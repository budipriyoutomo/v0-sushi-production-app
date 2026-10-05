import { describe, it, expect, beforeEach, vi } from "vitest"
import { act, renderHook, waitFor } from "@testing-library/react"
import { SWRConfig } from "swr"
import React from "react"

const mocks = vi.hoisted(() => ({ list: vi.fn(), resend: vi.fn() }))

vi.mock("@/lib/api", () => ({
  closingReportOutboxService: { list: mocks.list, resend: mocks.resend },
}))

import { useClosingReportOutbox } from "@/hooks/use-closing-report-outbox"

function wrapper({ children }: { children: React.ReactNode }) {
  return React.createElement(
    SWRConfig,
    { value: { provider: () => new Map(), dedupingInterval: 0 } },
    children,
  )
}

function row(id: string, status = "failed") {
  return { id, status }
}

describe("useClosingReportOutbox", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.list.mockResolvedValue({ rows: [row("row-1")], total: 1 })
  })

  it("tidak mengambil apa pun selama outlet belum dipilih", async () => {
    const { result } = renderHook(() => useClosingReportOutbox("", { status: "unpublished" }), { wrapper })

    await new Promise((r) => setTimeout(r, 20))

    expect(mocks.list).not.toHaveBeenCalled()
    expect(result.current.rows).toEqual([])
  })

  it("mengambil daftar outlet itu dengan filternya", async () => {
    const { result } = renderHook(
      () => useClosingReportOutbox("outlet-1", { status: "all", startDate: "2026-09-01", endDate: "" }),
      { wrapper }
    )

    await waitFor(() => expect(result.current.rows).toHaveLength(1))
    // Tanggal kosong tidak dikirim sebagai filter.
    expect(mocks.list).toHaveBeenCalledWith({ outletId: "outlet-1", status: "all", startDate: "2026-09-01" })
    expect(result.current.total).toBe(1)
  })

  it("filter yang berbeda adalah cache yang berbeda", async () => {
    const { result, rerender } = renderHook(
      ({ status }) => useClosingReportOutbox("outlet-1", { status }),
      { wrapper, initialProps: { status: "unpublished" as const } as { status: "unpublished" | "published" } }
    )
    await waitFor(() => expect(result.current.rows).toHaveLength(1))

    mocks.list.mockResolvedValue({ rows: [row("row-2", "published")], total: 1 })
    rerender({ status: "published" })

    await waitFor(() => expect(result.current.rows[0]?.id).toBe("row-2"))
  })

  it("kirim ulang mengembalikan baris hasilnya dan menyegarkan daftar", async () => {
    mocks.resend.mockResolvedValue(row("row-1", "published"))
    const { result } = renderHook(() => useClosingReportOutbox("outlet-1", { status: "unpublished" }), { wrapper })
    await waitFor(() => expect(result.current.rows).toHaveLength(1))

    mocks.list.mockResolvedValue({ rows: [], total: 0 })
    let updated: unknown
    await act(async () => {
      updated = await result.current.resend("row-1")
    })

    expect(mocks.resend).toHaveBeenCalledWith("row-1")
    expect(updated).toEqual(row("row-1", "published"))
    await waitFor(() => expect(result.current.rows).toHaveLength(0))
    expect(result.current.resendingId).toBeNull()
  })
})
