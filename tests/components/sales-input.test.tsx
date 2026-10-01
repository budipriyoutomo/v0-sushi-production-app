import { describe, it, expect, beforeEach, vi } from "vitest"
import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"

/**
 * Sales Input — jalur "buka draft lalu submit".
 *
 * Item draft dari `GET /sales` membawa dua hal yang berbeda: `platecolor`
 * (nama warna, untuk tampilan) dan `plate_color_id` (id master). Layar ini dulu
 * memakai nama sebagai id, jadi draft yang dibuka ulang mengirim "Blue" sebagai
 * `plate_color_id`. Backend dulu menjawabnya 500; sejak rule `uuid` dipasang,
 * 422. Yang dijaga di sini: yang dikirim balik adalah id-nya, bukan namanya.
 */

const PLATE_COLOR_ID = "3f2b8c1e-5d4a-4b6e-9a7c-1e2d3f4a5b6c"
const MENU_ID = "9a8b7c6d-5e4f-4a3b-8c2d-1e0f9a8b7c6d"

const mocks = vi.hoisted(() => ({
  getAll: vi.fn(),
  create: vi.fn(),
  getPOSData: vi.fn(),
  getProductionMenuDetail: vi.fn(),
  toast: vi.fn(),
  outletId: "outlet-1",
}))

vi.mock("@/lib/api", () => ({
  salesService: { getAll: mocks.getAll, create: mocks.create },
  reportsService: { getPOSData: mocks.getPOSData, getProductionMenuDetail: mocks.getProductionMenuDetail },
  getApiError: (e: unknown) => ({
    message: e instanceof Error ? e.message : String(e),
    status: 500,
  }),
}))

vi.mock("@/lib/outlet-context", () => ({
  useOutlet: () => ({
    selectedOutletId: mocks.outletId,
    setSelectedOutletId: vi.fn(),
    outlets: [
      { id: "outlet-1", code: "BDG", name: "Bandung" },
      { id: "outlet-2", code: "JKT", name: "Jakarta" },
    ],
    isLoading: false,
  }),
}))

vi.mock("@/components/outlet-selector", () => ({ OutletSelector: () => null }))

vi.mock("@/hooks/use-toast", () => ({ useToast: () => ({ toast: mocks.toast }) }))

import { SalesInput } from "@/components/sales-input"

function draft() {
  return {
    id: "draft-1",
    date: "2026-09-10",
    outlet_name: "Bandung",
    items: [
      {
        plate_color_id: PLATE_COLOR_ID,
        platecolor: "Blue",
        price: 15000,
        pos: 10,
        sold: 8,
        production: 8,
        waste: 1,
        adjustment: 0,
        compensation: 0,
        selisih: 2,
        details: [
          {
            menu_id: MENU_ID,
            menu_name: "Salmon",
            total_produced: 9,
            total_sold: 8,
            total_wasted: 1,
            adjustment: 1,
            compensation: 1,
          },
        ],
      },
    ],
    created_at: "",
    updated_at: "",
    deleted_at: null,
    created_by: "1",
    updated_by: "1",
    deleted_by: null,
  }
}

