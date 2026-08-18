/**
 * Helper untuk batas API.
 *
 * Backend `BaseResource::formatValue()` memutuskan tipe keluaran dari isi
 * nilai, bukan dari kolomnya: kolom varchar yang seluruhnya digit dikirim
 * sebagai number. Sisi backend sudah dikecualikan lewat `$textFields`, tapi
 * pengerasan di sini tetap dipertahankan karena dua alasan:
 *
 * - Service worker menyimpan respons GET `/api/*` selama 5 menit, jadi respons
 *   dari versi backend sebelumnya masih bisa terbaca setelah deploy.
 * - Tipe `*ApiResponse` menjanjikan `string`; memaksanya di satu tempat membuat
 *   janji itu benar, alih-alih berharap setiap pemakai ingat memeriksanya.
 */
export function text(value: string | number | null | undefined): string {
  return value === null || value === undefined ? '' : String(value)
}
