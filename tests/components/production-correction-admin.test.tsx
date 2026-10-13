import { describe, it, expect, beforeEach, vi } from "vitest"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"

/**
 * Layar admin "Koreksi Status Produksi".
 *
 * Yang dijaga: outlet wajib terpilih, tanggal yang terkunci tidak bisa diisi,
 * jumlah tidak bisa melebihi piring yang ada, alasan waste wajib untuk arah ke
 * waste, dan payload yang dikirim persis seperti yang diisi admin.
 */

const mocks = vi.hoisted(() => ({
  summary: null as unknown,
  preview: null as unknown,
  runPreview: vi.fn(),
  apply: vi.fn(),
  resetPreview: vi.fn(),
  cancelSalesDraft: vi.fn(),
  toast: vi.fn(),
  selectedOutletId: "outlet-1",
}))

vi.mock("@/hooks/use-production-correction", () => ({
  useProductionCorrection: () => ({
    summary: mocks.summary,
    summaryError: undefined,
    isLoadingSummary: false,
    history: [],
    historyTotal: 0,
    historyError: undefined,
    isLoadingHistory: false,
    preview: mocks.preview,
    isPreviewing: false,
    isApplying: false,
    runPreview: mocks.runPreview,
    apply: mocks.apply,
    resetPreview: mocks.resetPreview,
    isCancellingSales: false,
    cancelSalesDraft: mocks.cancelSalesDraft,
  }),
}))

vi.mock("@/hooks/use-waste-reasons", () => ({
  useWasteReasons: () => ({
    wasteReasons: [
      { id: "reason-1", reason_name: "Rusak", description: "", is_active: true },
      { id: "reason-2", reason_name: "Lama", description: "", is_active: false },
    ],
  }),
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
  getApiError: (e: unknown) => ({ message: e instanceof Error ? e.message : String(e), status: 422 }),
}))

import { ProductionCorrectionAdmin } from "@/components/production-correction-admin"

function summary(overrides: Record<string, unknown> = {}) {
  return {
    date: "2026-10-11",
    lock: { locked: false, reason: null, salesId: null, salesStatus: null, warnings: [] },
    unresolved: 0,
    cancelledSalesDrafts: [],
    menus: [
      {
        menuId: "menu-1",
        menuCode: "SUS-001",
        menuName: "Salmon Nigiri",
        plateColorId: "color-1",
        plateColorName: "Merah",
        plateColorHex: "#ff0000",
        sold: 5,
        waste: 1,
      },
    ],
    ...overrides,
  }
}

const REASON = "Close Day menandai semua sold padahal dibuang"

