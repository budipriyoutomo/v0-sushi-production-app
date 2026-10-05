import { describe, it, expect, beforeEach, vi } from "vitest"
import { render, screen, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"

/**
 * Layar admin "Kirim Ulang BI".
 *
 * Yang dijaga: outlet wajib terpilih, laporan yang sudah terkirim tidak punya
 * tombol kirim ulang, laporan yang berhenti dicoba terlihat jelas, dan hasil
 * kirim ulang — terkirim atau belum — dikatakan apa adanya.
 */

const mocks = vi.hoisted(() => ({
  rows: [] as unknown[],
  resend: vi.fn(),
  hookArgs: [] as unknown[],
  resendingId: null as string | null,
  toast: vi.fn(),
  selectedOutletId: "outlet-1",
}))

vi.mock("@/hooks/use-closing-report-outbox", () => ({
  useClosingReportOutbox: (...args: unknown[]) => {
    mocks.hookArgs = args
    return {
      rows: mocks.rows,
      total: mocks.rows.length,
      isLoading: false,
      error: undefined,
      resend: mocks.resend,
      resendingId: mocks.resendingId,
    }
  },
}))

vi.mock("@/lib/outlet-context", () => ({
  useOutlet: () => ({
    selectedOutletId: mocks.selectedOutletId,
    setSelectedOutletId: vi.fn(),
    outlets: [{ id: "outlet-1", code: "BDG", name: "Bandung" }],
    isLoading: false,
  }),
}))

vi.mock("@/components/outlet-selector", () => ({ OutletSelector: () => null }))

vi.mock("@/hooks/use-toast", () => ({ useToast: () => ({ toast: mocks.toast }) }))

vi.mock("@/lib/api", () => ({
  getApiError: (e: unknown) => ({
    message: e instanceof Error ? e.message : String(e),
    status: 409,
  }),
}))

import { BiSyncAdmin } from "@/components/bi-sync-admin"

function row(overrides: Record<string, unknown> = {}) {
  return {
    id: "row-1",
    closingReportId: "report-1",
    date: "2026-10-01",
    outletId: "outlet-1",
    outletCode: "BDG",
    outletName: "Bandung",
    status: "failed",
    attempts: 2,
    maxAttempts: 30,
    exhausted: false,
    lastError: "Connection refused",
    nextAttemptAt: "2026-10-02T15:04:00+00:00",
    publishedAt: null,
    createdAt: "2026-10-01T15:00:00+00:00",
    ...overrides,
  }
}

function rowFor(date: string) {
  return screen.getByText(date).closest("tr") as HTMLElement
}

describe("BiSyncAdmin", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.rows = []
    mocks.resendingId = null
    mocks.selectedOutletId = "outlet-1"
  })

  it("meminta outlet dipilih dulu dan tidak menampilkan tabel", () => {
    mocks.selectedOutletId = ""

    render(<BiSyncAdmin />)

    expect(screen.getByText(/pilih outlet/i)).toBeInTheDocument()
    expect(screen.queryByRole("table")).not.toBeInTheDocument()
  })

  it("defaultnya menampilkan yang belum terkirim untuk outlet terpilih", () => {
    render(<BiSyncAdmin />)

    expect(mocks.hookArgs[0]).toBe("outlet-1")
    expect(mocks.hookArgs[1]).toMatchObject({ status: "unpublished" })
  })

  it("filter status bisa diganti", async () => {
    const user = userEvent.setup()
    render(<BiSyncAdmin />)

    await user.click(screen.getByRole("button", { name: "Semua" }))

    expect(mocks.hookArgs[1]).toMatchObject({ status: "all" })
  })

  it("menampilkan baris beserta sebab gagal dan jumlah percobaan", () => {
    mocks.rows = [row()]

    render(<BiSyncAdmin />)

    const tr = rowFor("2026-10-01")
    expect(within(tr).getByText("Connection refused")).toBeInTheDocument()
    expect(within(tr).getByText("2 / 30")).toBeInTheDocument()
  })

  it("menandai laporan yang berhenti dicoba otomatis", () => {
    mocks.rows = [row({ attempts: 30, exhausted: true })]

    render(<BiSyncAdmin />)

    expect(within(rowFor("2026-10-01")).getByText(/berhenti dicoba/i)).toBeInTheDocument()
  })

  it("laporan yang sudah terkirim tidak punya tombol kirim ulang", () => {
    mocks.rows = [
      row({ id: "row-sent", date: "2026-09-30", status: "published", lastError: null, publishedAt: "2026-09-30T16:00:00+00:00" }),
    ]

    render(<BiSyncAdmin />)

    const tr = rowFor("2026-09-30")
    expect(within(tr).getByText("Terkirim")).toBeInTheDocument()
    expect(within(tr).queryByRole("button", { name: /kirim ulang/i })).not.toBeInTheDocument()
  })

  it("kirim ulang yang berhasil diberitahukan", async () => {
    mocks.rows = [row()]
    mocks.resend.mockResolvedValue(row({ status: "published" }))
    const user = userEvent.setup()
    render(<BiSyncAdmin />)

    await user.click(within(rowFor("2026-10-01")).getByRole("button", { name: /kirim ulang/i }))

    expect(mocks.resend).toHaveBeenCalledWith("row-1")
    expect(mocks.toast).toHaveBeenCalledWith(expect.objectContaining({ title: "Terkirim ke BI" }))
  })

  it("kirim ulang yang belum sampai menyebut sebabnya, tanpa mengaku berhasil", async () => {
    mocks.rows = [row()]
    mocks.resend.mockResolvedValue(row({ status: "failed", attempts: 3, lastError: "NO_ROUTE" }))
    const user = userEvent.setup()
    render(<BiSyncAdmin />)

    await user.click(within(rowFor("2026-10-01")).getByRole("button", { name: /kirim ulang/i }))

    expect(mocks.toast).toHaveBeenCalledWith(
      expect.objectContaining({ title: "Belum terkirim", description: expect.stringContaining("NO_ROUTE"), variant: "destructive" })
    )
  })

  it("penolakan server ditampilkan sebagai error", async () => {
    mocks.rows = [row()]
    mocks.resend.mockRejectedValue(new Error("Laporan ini sudah terkirim ke BI."))
    const user = userEvent.setup()
    render(<BiSyncAdmin />)

    await user.click(within(rowFor("2026-10-01")).getByRole("button", { name: /kirim ulang/i }))

    expect(mocks.toast).toHaveBeenCalledWith(
      expect.objectContaining({ description: "Laporan ini sudah terkirim ke BI.", variant: "destructive" })
    )
  })

  it("tombol baris yang sedang dikirim dinonaktifkan", () => {
    mocks.rows = [row()]
    mocks.resendingId = "row-1"

    render(<BiSyncAdmin />)

    expect(within(rowFor("2026-10-01")).getByRole("button", { name: /mengirim/i })).toBeDisabled()
  })
})
