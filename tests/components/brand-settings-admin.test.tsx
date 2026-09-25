import { describe, it, expect, beforeEach, vi } from "vitest"
import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import type { TimeMarker, TimeSlot } from "@/lib/api"

/**
 * Halaman setelan waktu per brand.
 *
 * Yang dijaga: brand wajib dipilih lebih dulu, peringatan siklus penanda muncul
 * ketika penanda berulang lebih cepat daripada umur piring, dan pengisian
 * otomatis hanya titik awal — bukan aturan yang tidak bisa diubah seperti rumus
 * sisa bagi yang dulu dikunci mati di layar planning.
 */

const mocks = vi.hoisted(() => ({
  toast: vi.fn(),
  createTimeSlot: vi.fn(),
  updateTimeSlot: vi.fn(),
  deleteTimeSlot: vi.fn(),
  createTimeMarker: vi.fn(),
  updateTimeMarker: vi.fn(),
  deleteTimeMarker: vi.fn(),
  refresh: vi.fn(),
  // Referensi stabil: lihat catatan yang sama di production-planning.test.tsx.
  brands: [{ id: "brand-1", code: "MHR", name: "Maharasa", isActive: true }],
  timeSlots: [] as TimeSlot[],
  timeMarkers: [] as TimeMarker[],
  summary: null as null | {
    repeatMinutes: number | null
    longestShelfLife: number
    ok: boolean
    message: string | null
  },
}))

vi.mock("@/hooks/use-toast", () => ({ useToast: () => ({ toast: mocks.toast }) }))

vi.mock("@/hooks/use-brands", () => ({
  useBrands: () => ({ brands: mocks.brands, isLoading: false }),
}))

// Radix Select sulit dikendalikan di jsdom, dan yang diuji di sini bukan
// selectnya — diganti tombol biasa.
vi.mock("@/components/brand-select", () => ({
  BrandSelect: ({ onChange }: { onChange: (id: string) => void }) => (
    <button onClick={() => onChange("brand-1")}>Pilih Brand</button>
  ),
}))

vi.mock("@/hooks/use-time-slots", () => ({
  useTimeSlotsByBrand: () => ({
    timeSlots: mocks.timeSlots,
    isLoading: false,
    createTimeSlot: mocks.createTimeSlot,
    updateTimeSlot: mocks.updateTimeSlot,
    deleteTimeSlot: mocks.deleteTimeSlot,
    refresh: mocks.refresh,
  }),
  useTimeSettingsSummaryByBrand: () => ({
    summary: mocks.summary,
    isLoading: false,
    refresh: mocks.refresh,
  }),
}))

vi.mock("@/hooks/use-time-markers", () => ({
  useTimeMarkersByBrand: () => ({
    timeMarkers: mocks.timeMarkers,
    isLoading: false,
    createTimeMarker: mocks.createTimeMarker,
    updateTimeMarker: mocks.updateTimeMarker,
    deleteTimeMarker: mocks.deleteTimeMarker,
    refresh: mocks.refresh,
  }),
}))

vi.mock("@/lib/api", () => ({
  getApiError: (e: unknown) => ({
    message: e instanceof Error ? e.message : String(e),
    status: 500,
  }),
}))

import { BrandSettingsAdmin } from "@/components/brand-settings-admin"

function marker(id: string, label: string, sortOrder: number): TimeMarker {
  return { id, brandId: "brand-1", label, colorHex: "#3B82F6", sortOrder, isActive: true }
}

function slot(start: string, end: string, markerRef: TimeMarker | null): TimeSlot {
  return {
    id: `slot-${start}`,
    brandId: "brand-1",
    startTime: `${start}:00`,
    endTime: `${end}:00`,
    label: `${start}-${end}`,
    marker: markerRef,
    sortOrder: 0,
    isActive: true,
  }
}

async function pickBrand() {
  const user = userEvent.setup()
  render(<BrandSettingsAdmin />)
  await user.click(screen.getByRole("button", { name: "Pilih Brand" }))
  return user
}

