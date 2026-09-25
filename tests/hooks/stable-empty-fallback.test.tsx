import { describe, it, expect, vi } from "vitest"
import { renderHook } from "@testing-library/react"
import { SWRConfig } from "swr"
import React from "react"

const { mockPlateColors, mockTimeSlots } = vi.hoisted(() => ({
  // Promise yang tidak pernah selesai: hook tertahan di keadaan loading.
  mockPlateColors: {
    getAll: vi.fn(() => new Promise(() => {})),
    getForOutlet: vi.fn(() => new Promise(() => {})),
  },
  mockTimeSlots: {
    getAll: vi.fn(() => new Promise(() => {})),
    getForOutlet: vi.fn(() => new Promise(() => {})),
  },
}))

vi.mock("@/lib/api", () => ({
  plateColorsService: mockPlateColors,
  timeSlotsService: mockTimeSlots,
  productionService: { invalidatePlateColors: vi.fn() },
}))

import { usePlateColorsSortedByPrice } from "@/hooks/use-plate-colors"
import { useTimeSlots } from "@/hooks/use-time-slots"

/**
 * Selama data belum ada, nilai cadangan hook harus array yang SAMA di setiap
 * render.
 *
 * `data || []` membuat array baru tiap render. `ProductionPlanning` memoisasi
 * dari array itu lalu menyetel state di sebuah effect — identitas yang selalu
 * berubah membuat effect-nya berputar sampai React menyerah dengan "Maximum
 * update depth exceeded". Itu terjadi saat plate color sudah termuat tetapi
 * slot masih loading.
 */
function wrapper({ children }: { children: React.ReactNode }) {
  return React.createElement(
    SWRConfig,
    { value: { provider: () => new Map(), dedupingInterval: 0 } },
    children,
  )
}

describe("nilai cadangan hook selama data belum ada", () => {
  it.each([
    ["loading", "outlet-1"],
    ["outlet belum dipilih (key null)", ""],
  ])("useTimeSlots stabil saat %s", (_, outletId) => {
    const { result, rerender } = renderHook(() => useTimeSlots(outletId), { wrapper })
    const first = result.current.timeSlots

    rerender()

    expect(first).toEqual([])
    expect(result.current.timeSlots).toBe(first)
  })

  it.each([
    ["loading", "outlet-1"],
    ["outlet belum dipilih (key null)", ""],
  ])("usePlateColorsSortedByPrice stabil saat %s", (_, outletId) => {
    const { result, rerender } = renderHook(() => usePlateColorsSortedByPrice(outletId), { wrapper })
    const first = result.current.plateColors

    rerender()

    expect(first).toEqual([])
    expect(result.current.plateColors).toBe(first)
  })
})
