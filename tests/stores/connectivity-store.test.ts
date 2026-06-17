import { describe, it, expect, beforeEach } from "vitest"
import { useConnectivityStore } from "@/stores/connectivity-store"

describe("useConnectivityStore", () => {
  beforeEach(() => {
    useConnectivityStore.setState({
      isOnline: true,
      lastOnlineAt: null,
      lastOfflineAt: null,
      pendingMutationCount: 0,
    })
  })

  it("setOnline(true) records lastOnlineAt and clears lastOfflineAt", () => {
    useConnectivityStore.getState().setOnline(true)

    const state = useConnectivityStore.getState()
    expect(state.isOnline).toBe(true)
    expect(typeof state.lastOnlineAt).toBe("number")
    expect(state.lastOfflineAt).toBeNull()
  })

  it("setOnline(false) records lastOfflineAt and clears lastOnlineAt", () => {
    useConnectivityStore.getState().setOnline(false)

    const state = useConnectivityStore.getState()
    expect(state.isOnline).toBe(false)
    expect(typeof state.lastOfflineAt).toBe("number")
    expect(state.lastOnlineAt).toBeNull()
  })

  it("setPendingMutationCount updates the pending count", () => {
    useConnectivityStore.getState().setPendingMutationCount(5)
    expect(useConnectivityStore.getState().pendingMutationCount).toBe(5)
  })
})
