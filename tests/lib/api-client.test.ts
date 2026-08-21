import { describe, it, expect, beforeEach, vi } from "vitest"
import axios from "axios"

// The client wires two axios interceptors that carry real business rules:
// idempotency keys on every mutation, and offline queueing on transient
// failures. Both dependencies are dynamically imported inside the
// interceptors, so they are mocked at module level here.
const { mockOfflineQueue, mockErrorLogger, mockAuthService, mockAuthStore } = vi.hoisted(() => ({
  mockOfflineQueue: {
    createRequestId: vi.fn(() => "generated-request-id"),
    enqueueOfflineRequest: vi.fn(async () => ({ id: "queued-1" })),
  },
  mockErrorLogger: {
    logOperationalError: vi.fn(),
  },
  // Dipakai jalur pemulihan 401: interceptor menukar token lalu mengulang
  // request. Keduanya di-import dinamis di dalam interceptor.
  mockAuthService: {
    refreshToken: vi.fn(async () => "jwt-baru"),
  },
  mockAuthStore: {
    clearSession: vi.fn(),
  },
}))

vi.mock("@/services/offline-queue", () => mockOfflineQueue)
vi.mock("@/services/error-logger", () => mockErrorLogger)
vi.mock("@/lib/api/services/auth", () => ({ authService: mockAuthService }))
vi.mock("@/stores/auth-store", () => ({
  useAuthStore: { getState: () => mockAuthStore },
}))

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

/**
 * Token JWT hidup 60 menit, sementara tablet dapur membuka PWA sepanjang shift.
 * Sebelumnya tidak ada yang memperpanjangnya: 401 pertama menghapus token tapi
 * membiarkan store tetap `authenticated`, jadi layar terlihat hidup sementara
 * setiap request gagal — dan mutasi yang kena 401 tidak masuk antrean offline
 * (401 bukan error transien), jadi piring yang dicatat setelah itu hilang tanpa
 * jejak.
 */
