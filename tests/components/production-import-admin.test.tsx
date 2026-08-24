import { describe, it, expect, beforeEach, vi } from "vitest"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"

/**
 * Import produksi backdate.
 *
 * Yang dijaga di sini adalah pagar-pagarnya, bukan tampilannya: impor menulis
 * satu baris per piring ke hari yang laporannya sudah jadi, dan tidak ada
 * tombol undo. Tiga hal yang harus tetap benar — outlet wajib terpilih, berkas
 * bermasalah tidak bisa diimpor, dan berkas yang tabrakan hanya lolos setelah
 * operator menyalakannya sendiri.
 */

const mocks = vi.hoisted(() => ({
  preview: null as unknown,
  runPreview: vi.fn(),
  runImport: vi.fn(),
  reset: vi.fn(),
  toast: vi.fn(),
  selectedOutletId: "outlet-1",
}))

vi.mock("@/hooks/use-production-import", () => ({
  useProductionImport: () => ({
    preview: mocks.preview,
    isPreviewing: false,
    isImporting: false,
    runPreview: mocks.runPreview,
    runImport: mocks.runImport,
    reset: mocks.reset,
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

vi.mock("@/hooks/use-toast", () => ({ useToast: () => ({ toast: mocks.toast }) }))

vi.mock("@/lib/api", () => ({
  getApiError: (e: unknown) => ({
    message: e instanceof Error ? e.message : String(e),
    status: 500,
  }),
  BACKDATE_TEMPLATE_CSV: "date,menu_code,quantity,final_status",
}))

import { ProductionImportAdmin } from "@/components/production-import-admin"

function summary(overrides: Record<string, unknown> = {}) {
  return {
    totalRows: 2,
    validRows: 2,
    errorRows: 0,
    totalPlates: 15,
    soldPlates: 12,
    wastePlates: 3,
    dates: ["2026-01-15"],
    duplicatePlates: 0,
    ...overrides,
  }
}

function row(overrides: Record<string, unknown> = {}) {
  return {
    line: 2,
    date: "2026-01-15",
    menuCode: "SUS-001",
    menuName: "Salmon Nigiri",
    plateColorName: "Merah",
    quantity: 12,
    finalStatus: "sold",
    notes: null,
    producedAt: "2026-01-15 12:00:00",
    existingPlates: 0,
    errors: [] as string[],
    ...overrides,
  }
}

const csvFile = () => new File(["date,menu_code,quantity,final_status"], "backdate.csv", { type: "text/csv" })

const fileInput = () => screen.getByLabelText("Berkas CSV")
const previewButton = () => screen.getByRole("button", { name: /^preview$/i })
const importButton = () => screen.getByRole("button", { name: /import \d+ piring/i })

describe("ProductionImportAdmin", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.preview = null
    mocks.selectedOutletId = "outlet-1"
    mocks.runPreview.mockResolvedValue({ summary: summary(), rows: [row()] })
    mocks.runImport.mockResolvedValue({ imported: 15, wasteRecords: 3, summary: summary() })
  })

  it("cannot preview before a file is chosen", () => {
    render(<ProductionImportAdmin />)

    expect(previewButton()).toBeDisabled()
  })

  it("previews the chosen file", async () => {
    const user = userEvent.setup()
    render(<ProductionImportAdmin />)

    const file = csvFile()
    await user.upload(fileInput(), file)
    await user.click(previewButton())

    expect(mocks.runPreview).toHaveBeenCalledWith(file)
  })

  /**
   * `selectedOutletId` kosong berarti daftar outlet belum membuktikan pilihan
   * tersimpan milik user ini (lihat OutletProvider). Mengimpor tetap akan
   * berhasil menulis — ke outlet yang salah.
   */
  it("refuses to preview without an outlet", async () => {
    const user = userEvent.setup()
    mocks.selectedOutletId = ""
    render(<ProductionImportAdmin />)

    await user.upload(fileInput(), csvFile())

    expect(previewButton()).toBeDisabled()
    expect(screen.getByText(/pilih outlet dulu/i)).toBeInTheDocument()
  })

  it("shows the per-row errors and blocks the import", () => {
    mocks.preview = {
      summary: summary({ validRows: 1, errorRows: 1, totalPlates: 12, wastePlates: 0 }),
      rows: [row(), row({ line: 3, menuName: null, errors: ["Menu dengan kode 'NOPE' tidak ada"] })],
    }
    render(<ProductionImportAdmin />)

    expect(screen.getByText(/Menu dengan kode 'NOPE' tidak ada/)).toBeInTheDocument()
    expect(importButton()).toBeDisabled()
  })

  it("holds a colliding file until the operator allows duplicates", async () => {
    const user = userEvent.setup()
    mocks.preview = {
      summary: summary({ duplicatePlates: 12 }),
      rows: [row({ existingPlates: 12 })],
    }
    render(<ProductionImportAdmin />)

    await user.upload(fileInput(), csvFile())

    expect(importButton()).toBeDisabled()
    expect(screen.getByText(/sudah punya 12 piring/i)).toBeInTheDocument()

    await user.click(screen.getByRole("switch"))

    expect(importButton()).toBeEnabled()
  })

  it("imports only after the confirmation dialog", async () => {
    const user = userEvent.setup()
    mocks.preview = { summary: summary(), rows: [row()] }
    render(<ProductionImportAdmin />)

    const file = csvFile()
    await user.upload(fileInput(), file)
    await user.click(importButton())

    expect(mocks.runImport).not.toHaveBeenCalled()

    await user.click(screen.getByRole("button", { name: /import sekarang/i }))

    expect(mocks.runImport).toHaveBeenCalledWith(file, false)
  })
})
