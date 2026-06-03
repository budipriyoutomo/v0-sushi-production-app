import { openDB, type DBSchema } from "idb"
import type { AxiosRequestConfig, Method } from "axios"
import apiClient from "@/lib/api/client"
import { logOperationalError } from "@/services/error-logger"

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

async function getDb() {
  if (!isBrowser()) return null

  return openDB<OfflineQueueDb>(DB_NAME, DB_VERSION, {
    upgrade(db) {
      const store = db.createObjectStore(STORE_NAME, { keyPath: "id" })
      store.createIndex("by-created-at", "createdAt")
    },
  })
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

  const id = await createQueueRequestId(config)
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
  if (!db || !navigator.onLine) return { retried: 0, remaining: 0 }

  const requests = await db.getAllFromIndex(STORE_NAME, "by-created-at")
  let retried = 0

  for (const request of requests) {
    try {
      await db.put(STORE_NAME, {
        ...request,
        attempts: request.attempts + 1,
        lastAttemptAt: Date.now(),
      })

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
      logOperationalError({
        level: "warning",
        message: "Offline queue retry failed",
        error,
        context: { requestId: request.id, url: request.url },
      })
      break
    }
  }

  return {
    retried,
    remaining: await db.count(STORE_NAME),
  }
}
