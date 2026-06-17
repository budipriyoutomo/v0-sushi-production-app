import { describe, it, expect, beforeEach } from "vitest"
import { useOutletStore } from "@/stores/outlet-store"

describe("useOutletStore", () => {
  beforeEach(() => {
    useOutletStore.setState({ selectedOutletId: "" })
  })

  it("defaults to an empty selected outlet", () => {
    expect(useOutletStore.getState().selectedOutletId).toBe("")
  })

  it("setSelectedOutletId updates the selected outlet", () => {
    useOutletStore.getState().setSelectedOutletId("outlet-123")
    expect(useOutletStore.getState().selectedOutletId).toBe("outlet-123")
  })

  it("persists the selected outlet to localStorage", () => {
    useOutletStore.getState().setSelectedOutletId("outlet-abc")

    const persisted = JSON.parse(localStorage.getItem("maharasa-active-outlet") ?? "{}")
    expect(persisted.state.selectedOutletId).toBe("outlet-abc")
  })
})
