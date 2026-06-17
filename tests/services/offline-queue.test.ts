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
const validationError = { isAxiosError: true, response: { status: 422 }, message: "Unprocessable" }

// Clear (rather than delete) the store: deleteDatabase blocks while idb keeps
// connections open, which would hang the tests.
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

describe("offline-queue", () => {
  beforeEach(async () => {
    vi.clearAllMocks()
    await resetDb()
    Object.defineProperty(navigator, "onLine", { value: true, configurable: true })
  })

  it("enqueues a mutating request and dedupes identical ones", async () => {
    const config = { method: "post", url: "/sales", data: { a: 1 } }
    await enqueueOfflineRequest(config)
    await enqueueOfflineRequest(config) // identical -> same id, no duplicate

    expect(await getQueuedRequestCount()).toBe(1)
  })

  it("does not enqueue GET requests or auth endpoints", async () => {
    await enqueueOfflineRequest({ method: "get", url: "/sales" })
    await enqueueOfflineRequest({ method: "post", url: "/login", data: {} })

    expect(await getQueuedRequestCount()).toBe(0)
  })

  it("drains successfully and removes the request", async () => {
    mockClient.request.mockResolvedValue({ data: {} })
    await enqueueOfflineRequest({ method: "post", url: "/sales", data: { a: 1 } })

    const result = await drainOfflineQueue()

    expect(result.retried).toBe(1)
    expect(result.dropped).toBe(0)
    expect(result.remaining).toBe(0)
    expect(mockClient.request).toHaveBeenCalledTimes(1)
  })

  it("drops a request that fails with a non-transient (4xx) error", async () => {
    mockClient.request.mockRejectedValue(validationError)
    await enqueueOfflineRequest({ method: "post", url: "/sales", data: { a: 1 } })

    const result = await drainOfflineQueue()

    expect(result.retried).toBe(0)
    expect(result.dropped).toBe(1)
    expect(result.remaining).toBe(0) // dead-lettered, not left to block the queue
  })

  it("keeps a request that fails with a transient error and stops draining", async () => {
    mockClient.request.mockRejectedValue(transientError)
    await enqueueOfflineRequest({ method: "post", url: "/sales", data: { a: 1 } })

    const result = await drainOfflineQueue()

    expect(result.retried).toBe(0)
    expect(result.dropped).toBe(0)
    expect(result.remaining).toBe(1) // preserved for the next reconnect
  })

  it("a non-transient failure does not block later queued requests", async () => {
    await enqueueOfflineRequest({ method: "post", url: "/bad", data: { a: 1 } })
    await enqueueOfflineRequest({ method: "post", url: "/good", data: { b: 2 } })

    // First (oldest) fails permanently, second succeeds.
    mockClient.request
      .mockRejectedValueOnce(validationError)
      .mockResolvedValueOnce({ data: {} })

    const result = await drainOfflineQueue()

    expect(result.dropped).toBe(1)
    expect(result.retried).toBe(1)
    expect(result.remaining).toBe(0)
  })
})
