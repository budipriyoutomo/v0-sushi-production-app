/**
 * Key SWR untuk master data yang disaring per outlet (dan lewat outlet, per brand).
 *
 * Tiga keadaan, bukan dua:
 *
 * - `undefined` — pemanggil memang tidak menyaring (layar master admin).
 * - `null` / `""` — outlet belum dipilih. Ini BUKAN izin melihat semua brand.
 * - id outlet — disaring ke brand outlet itu.
 *
 * Dulu `""` jatuh ke cabang yang sama dengan `undefined`, jadi selama outlet
 * belum terpilih dapur melihat master semua brand — sekejap saat halaman dibuka,
 * dan selamanya kalau `users.outlet` tidak cocok satu outlet aktif pun. Key
 * `null` membuat SWR tidak fetch sama sekali: gagal-tertutup, bukan gagal-terbuka.
 *
 * Aturan ini hidup di satu tempat karena menu dan plate color harus menyaring
 * dengan cara yang sama persis — kalau menyimpang, layar menampilkan menu satu
 * brand dengan harga brand lain.
 */
export function outletScopedKey<T extends string>(
  baseKey: T,
  outletId: string | null | undefined
) {
  if (outletId === undefined) return baseKey
  if (!outletId) return null
  return [baseKey, outletId] as const
}
