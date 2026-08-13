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
  },
}))

vi.mock("@/lib/api/client", () => ({ default: mockClient }))
vi.mock("@/lib/api/services/plate-colors", () => ({
  plateColorsService: mockPlateColors,
}))

import { productionService } from "@/lib/api/services/production"

function colors(list: Array<{ id: string; platename: string }>) {
  return { data: list }
}

/**
 * savePlan() turns a wide plan row ({ timeSlot, white: 5 }) into the
 * { plateColorId, qty } shape the API wants, using a cached platename -> id map.
 * The cache is what makes this worth testing: a stale map used to reject a
 * newly added colour until the whole page was reloaded.
 */
describe("productionService.savePlan", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    productionService.invalidatePlateColors()
    mockClient.post.mockResolvedValue({ data: { data: null } })
  })

  it("maps colour names to plate color ids", async () => {
    mockPlateColors.getAll.mockResolvedValue(
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

  it("loads the plate colour master only once across calls", async () => {
    mockPlateColors.getAll.mockResolvedValue(colors([{ id: "id-white", platename: "White" }]))

    await productionService.savePlan("outlet-1", "2026-06-17", [
      { timeSlot: "08:00-09:00", white: 1 } as any,
    ])
    await productionService.savePlan("outlet-1", "2026-06-18", [
      { timeSlot: "08:00-09:00", white: 2 } as any,
    ])

    expect(mockPlateColors.getAll).toHaveBeenCalledTimes(1)
  })

  it("refetches once when a colour is missing, instead of failing", async () => {
    // First load predates the new colour; the retry sees it.
    mockPlateColors.getAll
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

    expect(mockPlateColors.getAll).toHaveBeenCalledTimes(2)
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
    mockPlateColors.getAll.mockResolvedValue(colors([{ id: "id-white", platename: "White" }]))

    await expect(
      productionService.savePlan("outlet-1", "2026-06-17", [
        { timeSlot: "08:00-09:00", magenta: 1 } as any,
      ]),
    ).rejects.toThrow(/tidak ditemukan di master/)

    // Retried once, then gave up rather than posting a broken payload.
    expect(mockPlateColors.getAll).toHaveBeenCalledTimes(2)
    expect(mockClient.post).not.toHaveBeenCalled()
  })

  it("invalidatePlateColors forces the next call to refetch", async () => {
    mockPlateColors.getAll.mockResolvedValue(colors([{ id: "id-white", platename: "White" }]))

    await productionService.savePlan("outlet-1", "2026-06-17", [
      { timeSlot: "08:00-09:00", white: 1 } as any,
    ])
    productionService.invalidatePlateColors()
    await productionService.savePlan("outlet-1", "2026-06-18", [
      { timeSlot: "08:00-09:00", white: 1 } as any,
    ])

    expect(mockPlateColors.getAll).toHaveBeenCalledTimes(2)
  })
})
