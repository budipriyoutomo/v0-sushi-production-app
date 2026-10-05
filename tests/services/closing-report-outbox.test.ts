import { describe, it, expect, beforeEach, vi } from "vitest"

const mocks = vi.hoisted(() => ({ get: vi.fn(), post: vi.fn() }))

vi.mock("@/lib/api/client", () => ({ default: { get: mocks.get, post: mocks.post } }))

import { closingReportOutboxService } from "@/lib/api/services/closing-report-outbox"

/**
 * Service layar "Kirim Ulang BI".
 *
 * Kirim ulang sengaja TIDAK masuk antrean offline: admin menekan tombol untuk
 * melihat hasilnya sekarang. Request yang diantre lalu diputar diam-diam saat
 * jaringan kembali mengirim laporan tanpa ada yang melihat hasilnya.
 */
describe("closingReportOutboxService", () => {
  beforeEach(() => vi.clearAllMocks())

  it("meminta daftar satu outlet dengan filternya", async () => {
    mocks.get.mockResolvedValue({ data: { data: [{ id: "row-1" }], meta: { total: 1 } } })

    const result = await closingReportOutboxService.list({
      outletId: "outlet-1",
      status: "unpublished",
      startDate: "2026-09-01",
    })

    expect(mocks.get).toHaveBeenCalledWith("/closing-reports/outbox", {
      params: { outletId: "outlet-1", status: "unpublished", startDate: "2026-09-01", per_page: 100 },
    })
    expect(result).toEqual({ rows: [{ id: "row-1" }], total: 1 })
  })

  it("kirim ulang memanggil endpoint resend tanpa antrean offline", async () => {
    mocks.post.mockResolvedValue({ data: { data: { id: "row-1", status: "published" } } })

    const row = await closingReportOutboxService.resend("row-1")

    expect(mocks.post).toHaveBeenCalledWith(
      "/closing-reports/outbox/row-1/resend",
      undefined,
      { skipOfflineQueue: true }
    )
    expect(row).toEqual({ id: "row-1", status: "published" })
  })
})
