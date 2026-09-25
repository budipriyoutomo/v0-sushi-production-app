import { describe, it, expect } from "vitest"
import { render, screen } from "@testing-library/react"
import { PlateColorBadge } from "@/components/plate-color-badge"

/**
 * Warna badge sekarang data master, bukan peta nama yang dikunci mati.
 *
 * Nama bukan kunci yang sah: dua brand boleh sama-sama punya "Merah", dan tidak
 * ada yang menjamin keduanya ingin rona yang sama. Peta lama tetap ada sebagai
 * cadangan untuk baris yang `color_hex`-nya masih kosong.
 */
describe("PlateColorBadge", () => {
  it("memakai warna dari master kalau ada", () => {
    render(<PlateColorBadge color="Merah" colorHex="#EF4444" />)

    const badge = screen.getByText("Merah")

    expect(badge).toHaveStyle({ backgroundColor: "#EF4444" })
  })

  it("menghitung warna teks dari kecerahan latar", () => {
    render(<PlateColorBadge color="Kuning" colorHex="#FACC15" />)

    // Kuning terang: teks harus gelap supaya terbaca.
    expect(screen.getByText("Kuning")).toHaveStyle({ color: "#111827" })
  })

  it("jatuh ke palet lama kalau master belum punya warna", () => {
    const { container } = render(<PlateColorBadge color="blue" colorHex={null} />)

    expect(container.firstChild).toHaveClass("bg-blue-500")
  })

  it("jatuh ke palet lama kalau hex-nya rusak", () => {
    const { container } = render(<PlateColorBadge color="blue" colorHex="#GGG" />)

    expect(container.firstChild).toHaveClass("bg-blue-500")
  })

  it("memakai gaya netral untuk nama di luar palet", () => {
    const { container } = render(<PlateColorBadge color="Motif Sakura" />)

    expect(container.firstChild).toHaveClass("bg-muted")
  })
})
