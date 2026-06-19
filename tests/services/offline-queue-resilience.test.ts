import "fake-indexeddb/auto"
import { describe, it, expect, beforeEach, vi } from "vitest"
import { openDB } from "idb"

// Mock the axios client used by the queue when replaying requests.
const { mockClient } = vi.hoisted(() => ({
  mockClient: { request: vi.fn() },
}))
vi.mock("@/lib/api/client", () => ({ default: mockClient }))

import {
  enqueueOfflineRequest,
  drainOfflineQueue,
  getQueuedRequestCount,
} from "@/services/offline-queue"

// axios.isAxiosError only checks the `isAxiosError` flag, so these stand in for real errors.
const transientError = { isAxiosError: true, code: "ERR_NETWORK", message: "Network Error" }

async function resetDb() {
  const db = await openDB("maharasa-offline-queue", 1, {
    upgrade(d) {
      if (!d.objectStoreNames.contains("requests")) {
        const store = d.createObjectStore("requests", { keyPath: "id" })
        store.createIndex("by-created-at", "createdAt")
      }
    },
  })
  await db.clear("requests")
  db.close()
}

function setOnline(value: boolean) {
  Object.defineProperty(navigator, "onLine", { value, configurable: true })
}

describe("offline-queue resilience", () => {
  beforeEach(async () => {
    vi.clearAllMocks()
    await resetDb()
    setOnline(true)
  })

  it("dead-letters a request that keeps failing transiently, so the queue cannot wedge forever", async () => {
    mockClient.request.mockRejectedValue(transientError)
    await enqueueOfflineRequest({ method: "post", url: "/sales", data: { a: 1 } })

    // The first 7 drains preserve the request (transient, under the attempt cap)
    // and stop after the failing request.
    for (let i = 1; i <= 7; i++) {
      const result = await drainOfflineQueue()
      expect(result.dropped).toBe(0)
      expect(result.remaining).toBe(1)
    }

    // The 8th attempt hits MAX_ATTEMPTS and the request is dropped (dead-lettered),
    // even though the error is still transient.
    const final = await drainOfflineQueue()
    expect(final.dropped).toBe(1)
    expect(final.remaining).toBe(0)
    expect(await getQueuedRequestCount()).toBe(0)
  })

  it("preserves the idempotency key across retries so an offline replay is not duplicated", async () => {
    const idempotencyKey = "fixed-request-id-123"

    await enqueueOfflineRequest({
      method: "post",
      url: "/produce",
      data: { itemId: 7, qty: 1 },
      headers: { "X-Client-Request-Id": idempotencyKey },
    })

    // First reconnect: network still flaky -> request fails transiently and is kept.
    mockClient.request.mockRejectedValueOnce(transientError)
    await drainOfflineQueue()

    // Second reconnect: succeeds.
    mockClient.request.mockResolvedValueOnce({ data: {} })
    const result = await drainOfflineQueue()

    expect(result.retried).toBe(1)
    expect(result.remaining).toBe(0)

    // Both replays must carry the SAME idempotency key, otherwise the backend
    // would treat the retry as a second, distinct production.
    expect(mockClient.request).toHaveBeenCalledTimes(2)
    for (const call of mockClient.request.mock.calls) {
      expect(call[0].headers["X-Client-Request-Id"]).toBe(idempotencyKey)
    }
  })

  it("does not strip a unique id per submission (two distinct actions stay separate)", async () => {
    await enqueueOfflineRequest({
      method: "post",
      url: "/produce",
      data: { itemId: 7, qty: 1 },
      headers: { "X-Client-Request-Id": "id-a" },
    })
    await enqueueOfflineRequest({
      method: "post",
      url: "/produce",
      data: { itemId: 7, qty: 1 },
      headers: { "X-Client-Request-Id": "id-b" },
    })

    // Same endpoint + identical body, but distinct ids -> two queued operations.
    expect(await getQueuedRequestCount()).toBe(2)
  })

  it("never strips the Authorization header into the persisted queue", async () => {
    await enqueueOfflineRequest({
      method: "post",
      url: "/sales",
      data: { a: 1 },
      headers: { Authorization: "Bearer secret", "X-Client-Request-Id": "id-secure" },
    })

    const db = await openDB("maharasa-offline-queue", 1)
    const stored = await db.get("requests", "id-secure")
    db.close()

    expect(stored).toBeTruthy()
    expect(stored.headers).not.toHaveProperty("Authorization")
    expect(stored.headers).toHaveProperty("X-Client-Request-Id", "id-secure")
  })

  it("does not touch the network while offline (no request hammering)", async () => {
    await enqueueOfflineRequest({ method: "post", url: "/sales", data: { a: 1 } })

    setOnline(false)
    const result = await drainOfflineQueue()

    expect(mockClient.request).not.toHaveBeenCalled()
    expect(result.retried).toBe(0)
    expect(result.remaining).toBe(0) // short-circuits before counting; queue is untouched
    expect(await getQueuedRequestCount()).toBe(1) // still safely persisted for later
  })

  it("refuses to queue non-serializable FormData payloads", async () => {
    const form = new FormData()
    form.append("file", "x")

    const queued = await enqueueOfflineRequest({ method: "post", url: "/upload", data: form })

    expect(queued).toBeNull()
    expect(await getQueuedRequestCount()).toBe(0)
  })
})
