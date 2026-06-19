import { openDB, type DBSchema } from "idb"
import type { AxiosRequestConfig, Method } from "axios"
import apiClient from "@/lib/api/client"
import { logOperationalError } from "@/services/error-logger"
import { isTransientApiError } from "@/services/api-errors"

// A queued request that keeps failing with a non-transient (client) error, or
// exceeds this many attempts, is dropped so it cannot wedge the whole queue.
const MAX_ATTEMPTS = 8

const DB_NAME = "maharasa-offline-queue"
const DB_VERSION = 1
const STORE_NAME = "requests"

export type QueuedMethod = "post" | "put" | "patch"

export interface QueuedRequest {
  id: string
  method: QueuedMethod
  url: string
  data: unknown
  params?: unknown
  headers?: Record<string, string>
  createdAt: number
  lastAttemptAt?: number
  attempts: number
}

interface OfflineQueueDb extends DBSchema {
  requests: {
    key: string
    value: QueuedRequest
    indexes: {
      "by-created-at": number
    }
  }
}

function isBrowser() {
  return typeof window !== "undefined"
}

function isQueuedMethod(method?: Method | string): method is QueuedMethod {
  return ["post", "put", "patch"].includes(String(method || "").toLowerCase())
}

function isSerializablePayload(data: unknown) {
  return typeof FormData === "undefined" || !(data instanceof FormData)
}

function shouldSkipQueue(url?: string) {
  if (!url) return true
  return ["/login", "/login-pin", "/logout", "/auth/refresh"].some((path) => url.includes(path))
}

// Reuse a single connection. Tanpa memoize, setiap pemanggilan (termasuk polling
// jumlah antrean tiap 15 detik di ConnectivityMonitor) membuka koneksi IndexedDB
// baru — pemborosan yang tidak perlu.
let dbPromise: ReturnType<typeof openConnection> | null = null

function openConnection() {
  return openDB<OfflineQueueDb>(DB_NAME, DB_VERSION, {
    upgrade(db) {
      const store = db.createObjectStore(STORE_NAME, { keyPath: "id" })
      store.createIndex("by-created-at", "createdAt")
    },
  })
}

async function getDb() {
  if (!isBrowser()) return null

  if (!dbPromise) {
    dbPromise = openConnection()
    // Jika koneksi gagal terbuka, reset agar percobaan berikutnya bisa membuka ulang.
    dbPromise.catch(() => {
      dbPromise = null
    })
  }

  return dbPromise
}

async function digest(value: string) {
  if (!crypto?.subtle) {
    return btoa(value).replace(/[^a-z0-9]/gi, "").slice(0, 64)
  }

  const buffer = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value))
  return Array.from(new Uint8Array(buffer))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("")
}

// Unique per-submission token. This becomes the server idempotency key, so it
// MUST be unique per user action: two legitimately identical operations (e.g.
// producing the same item twice) need distinct ids, otherwise the backend
// replays the first response and silently drops the second. It is generated
// once and preserved across retries of the same queued request, which is what
// makes offline replay safe.
export function createRequestId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID()
  }

  // Fallback for non-secure contexts where randomUUID is unavailable.
  return `${Date.now().toString(16)}-${Math.random().toString(16).slice(2)}-${Math.random().toString(16).slice(2)}`
}

// Content-based hash. Used only as the queue's dedup key when a request has no
// X-Client-Request-Id header yet — NOT as the server idempotency key.
export async function createQueueRequestId(config: AxiosRequestConfig) {
  const method = String(config.method || "post").toLowerCase()
  const url = config.url || ""
  const body = JSON.stringify({
    method,
    url,
    params: config.params ?? null,
    data: config.data ?? null,
  })

  return digest(body)
}

function normalizeHeaders(headers: AxiosRequestConfig["headers"]) {
  const normalized: Record<string, string> = {}

  if (!headers) return normalized

  Object.entries(headers as Record<string, unknown>).forEach(([key, value]) => {
    if (typeof value === "string" && key.toLowerCase() !== "authorization") {
      normalized[key] = value
    }
  })

  return normalized
}

export async function enqueueOfflineRequest(config: AxiosRequestConfig) {
  if (!isQueuedMethod(config.method) || shouldSkipQueue(config.url) || !isSerializablePayload(config.data)) {
    return null
  }

  const db = await getDb()
  if (!db) return null

  // Reuse the unique id already stamped on the request so retries keep the same
  // idempotency key; fall back to the content hash only if it is missing.
  const headerId = (config.headers as Record<string, string> | undefined)?.["X-Client-Request-Id"]
  const id = headerId || (await createQueueRequestId(config))
  const existing = await db.get(STORE_NAME, id)

  if (existing) return existing

  const request: QueuedRequest = {
    id,
    method: String(config.method).toLowerCase() as QueuedMethod,
    url: config.url || "",
    data: config.data ?? null,
    params: config.params,
    headers: normalizeHeaders(config.headers),
    createdAt: Date.now(),
    attempts: 0,
  }

  await db.put(STORE_NAME, request)
  return request
}

export async function getQueuedRequestCount() {
  const db = await getDb()
  if (!db) return 0
  return db.count(STORE_NAME)
}

export async function drainOfflineQueue() {
  const db = await getDb()
  if (!db || !navigator.onLine) return { retried: 0, dropped: 0, remaining: 0 }

  const requests = await db.getAllFromIndex(STORE_NAME, "by-created-at")
  let retried = 0
  let dropped = 0

  for (const request of requests) {
    const attempts = request.attempts + 1

    await db.put(STORE_NAME, {
      ...request,
      attempts,
      lastAttemptAt: Date.now(),
    })

    try {
      await apiClient.request({
        method: request.method,
        url: request.url,
        data: request.data,
        params: request.params,
        headers: request.headers,
        skipOfflineQueue: true,
      })

      await db.delete(STORE_NAME, request.id)
      retried += 1
    } catch (error) {
      // Non-transient errors (4xx validation/auth) will never succeed on retry,
      // and a request that exhausted its attempts is treated the same way: drop
      // it (dead-letter) and keep draining the rest of the queue.
      if (!isTransientApiError(error) || attempts >= MAX_ATTEMPTS) {
        await db.delete(STORE_NAME, request.id)
        dropped += 1
        logOperationalError({
          level: "error",
          message: "Dropping unrecoverable queued request",
          error,
          context: { requestId: request.id, url: request.url, attempts },
        })
        continue
      }

      // Transient failure (network/5xx): stop here and retry on the next reconnect.
      logOperationalError({
        level: "warning",
        message: "Offline queue retry failed (will retry later)",
        error,
        context: { requestId: request.id, url: request.url, attempts },
      })
      break
    }
  }

  return {
    retried,
    dropped,
    remaining: await db.count(STORE_NAME),
  }
}
