import { describe, it, expect, beforeEach, vi } from "vitest"
import { act, renderHook, waitFor } from "@testing-library/react"
import { SWRConfig } from "swr"
import React from "react"

const mocks = vi.hoisted(() => ({
  summary: vi.fn(),
  history: vi.fn(),
  preview: vi.fn(),
  apply: vi.fn(),
  cancelDraft: vi.fn(),
}))

vi.mock("@/lib/api", () => ({
  productionCorrectionService: {
    summary: mocks.summary,
    history: mocks.history,
    preview: mocks.preview,
    apply: mocks.apply,
  },
  salesService: { cancelDraft: mocks.cancelDraft },
}))

import { useProductionCorrection } from "@/hooks/use-production-correction"

function wrapper({ children }: { children: React.ReactNode }) {
  return React.createElement(
    SWRConfig,
    { value: { provider: () => new Map(), dedupingInterval: 0 } },
    children,
  )
}

const summary = {
  date: "2026-10-11",
  lock: { locked: false, reason: null, salesStatus: null, warnings: [] },
  unresolved: 0,
  menus: [{ menuId: "menu-1", menuName: "Salmon", sold: 5, waste: 1 }],
}

const payload = {
  outletId: "outlet-1",
  date: "2026-10-11",
  reason: "Close Day menandai semua sold",
  wasteReasonId: "reason-1",
  items: [{ menuId: "menu-1", from: "sold" as const, to: "waste" as const, quantity: 2 }],
}

describe("useProductionCorrection", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.summary.mockResolvedValue(summary)
    mocks.history.mockResolvedValue({ rows: [{ id: "c-1" }], total: 1 })
  })

  it("tidak mengambil apa pun selama outlet belum dipilih", async () => {
    const { result } = renderHook(() => useProductionCorrection("", "2026-10-11"), { wrapper })

    await new Promise((r) => setTimeout(r, 20))

    expect(mocks.summary).not.toHaveBeenCalled()
    expect(mocks.history).not.toHaveBeenCalled()
    expect(result.current.summary).toBeNull()
    expect(result.current.history).toEqual([])
  })

  it("tidak mengambil ringkasan tanpa tanggal", async () => {
    renderHook(() => useProductionCorrection("outlet-1", ""), { wrapper })

    await waitFor(() => expect(mocks.history).toHaveBeenCalled())
    expect(mocks.summary).not.toHaveBeenCalled()
  })

  it("mengambil ringkasan dan riwayat outlet itu", async () => {
    const { result } = renderHook(() => useProductionCorrection("outlet-1", "2026-10-11"), { wrapper })

    await waitFor(() => expect(result.current.summary).not.toBeNull())
    await waitFor(() => expect(result.current.history).toHaveLength(1))

    expect(mocks.summary).toHaveBeenCalledWith("outlet-1", "2026-10-11")
    expect(mocks.history).toHaveBeenCalledWith({ outletId: "outlet-1" })
  })

  it("menyimpan preview, lalu membuangnya setelah koreksi tersimpan dan menyegarkan ringkasan", async () => {
    mocks.preview.mockResolvedValue({ totals: { toWaste: 2, toSold: 0 } })
    mocks.apply.mockResolvedValue({ id: "c-2", totalToWaste: 2, totalToSold: 0 })

    const { result } = renderHook(() => useProductionCorrection("outlet-1", "2026-10-11"), { wrapper })
    await waitFor(() => expect(result.current.summary).not.toBeNull())

    await act(async () => {
      await result.current.runPreview(payload)
    })
    expect(result.current.preview).toEqual({ totals: { toWaste: 2, toSold: 0 } })

    await act(async () => {
      await result.current.apply(payload)
    })

    expect(mocks.apply).toHaveBeenCalledWith(payload)
    expect(result.current.preview).toBeNull()
    // Ringkasan diambil ulang: angkanya baru saja berubah.
    await waitFor(() => expect(mocks.summary).toHaveBeenCalledTimes(2))
  })

  it("membatalkan draft lalu mengambil ulang ringkasan", async () => {
    mocks.cancelDraft.mockResolvedValue({ id: "sales-1" })

    const { result } = renderHook(() => useProductionCorrection("outlet-1", "2026-10-11"), { wrapper })
    await waitFor(() => expect(result.current.summary).not.toBeNull())

    await act(async () => {
      await result.current.cancelSalesDraft("sales-1", "Ada piring salah status")
    })

    expect(mocks.cancelDraft).toHaveBeenCalledWith("sales-1", "Ada piring salah status")
    await waitFor(() => expect(mocks.summary).toHaveBeenCalledTimes(2))
  })
})
