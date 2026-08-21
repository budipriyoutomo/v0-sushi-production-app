import { describe, it, expect, beforeEach, vi } from "vitest"

const { mockClient } = vi.hoisted(() => ({
  mockClient: { post: vi.fn(), get: vi.fn() },
}))
vi.mock("@/lib/api/client", () => ({ default: mockClient }))

import { authService } from "@/lib/api/services/auth"
import { config } from "@/lib/config"

/**
 * `user.id` harus punya satu bentuk, apa pun jalannya.
 *
 * `users.id` adalah satu-satunya auto-increment di skema backend, jadi sebelum
 * `UserResource` melakukan cast ia terkirim sebagai angka JSON. `login()` sudah
 * lama menormalkannya dengan `String()`, tapi `getCurrentUser()` mengembalikan
 * respons apa adanya — jadi id berbentuk string setelah login dan number
 * setelah restore. Dan karena `refreshUser()` jalan tiap `AuthProvider` mount,
 * bentuknya berubah di tengah sesi, bukan cuma antar-reload.
 *
 * Backend sudah diperbaiki, tapi normalisasi di sini tetap dipertahankan:
 * service worker PWA menyimpan respons `GET /api/*` selama 5 menit, dan tablet
 * dapur yang belum memuat bundel baru bisa jauh lebih lama dari itu.
 */
describe("authService — bentuk id user", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
  })

  function loginEnvelope(id: string | number) {
    return {
      data: {
        status: true,
        message: "ok",
        data: {
          user: {
            id,
            name: "Kitchen TSM",
            role: "kitchen",
            departemen: "Operation",
            outlet: ["STTSM"],
            module_app: ["kitchen"],
          },
          token: "jwt-abc",
          expires_in: 3600,
        },
      },
    }
  }

  it("menormalkan id dari /login walau backend mengirim angka", async () => {
    mockClient.post.mockResolvedValue(loginEnvelope(5))

    const { user } = await authService.login({ email: "a@b.c", password: "secret" })

    expect(user.id).toBe("5")
    expect(localStorage.getItem(config.auth.tokenKey)).toBe("jwt-abc")
  })

  it("menormalkan id dari /login-pin juga", async () => {
    mockClient.post.mockResolvedValue(loginEnvelope(7))

    const { user } = await authService.pinLogin({ pin: "123456" })

    expect(user.id).toBe("7")
    expect(mockClient.post).toHaveBeenCalledWith("/login-pin", { pin: "123456" })
  })

  /** Jalur yang dulu menyimpang, dan justru yang jalan tiap halaman dibuka. */
  it("menormalkan id dari /auth/me", async () => {
    mockClient.get.mockResolvedValue({
      data: {
        data: {
          id: 5,
          name: "Kitchen TSM",
          role: "kitchen",
          departemen: "Operation",
          outlet: ["STTSM"],
          module_app: ["kitchen"],
        },
      },
    })

    const user = await authService.getCurrentUser()

    expect(user.id).toBe("5")
  })

  it("membuat login dan restore sepakat soal bentuk id", async () => {
    mockClient.post.mockResolvedValue(loginEnvelope(5))
    mockClient.get.mockResolvedValue({
      data: {
        data: {
          id: 5,
          name: "Kitchen TSM",
          role: "kitchen",
          departemen: "Operation",
          outlet: ["STTSM"],
          module_app: ["kitchen"],
        },
      },
    })

    const { user: fromLogin } = await authService.login({ email: "a@b.c", password: "secret" })
    const fromRestore = await authService.getCurrentUser()

    // Bukan sekadar nilai yang sama — bentuk yang sama. Ini yang dulu berbeda.
    expect(fromRestore.id).toBe(fromLogin.id)
    expect(typeof fromRestore.id).toBe(typeof fromLogin.id)
  })

  it("tetap benar ketika backend sudah mengirim string", async () => {
    mockClient.post.mockResolvedValue(loginEnvelope("5"))

    const { user } = await authService.login({ email: "a@b.c", password: "secret" })

    expect(user.id).toBe("5")
  })
})
