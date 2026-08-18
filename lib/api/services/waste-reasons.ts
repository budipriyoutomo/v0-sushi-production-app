import { BaseService } from '../base-service'

export interface WasteReason {
  id: string
  reason_name: string
  description: string
  is_active: boolean
  created_at?: string
}

export interface CreateWasteReasonDTO {
  reason_name: string
  description: string
  is_active: boolean
}

export interface UpdateWasteReasonDTO {
  reason_name?: string
  description?: string
  is_active?: boolean
}

class WasteReasonsService extends BaseService<WasteReason, CreateWasteReasonDTO, UpdateWasteReasonDTO> {
  constructor() {
    super('/master/waste-reason')
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
