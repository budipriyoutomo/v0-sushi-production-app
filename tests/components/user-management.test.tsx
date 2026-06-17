import { describe, it, expect, beforeEach, vi } from "vitest"
import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"

const mocks = vi.hoisted(() => ({
  createUser: vi.fn(),
  updateUser: vi.fn(),
  deleteUser: vi.fn(),
  toast: vi.fn(),
  users: [] as Array<Record<string, unknown>>,
}))

vi.mock("@/hooks/use-users", () => ({
  useUsers: () => ({
    users: mocks.users,
    isLoading: false,
    createUser: mocks.createUser,
    updateUser: mocks.updateUser,
    deleteUser: mocks.deleteUser,
  }),
}))
vi.mock("@/lib/api", () => ({
  getApiError: (e: unknown) => ({ message: e instanceof Error ? e.message : String(e), status: 500 }),
}))
vi.mock("@/hooks/use-toast", () => ({ useToast: () => ({ toast: mocks.toast }) }))

import { UserManagement } from "@/components/user-management"

describe("UserManagement", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.users = []
  })

  it("creates an admin user with an email-based payload (no username)", async () => {
    mocks.createUser.mockResolvedValue({ id: "1" })
    const user = userEvent.setup()
    render(<UserManagement />)

    await user.click(screen.getByRole("button", { name: /add admin/i }))

    await user.type(screen.getByLabelText("Name"), "Jane Manager")
    await user.type(screen.getByLabelText("Email"), "jane@example.com")
    await user.type(screen.getByLabelText(/password/i), "secret123")

    await user.click(screen.getByRole("button", { name: /add user/i }))

    await waitFor(() => expect(mocks.createUser).toHaveBeenCalledTimes(1))
    expect(mocks.createUser).toHaveBeenCalledWith({
      name: "Jane Manager",
      email: "jane@example.com",
      password: "secret123",
      role: "manager",
    })
    // The payload must not contain a username field (backend has no such column).
    expect(mocks.createUser.mock.calls[0][0]).not.toHaveProperty("username")
  })

  it("creates a kitchen user with role 'kitchen'", async () => {
    mocks.createUser.mockResolvedValue({ id: "2" })
    const user = userEvent.setup()
    render(<UserManagement />)

    await user.click(screen.getByRole("button", { name: /add staff/i }))

    await user.type(screen.getByLabelText("Name"), "Chef Budi")
    await user.type(screen.getByLabelText("Email"), "budi@example.com")
    await user.type(screen.getByLabelText(/password/i), "secret123")
    await user.type(screen.getByLabelText(/pin/i), "1234")

    // The dialog's confirm button is the second "Add Staff" (the first is the section trigger).
    const addStaffButtons = screen.getAllByRole("button", { name: /add staff/i })
    await user.click(addStaffButtons[addStaffButtons.length - 1])

    await waitFor(() => expect(mocks.createUser).toHaveBeenCalledTimes(1))
    expect(mocks.createUser).toHaveBeenCalledWith({
      name: "Chef Budi",
      email: "budi@example.com",
      password: "secret123",
      role: "kitchen",
      pin: "1234",
    })
  })

  it("validates required fields before calling the API", async () => {
    const user = userEvent.setup()
    render(<UserManagement />)

    await user.click(screen.getByRole("button", { name: /add admin/i }))
    await user.click(screen.getByRole("button", { name: /add user/i }))

    expect(mocks.createUser).not.toHaveBeenCalled()
    expect(mocks.toast).toHaveBeenCalledWith(
      expect.objectContaining({ variant: "destructive" })
    )
  })

  it("guards against double-clicking the save button", async () => {
    let resolveCreate: () => void = () => {}
    mocks.createUser.mockImplementation(() => new Promise<void>((r) => { resolveCreate = r }))

    const user = userEvent.setup()
    render(<UserManagement />)

    await user.click(screen.getByRole("button", { name: /add admin/i }))
    await user.type(screen.getByLabelText("Name"), "Jane")
    await user.type(screen.getByLabelText("Email"), "jane@example.com")
    await user.type(screen.getByLabelText(/password/i), "secret123")

    const saveButton = screen.getByRole("button", { name: /add user/i })
    await user.click(saveButton)
    expect(saveButton).toBeDisabled()
    await user.click(saveButton)

    expect(mocks.createUser).toHaveBeenCalledTimes(1)

    // Resolve and let the resulting state updates flush (avoids act warnings).
    // On success the dialog closes, unmounting the save button.
    resolveCreate()
    await waitFor(() => expect(screen.queryByRole("button", { name: /add user/i })).toBeNull())
  })
})
