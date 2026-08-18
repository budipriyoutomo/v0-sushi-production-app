import { describe, it, expect, beforeEach, vi } from "vitest"

const { mockClient, mockPlateColors } = vi.hoisted(() => ({
  mockClient: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
  mockPlateColors: {
    getAll: vi.fn(),
    getForOutlet: vi.fn(),
  },
}))

vi.mock("@/lib/api/client", () => ({ default: mockClient }))
vi.mock("@/lib/api/services/plate-colors", () => ({
  plateColorsService: mockPlateColors,
}))

import { productionService } from "@/lib/api/services/production"

// getForOutlet() mengembalikan array langsung, bukan { data }.
function colors(list: Array<{ id: string; platename: string }>) {
  return list
}

/**
 * savePlan() turns a wide plan row ({ timeSlot, white: 5 }) into the
 * { plateColorId, qty } shape the API wants, using a cached platename -> id map.
 * The cache is what makes this worth testing: a stale map used to reject a
 * newly added colour until the whole page was reloaded.
 *
 * Sejak warna piring jadi milik brand, peta itu juga harus dikunci per outlet —
 * lihat test terakhir.
 */
describe("productionService.savePlan", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    productionService.invalidatePlateColors()
    mockClient.post.mockResolvedValue({ data: { data: null } })
  })

  it("maps colour names to plate color ids", async () => {
    mockPlateColors.getForOutlet.mockResolvedValue(
      colors([
        { id: "id-white", platename: "White" },
        { id: "id-blue", platename: "Blue" },
      ]),
    )

    await productionService.savePlan("outlet-1", "2026-06-17", [
      { timeSlot: "08:00-09:00", white: 5, blue: 3 } as any,
    ])

    expect(mockClient.post).toHaveBeenCalledWith("/production/plan", {
      outletId: "outlet-1",
      date: "2026-06-17",
      plan: [
        {
          timeSlot: "08:00-09:00",
          items: [
            { plateColorId: "id-white", qty: 5 },
            { plateColorId: "id-blue", qty: 3 },
          ],
        },
      ],
    })
  })

  it("asks for the colours of the outlet being planned", async () => {
    mockPlateColors.getForOutlet.mockResolvedValue(colors([{ id: "id-white", platename: "White" }]))

    await productionService.savePlan("outlet-1", "2026-06-17", [
      { timeSlot: "08:00-09:00", white: 1 } as any,
    ])

    expect(mockPlateColors.getForOutlet).toHaveBeenCalledWith("outlet-1")
  })

  it("loads the plate colour master only once across calls", async () => {
    mockPlateColors.getForOutlet.mockResolvedValue(colors([{ id: "id-white", platename: "White" }]))

    await productionService.savePlan("outlet-1", "2026-06-17", [
      { timeSlot: "08:00-09:00", white: 1 } as any,
    ])
    await productionService.savePlan("outlet-1", "2026-06-18", [
      { timeSlot: "08:00-09:00", white: 2 } as any,
    ])

    expect(mockPlateColors.getForOutlet).toHaveBeenCalledTimes(1)
  })

  it("keeps a separate map per outlet, so a shared colour name never crosses brands", async () => {
    // Inti perbaikannya. Dua brand boleh sama-sama punya "White" dengan id dan
    // harga berbeda. Satu peta global akan menyimpan salah satunya lalu
    // memakainya untuk outlet mana pun — tanpa error, hanya target plan yang
    // menempel ke piring brand lain.
    mockPlateColors.getForOutlet.mockImplementation(async (outletId: string) =>
      outletId === "outlet-maharasa"
        ? colors([{ id: "white-maharasa", platename: "White" }])
        : colors([{ id: "white-katsuri", platename: "White" }]),
    )

    await productionService.savePlan("outlet-maharasa", "2026-06-17", [
      { timeSlot: "08:00-09:00", white: 1 } as any,
    ])
    await productionService.savePlan("outlet-katsuri", "2026-06-17", [
      { timeSlot: "08:00-09:00", white: 1 } as any,
    ])

    expect(mockPlateColors.getForOutlet).toHaveBeenCalledTimes(2)

    expect(mockClient.post).toHaveBeenNthCalledWith(
      1,
      "/production/plan",
      expect.objectContaining({
        plan: [{ timeSlot: "08:00-09:00", items: [{ plateColorId: "white-maharasa", qty: 1 }] }],
      }),
    )
    expect(mockClient.post).toHaveBeenNthCalledWith(
      2,
      "/production/plan",
      expect.objectContaining({
        plan: [{ timeSlot: "08:00-09:00", items: [{ plateColorId: "white-katsuri", qty: 1 }] }],
      }),
    )
  })

  it("refetches once when a colour is missing, instead of failing", async () => {
    // First load predates the new colour; the retry sees it.
    mockPlateColors.getForOutlet
      .mockResolvedValueOnce(colors([{ id: "id-white", platename: "White" }]))
      .mockResolvedValueOnce(
        colors([
          { id: "id-white", platename: "White" },
          { id: "id-green", platename: "Green" },
        ]),
      )

    await productionService.savePlan("outlet-1", "2026-06-17", [
      { timeSlot: "08:00-09:00", green: 4 } as any,
    ])

    expect(mockPlateColors.getForOutlet).toHaveBeenCalledTimes(2)
    expect(mockClient.post).toHaveBeenCalledWith(
      "/production/plan",
      expect.objectContaining({
        plan: [
          { timeSlot: "08:00-09:00", items: [{ plateColorId: "id-green", qty: 4 }] },
        ],
      }),
    )
  })

  it("still fails when the colour is genuinely not in the master", async () => {
    mockPlateColors.getForOutlet.mockResolvedValue(colors([{ id: "id-white", platename: "White" }]))

    await expect(
      productionService.savePlan("outlet-1", "2026-06-17", [
        { timeSlot: "08:00-09:00", magenta: 1 } as any,
      ]),
    ).rejects.toThrow(/tidak ditemukan di master/)

    // Retried once, then gave up rather than posting a broken payload.
    expect(mockPlateColors.getForOutlet).toHaveBeenCalledTimes(2)
    expect(mockClient.post).not.toHaveBeenCalled()
  })

  it("invalidatePlateColors forces the next call to refetch", async () => {
    mockPlateColors.getForOutlet.mockResolvedValue(colors([{ id: "id-white", platename: "White" }]))

    await productionService.savePlan("outlet-1", "2026-06-17", [
      { timeSlot: "08:00-09:00", white: 1 } as any,
    ])
    productionService.invalidatePlateColors()
    await productionService.savePlan("outlet-1", "2026-06-18", [
      { timeSlot: "08:00-09:00", white: 1 } as any,
    ])

    expect(mockPlateColors.getForOutlet).toHaveBeenCalledTimes(2)
  })
})
