import { describe, it, expect, beforeEach, vi } from "vitest"
import { render, screen, waitFor } from "@testing-library/react"

const { mocks } = vi.hoisted(() => ({
  mocks: {
    outlets: [] as Array<{ id: string; code: string; name: string }>,
    user: null as { role: string; outlet: string[] } | null,
  },
}))

vi.mock("@/hooks/use-outlets", () => ({
  useActiveOutlets: () => ({ outlets: mocks.outlets, isLoading: false }),
}))

vi.mock("@/hooks/use-auth", () => ({
  useAuth: () => ({ user: mocks.user }),
}))

vi.mock("next/navigation", () => ({
  usePathname: () => "/kitchen/conveyor",
}))

import { OutletProvider, useOutlet } from "@/lib/outlet-context"
import { useOutletStore } from "@/stores/outlet-store"

function Probe() {
  const { selectedOutletId } = useOutlet()

  // String kosong tidak terlihat di DOM, jadi diberi penanda eksplisit.
  return <span data-testid="selected">{selectedOutletId || "(kosong)"}</span>
}

function renderProvider() {
  return render(
    <OutletProvider>
      <Probe />
    </OutletProvider>,
  )
}

const TSM = { id: "outlet-tsm", code: "STTSM", name: "Tunjungan" }
const JWB = { id: "outlet-jwb", code: "STJWB", name: "Jawa Barat" }

/**
 * `selectedOutletId` persist di localStorage dan bertahan lintas pengguna —
 * tablet dapur dipakai bergantian. Kalau ia dipercaya mentah, pengguna
 * berikutnya menembak setiap request dengan outlet milik pengguna sebelumnya
 * sampai `/master/outlet` menjawab dan koreksinya jalan.
 *
 * `outletScopedKey()` tidak menahannya: ia gagal-tertutup untuk outlet
 * **kosong**, bukan outlet **basi**.
 */
describe("OutletProvider — outlet tersimpan tidak dipercaya mentah", () => {
  beforeEach(() => {
    localStorage.clear()
    useOutletStore.setState({ selectedOutletId: "" })
    mocks.outlets = []
    mocks.user = { role: "kitchen", outlet: ["STTSM"] }
  })

  it("tidak memilih outlet apa pun selama daftarnya belum datang", () => {
    // Inilah jendela yang dulu terbuka: pilihan lama sudah ada di store,
    // daftar outlet belum. Versi sebelumnya memakai nilai lama itu apa adanya.
    useOutletStore.setState({ selectedOutletId: JWB.id })
    mocks.outlets = []

    renderProvider()

    expect(screen.getByTestId("selected")).toHaveTextContent("(kosong)")
  })

  it("menolak outlet tersimpan yang bukan milik user ini", async () => {
    useOutletStore.setState({ selectedOutletId: JWB.id })
    mocks.outlets = [TSM, JWB]
    mocks.user = { role: "kitchen", outlet: ["STTSM"] }

    renderProvider()

    // Bukan JWB — dan tidak pernah sekejap pun jadi JWB.
    await waitFor(() => expect(screen.getByTestId("selected")).toHaveTextContent(TSM.id))
  })

  it("mempertahankan outlet tersimpan yang memang milik user ini", async () => {
    useOutletStore.setState({ selectedOutletId: JWB.id })
    mocks.outlets = [TSM, JWB]
    mocks.user = { role: "admin", outlet: [] }

    renderProvider()

    await waitFor(() => expect(screen.getByTestId("selected")).toHaveTextContent(JWB.id))
  })

  it("memilih outlet pertama kalau belum ada yang terpilih", async () => {
    mocks.outlets = [TSM]

    renderProvider()

    await waitFor(() => expect(screen.getByTestId("selected")).toHaveTextContent(TSM.id))
  })

  it("tetap kosong kalau user tidak punya satu outlet pun yang cocok", async () => {
    mocks.outlets = [JWB]
    mocks.user = { role: "kitchen", outlet: ["STTSM"] }

    renderProvider()

    // Gagal-tertutup: tidak ada outlet berarti tidak ada yang di-fetch, bukan
    // "bebas melihat semuanya".
    await waitFor(() => expect(screen.getByTestId("selected")).toHaveTextContent("(kosong)"))
  })
})
