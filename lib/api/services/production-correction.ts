import apiClient from '../client'

/**
 * Koreksi Status Produksi: mengubah piring yang sudah final dari sold ke waste
 * atau sebaliknya. Hanya admin — server menjaganya dengan `role:admin` +
 * `module:admin`. Aturannya (batas hari, kunci closing, jumlah tersedia) hidup
 * di server; layar hanya menampilkan apa yang server putuskan.
 */

export type CorrectionStatus = 'sold' | 'waste'

/**
 * Tanggal terkunci begitu Sales Input-nya ada — draft sekalipun — atau di luar
 * batas hari. Koreksi hanya untuk angka yang belum direkonsiliasi.
 */
export interface CorrectionLock {
  locked: boolean
  reason: string | null
  /** Sales Input yang mengunci tanggal ini — untuk menawarkan pembatalan draft. */
  salesId: string | null
  salesStatus: 'draft' | 'submitted' | null
  warnings: string[]
}

export interface CorrectionMenuRow {
  menuId: string
  menuCode: string | null
  menuName: string
  plateColorId: string | null
  plateColorName: string | null
  plateColorHex: string | null
  sold: number
  waste: number
}

export interface CorrectionSummary {
  date: string
  lock: CorrectionLock
  /** Piring tanggal itu yang belum final — tidak bisa dikoreksi, hanya diinformasikan. */
  unresolved: number
  menus: CorrectionMenuRow[]
  /** Draft Sales Input tanggal ini yang pernah dibatalkan admin, terbaru dulu. */
  cancelledSalesDrafts: CancelledSalesDraftLog[]
}

export interface CancelledSalesDraftLog {
  id: string
  reason: string
  cancelledBy: string | null
  cancelledByName: string | null
  cancelledAt: string | null
}

export interface CorrectionLine {
  menuId: string
  from: CorrectionStatus
  to: CorrectionStatus
  quantity: number
}

export interface CorrectionPayload {
  outletId: string
  date: string
  reason: string
  wasteReasonId?: string | null
  items: CorrectionLine[]
}

interface BeforeAfter {
  soldBefore: number
  wasteBefore: number
  soldAfter: number
  wasteAfter: number
}

export interface CorrectionPreview {
  date: string
  lock: CorrectionLock
  menus: (BeforeAfter & {
    menuId: string
    menuCode: string | null
    menuName: string
    plateColorId: string | null
    plateColorName: string | null
  })[]
  plateColors: (BeforeAfter & { plateColorId: string; plateColorName: string | null })[]
  totals: { toWaste: number; toSold: number }
}

export interface CorrectionRecord {
  id: string
  outletId: string
  outletCode: string | null
  outletName: string | null
  productionDate: string
  reason: string
  wasteReasonId: string | null
  wasteReasonName: string | null
  totalToWaste: number
  totalToSold: number
  lines: {
    menuId: string
    menuCode: string | null
    menuName: string | null
    from: CorrectionStatus
    to: CorrectionStatus
    quantity: number
  }[]
  createdBy: string | null
  createdByName: string | null
  createdAt: string | null
}

export interface CorrectionHistoryParams {
  outletId: string
  startDate?: string
  endDate?: string
}

export interface CorrectionHistory {
  rows: CorrectionRecord[]
  total: number
}

/** Batas server per halaman. */
const PER_PAGE = 100

class ProductionCorrectionService {
  private endpoint = '/production/corrections'

  async summary(outletId: string, date: string): Promise<CorrectionSummary> {
    const response = await apiClient.get<{ data: CorrectionSummary }>(`${this.endpoint}/summary`, {
      params: { outletId, date },
    })

    return response.data.data
  }

  /**
   * Tidak menulis apa pun, tapi tetap tidak diantre offline: hasilnya hanya
   * berarti kalau dilihat saat itu juga.
   */
  async preview(payload: CorrectionPayload): Promise<CorrectionPreview> {
    const response = await apiClient.post<{ data: CorrectionPreview }>(
      `${this.endpoint}/preview`,
      payload,
      { skipOfflineQueue: true }
    )

    return response.data.data
  }

  /**
   * Tidak masuk antrean offline: koreksi yang diputar ulang diam-diam saat
   * jaringan kembali bisa mendarat setelah Sales Input disimpan — admin harus
   * melihat hasil atau penolakannya saat itu juga.
   */
  async apply(payload: CorrectionPayload): Promise<CorrectionRecord> {
    const response = await apiClient.post<{ data: CorrectionRecord }>(this.endpoint, payload, {
      skipOfflineQueue: true,
    })

    return response.data.data
  }

  async history(params: CorrectionHistoryParams): Promise<CorrectionHistory> {
    const response = await apiClient.get<{ data: CorrectionRecord[]; meta?: { total: number } }>(
      this.endpoint,
      { params: { ...params, per_page: PER_PAGE } }
    )

    const rows = response.data.data

    return { rows, total: response.data.meta?.total ?? rows.length }
  }
}

export const productionCorrectionService = new ProductionCorrectionService()