describe("SalesInput — draft yang dibuka ulang", () => {
  beforeEach(() => {
    mocks.outletId = "outlet-1"
    mocks.getAll.mockReset().mockResolvedValue([draft()])
    mocks.create.mockReset().mockResolvedValue({})
    mocks.toast.mockReset()
    localStorage.clear()
  })

  async function loadDraft() {
    const user = userEvent.setup()
    render(<SalesInput />)

    await user.click(screen.getByRole("button", { name: /get sales draft/i }))
    await user.click(await screen.findByRole("button", { name: /^load$/i }))

    return user
  }

  it("mengirim id plate color, bukan namanya, saat submit", async () => {
    const user = await loadDraft()

    await user.click(screen.getByRole("button", { name: /submit sales data/i }))

    await waitFor(() => expect(mocks.create).toHaveBeenCalledTimes(1))
    const payload = mocks.create.mock.calls[0][0]

    expect(payload.status).toBe("submitted")
    expect(payload.items[0].plate_color_id).toBe(PLATE_COLOR_ID)
    expect(payload.items[0].plate_color_id).not.toBe("Blue")
  })

  it("mengirim id plate color, bukan namanya, saat simpan draft", async () => {
    const user = await loadDraft()

    await user.click(screen.getByRole("button", { name: /save draft/i }))

    await waitFor(() => expect(mocks.create).toHaveBeenCalledTimes(1))
    expect(mocks.create.mock.calls[0][0].items[0].plate_color_id).toBe(PLATE_COLOR_ID)
  })

  it("hanya meminta draft outlet aktif", async () => {
    await loadDraft()

    expect(mocks.getAll).toHaveBeenCalledWith(
      expect.objectContaining({ outletId: "outlet-1", status: "draft" })
    )
  })

  /**
   * Server membuat ulang item beserta rinciannya dari payload. Draft yang
   * dibuka ulang tanpa rincian dulu menghapus rincian yang tersimpan.
   */
  it("mengirim balik rincian per menu dari draft saat submit", async () => {
    const user = await loadDraft()

    await user.click(screen.getByRole("button", { name: /submit sales data/i }))

    await waitFor(() => expect(mocks.create).toHaveBeenCalledTimes(1))
    expect(mocks.create.mock.calls[0][0].items[0].details).toEqual([
      {
        menu_id: MENU_ID,
        menu_name: "Salmon",
        total_produced: 9,
        total_sold: 8,
        total_wasted: 1,
        adjustment: 1,
        compensation: 1,
      },
    ])
  })

  it("membuang rincian lokal basi untuk tanggal draft itu", async () => {
    const draftWithoutDetails = draft()
    delete (draftWithoutDetails.items[0] as { details?: unknown }).details
    mocks.getAll.mockResolvedValue([draftWithoutDetails])

    const staleKey = `sales-input-detail-outlet-1-2026-09-10-${PLATE_COLOR_ID}`
    localStorage.setItem(staleKey, JSON.stringify({ menuDetails: [{ menuId: "old", adjustment: 9 }] }))

    const user = await loadDraft()
    expect(localStorage.getItem(staleKey)).toBeNull()

    await user.click(screen.getByRole("button", { name: /submit sales data/i }))
    await waitFor(() => expect(mocks.create).toHaveBeenCalledTimes(1))
    expect(mocks.create.mock.calls[0][0].items[0].details).toBeUndefined()
  })

  it("dialog detail memakai rincian draft, bukan nol dari server", async () => {
    mocks.getProductionMenuDetail.mockResolvedValue([
      { menuId: MENU_ID, menuName: "Salmon", totalProduced: 9, totalSold: 8, totalWasted: 1, adjustment: 0, compensation: 0 },
    ])
    const user = await loadDraft()

    await user.click(screen.getByTitle(/edit \/ view detail/i))
    const dialog = await screen.findByRole("dialog")

    await waitFor(() => expect(within(dialog).getAllByDisplayValue("1")).toHaveLength(2))
  })

  it("tetap menampilkan nama warna di tabel", async () => {
    await loadDraft()

    expect(screen.getAllByText(/blue/i).length).toBeGreaterThan(0)
  })
})

/**
 * Sales Input — jalur "Get Data POS".
 *
 * Tiga hal yang dulu bisa membuat data salah tersimpan tanpa tanda apa pun:
 * - tanda adjustment/compensation di layar berlawanan dengan rumus server,
 * - entri tetap tampil (dan bisa di-submit) setelah outlet/tanggal berganti,
 * - rincian per menu di localStorage bertahan setelah POS ditarik ulang.
 */
