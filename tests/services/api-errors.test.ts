import { describe, it, expect } from "vitest"

import { isTransientApiError, isAuthInvalidError } from "@/services/api-errors"

// This predicate decides whether a failed mutation gets queued for retry or
// dropped, and whether SWR retries a read. Getting it wrong either loses
// kitchen data or retries a request that can never succeed.
function axiosError(overrides: Record<string, unknown> = {}) {
  return Object.assign(new Error(String(overrides.message ?? "Request failed")), {
    isAxiosError: true,
    ...overrides,
  })
}

describe("isTransientApiError", () => {
  it("treats a missing response as transient", () => {
    // No status at all — the request never reached the server.
    expect(isTransientApiError(axiosError({ message: "Network Error" }))).toBe(true)
  })

  it.each([408, 425, 429, 500, 502, 503, 504])("treats %i as transient", (status) => {
    expect(isTransientApiError(axiosError({ response: { status } }))).toBe(true)
  })

  it.each([400, 401, 403, 404, 409, 422])("treats %i as permanent", (status) => {
    expect(isTransientApiError(axiosError({ response: { status } }))).toBe(false)
  })

  it.each(["ECONNABORTED", "ERR_NETWORK"])("treats the %s code as transient", (code) => {
    expect(isTransientApiError(axiosError({ code, response: { status: 400 } }))).toBe(true)
  })

  it.each(["timeout of 30000ms exceeded", "Network Error"])(
    "treats the message %j as transient",
    (message) => {
      expect(isTransientApiError(axiosError({ message, response: { status: 400 } }))).toBe(true)
    },
  )

  it("rejects anything that is not an axios error", () => {
    expect(isTransientApiError(new Error("Network Error"))).toBe(false)
    expect(isTransientApiError({ response: { status: 500 } })).toBe(false)
    expect(isTransientApiError(null)).toBe(false)
    expect(isTransientApiError(undefined)).toBe(false)
  })
})

describe("isAuthInvalidError", () => {
  it.each([401, 404])("flags %i as an invalid session", (status) => {
    expect(isAuthInvalidError(axiosError({ response: { status } }))).toBe(true)
  })

  it("does not flag a server outage as an invalid session", () => {
    // Session restore must survive a backend that is merely down — the
    // operator should not be kicked out because kitchen wifi dropped.
    expect(isAuthInvalidError(axiosError({ response: { status: 503 } }))).toBe(false)
    expect(isAuthInvalidError(axiosError({ code: "ERR_NETWORK" }))).toBe(false)
  })

  it("rejects anything that is not an axios error", () => {
    expect(isAuthInvalidError(new Error("401"))).toBe(false)
    expect(isAuthInvalidError(null)).toBe(false)
  })
})