describe("ProductionCorrectionAdmin", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.summary = summary()
    mocks.preview = null
    mocks.selectedOutletId = "outlet-1"
    mocks.runPreview.mockResolvedValue({})
  })

  it("meminta outlet dipilih dulu", () => {
    mocks.selectedOutletId = ""
    render(<ProductionCorrectionAdmin />)

    expect(screen.getByText("Pilih outlet terlebih dahulu.")).toBeInTheDocument()
    expect(screen.queryByText("Salmon Nigiri")).not.toBeInTheDocument()
  })

  it("tanggal terkunci menampilkan alasannya dan menonaktifkan input", () => {
    mocks.summary = summary({
      lock: {
        locked: true,
        reason: "Sales Input tanggal ini sudah dibuat (status draft).",
        salesId: "sales-1",
        salesStatus: "draft",
        warnings: [],
      },
    })
    render(<ProductionCorrectionAdmin />)

    expect(screen.getByRole("alert")).toHaveTextContent("status draft")
    expect(screen.getByLabelText("Salmon Nigiri sold ke waste")).toBeDisabled()
    expect(screen.queryByRole("button", { name: /Preview Koreksi/ })).not.toBeInTheDocument()
  })

  it("jumlah dipotong ke piring yang tersedia", async () => {
    const user = userEvent.setup()
    render(<ProductionCorrectionAdmin />)

    const input = screen.getByLabelText("Salmon Nigiri sold ke waste")
    await user.type(input, "9")

    expect(input).toHaveValue(5)
  })

  it("koreksi ke waste butuh alasan waste sebelum bisa di-preview", async () => {
    const user = userEvent.setup()
    render(<ProductionCorrectionAdmin />)

    await user.type(screen.getByLabelText("Salmon Nigiri sold ke waste"), "2")
    await user.type(screen.getByLabelText(/Alasan koreksi/), REASON)

    const previewButton = screen.getByRole("button", { name: /Preview Koreksi/ })
    expect(previewButton).toBeDisabled()

    // Alasan yang tidak aktif tidak ditawarkan.
    expect(screen.queryByRole("option", { name: "Lama" })).not.toBeInTheDocument()

    await user.selectOptions(screen.getByLabelText(/Alasan waste/), "reason-1")
    expect(previewButton).toBeEnabled()

    await user.click(previewButton)

    expect(mocks.runPreview).toHaveBeenCalledWith({
      outletId: "outlet-1",
      date: expect.any(String),
      reason: REASON,
      wasteReasonId: "reason-1",
      items: [{ menuId: "menu-1", from: "sold", to: "waste", quantity: 2 }],
    })
  })

  it("koreksi ke sold tidak mengirim alasan waste", async () => {
    const user = userEvent.setup()
    render(<ProductionCorrectionAdmin />)

    await user.type(screen.getByLabelText("Salmon Nigiri waste ke sold"), "1")
    await user.type(screen.getByLabelText(/Alasan koreksi/), REASON)
    await user.click(screen.getByRole("button", { name: /Preview Koreksi/ }))

    expect(mocks.runPreview).toHaveBeenCalledWith(
      expect.objectContaining({
        wasteReasonId: null,
        items: [{ menuId: "menu-1", from: "waste", to: "sold", quantity: 1 }],
      })
    )
  })

  it("menampilkan peringatan dari server", () => {
    mocks.summary = summary({
      lock: {
        locked: false,
        reason: null,
        salesId: null,
        salesStatus: null,
        warnings: ["Kalau operator sudah membuka Get Data POS, minta ulangi."],
      },
    })
    render(<ProductionCorrectionAdmin />)

    expect(screen.getByText("Kalau operator sudah membuka Get Data POS, minta ulangi.")).toBeInTheDocument()
  })

  it("draft Sales Input yang mengunci bisa dibatalkan dengan alasan", async () => {
    const user = userEvent.setup()
    mocks.cancelSalesDraft.mockResolvedValue(undefined)
    mocks.summary = summary({
      lock: {
        locked: true,
        reason: "Sales Input tanggal ini sudah dibuat (status draft).",
        salesId: "sales-1",
        salesStatus: "draft",
        warnings: [],
      },
    })
    render(<ProductionCorrectionAdmin />)

    await user.click(screen.getByRole("button", { name: "Batalkan draft Sales Input" }))

    const confirm = screen.getByRole("button", { name: "Batalkan Draft" })
    expect(confirm).toBeDisabled()

    await user.type(screen.getByLabelText(/Alasan pembatalan/), "Ada piring salah status")
    await user.click(confirm)

    expect(mocks.cancelSalesDraft).toHaveBeenCalledWith("sales-1", "Ada piring salah status")
  })

  it("Sales Input submitted tidak menawarkan pembatalan", () => {
    mocks.summary = summary({
      lock: {
        locked: true,
        reason: "Sales Input tanggal ini sudah dibuat (status submitted).",
        salesId: "sales-1",
        salesStatus: "submitted",
        warnings: [],
      },
    })
    render(<ProductionCorrectionAdmin />)

    expect(screen.queryByRole("button", { name: "Batalkan draft Sales Input" })).not.toBeInTheDocument()
  })

  it("menampilkan draft yang pernah dibatalkan", () => {
    mocks.summary = summary({
      cancelledSalesDrafts: [
        { id: "s-0", reason: "Salah status salmon", cancelledBy: "1", cancelledByName: "Admin", cancelledAt: null },
      ],
    })
    render(<ProductionCorrectionAdmin />)

    expect(screen.getByText(/oleh Admin: Salah status salmon/)).toBeInTheDocument()
  })
})
