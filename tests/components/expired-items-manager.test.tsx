import { describe, it, expect, beforeEach, vi } from "vitest"
import { render, screen, waitFor, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"

const mocks = vi.hoisted(() => ({
  updateItems: vi.fn(),
  refresh: vi.fn().mockResolvedValue(undefined),
  toast: vi.fn(),
  expiredGroups: [] as Array<Record<string, unknown>>,
}))

vi.mock("@/lib/api", () => ({
  getApiError: (e: unknown) => ({ message: e instanceof Error ? e.message : String(e), status: 500 }),
}))

vi.mock("@/hooks/use-production", () => ({
  useExpiredGroups: () => ({
    groups: mocks.expiredGroups,
    isLoading: false,
    updateItems: mocks.updateItems,
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
  useActiveWasteReasons: () => ({
    wasteReasons: [{ id: "r-1", reason_name: "Kering" }],
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

import { ExpiredItemsManager } from "@/components/expired-items-manager"

function makeGroup(overrides: Record<string, unknown> = {}) {
  const producedAt = new Date(Date.now() - 7_200_000).toISOString()
  const expiresAt = new Date(Date.now() - 3_600_000).toISOString()

  return {
    groupKey: `menu-1|${producedAt}|${expiresAt}`,
    menuId: "menu-1",
    menuName: "Salmon",
    plateColor: "color-1",
    plateColorName: "Merah",
    producedAt,
    expiresAt,
    beltStatus: "expired",
    quantity: 1,
    itemIds: ["exp-1"],
    ...overrides,
  }
}

describe("ExpiredItemsManager — update double-click guard", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.refresh.mockResolvedValue(undefined)
    mocks.updateItems.mockResolvedValue({ updated: 1, skipped: 0 })
    mocks.expiredGroups = [makeGroup()]
  })

  it("calls updateItems only once when Update Status is clicked twice", async () => {
    let resolveUpdate: (value: { updated: number; skipped: number }) => void = () => {}
    mocks.updateItems.mockImplementation(
      () => new Promise<{ updated: number; skipped: number }>((resolve) => { resolveUpdate = resolve })
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

    expect(mocks.updateItems).toHaveBeenCalledTimes(1)
    expect(mocks.updateItems).toHaveBeenCalledWith(["exp-1"], "sold", undefined)

    resolveUpdate({ updated: 1, skipped: 0 })
    await waitFor(() => expect(mocks.toast).toHaveBeenCalled())
  })
})

describe("ExpiredItemsManager — batch produksi", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.refresh.mockResolvedValue(undefined)
    mocks.updateItems.mockResolvedValue({ updated: 4, skipped: 0 })
    mocks.expiredGroups = [makeGroup({ quantity: 4, itemIds: ["a", "b", "c", "d"] })]
  })

  it("renders one card per batch with its plate count", () => {
    render(<ExpiredItemsManager />)

    expect(screen.getAllByRole("button", { name: "Update" })).toHaveLength(1)
    expect(screen.getByLabelText("4 plate")).toHaveTextContent("×4")
  })

  it("closes the whole batch in one request by default", async () => {
    const user = userEvent.setup()
    render(<ExpiredItemsManager />)

    await user.click(screen.getByRole("button", { name: "Update" }))
    await user.click(await screen.findByRole("button", { name: /update status/i }))

    // Empat piring, satu request. Versi per-piring berarti empat kesempatan
    // gagal dan empat baris antrean offline untuk satu aksi operator.
    await waitFor(() =>
      expect(mocks.updateItems).toHaveBeenCalledWith(["a", "b", "c", "d"], "sold", undefined)
    )
  })

  it("sends only the selected slice when the stepper is turned down", async () => {
    const user = userEvent.setup()
    render(<ExpiredItemsManager />)

    await user.click(screen.getByRole("button", { name: "Update" }))

    const dialog = await screen.findByRole("dialog")
    await user.click(within(dialog).getByRole("button", { name: /kurangi jumlah/i }))

    await user.click(within(dialog).getByRole("button", { name: /update status/i }))

    await waitFor(() =>
      expect(mocks.updateItems).toHaveBeenCalledWith(["a", "b", "c"], "sold", undefined)
    )
  })

  it("blocks waste without a reason and passes it once chosen", async () => {
    const user = userEvent.setup()
    render(<ExpiredItemsManager />)

    await user.click(screen.getByRole("button", { name: "Update" }))

    const dialog = await screen.findByRole("dialog")
    await user.click(within(dialog).getByRole("combobox", { name: /status/i }))
    await user.click(await screen.findByRole("option", { name: "Waste" }))

    await user.click(within(dialog).getByRole("button", { name: /update status/i }))

    // Waste tanpa alasan jadi baris laporan yang tidak bisa ditindaklanjuti.
    expect(mocks.updateItems).not.toHaveBeenCalled()

    await user.click(within(dialog).getByRole("combobox", { name: /waste reason/i }))
    await user.click(await screen.findByRole("option", { name: "Kering" }))
    await user.click(within(dialog).getByRole("button", { name: /update status/i }))

    await waitFor(() =>
      expect(mocks.updateItems).toHaveBeenCalledWith(["a", "b", "c", "d"], "waste", "Kering")
    )
  })

  it("tells the operator when the server skipped plates someone else closed", async () => {
    mocks.updateItems.mockResolvedValue({ updated: 3, skipped: 1 })

    const user = userEvent.setup()
    render(<ExpiredItemsManager />)

    await user.click(screen.getByRole("button", { name: "Update" }))
    await user.click(await screen.findByRole("button", { name: /update status/i }))

    // `skipped` bukan kegagalan — tapi diam saja membuat angka di layar
    // terlihat kurang tanpa sebab.
    await waitFor(() =>
      expect(mocks.toast).toHaveBeenCalledWith(
        expect.objectContaining({
          description: expect.stringContaining("1 sudah ditutup di tempat lain"),
        })
      )
    )
  })
})
