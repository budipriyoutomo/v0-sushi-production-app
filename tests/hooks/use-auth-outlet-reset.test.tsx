import { describe, it, expect, beforeEach, vi } from "vitest"
import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"

const { mockAuthService } = vi.hoisted(() => ({
  mockAuthService: {
    login: vi.fn(),
    pinLogin: vi.fn(),
    logout: vi.fn(async () => {}),
    getCurrentUser: vi.fn(),
  },
}))

vi.mock("@/lib/api", () => ({ authService: mockAuthService }))

import { AuthProvider, useAuth } from "@/hooks/use-auth"
import { useAuthStore } from "@/stores/auth-store"
import { useOutletStore } from "@/stores/outlet-store"

const NEXT_USER = {
  id: "9",
  name: "Kitchen JWB",
  role: "kitchen",
  departemen: "Operation",
  outlet: ["STJWB"],
  module_app: ["kitchen"],
}

function LoginButtons() {
  const { login, pinLogin } = useAuth()

  return (
    <>
      <button onClick={() => void login({ email: "a@b.c", password: "secret" })}>masuk email</button>
      <button onClick={() => void pinLogin({ pin: "123456" })}>masuk pin</button>
    </>
  )
}

/**
 * Outlet yang terpilih milik orang yang memilihnya, bukan milik tabletnya.
 *
 * `selectedOutletId` persist di localStorage dan tidak ikut dibersihkan
 * `clearSession()`. Di tablet dapur yang dipakai bergantian, pengguna
 * berikutnya mewarisi pilihan pengguna sebelumnya. `OutletProvider` menolak
 * outlet yang bukan milik user ini — tapi kalau keduanya sama-sama memegang
 * outlet itu, tidak ada yang janggal untuk ditolak, dan orang berikutnya
 * diam-diam bekerja di outlet yang salah.
 *
 * Direset saat login, bukan saat logout: hanya login yang pasti dilewati setiap
 * sesi baru. Tab yang ditutup tanpa logout, atau sesi yang diakhiri interceptor
 * 401, tidak pernah melewati jalur logout.
 */
describe("login memulai pilihan outlet dari nol", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
    useAuthStore.setState({ user: null, status: "loading", lastRestoredAt: null })
    // Warisan dari pengguna sebelumnya di tablet yang sama.
    useOutletStore.setState({ selectedOutletId: "outlet-milik-orang-sebelumnya" })
    mockAuthService.getCurrentUser.mockRejectedValue(new Error("tidak dipakai di test ini"))
    mockAuthService.login.mockResolvedValue({ user: NEXT_USER, token: "jwt-abc" })
    mockAuthService.pinLogin.mockResolvedValue({ user: NEXT_USER, token: "jwt-abc" })
  })

  it("membuang outlet pengguna sebelumnya saat login email", async () => {
    const user = userEvent.setup()
    render(
      <AuthProvider>
        <LoginButtons />
      </AuthProvider>,
    )

    await user.click(screen.getByRole("button", { name: "masuk email" }))

    await waitFor(() => expect(useOutletStore.getState().selectedOutletId).toBe(""))
    expect(useAuthStore.getState().user).toEqual(NEXT_USER)
  })

  it("membuang outlet pengguna sebelumnya saat login PIN", async () => {
    // Jalur inilah yang dipakai tablet dapur, dan tablet dapur yang dipakai
    // bergantian.
    const user = userEvent.setup()
    render(
      <AuthProvider>
        <LoginButtons />
      </AuthProvider>,
    )

    await user.click(screen.getByRole("button", { name: "masuk pin" }))

    await waitFor(() => expect(useOutletStore.getState().selectedOutletId).toBe(""))
  })
})
