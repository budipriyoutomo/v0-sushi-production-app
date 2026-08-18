import { describe, it, expect, beforeEach, vi } from "vitest"
import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"

// Shared mock handles, hoisted so the vi.mock factories below can reference them.
const mocks = vi.hoisted(() => ({
  closeDay: vi.fn(),
  markWaste: vi.fn(),
  recordWaste: vi.fn(),
  refresh: vi.fn().mockResolvedValue(undefined),
  toast: vi.fn(),
  user: { id: "u1", role: "service" } as { id: string; role: string },
  conveyorItems: [] as Array<Record<string, unknown>>,
}))

vi.mock("@/lib/api", () => ({
  productionService: {
    markWaste: mocks.markWaste,
    recordWaste: mocks.recordWaste,
  },
  getApiError: (e: unknown) => ({ message: e instanceof Error ? e.message : String(e), status: 500 }),
}))

vi.mock("@/hooks/use-production", () => ({
  useConveyorItems: () => ({
    items: mocks.conveyorItems,
    isLoading: false,
    refresh: mocks.refresh,
    closeDay: mocks.closeDay,
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

describe("ConveyorScreen — no per-plate Sold action", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.refresh.mockResolvedValue(undefined)
    mocks.closeDay.mockResolvedValue(1)
    mocks.user = { id: "u1", role: "service" }
    mocks.conveyorItems = [makeItem()]
  })

  it("renders no Sold button on a plate card", () => {
    render(<ConveyorScreen />)

    // Waste tetap satu-satunya aksi per plate.
    expect(screen.getByRole("button", { name: /waste/i })).toBeInTheDocument()
    expect(screen.queryByRole("button", { name: /^sold$/i })).not.toBeInTheDocument()
  })
})

describe("ConveyorScreen — Tutup Hari", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.refresh.mockResolvedValue(undefined)
    mocks.closeDay.mockResolvedValue(1)
    mocks.user = { id: "u1", role: "service" }
    mocks.conveyorItems = [makeItem()]
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

  it("disables Tutup Hari for kitchen role", () => {
    mocks.user = { id: "u2", role: "kitchen" }

    render(<ConveyorScreen />)

    expect(screen.getByRole("button", { name: /tutup hari/i })).toBeDisabled()
  })

  it("disables Tutup Hari when no plate is left on the belt", () => {
    mocks.conveyorItems = []

    render(<ConveyorScreen />)

    expect(screen.getByRole("button", { name: /tutup hari/i })).toBeDisabled()
  })
})
