import { describe, it, expect } from "vitest"
import {
  config,
  getAuthToken,
  setAuthToken,
  getRefreshToken,
  setRefreshToken,
  removeAuthToken,
} from "@/lib/config"

describe("auth token storage", () => {
  it("returns null when no token is stored", () => {
    expect(getAuthToken()).toBeNull()
    expect(getRefreshToken()).toBeNull()
  })

  it("stores and reads the auth token", () => {
    setAuthToken("abc.def.ghi")
    expect(getAuthToken()).toBe("abc.def.ghi")
    expect(localStorage.getItem(config.auth.tokenKey)).toBe("abc.def.ghi")
  })

  it("stores and reads the refresh token", () => {
    setRefreshToken("refresh-123")
    expect(getRefreshToken()).toBe("refresh-123")
  })

  it("removes both tokens", () => {
    setAuthToken("abc")
    setRefreshToken("refresh-123")

    removeAuthToken()

    expect(getAuthToken()).toBeNull()
    expect(getRefreshToken()).toBeNull()
  })
})