describe("BrandSettingsAdmin", () => {
  beforeEach(() => {
    Object.values(mocks).forEach((value) => {
      if (typeof value === "function" && "mockReset" in value) value.mockReset()
    })

    mocks.createTimeMarker.mockResolvedValue({})
    mocks.createTimeSlot.mockResolvedValue({})
    mocks.updateTimeSlot.mockResolvedValue({})
    mocks.refresh.mockResolvedValue(undefined)

    mocks.timeSlots = []
    mocks.timeMarkers = []
    mocks.summary = null
  })

  it("meminta brand dipilih lebih dulu", () => {
    render(<BrandSettingsAdmin />)

    expect(screen.getByText(/pilih brand dulu/i)).toBeInTheDocument()
  })

  it("menampilkan slot brand yang dipilih", async () => {
    mocks.timeSlots = [slot("10:00", "10:30", marker("m1", "Biru", 0))]

    await pickBrand()

    expect(await screen.findByText("10:00-10:30")).toBeInTheDocument()
  })

  /**
   * Masalah yang melahirkan fitur ini: penanda berulang tiap 150 menit
   * sementara menu bertahan 180 menit, jadi dua piring berwarna sama ada di
   * belt bersamaan.
   */
  it("menampilkan peringatan kalau penanda berulang terlalu cepat", async () => {
    mocks.summary = {
      repeatMinutes: 150,
      longestShelfLife: 180,
      ok: false,
      message: "Penanda yang sama berulang tiap 150 menit, padahal ada menu yang bertahan 180 menit.",
    }

    await pickBrand()

    expect(await screen.findByText(/berulang tiap 150 menit/i)).toBeInTheDocument()
  })

  it("diam kalau siklusnya aman", async () => {
    mocks.summary = { repeatMinutes: 180, longestShelfLife: 180, ok: true, message: null }

    await pickBrand()

    expect(screen.queryByText(/berulang tiap/i)).not.toBeInTheDocument()
  })

  it("menolak warna yang bukan #RRGGBB tanpa memanggil server", async () => {
    const user = await pickBrand()

    await user.click(screen.getByRole("button", { name: /penanda \(/i }))

    await user.type(screen.getByPlaceholderText("Biru"), "Ungu")

    const hexInputs = screen.getAllByDisplayValue("#3B82F6")
    const textInput = hexInputs[hexInputs.length - 1]

    await user.clear(textInput)
    await user.type(textInput, "ungu")

    await user.click(screen.getByRole("button", { name: /tambah/i }))

    expect(mocks.createTimeMarker).not.toHaveBeenCalled()
    expect(mocks.toast).toHaveBeenCalledWith(
      expect.objectContaining({ variant: "destructive" })
    )
  })

  /**
   * Titik awal, bukan aturan: hasilnya boleh diubah baris per baris. Itulah
   * bedanya dengan rumus sisa bagi yang dulu tidak bisa diintervensi.
   */
  it("mengisi penanda berputar mengikuti urutan jam", async () => {
    const biru = marker("m1", "Biru", 0)
    const hitam = marker("m2", "Hitam", 1)

    mocks.timeMarkers = [biru, hitam]
    mocks.timeSlots = [
      slot("10:00", "10:30", null),
      slot("10:30", "11:00", null),
      slot("11:00", "11:30", null),
    ]

    const user = await pickBrand()

    await user.click(screen.getByRole("button", { name: /isi otomatis berputar/i }))

    await waitFor(() => expect(mocks.updateTimeSlot).toHaveBeenCalledTimes(3))

    expect(mocks.updateTimeSlot.mock.calls.map((call) => call[1].time_marker_id)).toEqual([
      "m1",
      "m2",
      "m1",
    ])
  })

  /**
   * PUT di API ini berarti "ganti barisnya". `rulesForUpdate()` mewajibkan
   * `brand_id`, `start_time`, dan `end_time` — pemeriksaan tumpang tindih jam
   * tidak bisa dilakukan tanpa mengetahui jam barunya.
   *
   * Jebakannya halus: `fillSoleBrand()` di backend mengisi `brand_id` sendiri
   * selama basis data cuma punya satu brand, jadi payload yang kurang lengkap
   * tetap lolos di instalasi satu brand dan baru gagal setelah brand kedua
   * dibuat. Sisi servernya dikunci TimeSettingsContractTest.
   */
  it("mengirim baris utuh, bukan field yang berubah saja", async () => {
    const biru = marker("m1", "Biru", 0)

    mocks.timeMarkers = [biru]
    mocks.timeSlots = [slot("10:00", "10:30", null)]

    const user = await pickBrand()

    await user.click(screen.getByRole("button", { name: /isi otomatis berputar/i }))

    await waitFor(() => expect(mocks.updateTimeSlot).toHaveBeenCalledTimes(1))

    expect(mocks.updateTimeSlot.mock.calls[0][1]).toEqual({
      brand_id: "brand-1",
      start_time: "10:00",
      end_time: "10:30",
      time_marker_id: "m1",
      sort_order: 0,
      is_active: true,
    })
  })

  it("menolak isi otomatis kalau belum ada penanda", async () => {
    mocks.timeSlots = [slot("10:00", "10:30", null)]

    const user = await pickBrand()

    await user.click(screen.getByRole("button", { name: /isi otomatis berputar/i }))

    await waitFor(() =>
      expect(mocks.toast).toHaveBeenCalledWith(
        expect.objectContaining({ variant: "destructive" })
      )
    )
    expect(mocks.updateTimeSlot).not.toHaveBeenCalled()
  })
})
