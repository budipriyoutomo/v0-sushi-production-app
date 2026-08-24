"use client"

import { useEffect, useState } from "react"

/**
 * Satu detak untuk seluruh aplikasi.
 *
 * Layar conveyor merender satu countdown per plate, dan tiap countdown dulu
 * memegang `setInterval` sendiri. Pada belt yang ramai itu berarti 100+ timer
 * yang masing-masing memicu update React terpisah tiap detik — 100 siklus
 * render/commit per detik di tablet dapur.
 *
 * Di sini intervalnya cuma satu. Semua listener dipanggil dalam satu callback
 * timer yang sama, jadi automatic batching React 18 menggabungkan semua
 * `setState`-nya menjadi **satu** render pass per detik.
 *
 * Interval hidup selama masih ada pelanggan dan mati sendiri saat pelanggan
 * terakhir unmount — tidak ada timer yang tertinggal saat pindah halaman.
 */

const TICK_MS = 1000

type Listener = (now: number) => void

const listeners = new Set<Listener>()
let timer: ReturnType<typeof setInterval> | null = null

function tick(): void {
  const now = Date.now()
  listeners.forEach((listener) => listener(now))
}

function subscribe(listener: Listener): () => void {
  listeners.add(listener)

  if (timer === null) {
    timer = setInterval(tick, TICK_MS)
  }

  return () => {
    listeners.delete(listener)

    if (listeners.size === 0 && timer !== null) {
      clearInterval(timer)
      timer = null
    }
  }
}

/**
 * Waktu sekarang dalam milidetik, disegarkan tiap detik.
 *
 * Bernilai `null` sampai komponen ter-mount. Itu disengaja: render server dan
 * render pertama klien tidak boleh memuat jam yang berbeda, kalau tidak
 * hidrasi akan bentrok. Pemanggil menampilkan keadaan netral selama `null`.
 */
export function useNow(): number | null {
  const [now, setNow] = useState<number | null>(null)

  useEffect(() => {
    setNow(Date.now())
    return subscribe(setNow)
  }, [])

  return now
}
