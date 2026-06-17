import { describe, it, expect, beforeEach, vi } from "vitest"
import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"

const mocks = vi.hoisted(() => ({
  produceItem: vi.fn(),
  toast: vi.fn(),
}))

vi.mock("@/lib/api", () => ({
  getApiError: (e: unknown) => ({ message: e instanceof Error ? e.message : String(e), status: 500 }),
}))
vi.mock("@/hooks/use-production", () => ({
  useConveyorItems: () => ({ produceItem: mocks.produceItem }),
}))
vi.mock("@/hooks/use-menus", () => ({
  useMenus: () => ({
    menus: [
      {
        id: "menu-1",
        menuname: "Salmon",
        image: null,
        plateColorId: "color-1",
        plateColorName: "Merah",
        price: 20000,
        shelfLife: 60,
      },
    ],
    isLoading: false,
  }),
}))
vi.mock("@/hooks/use-plate-colors", () => ({
  usePlateColorsSortedByPrice: () => ({
    plateColors: [{ id: "color-1", platename: "Merah", price: 20000 }],
    isLoading: false,
  }),
}))
vi.mock("@/hooks/use-toast", () => ({
  useToast: () => ({ toast: mocks.toast }),
}))
vi.mock("@/lib/outlet-context", () => ({
  useOutlet: () => ({ selectedOutletId: "outlet-1" }),
}))
vi.mock("next/image", () => ({ default: () => null }))
vi.mock("@/components/outlet-selector", () => ({ OutletSelector: () => null }))
vi.mock("@/components/plate-color-badge", () => ({ PlateColorBadge: () => null, PlateColor: {} }))

import { ProduceScreen } from "@/components/produce-screen"

describe("ProduceScreen — produce double-submit guard", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("produces once with the chosen quantity", async () => {
    mocks.produceItem.mockResolvedValue(undefined)
    const user = userEvent.setup()
    render(<ProduceScreen />)

    await user.click(screen.getByRole("button", { name: /make/i }))
    // Confirm in the quantity calculator dialog (default quantity = 1).
    await user.click(screen.getByRole("button", { name: /produce 1x/i }))

    await waitFor(() => {
      expect(mocks.produceItem).toHaveBeenCalledTimes(1)
      expect(mocks.produceItem).toHaveBeenCalledWith("menu-1", 1)
    })
  })

  it("disables the Make button while a production is in flight", async () => {
    // Keep produceItem pending so the in-flight state persists.
    let resolveProduce: () => void = () => {}
    mocks.produceItem.mockImplementation(
      () => new Promise<void>((resolve) => { resolveProduce = resolve })
    )

    const user = userEvent.setup()
    render(<ProduceScreen />)

    const makeButton = screen.getByRole("button", { name: /make/i })
    await user.click(makeButton)
    await user.click(screen.getByRole("button", { name: /produce 1x/i }))

    // The calculator closed and the grid's Make button is now disabled,
    // so a second production cannot be started while the first is in flight.
    await waitFor(() => {
      expect(mocks.produceItem).toHaveBeenCalledTimes(1)
      expect(screen.getByRole("button", { name: /producing|make/i })).toBeDisabled()
    })

    resolveProduce()
    await waitFor(() =>
      expect(screen.getByRole("button", { name: /make/i })).not.toBeDisabled()
    )
  })
})
