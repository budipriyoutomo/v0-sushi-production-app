import { describe, it, expect, beforeEach, vi } from "vitest"
import { render, screen, waitFor, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"

// Shared mock handles, hoisted so the vi.mock factories below can reference them.
const mocks = vi.hoisted(() => ({
  closeDay: vi.fn(),
  wasteItems: vi.fn(),
  refresh: vi.fn().mockResolvedValue(undefined),
  toast: vi.fn(),
  user: { id: "u1", role: "kitchen" } as { id: string; role: string },
  conveyorGroups: [] as Array<Record<string, unknown>>,
}))

vi.mock("@/lib/api", () => ({
  getApiError: (e: unknown) => ({ message: e instanceof Error ? e.message : String(e), status: 500 }),
}))

vi.mock("@/hooks/use-production", () => ({
  useConveyorGroups: () => ({
    groups: mocks.conveyorGroups,
    isLoading: false,
    refresh: mocks.refresh,
    closeDay: mocks.closeDay,
    wasteItems: mocks.wasteItems,
  }),
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
  useActiveWasteReasons: () => ({
    wasteReasons: [{ id: "r-1", reason_name: "Jatuh" }],
  }),
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

function makeGroup(overrides: Record<string, unknown> = {}) {
  const producedAt = new Date(Date.now() - 60_000).toISOString()
  const expiresAt = new Date(Date.now() + 3_600_000).toISOString()

  return {
    groupKey: `menu-1|${producedAt}|${expiresAt}`,
    menuId: "menu-1",
    menuName: "Salmon",
    plateColor: "color-1",
    plateColorName: "Merah",
    producedAt,
    expiresAt,
    beltStatus: "fresh",
    quantity: 1,
    itemIds: ["item-1"],
    ...overrides,
  }
}

/** Buka dialog waste dan pilih alasannya, karena Confirm terkunci tanpa itu. */
async function openWasteDialogWithReason(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole("button", { name: /waste/i }))
  await user.click(await screen.findByRole("combobox"))
  await user.click(await screen.findByRole("option", { name: "Jatuh" }))
}

describe("ConveyorScreen — no per-plate Sold action", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.refresh.mockResolvedValue(undefined)
    mocks.closeDay.mockResolvedValue(1)
    mocks.wasteItems.mockResolvedValue(undefined)
    mocks.user = { id: "u1", role: "kitchen" }
    mocks.conveyorGroups = [makeGroup()]
  })

  it("renders no Sold button on a plate card", () => {
    render(<ConveyorScreen />)

    // Waste tetap satu-satunya aksi per batch.
    expect(screen.getByRole("button", { name: /waste/i })).toBeInTheDocument()
    expect(screen.queryByRole("button", { name: /^sold$/i })).not.toBeInTheDocument()
  })
})

