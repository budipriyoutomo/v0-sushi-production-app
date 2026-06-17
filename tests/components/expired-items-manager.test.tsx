import { describe, it, expect, beforeEach, vi } from "vitest"
import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"

const mocks = vi.hoisted(() => ({
  updateExpiredItem: vi.fn(),
  removeExpiredItem: vi.fn(),
  refresh: vi.fn().mockResolvedValue(undefined),
  toast: vi.fn(),
  expiredItems: [] as Array<Record<string, unknown>>,
}))

vi.mock("@/hooks/use-production", () => ({
  useExpiredItems: () => ({
    expiredItems: mocks.expiredItems,
    isLoading: false,
    updateExpiredItem: mocks.updateExpiredItem,
    removeExpiredItem: mocks.removeExpiredItem,
    refresh: mocks.refresh,
  }),
}))
vi.mock("@/hooks/use-menus", () => ({
  useMenus: () => ({ menus: [{ id: "menu-1", menuname: "Salmon", image: null }], isLoading: false }),
}))
vi.mock("@/hooks/use-plate-colors", () => ({
  usePlateColorsSortedByPrice: () => ({
    plateColors: [{ id: "color-1", platename: "Merah", price: 20000 }],
    isLoading: false,
  }),
}))
vi.mock("@/hooks/use-waste-reasons", () => ({
  useActiveWasteReasons: () => ({ wasteReasons: [] }),
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

import { ExpiredItemsManager } from "@/components/expired-items-manager"

function makeExpiredItem() {
  return {
    id: "exp-1",
    menuId: "menu-1",
    menuName: "Salmon",
    plateColor: "color-1",
    plateColorName: "Merah",
    producedAt: new Date(Date.now() - 7_200_000).toISOString(),
    expiresAt: new Date(Date.now() - 3_600_000).toISOString(),
    status: "sold",
    notes: "",
  }
}

describe("ExpiredItemsManager — update double-click guard", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.refresh.mockResolvedValue(undefined)
    mocks.expiredItems = [makeExpiredItem()]
  })

  it("calls updateExpiredItem only once when Update Status is clicked twice", async () => {
    let resolveUpdate: () => void = () => {}
    mocks.updateExpiredItem.mockImplementation(
      () => new Promise<void>((resolve) => { resolveUpdate = resolve })
    )

    const user = userEvent.setup()
    render(<ExpiredItemsManager />)

    // Open the update dialog (status defaults to "sold").
    await user.click(screen.getByRole("button", { name: "Update" }))

    const confirm = await screen.findByRole("button", { name: /update status/i })
    await user.click(confirm)
    expect(confirm).toBeDisabled()

    // Second click while in flight must not dispatch another request.
    await user.click(confirm)

    expect(mocks.updateExpiredItem).toHaveBeenCalledTimes(1)
    expect(mocks.updateExpiredItem).toHaveBeenCalledWith("exp-1", "sold", "")

    resolveUpdate()
    await waitFor(() => expect(mocks.toast).toHaveBeenCalled())
  })
})
