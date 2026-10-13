import apiClient from '../client'

export interface SalesDraft {
  id: string
  date: string
  outlet_name: string
  items: SalesDraftItem[]
  created_at: string
  updated_at: string
  deleted_at: string | null
  created_by: string
  updated_by: string
  deleted_by: string | null
}

export interface SalesDraftItem {
  // Id master plate color — yang dikirim balik sebagai `plate_color_id`.
  plate_color_id: string
  // Nama warna, hanya untuk tampilan. Bukan id.
  platecolor: string
  price: number
  pos: number
  sold: number
  production: number
  waste: number
  adjustment: number
  compensation: number
  selisih: number
  // Rincian per menu. Harus dikirim balik saat draft disimpan lagi — server
  // membuat ulang item beserta rinciannya dari payload.
  details?: SalesDraftItemDetail[]
}

export interface SalesDraftItemDetail {
  menu_id: string
  menu_name: string
  total_produced: number
  total_sold: number
  total_wasted: number
  adjustment: number
  compensation: number
}

export interface CancelledSalesDraft {
  id: string
  outletId: string
  date: string
  deletionReason: string
  deletedAt: string | null
}

class SalesService {
  private endpoint = '/sales'

  // Get all sales (with optional filters)
  async getAll(params?: {
    outletId?: string
    status?: 'draft' | 'submitted'
    date?: string 
  }): Promise<SalesDraft[]> {
    const response = await apiClient.get<{ data: SalesDraft[] }>(this.endpoint, { params })
    return response.data.data
  }

  // Get single sales by ID
  async getById(id: string): Promise<SalesDraft> {
    const response = await apiClient.get<{ data: SalesDraft }>(`${this.endpoint}/${id}`)
    return response.data.data
  }

  // Create new sales (draft or submitted)
  async create(data: {
    outlet_id: string
    date: string
    status: 'draft' | 'submitted'
    items: Array<{
      plate_color_id: string
      pos_sold: number
      production_sold: number
      production_waste?: number
      adjustment?: number
      compensation?: number
      details?: Array<{
        menu_id: string
        menu_name: string
        total_produced: number
        total_sold: number
        total_wasted: number
        adjustment?: number
        compensation?: number
      }>
    }>
  }): Promise<SalesDraft> {
    const response = await apiClient.post<{ data: SalesDraft }>(this.endpoint, data)
    return response.data.data
  }

  /**
   * Membatalkan draft Sales Input (soft delete). Hanya admin, hanya draft —
   * dipakai layar Koreksi Status Produksi, yang terkunci selama Sales Input
   * tanggal itu ada. Alasan wajib dan tersimpan di `sales_headers.deletion_reason`.
   *
   * Tidak masuk antrean offline: menghapus pekerjaan operator diam-diam saat
   * jaringan kembali adalah hal terakhir yang diinginkan.
   */
  async cancelDraft(id: string, reason: string): Promise<CancelledSalesDraft> {
    const response = await apiClient.delete<{ data: CancelledSalesDraft }>(`${this.endpoint}/${id}`, {
      data: { reason },
      skipOfflineQueue: true,
    })
    return response.data.data
  }

  // NOTE: there is deliberately no update/submit here. create() upserts on
  // (outlet_id, date) and carries the draft/submitted status in its payload.
  // The only delete is cancelDraft() above — admin-only, draft-only.
}

export const salesService = new SalesService()
