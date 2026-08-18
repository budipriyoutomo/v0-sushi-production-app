import { describe, it, expect, beforeEach, vi } from "vitest"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"

const mocks = vi.hoisted(() => ({
  menus: [] as Array<Record<string, unknown>>,
  createMenu: vi.fn(),
  updateMenu: vi.fn(),
  deleteMenu: vi.fn(),
  toast: vi.fn(),
}))

vi.mock("@/hooks/use-menus", () => ({
  useMenus: () => ({
    menus: mocks.menus,
    isLoading: false,
    createMenu: mocks.createMenu,
    updateMenu: mocks.updateMenu,
    deleteMenu: mocks.deleteMenu,
  }),
}))
vi.mock("@/hooks/use-plate-colors", () => ({
  usePlateColors: () => ({ plateColors: [{ id: "pc-1", platename: "Merah", price: 15000 }] }),
}))
vi.mock("@/hooks/use-brands", () => ({
  useBrands: () => ({ brands: [{ id: "b-1", name: "Maharasa" }] }),
}))
vi.mock("@/lib/api", () => ({
  getApiError: (e: unknown) => ({ message: e instanceof Error ? e.message : String(e), status: 500 }),
}))
vi.mock("@/hooks/use-toast", () => ({ useToast: () => ({ toast: mocks.toast }) }))

import { MenusAdmin } from "@/components/menus-admin"

/** 24 menu — lebih dari satu halaman klien (10) dan lebih dari default backend (15). */
function manyMenus() {
  return Array.from({ length: 24 }, (_, i) => ({
    id: `m-${i + 1}`,
    code: `CODE-${String(i + 1).padStart(2, "0")}`,
    menuname: `Menu ${i + 1}`,
    description: `Deskripsi ${i + 1}`,
    price: 20000,
    shelfLife: 60,
    plateColorId: "pc-1",
    plateColorName: "Merah",
    brandId: "b-1",
    brandName: "Maharasa",
    isActive: true,
  }))
}

const searchBox = () => screen.getByPlaceholderText(/search code/i)

describe("MenusAdmin — search", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.menus = manyMenus()
  })

  it("finds a menu that sits past the first client page", async () => {
    const user = userEvent.setup()
    render(<MenusAdmin />)

    // Urutan default adalah menuname sebagai teks, jadi "Menu 10" mendahului
    // "Menu 2" dan Menu 20 jatuh di luar halaman klien pertama.
    expect(screen.queryByText("Menu 20")).toBeNull()

    await user.type(searchBox(), "Menu 20")

    expect(screen.getByText("Menu 20")).toBeInTheDocument()
    expect(screen.queryByText("Menu 1")).toBeNull()
  })

  it("counts against the full list, not the visible page", () => {
    render(<MenusAdmin />)

    // Kalau angka kedua ini pernah terbaca 15, artinya hook lupa
    // `per_page: 'all'` dan backend hanya mengirim halaman pertama.
    expect(screen.getByText("24 of 24 items")).toBeInTheDocument()
  })

  it("narrows the count as the query narrows", async () => {
    const user = userEvent.setup()
    render(<MenusAdmin />)

    await user.type(searchBox(), "CODE-07")

    expect(screen.getByText("1 of 24 items")).toBeInTheDocument()
  })

  it("searches by code", async () => {
    const user = userEvent.setup()
    render(<MenusAdmin />)

    await user.type(searchBox(), "code-18")

    expect(screen.getByText("Menu 18")).toBeInTheDocument()
  })

  it("searches by brand name", async () => {
    const user = userEvent.setup()
    mocks.menus = [
      { ...manyMenus()[0], id: "x", menuname: "Salmon", brandName: "Maharasa" },
      { ...manyMenus()[1], id: "y", menuname: "Tuna", brandName: "Brand Lain" },
    ]
    render(<MenusAdmin />)

    await user.type(searchBox(), "brand lain")

    expect(screen.getByText("Tuna")).toBeInTheDocument()
    expect(screen.queryByText("Salmon")).toBeNull()
  })

  it("says so plainly when nothing matches", async () => {
    const user = userEvent.setup()
    render(<MenusAdmin />)

    await user.type(searchBox(), "tidak ada apa pun")

    expect(screen.getByText("No menu items found")).toBeInTheDocument()
    expect(screen.getByText("0 of 24 items")).toBeInTheDocument()
  })

  it("resets to page one when the query changes", async () => {
    const user = userEvent.setup()
    render(<MenusAdmin />)

    // Halaman 3 dari urutan teks berisi Menu 6–9.
    await user.click(screen.getByRole("button", { name: "3" }))
    expect(screen.getByText("Menu 6")).toBeInTheDocument()

    await user.type(searchBox(), "Menu 20")

    // Tanpa reset, satu hasil ini jatuh di halaman 1 sementara tabel masih
    // menampilkan halaman 3 — layarnya kosong padahal hitungannya bilang ada.
    expect(screen.getByText("Menu 20")).toBeInTheDocument()
    expect(screen.getByText("1 of 24 items")).toBeInTheDocument()
  })
})

describe("MenusAdmin — duplicate code check", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.menus = manyMenus()
  })

  it("catches a duplicate code that lives past the first backend page", async () => {
    const user = userEvent.setup()
    render(<MenusAdmin />)

    await user.click(screen.getByRole("button", { name: /add menu item/i }))
    // CODE-20 hanya bisa terdeteksi kalau daftarnya utuh; dengan 15 baris
    // pertama saja, form meloloskannya dan backend menolak 422 belakangan.
    await user.type(screen.getByLabelText(/code/i), "CODE-20")

    expect(screen.getByText("Code already exists in this brand")).toBeInTheDocument()
  })
})
