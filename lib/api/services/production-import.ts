import apiClient from '../client'

/**
 * Import produksi backdate (CSV).
 *
 * Dua panggilan ke berkas yang sama: `preview()` hanya membaca dan menghitung,
 * `commit()` menulis. Berkasnya dikirim ulang, bukan baris hasil parse klien —
 * validasi brand, tabrakan tanggal, dan resolusi kode menu semuanya aturan
 * bisnis, dan aturan bisnis tidak boleh punya versi di browser.
 *
 * Payload berbentuk `FormData`, jadi ia **tidak** masuk antrean offline
 * (`services/offline-queue.ts` melewatkan FormData). Itu memang yang diinginkan:
 * impor 500 piring yang diputar ulang diam-diam saat wifi kembali adalah hari
 * kerja yang harus dibereskan tangan.
 */

export type BackdateFinalStatus = 'sold' | 'waste'

export interface BackdateImportRow {
  line: number
  date: string | null
  menuCode: string
  menuName: string | null
  plateColorName: string | null
  quantity: number
  finalStatus: BackdateFinalStatus | null
  notes: string | null
  producedAt: string | null
  existingPlates: number
  errors: string[]
}

export interface BackdateImportSummary {
  totalRows: number
  validRows: number
  errorRows: number
  totalPlates: number
  soldPlates: number
  wastePlates: number
  dates: string[]
  duplicatePlates: number
}

export interface BackdateImportPreview {
  summary: BackdateImportSummary
  rows: BackdateImportRow[]
}

export interface BackdateImportResult {
  imported: number
  wasteRecords: number
  summary: BackdateImportSummary
}

/**
 * Header pakai nama kanonik. Backend juga menerima judul berbahasa Indonesia
 * (`tanggal`, `kode_menu`, `jumlah`, `status`), tapi contoh yang diunduh
 * operator sebaiknya satu bentuk saja.
 */
export const BACKDATE_TEMPLATE_CSV = [
  'date,menu_code,quantity,final_status,time,notes',
  '2026-01-15,SUS-001,12,sold,09:30,',
  '2026-01-15,SUS-002,3,waste,,rusak saat plating',
  '2026-01-16,SUS-001,8,sold,,',
].join('\n')

class ProductionImportService {
  private endpoint = '/production/import-backdate'

  private body(file: File, outletId: string, allowDuplicate?: boolean): FormData {
    const formData = new FormData()

    formData.append('file', file)
    formData.append('outletId', outletId)

    if (allowDuplicate !== undefined) {
      formData.append('allowDuplicate', allowDuplicate ? '1' : '0')
    }

    return formData
  }

  async preview(file: File, outletId: string): Promise<BackdateImportPreview> {
    const response = await apiClient.post<{ data: BackdateImportPreview }>(
      `${this.endpoint}/preview`,
      this.body(file, outletId)
    )

    return response.data.data
  }

  async commit(
    file: File,
    outletId: string,
    allowDuplicate = false
  ): Promise<BackdateImportResult> {
    const response = await apiClient.post<{ data: BackdateImportResult }>(
      this.endpoint,
      this.body(file, outletId, allowDuplicate)
    )

    return response.data.data
  }
}

export const productionImportService = new ProductionImportService()