describe("ConveyorScreen — batch produksi", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.refresh.mockResolvedValue(undefined)
    mocks.closeDay.mockResolvedValue(1)
    mocks.wasteItems.mockResolvedValue(undefined)
    mocks.user = { id: "u1", role: "kitchen" }
    mocks.conveyorGroups = [
      makeGroup({ quantity: 8, itemIds: ["a", "b", "c", "d", "e", "f", "g", "h"] }),
    ]
  })

  it("renders one card per batch with its plate count", () => {
    render(<ConveyorScreen />)

    // Satu batch delapan piring = satu kartu, bukan delapan.
    expect(screen.getAllByRole("button", { name: /waste/i })).toHaveLength(1)
    expect(screen.getByLabelText("8 plate")).toHaveTextContent("×8")
  })

  it("counts plates rather than batches in the header", () => {
    mocks.conveyorGroups = [
      makeGroup({ groupKey: "g1", quantity: 8, itemIds: ["a", "b", "c", "d", "e", "f", "g", "h"] }),
      makeGroup({ groupKey: "g2", quantity: 3, itemIds: ["i", "j", "k"] }),
    ]

    render(<ConveyorScreen />)

    expect(screen.getByText("11")).toBeInTheDocument()
  })

  it("wastes only the chosen number of plates, defaulting to one", async () => {
    const user = userEvent.setup()
    render(<ConveyorScreen />)

    await openWasteDialogWithReason(user)
    await user.click(screen.getByRole("button", { name: /confirm waste/i }))

    // Default satu piring: membuang lebih banyak dari yang dimaksud tidak bisa
    // dibatalkan, membuang kurang tinggal diulang.
    await waitFor(() => expect(mocks.wasteItems).toHaveBeenCalledWith(["a"], "Jatuh"))
  })

  it("sends exactly the ids the stepper selected", async () => {
    const user = userEvent.setup()
    render(<ConveyorScreen />)

    await openWasteDialogWithReason(user)

    const dialog = screen.getByRole("dialog")
    const plus = within(dialog).getByRole("button", { name: /tambah jumlah/i })
    await user.click(plus)
    await user.click(plus)

    await user.click(screen.getByRole("button", { name: /confirm waste/i }))

    // Id yang dikirim, bukan sekadar jumlahnya — dua tablet yang menekan
    // bersamaan harus bertabrakan di server, bukan diambilkan piring berbeda.
    await waitFor(() => expect(mocks.wasteItems).toHaveBeenCalledWith(["a", "b", "c"], "Jatuh"))
  })

  it("cannot select more plates than the batch holds", async () => {
    mocks.conveyorGroups = [makeGroup({ quantity: 2, itemIds: ["a", "b"] })]

    const user = userEvent.setup()
    render(<ConveyorScreen />)

    await openWasteDialogWithReason(user)

    const dialog = screen.getByRole("dialog")
    const plus = within(dialog).getByRole("button", { name: /tambah jumlah/i })
    await user.click(plus)

    expect(plus).toBeDisabled()
    expect(within(dialog).getByRole("button", { name: /kurangi jumlah/i })).toBeEnabled()
  })
})

describe("ConveyorScreen — Tutup Hari", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.refresh.mockResolvedValue(undefined)
    mocks.closeDay.mockResolvedValue(1)
    mocks.wasteItems.mockResolvedValue(undefined)
    mocks.user = { id: "u1", role: "kitchen" }
    mocks.conveyorGroups = [makeGroup()]
  })

  it("closes the day only after the confirmation dialog is accepted", async () => {
    const user = userEvent.setup()
    render(<ConveyorScreen />)

    await user.click(screen.getByRole("button", { name: /tutup hari/i }))

    // Membuka dialog saja belum boleh memfinalisasi apa pun.
    expect(mocks.closeDay).not.toHaveBeenCalled()

    await user.click(screen.getByRole("button", { name: /tandai terjual/i }))

    await waitFor(() => expect(mocks.closeDay).toHaveBeenCalledTimes(1))
  })

  it("calls closeDay only once when confirmed twice rapidly", async () => {
    // Keep the request in flight so the in-flight guard stays active across clicks.
    let resolveCloseDay: (value: number) => void = () => {}
    mocks.closeDay.mockImplementation(
      () => new Promise<number>((resolve) => { resolveCloseDay = resolve })
    )

    const user = userEvent.setup()
    render(<ConveyorScreen />)

    await user.click(screen.getByRole("button", { name: /tutup hari/i }))

    const confirm = screen.getByRole("button", { name: /tandai terjual/i })
    await user.click(confirm)
    expect(confirm).toBeDisabled()

    await user.click(confirm)

    expect(mocks.closeDay).toHaveBeenCalledTimes(1)

    resolveCloseDay(1)
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument())
  })

  it("lets kitchen close the day now that the service role is gone", () => {
    mocks.user = { id: "u2", role: "kitchen" }

    render(<ConveyorScreen />)

    expect(screen.getByRole("button", { name: /tutup hari/i })).toBeEnabled()
  })

  it("lets kitchen waste a plate", () => {
    mocks.user = { id: "u2", role: "kitchen" }

    render(<ConveyorScreen />)

    expect(screen.getByRole("button", { name: /waste/i })).toBeEnabled()
  })

  it("disables Tutup Hari when no plate is left on the belt", () => {
    mocks.conveyorGroups = []

    render(<ConveyorScreen />)

    expect(screen.getByRole("button", { name: /tutup hari/i })).toBeDisabled()
  })
})
