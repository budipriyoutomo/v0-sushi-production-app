import { describe, it, expect, beforeEach, vi } from "vitest"

const mocks = vi.hoisted(() => ({ get: vi.fn(), post: vi.fn() }))

vi.mock("@/lib/api/client", () => ({ default: { get: mocks.get, post: mocks.post } }))

import { productionCorrectionService } from "@/lib/api/services/production-correction"

/**
 * Service Koreksi Status Produksi.
 *
 * Preview dan simpan sengaja TIDAK masuk antrean offline: koreksi yang diputar
 * ulang diam-diam saat jaringan kembali bisa mendarat setelah Sales Input disimpan.
 */
describe("productionCorrectionService", () => {
  beforeEach(() => vi.clearAllMocks())

  const payload = {
    outletId: "outlet-1",
    date: "2026-10-11",
    reason: "Close Day menandai semua sold",
    wasteReasonId: "reason-1",
    items: [{ menuId: "menu-1", from: "sold" as const, to: "waste" as const, quantity: 2 }],
  }

  it("meminta ringkasan per outlet dan tanggal", async () => {
    mocks.get.mockResolvedValue({ data: { data: { date: "2026-10-11", menus: [] } } })

    const result = await productionCorrectionService.summary("outlet-1", "2026-10-11")

    expect(mocks.get).toHaveBeenCalledWith("/production/corrections/summary", {
      params: { outletId: "outlet-1", date: "2026-10-11" },
    })
    expect(result).toEqual({ date: "2026-10-11", menus: [] })
  })

  it("preview dan simpan tidak diantre offline", async () => {
    mocks.post.mockResolvedValue({ data: { data: { id: "c-1" } } })

    await productionCorrectionService.preview(payload)
    await productionCorrectionService.apply(payload)

    expect(mocks.post).toHaveBeenNthCalledWith(1, "/production/corrections/preview", payload, {
      skipOfflineQueue: true,
    })
    expect(mocks.post).toHaveBeenNthCalledWith(2, "/production/corrections", payload, {
      skipOfflineQueue: true,
    })
  })

  it("riwayat membaca total dari meta", async () => {
    mocks.get.mockResolvedValue({ data: { data: [{ id: "c-1" }], meta: { total: 7 } } })

    const result = await productionCorrectionService.history({ outletId: "outlet-1" })

    expect(mocks.get).toHaveBeenCalledWith("/production/corrections", {
      params: { outletId: "outlet-1", per_page: 100 },
    })
    expect(result).toEqual({ rows: [{ id: "c-1" }], total: 7 })
  })
})
