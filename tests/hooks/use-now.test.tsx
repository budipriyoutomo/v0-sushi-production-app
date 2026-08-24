import { describe, it, expect, beforeEach, afterEach, vi } from "vitest"
import { render, screen, act } from "@testing-library/react"
import { renderToString } from "react-dom/server"

import { useNow } from "@/hooks/use-now"

function Clock({ label }: { label: string }) {
  const now = useNow()
  return <span data-testid={label}>{now === null ? "idle" : String(now)}</span>
}

describe("useNow — satu detak untuk semua pemanggil", () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it("hanya membuat satu interval berapa pun jumlah pemanggilnya", () => {
    const setInterval = vi.spyOn(globalThis, "setInterval")

    render(
      <>
        <Clock label="a" />
        <Clock label="b" />
        <Clock label="c" />
      </>
    )

    // Inti perbaikannya: 100 plate di belt tidak boleh berarti 100 timer.
    expect(setInterval).toHaveBeenCalledTimes(1)
  })

  it("memberi nilai yang sama persis ke semua pemanggil di detak yang sama", () => {
    render(
      <>
        <Clock label="a" />
        <Clock label="b" />
      </>
    )

    act(() => {
      vi.advanceTimersByTime(1000)
    })

    const a = screen.getByTestId("a").textContent
    const b = screen.getByTestId("b").textContent

    expect(a).not.toBe("idle")
    expect(a).toBe(b)
  })

  it("maju tiap detik", () => {
    render(<Clock label="a" />)

    act(() => {
      vi.advanceTimersByTime(1000)
    })
    const first = screen.getByTestId("a").textContent

    act(() => {
      vi.advanceTimersByTime(1000)
    })
    const second = screen.getByTestId("a").textContent

    expect(Number(second) - Number(first)).toBe(1000)
  })

  it("mematikan interval setelah pemanggil terakhir unmount", () => {
    const clearInterval = vi.spyOn(globalThis, "clearInterval")

    const { unmount, rerender } = render(
      <>
        <Clock label="a" />
        <Clock label="b" />
      </>
    )

    // Satu pemanggil pergi, satu masih ada: timer harus tetap hidup.
    rerender(<Clock label="a" />)
    expect(clearInterval).not.toHaveBeenCalled()

    unmount()
    expect(clearInterval).toHaveBeenCalled()
  })

  it("merender netral di server supaya hidrasi tidak bentrok", () => {
    // Server tidak punya effect, jadi nilainya harus tetap null di sana. Kalau
    // hook ini mengembalikan Date.now() saat render pertama, jam server dan jam
    // klien akan berbeda dan React mengeluh saat hidrasi.
    expect(renderToString(<Clock label="a" />)).toContain("idle")
  })
})
