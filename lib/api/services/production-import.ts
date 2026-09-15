import apiClient from '../client'

/**
 * Import produksi backdate (.xlsx / CSV).
 *
 * Tiga panggilan: `downloadTemplate()` mengambil workbook berisi menu aktif
 * outlet plus sheet panduannya, lalu `preview()` membaca dan menghitung berkas
 * isiannya, dan `commit()` menulis. Berkasnya dikirim ulang, bukan baris hasil parse klien —
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

export interface BackdateTemplateFile {
  blob: Blob
  filename: string
}

/**
 * Nama berkas cadangan kalau `Content-Disposition` tidak sampai — di balik
 * proxy yang menyaring header, unduhan tetap harus punya nama yang masuk akal.
 */
const FALLBACK_TEMPLATE_NAME = 'template-import-produksi.xlsx'

function filenameFrom(disposition: string | undefined): string {
  if (!disposition) return FALLBACK_TEMPLATE_NAME

  // `filename*=UTF-8''...` didahulukan: itu bentuk yang membawa karakter non-ASCII.
  const encoded = /filename\*=UTF-8''([^;]+)/i.exec(disposition)
  if (encoded) {
    try {
      return decodeURIComponent(encoded[1].trim())
    } catch {
      // Header rusak — pakai cadangan, bukan nama setengah ter-decode.
    }
  }

  const plain = /filename="?([^"';]+)"?/i.exec(disposition)

  return plain ? plain[1].trim() : FALLBACK_TEMPLATE_NAME
}

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

  /**
   * Template .xlsx milik outlet ini.
   *
   * Berkasnya dirakit server, bukan dirakit di sini: isinya menu aktif brand
   * outlet dan aturan yang dijalankan importer, dan keduanya tidak boleh punya
   * salinan di browser yang bisa basi tanpa ada yang tahu.
   */
  async downloadTemplate(outletId: string): Promise<BackdateTemplateFile> {
    const response = await apiClient.get<Blob>(`${this.endpoint}/template`, {
      params: { outletId },
      responseType: 'blob',
    })

    return {
      blob: response.data,
      filename: filenameFrom(response.headers['content-disposition'] as string | undefined),
    }
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
