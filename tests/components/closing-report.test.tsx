import { describe, it, expect, beforeEach, vi } from "vitest"
import { render, screen, waitFor, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"

/**
 * Closing Report — setelah submit, operator melihat apakah laporan sudah
 * terkirim ke BI (RabbitMQ `closingreport.submitted`). Statusnya dibaca dari
 * respons submit (`publishStatus`), bukan ditebak di klien.
 */

const mocks = vi.hoisted(() => ({
  getData: vi.fn(),
  submit: vi.fn(),
  toast: vi.fn(),
}))

vi.mock("@/lib/api", () => ({
  closingReportService: { getData: mocks.getData, submit: mocks.submit },
  getApiError: (e: unknown) => ({
    message: e instanceof Error ? e.message : String(e),
    status: 500,
  }),
}))

vi.mock("@/lib/outlet-context", () => ({
  useOutlet: () => ({
    selectedOutletId: "outlet-1",
    setSelectedOutletId: vi.fn(),
    outlets: [{ id: "outlet-1", code: "BDG", name: "Bandung" }],
    isLoading: false,
  }),
}))

vi.mock("@/components/outlet-selector", () => ({ OutletSelector: () => null }))

vi.mock("@/hooks/use-toast", () => ({ useToast: () => ({ toast: mocks.toast }) }))

import { ClosingReport } from "@/components/closing-report"

function reportData(overrides: Record<string, unknown> = {}) {
  return {
    id: "report-1",
    outletId: "outlet-1",
    outletName: "Bandung",
    date: "2026-10-02",
    status: "draft",
    entries: [
      {
        id: "entry-1",
        menuId: "menu-1",
        menuCode: "SU-001",
        menuName: "Salmon Nigiri",
        categoryName: null,
        plateColor: { id: "pc-1", name: "Merah", code: "RED" },
        sellingPrice: 15000,
        produced: 10,
        sold: 9,
        waste: 1,
        posSold: 9,
        adjustment: 0,
        compensation: 0,
        selisih: 0,
        revenue: 135000,
      },
    ],
    wastePhotoUrls: [],
    publishStatus: null,
    ...overrides,
  }
}

async function loadAndSubmit() {
  const user = userEvent.setup()
  render(<ClosingReport />)

  await user.click(screen.getByRole("button", { name: /get data/i }))
  await screen.findByText("Salmon Nigiri")

  await user.type(screen.getByLabelText(/kitchen leader/i), "Budi")
  await user.type(screen.getByLabelText(/operation leader/i), "Sari")
  await user.click(screen.getByRole("button", { name: /submit closing report/i }))

  return user
}

describe("ClosingReport — status kirim ke BI", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.getData.mockResolvedValue(reportData())
  })

  it("menampilkan terkirim di dialog sukses dan banner kalau server sudah mengirim", async () => {
    mocks.submit.mockResolvedValue(reportData({ status: "submitted", publishStatus: "published" }))

    await loadAndSubmit()

    const dialog = await screen.findByRole("dialog")
    expect(within(dialog).getByText("Terkirim ke BI")).toBeInTheDocument()
    expect(screen.getAllByText("Terkirim ke BI").length).toBeGreaterThanOrEqual(2)
  })

  it("menampilkan menunggu kalau broker sedang tidak bisa dihubungi", async () => {
    mocks.submit.mockResolvedValue(reportData({ status: "submitted", publishStatus: "failed" }))

    await loadAndSubmit()

    const dialog = await screen.findByRole("dialog")
    // Submit-nya tetap sukses — yang tertunda hanya kirimannya.
    expect(within(dialog).getByText("Sukses!")).toBeInTheDocument()
    expect(within(dialog).getByText("Menunggu dikirim ke BI")).toBeInTheDocument()
  })

  it("tidak menampilkan status kirim kalau submit gagal", async () => {
    mocks.submit.mockRejectedValue(new Error("Closing report already submitted."))

    await loadAndSubmit()

    await waitFor(() =>
      expect(mocks.toast).toHaveBeenCalledWith(
        expect.objectContaining({ description: "Closing report already submitted." })
      )
    )
    expect(screen.queryByText("Terkirim ke BI")).not.toBeInTheDocument()
    expect(screen.queryByText("Menunggu dikirim ke BI")).not.toBeInTheDocument()
  })
})
