import { describe, it, expect, beforeEach, vi } from "vitest"
import { render, screen, waitFor } from "@testing-library/react"
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

const mocks = vi.hoisted(() => ({
  getAll: vi.fn(),
  create: vi.fn(),
  toast: vi.fn(),
}))

vi.mock("@/lib/api", () => ({
  salesService: { getAll: mocks.getAll, create: mocks.create },
  reportsService: { getPOSData: vi.fn(), getProductionMenuDetail: vi.fn() },
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

  it("tetap menampilkan nama warna di tabel", async () => {
    await loadDraft()

    expect(screen.getAllByText(/blue/i).length).toBeGreaterThan(0)
  })
})
