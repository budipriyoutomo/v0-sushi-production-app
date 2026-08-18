import { describe, it, expect, beforeEach, vi } from "vitest"
import { renderHook, waitFor } from "@testing-library/react"
import { SWRConfig } from "swr"
import React from "react"

const { mockMenus, mockPlateColors, mockProduction } = vi.hoisted(() => ({
  mockMenus: { getAll: vi.fn(), getForOutlet: vi.fn() },
  mockPlateColors: { getAll: vi.fn(), getForOutlet: vi.fn() },
  mockProduction: { invalidatePlateColors: vi.fn() },
}))

vi.mock("@/lib/api", () => ({
  menusService: mockMenus,
  plateColorsService: mockPlateColors,
  productionService: mockProduction,
}))

import { useMenus } from "@/hooks/use-menus"
import { usePlateColors, usePlateColorsSortedByPrice } from "@/hooks/use-plate-colors"

/**
 * Cache key adalah inti dari fitur brand di frontend.
 *
 * Key statis adalah bug diam: begitu menu dan warna piring jadi milik brand
 * tertentu, berpindah outlet akan menampilkan data brand sebelumnya dari cache.
 * Tidak ada error — dapur hanya melihat piring yang tidak dijual di tempatnya,
 * dengan harga yang salah. Karena itu diuji per-hook.
 */
function wrapper({ children }: { children: React.ReactNode }) {
  // provider: cache baru per render, supaya test tidak saling mewarisi cache.
  return React.createElement(
    SWRConfig,
    { value: { provider: () => new Map(), dedupingInterval: 0 } },
    children,
  )
}

describe("useMenus", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockMenus.getAll.mockResolvedValue({ data: [{ id: "all" }] })
    mockMenus.getForOutlet.mockImplementation(async (outletId: string) => [
      { id: `menu-${outletId}` },
    ])
  })

  it("asks for the outlet's own menus when an outlet is given", async () => {
    const { result } = renderHook(() => useMenus("outlet-1"), { wrapper })

    await waitFor(() => expect(result.current.menus).toHaveLength(1))

    expect(mockMenus.getForOutlet).toHaveBeenCalledWith("outlet-1")
    expect(mockMenus.getAll).not.toHaveBeenCalled()
  })

  it("shows every brand when no outlet is given, for the master screen", async () => {
    const { result } = renderHook(() => useMenus(), { wrapper })

    await waitFor(() => expect(result.current.menus).toHaveLength(1))

    // Bukan sekadar "dipanggil": tanpa `per_page: 'all'` backend mengirim 15
    // baris pertama, dan pencarian di layar master hanya melihat 15 menu itu.
    expect(mockMenus.getAll).toHaveBeenCalledWith({ per_page: "all" })
    expect(mockMenus.getForOutlet).not.toHaveBeenCalled()
  })

  it("refetches when the outlet changes instead of serving the previous brand", async () => {
    const { result, rerender } = renderHook(({ outletId }) => useMenus(outletId), {
      wrapper,
      initialProps: { outletId: "outlet-1" },
    })

    await waitFor(() => expect(result.current.menus[0]?.id).toBe("menu-outlet-1"))

    rerender({ outletId: "outlet-2" })

    await waitFor(() => expect(result.current.menus[0]?.id).toBe("menu-outlet-2"))
    expect(mockMenus.getForOutlet).toHaveBeenCalledWith("outlet-2")
  })
})

describe("usePlateColors", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockPlateColors.getAll.mockResolvedValue({ data: [{ id: "all" }] })
    mockPlateColors.getForOutlet.mockImplementation(async (outletId: string) => [
      { id: `color-${outletId}` },
    ])
  })

  it("scopes to the outlet when one is given", async () => {
    const { result } = renderHook(() => usePlateColors("outlet-1"), { wrapper })

    await waitFor(() => expect(result.current.plateColors[0]?.id).toBe("color-outlet-1"))
    expect(mockPlateColors.getForOutlet).toHaveBeenCalledWith("outlet-1")
  })

  it("refetches when the outlet changes", async () => {
    const { result, rerender } = renderHook(({ outletId }) => usePlateColors(outletId), {
      wrapper,
      initialProps: { outletId: "outlet-1" },
    })

    await waitFor(() => expect(result.current.plateColors[0]?.id).toBe("color-outlet-1"))

    rerender({ outletId: "outlet-2" })

    // Warna piring adalah unit harga — cache basi di sini berarti harga salah.
    await waitFor(() => expect(result.current.plateColors[0]?.id).toBe("color-outlet-2"))
  })

  it("sorted-by-price keeps outlets apart too", async () => {
    const { result, rerender } = renderHook(
      ({ outletId }) => usePlateColorsSortedByPrice(outletId),
      { wrapper, initialProps: { outletId: "outlet-1" } },
    )

    await waitFor(() => expect(result.current.plateColors[0]?.id).toBe("color-outlet-1"))

    rerender({ outletId: "outlet-2" })

    await waitFor(() => expect(result.current.plateColors[0]?.id).toBe("color-outlet-2"))
  })
})
