import { describe, it, expect, beforeEach, vi } from "vitest"
import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import type { TimeSlot } from "@/lib/api"

/**
 * Layar planning setelah slot jadi data.
 *
 * Yang dijaga di sini tiga hal, semuanya bekas bug:
 *
 * - Barisnya datang dari master brand, bukan dari 22 slot 10:00-21:00 yang dulu
 *   dikunci mati dan sama untuk semua brand.
 * - Warna baris diambil dari baris slot, bukan dari NOMOR URUT BARIS. Versi
 *   lama memakai sisa bagi nomor baris, jadi plan tersimpan yang urutannya
 *   dikembalikan acak oleh basis data menampilkan warna yang salah.
 * - Label tersimpan yang slotnya sudah tidak ada ditampilkan apa adanya dan
 *   tidak ikut dikirim — server menolak label di luar master, jadi
 *   menyertakannya membuat seluruh plan gagal disimpan.
 */

/**
 * Referensinya harus STABIL antar render.
 *
 * Komponen memoisasi `colorKeys` dan `sortedSlots` dari array ini, lalu sebuah
 * effect menyetel state dari hasil memo itu. Mock yang mengembalikan array baru
 * tiap render membuat identitasnya selalu berubah, jadi effect-nya berputar
 * tanpa henti ("Maximum update depth exceeded"). Ini bukan hanya jebakan test:
 * hook aslinya dulu mengembalikan `data || []` selama data belum datang, dan
 * layar ini loop sungguhan di browser. Sekarang hook memakai `emptyArray()`
 * yang identitasnya tetap — dijaga di tests/hooks/stable-empty-fallback.test.tsx.
 */
const mocks = vi.hoisted(() => ({
  savePlan: vi.fn(),
  refresh: vi.fn(),
  toast: vi.fn(),
  plan: [] as Array<Record<string, string | number>>,
  timeSlots: [] as TimeSlot[],
  plateColors: [
    {
      id: "pc-1",
      platename: "Merah",
      colorHex: "#EF4444",
      price: 15000,
      description: "",
      targetFoodCost: 0,
      brandId: "brand-1",
      isActive: true,
    },
  ],
}))

vi.mock("@/lib/outlet-context", () => ({
  useOutlet: () => ({ selectedOutletId: "outlet-1" }),
}))

vi.mock("@/components/outlet-selector", () => ({ OutletSelector: () => null }))

vi.mock("@/hooks/use-toast", () => ({ useToast: () => ({ toast: mocks.toast }) }))

vi.mock("@/hooks/use-production", () => ({
  useProductionPlan: () => ({
    plan: mocks.plan,
    isLoading: false,
    savePlan: mocks.savePlan,
    refresh: mocks.refresh,
  }),
}))

vi.mock("@/hooks/use-plate-colors", () => ({
  usePlateColorsSortedByPrice: () => ({
    plateColors: mocks.plateColors,
    isLoading: false,
  }),
}))

vi.mock("@/hooks/use-time-slots", () => ({
  useTimeSlots: () => ({ timeSlots: mocks.timeSlots, isLoading: false }),
}))

vi.mock("@/lib/api", () => ({
  getApiError: (e: unknown) => ({
    message: e instanceof Error ? e.message : String(e),
    status: 500,
  }),
}))

import { ProductionPlanning } from "@/components/production-planning"

function slot(start: string, end: string, markerLabel: string | null): TimeSlot {
  return {
    id: `slot-${start}`,
    brandId: "brand-1",
    startTime: `${start}:00`,
    endTime: `${end}:00`,
    label: `${start}-${end}`,
    marker: markerLabel
      ? {
          id: `marker-${markerLabel}`,
          brandId: "brand-1",
          label: markerLabel,
          colorHex: "#3B82F6",
          sortOrder: 0,
          isActive: true,
        }
      : null,
    sortOrder: 0,
    isActive: true,
  }
}

describe("ProductionPlanning", () => {
  beforeEach(() => {
    mocks.savePlan.mockReset().mockResolvedValue(undefined)
    mocks.toast.mockReset()
    mocks.plan = []
    mocks.timeSlots = [slot("10:00", "10:30", "Biru"), slot("12:30", "13:00", "Hitam")]
  })

  it("membuat baris dari slot master, bukan daftar bawaan", async () => {
    render(<ProductionPlanning />)

    expect(await screen.findByText("10:00")).toBeInTheDocument()
    expect(screen.getByText("12:30")).toBeInTheDocument()

    // Daftar lama selalu punya 22 baris 10:00-21:00. Kalau masih dipakai,
    // jam-jam ini ikut muncul.
    expect(screen.queryByText("11:00")).not.toBeInTheDocument()
    expect(screen.queryByText("20:30")).not.toBeInTheDocument()
  })

  it("menampilkan penanda yang dipakai brand di legenda", async () => {
    render(<ProductionPlanning />)

    expect(await screen.findByText("Biru")).toBeInTheDocument()
    expect(screen.getByText("Hitam")).toBeInTheDocument()

    // Lima warna bawaan lama termasuk Kuning; ia tidak dipakai brand ini.
    expect(screen.queryByText("Kuning")).not.toBeInTheDocument()
  })

  it("mengajak ke setelan kalau brand belum punya slot", async () => {
    mocks.timeSlots = []

    render(<ProductionPlanning />)

    expect(await screen.findByText(/belum punya time slot/i)).toBeInTheDocument()
    expect(screen.getByRole("link", { name: /setelan brand/i })).toHaveAttribute(
      "href",
      "/admin/brand-settings"
    )
  })

  it("menampilkan baris tersimpan yang slotnya sudah tidak ada, tapi menguncinya", async () => {
    mocks.plan = [
      { timeSlot: "10:00-10:30", merah: 5 },
      { timeSlot: "08:00-09:00", merah: 3 },
    ]

    render(<ProductionPlanning />)

    expect(await screen.findByText("08:00")).toBeInTheDocument()
    expect(screen.getByText(/tidak dikenal/i)).toBeInTheDocument()
    expect(screen.getByText(/tidak ikut tersimpan/i)).toBeInTheDocument()

    const lockedInput = screen.getByDisplayValue("3")
    expect(lockedInput).toBeDisabled()
  })

  it("tidak mengirim baris yang slotnya sudah tidak ada", async () => {
    mocks.plan = [
      { timeSlot: "10:00-10:30", merah: 5 },
      { timeSlot: "08:00-09:00", merah: 3 },
    ]

    const user = userEvent.setup()
    render(<ProductionPlanning />)

    await user.click(await screen.findByRole("button", { name: /save production plan/i }))

    await waitFor(() => expect(mocks.savePlan).toHaveBeenCalledTimes(1))

    const sent = mocks.savePlan.mock.calls[0][0] as Array<{ timeSlot: string }>

    expect(sent.map((row) => row.timeSlot)).toEqual(["10:00-10:30", "12:30-13:00"])
  })
})
