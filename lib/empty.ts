/**
 * Array kosong dengan identitas tetap, untuk nilai cadangan hook selama data
 * SWR belum ada (loading, error, atau key `null`).
 *
 * `data || []` membuat array BARU di setiap render. Nilai seperti itu yang
 * masuk ke dependency `useMemo`/`useEffect` membuat efeknya jalan di setiap
 * render — dan kalau efeknya memanggil setState, hasilnya "Maximum update depth
 * exceeded". Ini yang terjadi di `ProductionPlanning` saat plate color sudah
 * termuat tetapi slot belum.
 *
 * Dibekukan supaya tidak ada pemanggil yang diam-diam mengisinya: satu array
 * ini dipakai bersama oleh semua hook.
 */
const EMPTY: readonly never[] = Object.freeze([])

export function emptyArray<T>(): T[] {
  return EMPTY as unknown as T[]
}
