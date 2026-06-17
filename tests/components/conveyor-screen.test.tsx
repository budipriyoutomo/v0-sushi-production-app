import { describe, it, expect, beforeEach, vi } from "vitest"
import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"

// Shared mock handles, hoisted so the vi.mock factories below can reference them.
const mocks = vi.hoisted(() => ({
  markSold: vi.fn(),
  markWaste: vi.fn(),
  recordWaste: vi.fn(),
  refresh: vi.fn().mockResolvedValue(undefined),
  toast: vi.fn(),
  user: { id: "u1", role: "service" } as { id: string; role: string },
  conveyorItems: [] as Array<Record<string, unknown>>,
}))

vi.mock("@/lib/api", () => ({
  productionService: {
    markSold: mocks.markSold,
    markWaste: mocks.markWaste,
    recordWaste: mocks.recordWaste,
  },
  getApiError: (e: unknown) => ({ message: e instanceof Error ? e.message : String(e), status: 500 }),
}))

vi.mock("@/hooks/use-production", () => ({
  useConveyorItems: () => ({ items: mocks.conveyorItems, isLoading: false, refresh: mocks.refresh }),
}))
vi.mock("@/hooks/use-plate-colors", () => ({
  usePlateColorsSortedByPrice: () => ({
    plateColors: [{ id: "color-1", platename: "Merah", price: 20000 }],
  }),
}))
vi.mock("@/hooks/use-menus", () => ({
  useMenus: () => ({
    menus: [{ id: "menu-1", menuname: "Salmon", image: null, plateColorId: "color-1", price: 20000 }],
  }),
}))
vi.mock("@/hooks/use-waste-reasons", () => ({
  useActiveWasteReasons: () => ({ wasteReasons: [] }),
}))
vi.mock("@/hooks/use-toast", () => ({
  useToast: () => ({ toast: mocks.toast }),
}))
vi.mock("@/hooks/use-auth", () => ({
  useAuth: () => ({ user: mocks.user }),
}))
vi.mock("@/lib/outlet-context", () => ({
  useOutlet: () => ({ selectedOutletId: "outlet-1" }),
}))

// Trivial stubs for presentational children that pull in their own dependencies.
vi.mock("next/image", () => ({ default: () => null }))
vi.mock("@/components/outlet-selector", () => ({ OutletSelector: () => null }))
vi.mock("@/components/expiration-countdown", () => ({ ExpirationCountdown: () => null }))
vi.mock("@/components/plate-color-badge", () => ({ PlateColorBadge: () => null }))

import { ConveyorScreen } from "@/components/conveyor-screen"

function makeItem() {
  return {
    id: "item-1",
    menuId: "menu-1",
    menuName: "Salmon",
    plateColor: "color-1",
    plateColorName: "Merah",
    producedAt: new Date(Date.now() - 60_000).toISOString(),
    expiresAt: new Date(Date.now() + 3_600_000).toISOString(),
    soldAt: null,
    wastedAt: null,
    finalStatus: null,
    quantity: 1,
    beltStatus: "fresh",
  }
}

describe("ConveyorScreen — Sold button double-click guard", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.refresh.mockResolvedValue(undefined)
    mocks.user = { id: "u1", role: "service" }
    mocks.conveyorItems = [makeItem()]
  })

  it("calls markSold only once when the Sold button is clicked twice rapidly", async () => {
    // Keep the request in flight so the in-flight guard stays active across clicks.
    let resolveMarkSold: () => void = () => {}
    mocks.markSold.mockImplementation(
      () => new Promise<void>((resolve) => { resolveMarkSold = resolve })
    )

    const user = userEvent.setup()
    render(<ConveyorScreen />)

    const soldButton = screen.getByRole("button", { name: /sold/i })

    await user.click(soldButton)
    // After the first click the button must be disabled (in-flight).
    expect(soldButton).toBeDisabled()

    // A second click while disabled / in-flight must not trigger another request.
    await user.click(soldButton)

    expect(mocks.markSold).toHaveBeenCalledTimes(1)
    expect(mocks.markSold).toHaveBeenCalledWith(["item-1"])

    // Cleanup: let the pending request resolve.
    resolveMarkSold()
    await waitFor(() => expect(mocks.refresh).toHaveBeenCalledTimes(1))
  })

  it("re-enables the Sold button and refreshes after a successful sale", async () => {
    mocks.markSold.mockResolvedValue(undefined)

    const user = userEvent.setup()
    render(<ConveyorScreen />)

    const soldButton = screen.getByRole("button", { name: /sold/i })
    await user.click(soldButton)

    await waitFor(() => {
      expect(mocks.markSold).toHaveBeenCalledTimes(1)
      expect(mocks.refresh).toHaveBeenCalledTimes(1)
    })
  })

  it("disables Sold for kitchen role (cannot mark sold at all)", async () => {
    mocks.user = { id: "u2", role: "kitchen" }

    render(<ConveyorScreen />)

    expect(screen.getByRole("button", { name: /sold/i })).toBeDisabled()
  })
})
