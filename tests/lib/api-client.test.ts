import { describe, it, expect, beforeEach, vi } from "vitest"
import axios from "axios"

// The client wires two axios interceptors that carry real business rules:
// idempotency keys on every mutation, and offline queueing on transient
// failures. Both dependencies are dynamically imported inside the
// interceptors, so they are mocked at module level here.
const { mockOfflineQueue, mockErrorLogger } = vi.hoisted(() => ({
  mockOfflineQueue: {
    createRequestId: vi.fn(() => "generated-request-id"),
    enqueueOfflineRequest: vi.fn(async () => ({ id: "queued-1" })),
  },
  mockErrorLogger: {
    logOperationalError: vi.fn(),
  },
}))

vi.mock("@/services/offline-queue", () => mockOfflineQueue)
vi.mock("@/services/error-logger", () => mockErrorLogger)

import apiClient, { getApiError } from "@/lib/api/client"
import { config } from "@/lib/config"

type Handler = {
  fulfilled: (value: any) => any
  rejected: (error: any) => any
}

// axios keeps registered interceptors on `.handlers`; grabbing them lets the
// interceptor logic be tested without a network layer or a mocked adapter.
const requestInterceptor = (apiClient.interceptors.request as any).handlers[0] as Handler
const responseInterceptor = (apiClient.interceptors.response as any).handlers[0] as Handler

// Return type is widened deliberately: the spread of a Record<string, unknown>
// erases the individual keys, so `error.config` would not type-check otherwise.
function axiosErrorWith(overrides: Record<string, unknown>): Error & Record<string, any> {
  return Object.assign(new Error(String(overrides.message ?? "Request failed")), {
    isAxiosError: true,
    ...overrides,
  })
}

describe("apiClient request interceptor", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("attaches the bearer token when one is stored", async () => {
    localStorage.setItem(config.auth.tokenKey, "jwt-abc")

    const result = await requestInterceptor.fulfilled({ method: "get", headers: {} })

    expect(result.headers.Authorization).toBe("Bearer jwt-abc")
  })

  it("leaves the Authorization header off when there is no token", async () => {
    const result = await requestInterceptor.fulfilled({ method: "get", headers: {} })

    expect(result.headers.Authorization).toBeUndefined()
  })

  it("stamps an idempotency key on mutating requests", async () => {
    for (const method of ["post", "put", "patch", "POST"]) {
      const result = await requestInterceptor.fulfilled({ method, headers: {} })

      expect(result.headers["X-Client-Request-Id"]).toBe("generated-request-id")
    }

    expect(mockOfflineQueue.createRequestId).toHaveBeenCalledTimes(4)
  })

  it("does not stamp an idempotency key on reads or deletes", async () => {
    for (const method of ["get", "delete", undefined]) {
      const result = await requestInterceptor.fulfilled({ method, headers: {} })

      expect(result.headers["X-Client-Request-Id"]).toBeUndefined()
    }

    expect(mockOfflineQueue.createRequestId).not.toHaveBeenCalled()
  })

  it("keeps an idempotency key that the caller already set", async () => {
    // Replays out of the offline queue arrive with their original id; the
    // interceptor must not mint a new one or the server would treat the retry
    // as a second, distinct action.
    const result = await requestInterceptor.fulfilled({
      method: "post",
      headers: { "X-Client-Request-Id": "original-id" },
    })

    expect(result.headers["X-Client-Request-Id"]).toBe("original-id")
    expect(mockOfflineQueue.createRequestId).not.toHaveBeenCalled()
  })

  it("propagates request errors untouched", async () => {
    const error = new Error("boom")

    await expect(requestInterceptor.rejected(error)).rejects.toThrow("boom")
  })
})

