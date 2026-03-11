import { BaseService } from '../base-service'
import type { Outlet } from '@/lib/types'

export interface CreateOutletDTO {
  name: string
  brand: string
  location: string
  code: string
  isActive?: boolean
}

export interface UpdateOutletDTO {
  name?: string
  brand?: string
  location?: string
  code?: string
  isActive?: boolean
}

class OutletsService extends BaseService<Outlet, CreateOutletDTO, UpdateOutletDTO> {
  constructor() {
    super('/outlets')
  }

  // Toggle outlet active status
  async toggleStatus(id: string): Promise<Outlet> {
    const response = await this.request<Outlet>('patch', `${id}/toggle-status`)
    return response.data
  }

  // Get active outlets only
  async getActive(): Promise<Outlet[]> {
    const response = await this.getAll({ isActive: true })
    return response.data
  }
}

export const outletsService = new OutletsService()
