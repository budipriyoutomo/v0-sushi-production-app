import { describe, it, expect, beforeEach, vi } from "vitest"
import { render, screen } from "@testing-library/react"

const mocks = vi.hoisted(() => ({
  replace: vi.fn(),
  pathname: "/kitchen/conveyor",
  auth: {
    user: null as Record<string, unknown> | null,
    isLoading: false,
    isAuthenticated: true,
  },
}))

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: mocks.replace }),
  usePathname: () => mocks.pathname,
}))
vi.mock("@/hooks/use-auth", () => ({ useAuth: () => mocks.auth }))

import { AuthGuard } from "@/components/auth-guard"

function renderGuard(props: { allowedRoles?: string[]; allowedModules?: string[] } = {}) {
  return render(
    <AuthGuard {...props}>
      <div>halaman rahasia</div>
    </AuthGuard>
  )
}

describe("AuthGuard", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.pathname = "/kitchen/conveyor"
    mocks.auth = { user: null, isLoading: false, isAuthenticated: true }
  })

  it("denies access when module_app is missing", () => {
    // Ini regresi utamanya: versi lama memakai `user?.module_app` sebagai syarat
    // masuk blok pengecekan, jadi user tanpa modul melewati pemeriksaan dan
    // melihat semua halaman. Setiap user yang dibuat lewat layar User Management
    // dulu berada di keadaan itu.
    mocks.auth.user = { id: "1", name: "Tanpa Modul", role: "kitchen" }

    renderGuard()

    expect(screen.queryByText("halaman rahasia")).toBeNull()
    expect(mocks.replace).toHaveBeenCalledWith("/login")
  })

  it("denies access when module_app is an empty array", () => {
    mocks.auth.user = { id: "1", name: "Kosong", role: "kitchen", module_app: [] }

    renderGuard()

    expect(screen.queryByText("halaman rahasia")).toBeNull()
    expect(mocks.replace).toHaveBeenCalledWith("/login")
  })

  it("allows access when the path module is granted", () => {
    mocks.auth.user = { id: "1", name: "Chef", role: "kitchen", module_app: ["app", "kitchen"] }

    renderGuard()

    expect(screen.getByText("halaman rahasia")).toBeInTheDocument()
    expect(mocks.replace).not.toHaveBeenCalled()
  })

  it("redirects to the first non-app module when the path module is not granted", () => {
    mocks.pathname = "/admin/users"
    mocks.auth.user = { id: "1", name: "Chef", role: "kitchen", module_app: ["app", "kitchen"] }

    renderGuard()

    expect(screen.queryByText("halaman rahasia")).toBeNull()
    expect(mocks.replace).toHaveBeenCalledWith("/kitchen")
  })

  it("sends a user holding only 'app' to login, since app has no page", () => {
    mocks.pathname = "/admin/users"
    mocks.auth.user = { id: "1", name: "Dasar", role: "kitchen", module_app: ["app"] }

    renderGuard()

    expect(mocks.replace).toHaveBeenCalledWith("/login")
  })

  it("honours allowedModules over the module taken from the path", () => {
    mocks.pathname = "/operation/sales-input"
    mocks.auth.user = { id: "1", name: "Ops", role: "operation", module_app: ["report"] }

    renderGuard({ allowedModules: ["operation", "report"] })

    expect(screen.getByText("halaman rahasia")).toBeInTheDocument()
  })

  it("redirects guests to login", () => {
    mocks.auth = { user: null, isLoading: false, isAuthenticated: false }

    renderGuard()

    expect(screen.queryByText("halaman rahasia")).toBeNull()
    expect(mocks.replace).toHaveBeenCalledWith("/login")
  })

  it("blocks a role that is not in allowedRoles", () => {
    mocks.auth.user = { id: "1", name: "Chef", role: "kitchen", module_app: ["app", "kitchen"] }

    renderGuard({ allowedRoles: ["admin"] })

    expect(screen.queryByText("halaman rahasia")).toBeNull()
    expect(mocks.replace).toHaveBeenCalledWith("/login")
  })
})
