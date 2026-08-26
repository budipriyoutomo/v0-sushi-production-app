import { describe, it, expect, beforeEach, vi } from "vitest"

/**
 * Service frontend memanggil route yang tidak ada — pola yang sudah kambuh
 * enam kali (`removeExpired`, `removeExpiredItem`, `auth/refresh`, tiga method
 * di `usersService`, lalu satu lagi di tiap service master).
 *
 * Gejalanya selalu sama dan selalu telat ketahuan: tombol di layar memanggil
 * hook, hook memanggil service, service kena 404, dan yang terlihat pemakai
 * cuma toast error tanpa sebab.
 *
 * Test ini mengunci PATH yang benar-benar dikirim untuk method yang pernah
 * salah, dan membuktikan method hantunya sudah tidak ada lagi.
 */

const { mockClient } = vi.hoisted(() => ({
  mockClient: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
    request: vi.fn(),
  },
}))

vi.mock("@/lib/api/client", () => ({ default: mockClient }))

import { outletsService } from "@/lib/api/services/outlets"
import { menusService } from "@/lib/api/services/menus"
import { plateColorsService } from "@/lib/api/services/plate-colors"
import { wasteReasonsService } from "@/lib/api/services/waste-reasons"
import { usersService } from "@/lib/api/services/users"
import { productionImportService } from "@/lib/api/services/production-import"
import { productionService } from "@/lib/api/services/production"

describe("service paths match routes that actually exist", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockClient.put.mockResolvedValue({ data: { data: { id: "o-1", is_active: false } } })
  })

  it("toggling an outlet uses PUT /master/outlet/{id}, not a toggle-status route", async () => {
    await outletsService.toggleStatus("o-1", true)

    expect(mockClient.put).toHaveBeenCalledWith("/master/outlet/o-1", { is_active: false })
    expect(mockClient.request).not.toHaveBeenCalled()
  })

  it("toggling an inactive outlet turns it back on", async () => {
    await outletsService.toggleStatus("o-1", false)

    expect(mockClient.put).toHaveBeenCalledWith("/master/outlet/o-1", { is_active: true })
  })
})

/**
 * Import backdate punya dua route yang mirip namanya — `/preview` yang tidak
 * menulis apa pun dan induknya yang menulis. Tertukar berarti preview yang
 * ternyata mengimpor, dan itu tidak bisa dibatalkan.
 */
describe("backdate import hits the dry-run route for preview and the write route for commit", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockClient.post.mockResolvedValue({ data: { data: {} } })
  })

  it("previews against /production/import-backdate/preview", async () => {
    await productionImportService.preview(new File(["x"], "a.csv"), "outlet-1")

    const [path, body] = mockClient.post.mock.calls[0]
    expect(path).toBe("/production/import-backdate/preview")
    // Preview tidak boleh membawa izin duplikat — kalau ikut terkirim, tombol
    // pengaman di layar tidak lagi mencerminkan apa yang dinilai server.
    expect((body as FormData).get("allowDuplicate")).toBeNull()
    expect((body as FormData).get("outletId")).toBe("outlet-1")
  })

  it("commits against /production/import-backdate", async () => {
    await productionImportService.commit(new File(["x"], "a.csv"), "outlet-1", true)

    const [path, body] = mockClient.post.mock.calls[0]
    expect(path).toBe("/production/import-backdate")
    expect((body as FormData).get("allowDuplicate")).toBe("1")
  })
})

/**
 * Layar conveyor dan expired sekarang membaca bentuk ter-group. Path-nya
 * bertetangga dengan versi per-piring yang masih hidup, dan tertukar tidak
 * memunculkan error apa pun — layarnya cuma menerima objek tanpa `itemIds`,
 * lalu setiap tombol Waste mengirim `undefined`.
 */
describe("belt screens read the grouped endpoints", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockClient.get.mockResolvedValue({ data: { data: [] } })
    mockClient.post.mockResolvedValue({ data: { data: { updated: 0, skipped: 0 } } })
  })

  it("reads the conveyor from /production/conveyor-grouped", async () => {
    await productionService.getConveyorGroups("outlet-1")

    expect(mockClient.get).toHaveBeenCalledWith("/production/conveyor-grouped", {
      params: { outletId: "outlet-1" },
    })
  })

  it("reads expired items from /production/expired-grouped", async () => {
    await productionService.getExpiredGroups("outlet-1")

    expect(mockClient.get).toHaveBeenCalledWith("/production/expired-grouped", {
      params: { outletId: "outlet-1" },
    })
  })

  it("closes a batch with one POST to /production/expired/bulk", async () => {
    await productionService.updateExpiredBulk(["a", "b"], "waste", "Kering")

    // Satu request untuk seluruh batch. Versi per-piring akan memakai
    // PUT /production/expired/{id} sekali per piring.
    expect(mockClient.post).toHaveBeenCalledTimes(1)
    expect(mockClient.post).toHaveBeenCalledWith("/production/expired/bulk", {
      itemIds: ["a", "b"],
      status: "waste",
      notes: "Kering",
    })
    expect(mockClient.put).not.toHaveBeenCalled()
  })
})

/**
 * Backend `Route::crud` hanya membuat index/store/show/update/destroy, dan
 * prefix `/users` hanya punya empat route. Setiap method di bawah pernah ada
 * dan memanggil sub-path yang tidak pernah dibuat.
 */
describe("ghost methods stay deleted", () => {
  const ghosts: Array<[string, object, string]> = [
    ["menusService.uploadImage", menusService, "uploadImage"],
    ["plateColorsService.updatePrice", plateColorsService, "updatePrice"],
    ["wasteReasonsService.toggleStatus", wasteReasonsService, "toggleStatus"],
    ["usersService.toggleStatus", usersService, "toggleStatus"],
    ["usersService.updatePin", usersService, "updatePin"],
    ["usersService.verifyPin", usersService, "verifyPin"],

    // Bentuk per-piring dari belt. Route-nya sudah dibuang di backend, jadi
    // method yang tertinggal di sini akan berujung 404 — persis gejala yang
    // berkas ini dibuat untuk mencegah.
    ["productionService.getConveyorItems", productionService, "getConveyorItems"],
    ["productionService.getExpiredItems", productionService, "getExpiredItems"],
    ["productionService.updateExpiredItem", productionService, "updateExpiredItem"],
  ]

  it.each(ghosts)("%s no longer exists", (_label, service, method) => {
    expect((service as Record<string, unknown>)[method]).toBeUndefined()
  })
})