describe("SalesInput — Get Data POS", () => {
  function posRow() {
    return {
      plateColorId: PLATE_COLOR_ID,
      plateColorName: "Blue",
      posSold: 10,
      productionSold: 8,
      productionWaste: 1,
      selisih: 2,
    }
  }

  beforeEach(() => {
    mocks.outletId = "outlet-1"
    mocks.getPOSData.mockReset().mockResolvedValue([posRow()])
    mocks.create.mockReset().mockResolvedValue({})
    mocks.toast.mockReset()
    localStorage.clear()
  })

  function dateInput(container: HTMLElement) {
    return container.querySelector('input[type="date"]') as HTMLInputElement
  }

  async function fetchPOS() {
    const user = userEvent.setup()
    const utils = render(<SalesInput />)
    await user.click(screen.getByRole("button", { name: /get data pos/i }))
    await screen.findByText(/discrepancies found/i)
    return { user, ...utils }
  }

  it("menghitung selisih dengan rumus server: pos - (sold + adjustment + compensation)", async () => {
    const { user } = await fetchPOS()

    // pos 10, sold 8 → operator menutup selisih +2 dengan adjustment +2.
    const [adjustment] = screen.getAllByRole("spinbutton")
    await user.type(adjustment, "2")

    expect(await screen.findByText(/all sales match system/i)).toBeInTheDocument()

    await user.click(screen.getByRole("button", { name: /submit sales data/i }))
    await waitFor(() => expect(mocks.create).toHaveBeenCalledTimes(1))

    const item = mocks.create.mock.calls[0][0].items[0]
    // Nilai yang sama dengan hitungan SalesService di backend.
    expect(item.pos_sold - (item.production_sold + item.adjustment + item.compensation)).toBe(0)
    expect(item.production_waste).toBe(1)
  })

  it("menyembunyikan entri saat tanggal berganti, jadi tidak bisa ter-submit ke tanggal lain", async () => {
    const { container } = await fetchPOS()

    fireEvent.change(dateInput(container), { target: { value: "2020-01-01" } })

    expect(screen.getByText(/no sales entries yet/i)).toBeInTheDocument()
    expect(screen.queryByRole("button", { name: /submit sales data/i })).not.toBeInTheDocument()
  })

  it("menyembunyikan entri saat outlet berganti", async () => {
    const { rerender } = await fetchPOS()

    mocks.outletId = "outlet-2"
    rerender(<SalesInput />)

    expect(screen.getByText(/no sales entries yet/i)).toBeInTheDocument()
  })

  it("tidak menampilkan respons POS yang datang setelah tanggal berganti", async () => {
    let resolve!: (rows: ReturnType<typeof posRow>[]) => void
    mocks.getPOSData.mockReturnValueOnce(new Promise((r) => (resolve = r)))

    const user = userEvent.setup()
    const { container } = render(<SalesInput />)
    await user.click(screen.getByRole("button", { name: /get data pos/i }))

    fireEvent.change(dateInput(container), { target: { value: "2020-01-01" } })
    await act(async () => resolve([posRow()]))

    expect(screen.getByText(/no sales entries yet/i)).toBeInTheDocument()
  })

  it("membuang rincian per menu yang tersimpan saat POS ditarik ulang", async () => {
    const { user, container } = await fetchPOS()
    const date = dateInput(container).value
    const key = `sales-input-detail-outlet-1-${date}-${PLATE_COLOR_ID}`
    localStorage.setItem(key, JSON.stringify({ menuDetails: [{ menuId: "m1", adjustment: 5, compensation: 0 }] }))

    await user.click(screen.getByRole("button", { name: /get data pos/i }))
    await waitFor(() => expect(mocks.getPOSData).toHaveBeenCalledTimes(2))
    await waitFor(() => expect(localStorage.getItem(key)).toBeNull())

    await user.click(screen.getByRole("button", { name: /submit sales data/i }))
    await waitFor(() => expect(mocks.create).toHaveBeenCalledTimes(1))
    expect(mocks.create.mock.calls[0][0].items[0].details).toBeUndefined()
  })
})
