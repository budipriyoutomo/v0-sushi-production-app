import { BaseService } from '../base-service'

export interface WasteReason {
  id: string
  reason_name: string
  description: string
  is_active: boolean
  /** `null` = belum dikategorikan (reason lama sebelum backfill). */
  waste_category_id?: string | null
  waste_category_code?: string | null
  waste_category_name?: string | null
  /**
   * Reason yang ditulis kode (Auto-waste, Import backdate). Tidak bisa dihapus
   * atau di-rename, dan hanya dikirim backend kalau diminta `with_system`.
   */
  is_system?: boolean
  created_at?: string
}

export interface CreateWasteReasonDTO {
  reason_name: string
  description: string
  /** Wajib untuk reason baru. */
  waste_category_id: string
  is_active: boolean
}

export interface UpdateWasteReasonDTO {
  reason_name?: string
  description?: string
  waste_category_id?: string | null
  is_active?: boolean
}

class WasteReasonsService extends BaseService<WasteReason, CreateWasteReasonDTO, UpdateWasteReasonDTO> {
  constructor() {
    super('/master/waste-reason')
  }

  /**
   * Semua reason termasuk reason sistem — untuk layar admin. Dropdown dapur
   * tetap memakai `getAll()`/`getActive()`, yang tanpa reason sistem.
   */
  async getAllWithSystem(): Promise<WasteReason[]> {
    const response = await this.getAll({ with_system: 1, per_page: 'all' })
    return response.data
  }

  // Get only active waste reasons
  async getActive(): Promise<WasteReason[]> {
    const response = await this.getAll({ is_active: true })
    return response.data
  }

    // Get waste reason by ID
    async getById(id: string | number): Promise<{ data: WasteReason }> {
      const response = await super.getById(id)
      return {
        ...response,
        data: response.data as WasteReason,
      }
    }

    // Create waste reason
    async create(
      data: CreateWasteReasonDTO
    ): Promise<{ data: WasteReason }> {
      const response = await super.create(data)
      return {
        ...response,
        data: response.data as WasteReason,
      }
    }

    // Update waste reason
    async update(
      id: string | number,
      data: UpdateWasteReasonDTO
    ): Promise<{ data: WasteReason }> {
      const response = await super.update(id, data)
      return {
        ...response,
        data: response.data as WasteReason,
      }
    }

  // CATATAN: `toggleStatus()` dibuang. Ia memanggil
  // `PATCH /master/waste-reason/{id}/toggle-status` — route yang tidak pernah
  // ada, dan nol pemakai. Status diubah lewat `update(id, { is_active })`.
}

export const wasteReasonsService = new WasteReasonsService()
