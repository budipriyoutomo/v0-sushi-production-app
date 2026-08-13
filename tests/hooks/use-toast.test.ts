import { describe, it, expect, beforeEach, afterEach, vi } from "vitest"
import { act, renderHook } from "@testing-library/react"

import { reducer, useToast, toast } from "@/hooks/use-toast"

const TOAST_REMOVE_DELAY = 1000000

type ToastState = Parameters<typeof reducer>[0]

const emptyState: ToastState = { toasts: [] }

function makeToast(id: string, extra: Record<string, unknown> = {}) {
  return { id, title: `Toast ${id}`, open: true, ...extra } as ToastState["toasts"][number]
}

describe("toast reducer", () => {
  it("adds a toast to the front of the list", () => {
    const state = reducer(emptyState, { type: "ADD_TOAST", toast: makeToast("1") })

    expect(state.toasts).toHaveLength(1)
    expect(state.toasts[0].id).toBe("1")
  })

  it("keeps only the newest toast (TOAST_LIMIT is 1)", () => {
    const first = reducer(emptyState, { type: "ADD_TOAST", toast: makeToast("1") })
    const second = reducer(first, { type: "ADD_TOAST", toast: makeToast("2") })

    expect(second.toasts).toHaveLength(1)
    expect(second.toasts[0].id).toBe("2")
  })

  it("merges an update into the matching toast only", () => {
    const state: ToastState = { toasts: [makeToast("1"), makeToast("2")] }

    const updated = reducer(state, {
      type: "UPDATE_TOAST",
      toast: { id: "1", title: "Berhasil disimpan" },
    })

    expect(updated.toasts[0]).toMatchObject({ id: "1", title: "Berhasil disimpan", open: true })
    expect(updated.toasts[1]).toMatchObject({ id: "2", title: "Toast 2" })
  })

  it("ignores an update for an unknown id", () => {
    const state: ToastState = { toasts: [makeToast("1")] }

    const updated = reducer(state, { type: "UPDATE_TOAST", toast: { id: "nope", title: "X" } })

    expect(updated.toasts).toEqual(state.toasts)
  })

  it("dismiss closes the targeted toast but keeps it mounted", () => {
    const state: ToastState = { toasts: [makeToast("a1"), makeToast("a2")] }

    const dismissed = reducer(state, { type: "DISMISS_TOAST", toastId: "a1" })

    // Still present so the exit animation can run; only `open` flips.
    expect(dismissed.toasts).toHaveLength(2)
    expect(dismissed.toasts[0].open).toBe(false)
    expect(dismissed.toasts[1].open).toBe(true)
  })

  it("dismiss without an id closes every toast", () => {
    const state: ToastState = { toasts: [makeToast("b1"), makeToast("b2")] }

    const dismissed = reducer(state, { type: "DISMISS_TOAST" })

    expect(dismissed.toasts.every((t) => t.open === false)).toBe(true)
  })

  it("remove drops one toast, or all of them when no id is given", () => {
    const state: ToastState = { toasts: [makeToast("1"), makeToast("2")] }

    expect(reducer(state, { type: "REMOVE_TOAST", toastId: "1" }).toasts).toHaveLength(1)
    expect(reducer(state, { type: "REMOVE_TOAST", toastId: undefined }).toasts).toEqual([])
  })
})

describe("useToast", () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    // The store lives at module scope, so each test has to leave it empty.
    act(() => {
      toast({}).dismiss()
    })
    act(() => {
      vi.advanceTimersByTime(TOAST_REMOVE_DELAY)
    })
    vi.useRealTimers()
  })

  it("exposes the shared store and pushes a new toast into it", () => {
    const { result } = renderHook(() => useToast())

    act(() => {
      result.current.toast({ title: "Piring diproduksi" })
    })

    expect(result.current.toasts).toHaveLength(1)
    expect(result.current.toasts[0]).toMatchObject({ title: "Piring diproduksi", open: true })
  })

  it("hands back a handle that can update the toast in place", () => {
    const { result } = renderHook(() => useToast())
    let handle: ReturnType<typeof toast>

    act(() => {
      handle = result.current.toast({ title: "Menyimpan..." })
    })

    act(() => {
      handle.update({ id: handle.id, title: "Tersimpan" })
    })

    expect(result.current.toasts).toHaveLength(1)
    expect(result.current.toasts[0].title).toBe("Tersimpan")
  })

  it("gives every toast a distinct id", () => {
    const { result } = renderHook(() => useToast())
    const ids: string[] = []

    act(() => {
      ids.push(result.current.toast({ title: "A" }).id)
      ids.push(result.current.toast({ title: "B" }).id)
    })

    expect(new Set(ids).size).toBe(2)
  })

  it("removes a dismissed toast once the delay elapses", () => {
    const { result } = renderHook(() => useToast())

    act(() => {
      result.current.toast({ title: "Waste dicatat" })
    })

    act(() => {
      result.current.dismiss()
    })
    expect(result.current.toasts[0].open).toBe(false)

    act(() => {
      vi.advanceTimersByTime(TOAST_REMOVE_DELAY)
    })
    expect(result.current.toasts).toHaveLength(0)
  })

  it("closes the toast when onOpenChange reports it closed", () => {
    const { result } = renderHook(() => useToast())

    act(() => {
      result.current.toast({ title: "Ditutup lewat UI" })
    })

    act(() => {
      result.current.toasts[0].onOpenChange?.(false)
    })

    expect(result.current.toasts[0].open).toBe(false)
  })

  it("notifies every mounted subscriber", () => {
    const first = renderHook(() => useToast())
    const second = renderHook(() => useToast())

    act(() => {
      first.result.current.toast({ title: "Broadcast" })
    })

    expect(second.result.current.toasts[0]?.title).toBe("Broadcast")
  })

  it("stops notifying after unmount", () => {
    const { result, unmount } = renderHook(() => useToast())
    const snapshot = result.current.toasts

    unmount()

    act(() => {
      toast({ title: "Setelah unmount" })
    })

    expect(result.current.toasts).toBe(snapshot)
  })
})
