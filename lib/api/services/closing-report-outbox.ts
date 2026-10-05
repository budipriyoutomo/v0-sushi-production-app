import apiClient from '../client'
import type { ClosingReportPublishStatus } from './closing-report'

/**
 * Layar admin "Kirim Ulang BI": pesan closing report ke BI (RabbitMQ) dan
 * tombol kirim ulangnya. Hanya admin — server menjaganya dengan `role:admin`
 * + `module:admin`.
 */

export type ClosingReportOutboxStatusFilter = 'unpublished' | 'published' | 'all'

export interface ClosingReportOutboxRow {
  id: string
  closingReportId: string
  date: string | null
  outletId: string | null
  outletCode: string | null
  outletName: string | null
  status: ClosingReportPublishStatus
  attempts: number
  maxAttempts: number
  /** Berhenti dicoba otomatis — hanya kirim ulang manual yang tersisa. */
  exhausted: boolean
  lastError: string | null
  nextAttemptAt: string | null
  publishedAt: string | null
  createdAt: string | null
}

export interface ClosingReportOutboxParams {
  outletId: string
  status?: ClosingReportOutboxStatusFilter
  startDate?: string
  endDate?: string
}

export interface ClosingReportOutboxList {
  rows: ClosingReportOutboxRow[]
  total: number
}

/** Batas server per halaman. Cukup untuk antrean satu outlet; lebih dari itu berarti ada masalah lain. */
const PER_PAGE = 100

class ClosingReportOutboxService {
  private endpoint = '/closing-reports/outbox'

  async list(params: ClosingReportOutboxParams): Promise<ClosingReportOutboxList> {
    const response = await apiClient.get<{ data: ClosingReportOutboxRow[]; meta?: { total: number } }>(
      this.endpoint,
      { params: { ...params, per_page: PER_PAGE } }
    )

    const rows = response.data.data

    return { rows, total: response.data.meta?.total ?? rows.length }
  }

  /**
   * Kirim sekarang, mengabaikan jadwal retry dan batas percobaan.
   *
   * Tidak masuk antrean offline: admin menekan tombol untuk melihat hasilnya
   * saat itu juga. Request yang diantre lalu diputar diam-diam saat jaringan
   * kembali mengirim laporan tanpa ada yang melihat hasilnya.
   *
   * Broker yang menolak bukan error HTTP — barisnya kembali dengan
   * `status: 'failed'` dan `lastError`. Yang dilempar hanya penolakan server
   * (mis. 409 untuk laporan yang sudah terkirim).
   */
  async resend(id: string): Promise<ClosingReportOutboxRow> {
    const response = await apiClient.post<{ data: ClosingReportOutboxRow }>(
      `${this.endpoint}/${id}/resend`,
      undefined,
      { skipOfflineQueue: true }
    )

    return response.data.data
  }
}

export const closingReportOutboxService = new ClosingReportOutboxService()
