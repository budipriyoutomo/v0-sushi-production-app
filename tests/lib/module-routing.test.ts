import { describe, it, expect } from "vitest"
import { landingRouteFor, MODULE_LANDING, MODULE_PRIORITY } from "@/lib/constants/access"

/**
 * Tujuan setelah login ditentukan prioritas, bukan urutan centang.
 *
 * Versi sebelumnya mengiterasi `module_app` milik user, jadi pemenangnya adalah
 * modul yang kebetulan tercatat paling awal di array itu — dan urutan array itu
 * mengikuti urutan kotak dicentang di layar User Management. Dua user dengan
 * izin identik bisa mendarat di halaman berbeda tanpa ada yang memutuskan
 * begitu, dan itulah yang membuat user operation/production terlempar ke
 * `/kitchen/*`.
 */
describe("landingRouteFor", () => {
  it("tidak terpengaruh urutan module_app", () => {
    // Inti bug-nya. Kedua user ini izinnya sama persis.
    expect(landingRouteFor(["kitchen", "operation"])).toBe("/operation/sales-input")
    expect(landingRouteFor(["operation", "kitchen"])).toBe("/operation/sales-input")
  })

  it("mengikuti prioritas saat user punya beberapa modul", () => {
    expect(landingRouteFor(["report", "production", "operation"])).toBe("/operation/sales-input")
    expect(landingRouteFor(["report", "production"])).toBe("/production/planning")
    expect(landingRouteFor(["kitchen", "report"])).toBe("/report/production-item-list")
  })

  it("mengantar tiap modul ke halaman pertamanya", () => {
    expect(landingRouteFor(["admin"])).toBe("/admin/plate-colors")
    expect(landingRouteFor(["operation"])).toBe("/operation/sales-input")
    expect(landingRouteFor(["production"])).toBe("/production/planning")
    expect(landingRouteFor(["report"])).toBe("/report/production-item-list")
    expect(landingRouteFor(["kitchen"])).toBe("/kitchen/dashboard")
  })

  it("mengantar modul service ke layar dapur, bukan operation", () => {
    // `app/kitchen/layout.tsx` menerima modul `service`; `/operation/*` tidak.
    // Peta lama mengarahkannya ke sales-input, yang justru ditolak AuthGuard.
    expect(landingRouteFor(["service"])).toBe("/kitchen/dashboard")
  })

  it("mengabaikan `app` — modul dasar tanpa halaman", () => {
    expect(landingRouteFor(["app", "production"])).toBe("/production/planning")
    expect(landingRouteFor(["app"])).toBeNull()
  })

  it("gagal-tertutup kalau tidak ada modul berhalaman", () => {
    // Cadangan lamanya `/admin/plate-colors` — halaman yang justru paling tidak
    // boleh dibuka user tanpa modul. `null` memaksa pemanggil kirim ke /login.
    expect(landingRouteFor([])).toBeNull()
    expect(landingRouteFor(undefined)).toBeNull()
    expect(landingRouteFor(null)).toBeNull()
    expect(landingRouteFor(["modul-yang-tidak-dikenal"])).toBeNull()
  })

  it("tiap modul di daftar prioritas punya halaman tujuan", () => {
    // Menambah modul tanpa menambah tujuannya akan membuat user modul itu
    // mendarat di `undefined`.
    for (const mod of MODULE_PRIORITY) {
      expect(MODULE_LANDING[mod]).toBeTruthy()
    }
  })
})
