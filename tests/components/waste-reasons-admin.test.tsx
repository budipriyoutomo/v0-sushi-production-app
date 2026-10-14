import { describe, it, expect, beforeEach, vi } from "vitest"
import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"

const mocks = vi.hoisted(() => ({
  createWasteReason: vi.fn(),
  updateWasteReason: vi.fn(),
  deleteWasteReason: vi.fn(),
  useWasteReasons: vi.fn(),
  toast: vi.fn(),
  wasteReasons: [] as Array<Record<string, unknown>>,
  wasteCategories: [] as Array<Record<string, unknown>>,
}))

vi.mock("@/hooks/use-waste-reasons", () => ({
  useWasteReasons: (options: unknown) => {
    mocks.useWasteReasons(options)
    return {
      wasteReasons: mocks.wasteReasons,
      isLoading: false,
      createWasteReason: mocks.createWasteReason,
      updateWasteReason: mocks.updateWasteReason,
      deleteWasteReason: mocks.deleteWasteReason,
    }
  },
}))
vi.mock("@/hooks/use-waste-categories", () => ({
  useWasteCategories: () => ({ wasteCategories: mocks.wasteCategories, isLoading: false }),
}))
vi.mock("@/lib/api", () => ({
  getApiError: (e: unknown) => ({ message: e instanceof Error ? e.message : String(e), status: 500 }),
}))
vi.mock("@/hooks/use-toast", () => ({ useToast: () => ({ toast: mocks.toast }) }))

import { WasteReasonsAdmin } from "@/components/waste-reasons-admin"

describe("WasteReasonsAdmin — categories", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.createWasteReason.mockResolvedValue({})
    mocks.updateWasteReason.mockResolvedValue({})
    mocks.wasteCategories = [
      { id: "cat-1", code: "DEFAULT_WASTE", category_name: "Default Waste", is_active: true, sort_order: 0 },
      { id: "cat-old", code: "OLD", category_name: "Old", is_active: false, sort_order: 1 },
    ]
    mocks.wasteReasons = [
      { id: "r-1", reason_name: "Expired", description: "", is_active: true, waste_category_id: "cat-1", waste_category_name: "Default Waste", is_system: false },
      { id: "r-2", reason_name: "Legacy", description: "", is_active: true, waste_category_id: null, waste_category_name: null, is_system: false },
      { id: "r-3", reason_name: "Auto-waste", description: "", is_active: true, waste_category_id: "cat-1", waste_category_name: "Default Waste", is_system: true },
    ]
  })

  it("asks for system reasons too, so their category can be managed", () => {
    render(<WasteReasonsAdmin />)

    expect(mocks.useWasteReasons).toHaveBeenCalledWith({ withSystem: true })
  })

  it("shows each reason's category, flags uncategorized and system reasons", () => {
    render(<WasteReasonsAdmin />)

    expect(screen.getAllByText("Default Waste").length).toBeGreaterThan(0)
    expect(screen.getByText("Uncategorized")).toBeInTheDocument()
    expect(screen.getByText("System")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Delete Auto-waste" })).toBeDisabled()
    expect(screen.getByRole("button", { name: "Delete Expired" })).toBeEnabled()
  })

  it("filters to uncategorized reasons", async () => {
    const user = userEvent.setup()
    render(<WasteReasonsAdmin />)

    await user.selectOptions(screen.getByLabelText("Filter by category"), "__uncategorized__")

    expect(screen.getByText("Legacy")).toBeInTheDocument()
    expect(screen.queryByText("Expired")).not.toBeInTheDocument()
  })

  it("requires a category for a new reason and sends it", async () => {
    const user = userEvent.setup()
    render(<WasteReasonsAdmin />)

    await user.click(screen.getByRole("button", { name: /add reason/i }))
    await user.type(screen.getByLabelText("Reason Name"), "Jatuh")
    await user.click(screen.getByRole("button", { name: /save changes/i }))

    expect(mocks.createWasteReason).not.toHaveBeenCalled()
    expect(mocks.toast).toHaveBeenCalledWith(expect.objectContaining({ variant: "destructive" }))

    // Kategori nonaktif tidak ditawarkan untuk reason baru.
    expect(screen.queryByRole("option", { name: /Old/ })).not.toBeInTheDocument()

    await user.selectOptions(screen.getByLabelText("Category"), "cat-1")
    await user.click(screen.getByRole("button", { name: /save changes/i }))

    await waitFor(() =>
      expect(mocks.createWasteReason).toHaveBeenCalledWith({
        reason_name: "Jatuh",
        description: "",
        waste_category_id: "cat-1",
        is_active: true,
      })
    )
  })

  it("lets a legacy reason be saved without a category, without clearing anything", async () => {
    const user = userEvent.setup()
    render(<WasteReasonsAdmin />)

    const editButtons = screen.getAllByRole("button").filter((b) => b.querySelector('svg[class*="pencil"]'))
    await user.click(editButtons[1]) // Legacy
    await user.click(screen.getByRole("button", { name: /save changes/i }))

    await waitFor(() =>
      expect(mocks.updateWasteReason).toHaveBeenCalledWith("r-2", {
        reason_name: "Legacy",
        description: "",
        is_active: true,
      })
    )
  })

  it("does not allow renaming a system reason", async () => {
    const user = userEvent.setup()
    render(<WasteReasonsAdmin />)

    const editButtons = screen.getAllByRole("button").filter((b) => b.querySelector('svg[class*="pencil"]'))
    await user.click(editButtons[2]) // Auto-waste

    expect(screen.getByLabelText("Reason Name")).toBeDisabled()
  })
})
