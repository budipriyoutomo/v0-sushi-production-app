import { describe, it, expect, beforeEach, vi } from "vitest"
import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"

const mocks = vi.hoisted(() => ({
  createWasteCategory: vi.fn(),
  updateWasteCategory: vi.fn(),
  deleteWasteCategory: vi.fn(),
  toast: vi.fn(),
  wasteCategories: [] as Array<Record<string, unknown>>,
}))

vi.mock("@/hooks/use-waste-categories", () => ({
  useWasteCategories: () => ({
    wasteCategories: mocks.wasteCategories,
    isLoading: false,
    createWasteCategory: mocks.createWasteCategory,
    updateWasteCategory: mocks.updateWasteCategory,
    deleteWasteCategory: mocks.deleteWasteCategory,
  }),
}))
vi.mock("@/lib/api", () => ({
  getApiError: (e: unknown) => ({ message: e instanceof Error ? e.message : String(e), status: 500 }),
}))
vi.mock("@/hooks/use-toast", () => ({ useToast: () => ({ toast: mocks.toast }) }))

import { WasteCategoriesAdmin } from "@/components/waste-categories-admin"

describe("WasteCategoriesAdmin", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.createWasteCategory.mockResolvedValue({})
    mocks.updateWasteCategory.mockResolvedValue({})
    mocks.wasteCategories = [
      { id: "cat-1", code: "DEFAULT_WASTE", category_name: "Default Waste", description: null, sort_order: 0, is_active: true, reasons_count: 7 },
      { id: "cat-2", code: "UNUSED", category_name: "Unused", description: null, sort_order: 1, is_active: true, reasons_count: 0 },
    ]
  })

  it("lists categories with their code and reason count", () => {
    render(<WasteCategoriesAdmin />)

    expect(screen.getByText("Default Waste")).toBeInTheDocument()
    expect(screen.getByText("DEFAULT_WASTE")).toBeInTheDocument()
    expect(screen.getByText("7 reason(s)")).toBeInTheDocument()
  })

  it("cannot delete a category that still has reasons", () => {
    render(<WasteCategoriesAdmin />)

    expect(screen.getByRole("button", { name: "Delete Default Waste" })).toBeDisabled()
    expect(screen.getByRole("button", { name: "Delete Unused" })).toBeEnabled()
  })

  it("normalises the code to the shape the backend accepts", async () => {
    const user = userEvent.setup()
    render(<WasteCategoriesAdmin />)

    await user.click(screen.getByRole("button", { name: /add category/i }))
    await user.type(screen.getByLabelText("Code"), "shelf life")
    await user.type(screen.getByLabelText("Name"), "Shelf Life")
    await user.click(screen.getByRole("button", { name: /save changes/i }))

    await waitFor(() =>
      expect(mocks.createWasteCategory).toHaveBeenCalledWith({
        code: "SHELF_LIFE",
        category_name: "Shelf Life",
        description: null,
        sort_order: 0,
        is_active: true,
      })
    )
  })

  it("locks the code of a category that is already used", async () => {
    const user = userEvent.setup()
    render(<WasteCategoriesAdmin />)

    await user.click(screen.getByRole("button", { name: "Edit Default Waste" }))
    expect(screen.getByLabelText("Code")).toBeDisabled()

    await user.click(screen.getByRole("button", { name: /cancel/i }))
    await user.click(screen.getByRole("button", { name: "Edit Unused" }))
    expect(screen.getByLabelText("Code")).toBeEnabled()
  })
})