describe("apiClient — pemulihan sesi saat token kedaluwarsa", () => {
  // `apiClient(config)` pada retry menjalankan interceptor + adapter sungguhan.
  // Adapter palsu memotongnya di lapisan transport, bukan di logika yang diuji.
  let adapter: ReturnType<typeof vi.fn>

  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()

    adapter = vi.fn(async (cfg: any) => ({
      data: { ok: true },
      status: 200,
      statusText: "OK",
      headers: {},
      config: cfg,
    }))
    apiClient.defaults.adapter = adapter as any

    mockAuthService.refreshToken.mockImplementation(async () => {
      localStorage.setItem(config.auth.tokenKey, "jwt-baru")
      return "jwt-baru"
    })
  })

  function unauthorized(overrides: Record<string, unknown> = {}) {
    return axiosErrorWith({
      config: {
        method: "get",
        url: "/production/conveyor",
        headers: { Authorization: "Bearer jwt-lama" },
        ...overrides,
      },
      response: { status: 401, data: {} },
    })
  }

  it("menukar token lalu mengulang request yang kena 401", async () => {
    localStorage.setItem(config.auth.tokenKey, "jwt-lama")

    const response = await responseInterceptor.rejected(unauthorized())

    expect(mockAuthService.refreshToken).toHaveBeenCalledTimes(1)
    expect(response.status).toBe(200)
    // Retry berangkat dengan token baru, bukan yang sudah mati.
    expect(adapter.mock.calls[0][0].headers.Authorization).toBe("Bearer jwt-baru")
  })

  it("mempertahankan idempotency key saat mengulang mutasi", async () => {
    // Inti dari perbaikan ini. Kalau retry memakai id baru, server
    // memperlakukannya sebagai piring kedua, bukan aksi yang sama.
    localStorage.setItem(config.auth.tokenKey, "jwt-lama")

    await responseInterceptor.rejected(
      unauthorized({
        method: "post",
        url: "/production/produce",
        headers: { Authorization: "Bearer jwt-lama", "X-Client-Request-Id": "aksi-asli" },
      }),
    )

    expect(adapter.mock.calls[0][0].headers["X-Client-Request-Id"]).toBe("aksi-asli")
    expect(mockOfflineQueue.createRequestId).not.toHaveBeenCalled()
  })

  it("mengakhiri sesi ketika penukaran token ditolak", async () => {
    localStorage.setItem(config.auth.tokenKey, "jwt-lama")
    mockAuthService.refreshToken.mockRejectedValueOnce(new Error("refresh window lewat"))

    const error = unauthorized()

    await expect(responseInterceptor.rejected(error)).rejects.toBe(error)

    // Token dibuang **dan** store dibersihkan. Tanpa yang kedua, AuthGuard terus
    // meloloskan halaman yang datanya tidak akan pernah datang.
    expect(localStorage.getItem(config.auth.tokenKey)).toBeNull()
    expect(mockAuthStore.clearSession).toHaveBeenCalledTimes(1)
  })

  it("menyerah kalau request yang sudah diulang tetap 401", async () => {
    localStorage.setItem(config.auth.tokenKey, "jwt-baru")

    const error = unauthorized({ authRetried: true })

    await expect(responseInterceptor.rejected(error)).rejects.toBe(error)

    expect(mockAuthService.refreshToken).not.toHaveBeenCalled()
    expect(mockAuthStore.clearSession).toHaveBeenCalledTimes(1)
  })

  it("menukar token sekali saja walau beberapa request kena 401 bersamaan", async () => {
    // Satu layar dapur menjalankan beberapa hook SWR sekaligus. Tiap penukaran
    // mem-blacklist token sebelumnya, jadi penukaran kedua membatalkan hasil
    // penukaran pertama.
    localStorage.setItem(config.auth.tokenKey, "jwt-lama")

    // Deferred dibuat di muka supaya `release` sudah terpasang sebelum
    // interceptor sempat memanggil refresh — bukan di dalam mockImplementation,
    // yang baru jalan setelah `await import()` di dalam interceptor selesai.
    let release: (value: string) => void = () => {}
    const pendingRefresh = new Promise<string>((resolve) => {
      release = (token) => {
        localStorage.setItem(config.auth.tokenKey, token)
        resolve(token)
      }
    })
    mockAuthService.refreshToken.mockImplementation(() => pendingRefresh)

    const inFlight = [
      responseInterceptor.rejected(unauthorized({ url: "/production/conveyor" })),
      responseInterceptor.rejected(unauthorized({ url: "/production/stats" })),
      responseInterceptor.rejected(unauthorized({ url: "/master/menu" })),
    ]

    // Beri ketiganya kesempatan mendaftar ke penukaran yang sama sebelum
    // dilepas. Tanpa jeda ini yang teruji cuma kebetulan urutan.
    await new Promise((resolve) => setTimeout(resolve, 0))
    release("jwt-baru")
    await Promise.all(inFlight)

    expect(mockAuthService.refreshToken).toHaveBeenCalledTimes(1)
    expect(adapter).toHaveBeenCalledTimes(3)
  })

  it("langsung mengulang tanpa menukar lagi kalau token sudah diganti request lain", async () => {
    // Request yang berangkat sebelum penukaran tiba membawa token lama yang
    // sudah di-blacklist. Menukar lagi akan mematikan token yang baru saja
    // dipakai request lain.
    localStorage.setItem(config.auth.tokenKey, "jwt-baru")

    const response = await responseInterceptor.rejected(unauthorized())

    expect(mockAuthService.refreshToken).not.toHaveBeenCalled()
    expect(response.status).toBe(200)
    expect(adapter.mock.calls[0][0].headers.Authorization).toBe("Bearer jwt-baru")
  })

  it("langsung mengakhiri sesi kalau memang tidak ada token tersimpan", async () => {
    // Sesudah logout, request yang masih menggantung akan kena 401. Menembak
    // `/auth/refresh` tanpa token hanya menghasilkan 401 kedua.
    const error = unauthorized({ headers: {} })

    await expect(responseInterceptor.rejected(error)).rejects.toBe(error)

    expect(mockAuthService.refreshToken).not.toHaveBeenCalled()
    expect(mockAuthStore.clearSession).toHaveBeenCalledTimes(1)
  })

  /**
   * Skenario yang jadi alasan seluruh perbaikan ini ada, lewat pipeline axios
   * sungguhan — bukan dengan memanggil handler interceptor langsung.
   *
   * Tablet offline sepanjang jam sibuk, mutasi menumpuk di IndexedDB, token
   * kedaluwarsa sementara itu. Saat koneksi kembali `drainOfflineQueue()`
   * memanggil `apiClient.request()`. Sebelumnya request pertama kena 401, dan
   * karena 401 bukan error transien, drain memperlakukannya sebagai
   * "unrecoverable" lalu **menghapus** antreannya — piring yang sudah dicatat
   * dapur hilang tanpa jejak.
   */
  it("menyelamatkan replay antrean offline yang tokennya keburu mati", async () => {
    localStorage.setItem(config.auth.tokenKey, "jwt-lama")

    adapter.mockImplementation(async (cfg: any) => {
      if (cfg.headers.Authorization === "Bearer jwt-lama") {
        return Promise.reject(
          Object.assign(new Error("Request failed with status code 401"), {
            isAxiosError: true,
            config: cfg,
            response: { status: 401, data: {}, headers: {}, config: cfg },
          }),
        )
      }

      return { data: { ok: true }, status: 200, statusText: "OK", headers: {}, config: cfg }
    })

    // Bentuk panggilan yang dipakai drainOfflineQueue().
    const response = await apiClient.request({
      method: "post",
      url: "/production/produce",
      data: { menuId: "m1", quantity: 1 },
      headers: { "X-Client-Request-Id": "aksi-dari-antrean" },
      skipOfflineQueue: true,
    })

    expect(response.status).toBe(200)
    expect(mockAuthService.refreshToken).toHaveBeenCalledTimes(1)
    expect(mockAuthStore.clearSession).not.toHaveBeenCalled()

    // Percobaan kedua membawa token baru tapi id aksi yang sama — server
    // memperlakukannya sebagai piring yang sama, bukan piring kedua.
    const replay = adapter.mock.calls[1][0]
    expect(replay.headers.Authorization).toBe("Bearer jwt-baru")
    expect(replay.headers["X-Client-Request-Id"]).toBe("aksi-dari-antrean")

    // Dan tidak ikut diantre ulang sebagai mutasi yang gagal.
    expect(mockOfflineQueue.enqueueOfflineRequest).not.toHaveBeenCalled()
  })

  it("tidak menukar token saat login sendiri yang ditolak", async () => {
    // 401 di sini berarti PIN atau password salah, bukan sesi basi.
    localStorage.setItem(config.auth.tokenKey, "jwt-lama")

    const error = axiosErrorWith({
      config: { method: "post", url: "/login-pin", headers: {}, skipOfflineQueue: true },
      response: { status: 401, data: {} },
    })

    await expect(responseInterceptor.rejected(error)).rejects.toBe(error)

    expect(mockAuthService.refreshToken).not.toHaveBeenCalled()
    expect(mockAuthStore.clearSession).not.toHaveBeenCalled()
    expect(localStorage.getItem(config.auth.tokenKey)).toBeNull()
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
