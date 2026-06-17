import { describe, it, expect, beforeEach, vi } from "vitest"
import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"

const mocks = vi.hoisted(() => ({
  createPlateColor: vi.fn(),
  updatePlateColor: vi.fn(),
  deletePlateColor: vi.fn(),
  toast: vi.fn(),
  plateColors: [] as Array<Record<string, unknown>>,
}))

vi.mock("@/hooks/use-plate-colors", () => ({
  usePlateColors: () => ({
    plateColors: mocks.plateColors,
    isLoading: false,
    createPlateColor: mocks.createPlateColor,
    updatePlateColor: mocks.updatePlateColor,
    deletePlateColor: mocks.deletePlateColor,
  }),
}))
vi.mock("@/lib/api", () => ({
  getApiError: (e: unknown) => ({ message: e instanceof Error ? e.message : String(e), status: 500 }),
}))
vi.mock("@/hooks/use-toast", () => ({ useToast: () => ({ toast: mocks.toast }) }))
vi.mock("@/components/plate-color-badge", () => ({ PlateColorBadge: () => null }))

import { PlateColorsAdmin } from "@/components/plate-colors-admin"

describe("PlateColorsAdmin — delete double-click guard", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.plateColors = [
      { id: "pc-1", platename: "Merah", price: 15000, description: "Red", targetFoodCost: 30, isActive: true },
    ]
  })

  it("calls deletePlateColor only once when Delete is clicked twice", async () => {
    let resolveDelete: () => void = () => {}
    mocks.deletePlateColor.mockImplementation(
      () => new Promise<void>((resolve) => { resolveDelete = resolve })
    )

    const user = userEvent.setup()
    render(<PlateColorsAdmin />)

    // Open the delete confirmation dialog via the row's trash icon button.
    const trashButton = screen
      .getAllByRole("button")
      .find((b) => b.querySelector('svg[class*="trash"]'))
    expect(trashButton).toBeTruthy()
    await user.click(trashButton!)

    const confirm = await screen.findByRole("button", { name: "Delete" })
    await user.click(confirm)
    expect(confirm).toBeDisabled()

    // Second click while the delete is in flight must be a no-op.
    await user.click(confirm)

    expect(mocks.deletePlateColor).toHaveBeenCalledTimes(1)
    expect(mocks.deletePlateColor).toHaveBeenCalledWith("pc-1")

    resolveDelete()
    await waitFor(() => expect(mocks.toast).toHaveBeenCalled())
  })
})
