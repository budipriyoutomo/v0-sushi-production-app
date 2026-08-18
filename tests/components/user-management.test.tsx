import { describe, it, expect, beforeEach, vi } from "vitest"
import { render, screen, waitFor, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"

const mocks = vi.hoisted(() => ({
  createUser: vi.fn(),
  updateUser: vi.fn(),
  deleteUser: vi.fn(),
  toast: vi.fn(),
  users: [] as Array<Record<string, unknown>>,
  outlets: [
    { id: "o-1", code: "bandung", name: "Bandung" },
    { id: "o-2", code: "jakarta", name: "Jakarta" },
  ] as Array<Record<string, unknown>>,
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
vi.mock("@/hooks/use-outlets", () => ({
  useOutlets: () => ({ outlets: mocks.outlets, isLoading: false }),
}))
vi.mock("@/lib/api", () => ({
  getApiError: (e: unknown) => ({ message: e instanceof Error ? e.message : String(e), status: 500 }),
}))
vi.mock("@/hooks/use-toast", () => ({ useToast: () => ({ toast: mocks.toast }) }))

import { UserManagement } from "@/components/user-management"

/** Centang satu kotak di dalam fieldset dengan legend tertentu. */
async function checkIn(user: ReturnType<typeof userEvent.setup>, legend: string, label: RegExp) {
  const group = screen.getByRole("group", { name: legend })
  await user.click(within(group).getByLabelText(label))
}

describe("UserManagement", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.users = []
  })

  it("creates an admin user with outlet and module_app in the payload", async () => {
    mocks.createUser.mockResolvedValue({ id: "1" })
    const user = userEvent.setup()
    render(<UserManagement />)

    await user.click(screen.getByRole("button", { name: /add admin/i }))

    await user.type(screen.getByLabelText("Name"), "Jane Manager")
    await user.type(screen.getByLabelText("Email"), "jane@example.com")
    await user.type(screen.getByLabelText(/password/i), "secret123")
    await checkIn(user, "Outlet", /Bandung/)
    await checkIn(user, "Modules", /^Report$/)

    await user.click(screen.getByRole("button", { name: /add user/i }))

    await waitFor(() => expect(mocks.createUser).toHaveBeenCalledTimes(1))
    expect(mocks.createUser).toHaveBeenCalledWith({
      name: "Jane Manager",
      email: "jane@example.com",
      password: "secret123",
      role: "manager",
      outlet: ["bandung"],
      module_app: ["app", "report"],
    })
    // The payload must not contain a username field (backend has no such column).
    expect(mocks.createUser.mock.calls[0][0]).not.toHaveProperty("username")
  })

  it("creates a kitchen user with role 'kitchen' and its default modules", async () => {
    mocks.createUser.mockResolvedValue({ id: "2" })
    const user = userEvent.setup()
    render(<UserManagement />)

    await user.click(screen.getByRole("button", { name: /add staff/i }))

    await user.type(screen.getByLabelText("Name"), "Chef Budi")
    await user.type(screen.getByLabelText("Email"), "budi@example.com")
    await user.type(screen.getByLabelText(/password/i), "secret123")
    await user.type(screen.getByLabelText(/pin/i), "123456")
    await checkIn(user, "Outlet", /Bandung/)

    // The dialog's confirm button is the second "Add Staff" (the first is the section trigger).
    const addStaffButtons = screen.getAllByRole("button", { name: /add staff/i })
    await user.click(addStaffButtons[addStaffButtons.length - 1])

    await waitFor(() => expect(mocks.createUser).toHaveBeenCalledTimes(1))
    expect(mocks.createUser).toHaveBeenCalledWith({
      name: "Chef Budi",
      email: "budi@example.com",
      password: "secret123",
      role: "kitchen",
      pin: "123456",
      outlet: ["bandung"],
      module_app: ["app", "kitchen"],
    })
  })

  it("refuses to create a user with no outlet", async () => {
    const user = userEvent.setup()
    render(<UserManagement />)

    await user.click(screen.getByRole("button", { name: /add admin/i }))
    await user.type(screen.getByLabelText("Name"), "Jane")
    await user.type(screen.getByLabelText("Email"), "jane@example.com")
    await user.type(screen.getByLabelText(/password/i), "secret123")

    await user.click(screen.getByRole("button", { name: /add user/i }))

    expect(mocks.createUser).not.toHaveBeenCalled()
    expect(mocks.toast).toHaveBeenCalledWith(
      expect.objectContaining({ description: expect.stringMatching(/outlet/i) })
    )
  })

  it("refuses to create a user with no module", async () => {
    const user = userEvent.setup()
    render(<UserManagement />)

    await user.click(screen.getByRole("button", { name: /add admin/i }))
    await user.type(screen.getByLabelText("Name"), "Jane")
    await user.type(screen.getByLabelText("Email"), "jane@example.com")
    await user.type(screen.getByLabelText(/password/i), "secret123")
    await checkIn(user, "Outlet", /Bandung/)
    // 'app' is preselected on the admin form — untick it to end up with none.
    await checkIn(user, "Modules", /App/)

    await user.click(screen.getByRole("button", { name: /add user/i }))

    expect(mocks.createUser).not.toHaveBeenCalled()
    expect(mocks.toast).toHaveBeenCalledWith(
      expect.objectContaining({ description: expect.stringMatching(/module/i) })
    )
  })

  it("rejects a PIN shorter than 6 digits, matching the backend rule", async () => {
    const user = userEvent.setup()
    render(<UserManagement />)

    await user.click(screen.getByRole("button", { name: /add staff/i }))
    await user.type(screen.getByLabelText("Name"), "Chef Budi")
    await user.type(screen.getByLabelText("Email"), "budi@example.com")
    await user.type(screen.getByLabelText(/password/i), "secret123")
    await user.type(screen.getByLabelText(/pin/i), "1234")
    await checkIn(user, "Outlet", /Bandung/)

    const addStaffButtons = screen.getAllByRole("button", { name: /add staff/i })
    await user.click(addStaffButtons[addStaffButtons.length - 1])

    expect(mocks.createUser).not.toHaveBeenCalled()
    expect(mocks.toast).toHaveBeenCalledWith(
      expect.objectContaining({ description: expect.stringMatching(/pin/i) })
    )
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

  it("shows outlet and modules in the user table", async () => {
    mocks.users = [
      {
        id: "1",
        name: "Chef Budi",
        email: "budi@example.com",
        role: "kitchen",
        outlet: ["bandung"],
        module_app: ["app", "kitchen"],
      },
      { id: "2", name: "Tanpa Akses", email: "x@example.com", role: "manager" },
    ]

    render(<UserManagement />)

    expect(screen.getByText("app, kitchen")).toBeInTheDocument()
    // A user with nothing assigned must read as such, not as a blank cell.
    expect(screen.getByText("No outlet")).toBeInTheDocument()
    expect(screen.getByText("No module")).toBeInTheDocument()
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
    await checkIn(user, "Outlet", /Bandung/)

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
