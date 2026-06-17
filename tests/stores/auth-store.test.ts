import { describe, it, expect, beforeEach } from "vitest"
import { useAuthStore } from "@/stores/auth-store"
import type { User } from "@/lib/types"

const sampleUser = { id: "1", name: "Budi", role: "admin" } as unknown as User

describe("useAuthStore", () => {
  beforeEach(() => {
    useAuthStore.setState({ user: null, status: "loading", lastRestoredAt: null })
  })

  it("starts in the loading state", () => {
    expect(useAuthStore.getState().status).toBe("loading")
    expect(useAuthStore.getState().user).toBeNull()
  })

  it("setSession sets the user, status and a timestamp", () => {
    useAuthStore.getState().setSession(sampleUser, "authenticated")

    const state = useAuthStore.getState()
    expect(state.user).toEqual(sampleUser)
    expect(state.status).toBe("authenticated")
    expect(typeof state.lastRestoredAt).toBe("number")
  })

  it("setStatus updates only the status", () => {
    useAuthStore.getState().setSession(sampleUser, "authenticated")
    useAuthStore.getState().setStatus("unauthenticated")

    const state = useAuthStore.getState()
    expect(state.status).toBe("unauthenticated")
    expect(state.user).toEqual(sampleUser)
  })

  it("clearSession resets user and marks unauthenticated", () => {
    useAuthStore.getState().setSession(sampleUser, "authenticated")
    useAuthStore.getState().clearSession()

    const state = useAuthStore.getState()
    expect(state.user).toBeNull()
    expect(state.status).toBe("unauthenticated")
    expect(state.lastRestoredAt).toBeNull()
  })

  it("persists a non-authenticated status as unauthenticated", () => {
    // partialize collapses any non-authenticated status to "unauthenticated".
    useAuthStore.getState().setSession(sampleUser, "authenticated")

    const persisted = JSON.parse(localStorage.getItem("maharasa-auth-session") ?? "{}")
    expect(persisted.state.status).toBe("authenticated")

    useAuthStore.getState().setStatus("loading")
    const persistedLoading = JSON.parse(localStorage.getItem("maharasa-auth-session") ?? "{}")
    expect(persistedLoading.state.status).toBe("unauthenticated")
  })
})
