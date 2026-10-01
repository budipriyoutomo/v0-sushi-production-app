/**
 * Aturan rekonsiliasi sales yang dipakai layar Sales Input.
 *
 * `selisih` disimpan server (`SalesService`), dan nilai kiriman klien diabaikan.
 * Layar ini tetap menghitungnya sendiri untuk umpan balik langsung — jadi
 * rumusnya HARUS sama persis dengan server. Dulu tanda adjustment/compensation
 * terbalik: operator mengisi -2 sampai layar menunjukkan 0, server menyimpan 4.
 */
export function computeSelisih(
  posSold: number,
  productionSold: number,
  adjustment: number,
  compensation: number,
): number {
  return posSold - (productionSold + adjustment + compensation)
}

const DETAIL_KEY_PREFIX = 'sales-input-detail-'

/** Kunci localStorage untuk rincian adjustment/compensation per menu. */
export function salesDetailKey(outletId: string, date: string, plateColorId: string): string {
  return `${DETAIL_KEY_PREFIX}${outletId}-${date}-${plateColorId}`
}

/** Rincian adjustment/compensation satu menu, seperti disimpan di localStorage. */
export interface StoredMenuDetail {
  menuId: string
  menuName: string
  totalProduced: number
  totalSold: number
  totalWasted: number
  adjustment: number
  compensation: number
}

/** Rincian tersimpan untuk satu plate color, atau `[]` kalau tidak ada/rusak. */
export function readSalesDetails(outletId: string, date: string, plateColorId: string): StoredMenuDetail[] {
  try {
    const stored = localStorage.getItem(salesDetailKey(outletId, date, plateColorId))
    const parsed = stored ? JSON.parse(stored) : null
    return Array.isArray(parsed?.menuDetails) ? parsed.menuDetails : []
  } catch {
    return []
  }
}

/**
 * Buang semua rincian tersimpan untuk satu outlet + tanggal.
 *
 * Dipanggil saat data POS ditarik ulang: entri kembali ke adjustment 0, jadi
 * rincian lama yang tertinggal akan ikut terkirim sebagai `details` yang
 * totalnya tidak cocok dengan item-nya.
 */
export function clearSalesDetails(outletId: string, date: string): void {
  const prefix = `${DETAIL_KEY_PREFIX}${outletId}-${date}-`
  const stale: string[] = []
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i)
    if (key?.startsWith(prefix)) stale.push(key)
  }
  stale.forEach((key) => localStorage.removeItem(key))
}
