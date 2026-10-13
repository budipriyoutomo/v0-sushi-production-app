import { describe, it, expect, beforeEach, vi } from "vitest"

const mocks = vi.hoisted(() => ({ delete: vi.fn() }))

vi.mock("@/lib/api/client", () => ({ default: { delete: mocks.delete } }))

import { salesService } from "@/lib/api/services/sales"

/**
 * Pembatalan draft Sales Input menghapus pekerjaan operator, jadi sengaja TIDAK
 * masuk antrean offline — admin harus melihat hasilnya saat itu juga.
 */
describe("salesService.cancelDraft", () => {
  beforeEach(() => vi.clearAllMocks())

  it("mengirim alasan di body DELETE tanpa antrean offline", async () => {
    mocks.delete.mockResolvedValue({ data: { data: { id: "sales-1", deletionReason: "Ada piring salah status" } } })

    const result = await salesService.cancelDraft("sales-1", "Ada piring salah status")

    expect(mocks.delete).toHaveBeenCalledWith("/sales/sales-1", {
      data: { reason: "Ada piring salah status" },
      skipOfflineQueue: true,
    })
    expect(result).toEqual({ id: "sales-1", deletionReason: "Ada piring salah status" })
  })
})
