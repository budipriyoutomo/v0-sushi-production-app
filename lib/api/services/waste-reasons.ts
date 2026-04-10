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
}

export const wasteReasonsService = new WasteReasonsService()
