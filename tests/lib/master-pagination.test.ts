import { describe, it, expect, beforeEach, vi } from "vitest"

/**
 * Backend `BaseService::list()` memaginasi 15 baris kalau `per_page` tidak
 * diminta. Layar master menyaring, mengurutkan, dan memaginasi di sisi klien,
 * dan layar dapur memakai daftar menu sebagai daftar produksi — keduanya
 * mengasumsikan daftarnya utuh.
 *
 * Kelalaian ini pernah terjadi di `menusService`: pencarian di /admin/menus
 * hanya melihat 15 menu pertama, dan menu selebihnya seolah tidak ada. Tanpa
 * error, tanpa halaman kedua — jadi hanya test yang bisa menjaganya.
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

import { menusService } from "@/lib/api/services/menus"
import { plateColorsService } from "@/lib/api/services/plate-colors"
import { brandsService } from "@/lib/api/services/brands"

function paramsOfLastGet(): Record<string, unknown> {
  const call = mockClient.get.mock.calls.at(-1)
  return (call?.[1] as { params?: Record<string, unknown> })?.params ?? {}
}

describe("master services ask for the whole list, not page one", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockClient.get.mockResolvedValue({ data: { data: [] } })
  })

  it("menusService.getForOutlet requests every row", async () => {
    await menusService.getForOutlet("outlet-1")

    expect(paramsOfLastGet()).toMatchObject({ per_page: "all", outlet_id: "outlet-1" })
  })

  it("menusService.getForOutlet still lets the caller override per_page", async () => {
    await menusService.getForOutlet("outlet-1", { per_page: 5 })

    expect(paramsOfLastGet()).toMatchObject({ per_page: 5 })
  })

  it("plateColorsService.getForOutlet requests every row", async () => {
    await plateColorsService.getForOutlet("outlet-1")

    expect(paramsOfLastGet()).toMatchObject({ per_page: "all", outlet_id: "outlet-1" })
  })

  it("brandsService.getAll is already unpaginated", async () => {
    await brandsService.getAll({ per_page: "all" })

    expect(paramsOfLastGet()).toMatchObject({ per_page: "all" })
  })
})
