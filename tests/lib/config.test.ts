import { describe, it, expect } from "vitest"
import { config, getAuthToken, setAuthToken, removeAuthToken } from "@/lib/config"

/**
 * Hanya ada satu token.
 *
 * Versi sebelumnya juga menyimpan `refresh_token`, lengkap dengan test — tapi
 * backend murni JWT dan tidak pernah menerbitkan refresh token, jadi tidak ada
 * kode aplikasi yang memanggil `setRefreshToken()`. Kuncinya selalu kosong dan
 * `removeAuthToken()` rajin menghapus sesuatu yang tidak pernah ada.
 * Perpanjangan sesi memakai access token yang kedaluwarsa, lihat
 * `lib/api/client.ts`.
 */
describe("auth token storage", () => {
  it("returns null when no token is stored", () => {
    expect(getAuthToken()).toBeNull()
  })

  it("stores and reads the auth token", () => {
    setAuthToken("abc.def.ghi")

    expect(getAuthToken()).toBe("abc.def.ghi")
    expect(localStorage.getItem(config.auth.tokenKey)).toBe("abc.def.ghi")
  })

  it("removes the auth token", () => {
    setAuthToken("abc")

    removeAuthToken()

    expect(getAuthToken()).toBeNull()
    expect(localStorage.getItem(config.auth.tokenKey)).toBeNull()
  })
})