describe("apiClient response interceptor", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("passes successful responses straight through", () => {
    const response = { status: 200, data: { ok: true } }

    expect(responseInterceptor.fulfilled(response)).toBe(response)
  })

  it("queues a mutation that failed with a transient error", async () => {
    const error = axiosErrorWith({
      message: "Network Error",
      code: "ERR_NETWORK",
      config: { method: "post", url: "/production/produce", headers: {} },
    })

    await expect(responseInterceptor.rejected(error)).rejects.toBe(error)

    expect(mockOfflineQueue.enqueueOfflineRequest).toHaveBeenCalledWith(error.config)
    expect(mockErrorLogger.logOperationalError).toHaveBeenCalledWith(
      expect.objectContaining({
        level: "warning",
        context: { url: "/production/produce", method: "post" },
      }),
    )
  })

  it("does not queue a read that failed transiently", async () => {
    const error = axiosErrorWith({
      message: "Network Error",
      code: "ERR_NETWORK",
      config: { method: "get", url: "/production/conveyor", headers: {} },
    })

    await expect(responseInterceptor.rejected(error)).rejects.toBe(error)

    expect(mockOfflineQueue.enqueueOfflineRequest).not.toHaveBeenCalled()
  })

  it("does not queue a mutation rejected for a business reason", async () => {
    // 422 will fail again on retry — queueing it would loop forever.
    const error = axiosErrorWith({
      config: { method: "post", url: "/production/mark-sold", headers: {} },
      response: { status: 422, data: { message: "Plate dari hari sebelumnya" } },
    })

    await expect(responseInterceptor.rejected(error)).rejects.toBe(error)

    expect(mockOfflineQueue.enqueueOfflineRequest).not.toHaveBeenCalled()
  })

  it("respects skipOfflineQueue", async () => {
    const error = axiosErrorWith({
      message: "Network Error",
      code: "ERR_NETWORK",
      config: { method: "post", url: "/login", headers: {}, skipOfflineQueue: true },
    })

    await expect(responseInterceptor.rejected(error)).rejects.toBe(error)

    expect(mockOfflineQueue.enqueueOfflineRequest).not.toHaveBeenCalled()
  })

  it("does not log when the queue declines the request", async () => {
    mockOfflineQueue.enqueueOfflineRequest.mockResolvedValueOnce(null as any)

    const error = axiosErrorWith({
      message: "Network Error",
      code: "ERR_NETWORK",
      config: { method: "post", url: "/production/produce", headers: {} },
    })

    await expect(responseInterceptor.rejected(error)).rejects.toBe(error)

    expect(mockErrorLogger.logOperationalError).not.toHaveBeenCalled()
  })

  it("clears stored tokens on 401 without redirecting", async () => {
    localStorage.setItem(config.auth.tokenKey, "jwt-abc")
    localStorage.setItem(config.auth.refreshTokenKey, "refresh-abc")

    const error = axiosErrorWith({
      config: { method: "get", url: "/auth/me", headers: {} },
      response: { status: 401, data: {} },
    })

    await expect(responseInterceptor.rejected(error)).rejects.toBe(error)

    expect(localStorage.getItem(config.auth.tokenKey)).toBeNull()
    expect(localStorage.getItem(config.auth.refreshTokenKey)).toBeNull()
  })

  it("keeps the token on other error statuses", async () => {
    localStorage.setItem(config.auth.tokenKey, "jwt-abc")

    const error = axiosErrorWith({
      config: { method: "get", url: "/production/conveyor", headers: {} },
      response: { status: 403, data: {} },
    })

    await expect(responseInterceptor.rejected(error)).rejects.toBe(error)

    expect(localStorage.getItem(config.auth.tokenKey)).toBe("jwt-abc")
  })
})

describe("getApiError", () => {
  it("prefers the API message and status from the response body", () => {
    const error = axiosErrorWith({
      message: "Request failed with status code 422",
      response: {
        status: 422,
        data: {
          message: "Validasi gagal",
          errors: { quantity: ["Wajib diisi"] },
        },
      },
    })

    expect(getApiError(error)).toEqual({
      message: "Validasi gagal",
      status: 422,
      errors: { quantity: ["Wajib diisi"] },
    })
  })

  it("falls back to the axios message and 500 when there is no response", () => {
    const error = axiosErrorWith({ message: "Network Error", code: "ERR_NETWORK" })

    expect(getApiError(error)).toEqual({
      message: "Network Error",
      status: 500,
      errors: undefined,
    })
  })

  it("handles plain errors", () => {
    expect(getApiError(new Error("something broke"))).toEqual({
      message: "something broke",
      status: 500,
    })
  })

  it("handles values that are not errors at all", () => {
    expect(getApiError("nope")).toEqual({
      message: "An unknown error occurred",
      status: 500,
    })
  })

  it("is consistent with axios.isAxiosError for the fixtures used here", () => {
    // Guards the fixture helper itself: if this stops being recognised as an
    // axios error, every assertion above would silently test the wrong branch.
    expect(axios.isAxiosError(axiosErrorWith({ message: "x" }))).toBe(true)
  })
})
