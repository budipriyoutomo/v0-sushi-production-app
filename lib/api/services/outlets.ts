import { BaseService } from '../base-service'
import type { Outlet } from '@/lib/types'

export interface CreateOutletDTO {
  code: string
  name: string
  brand: string
  address: string
  is_active: boolean
}

export interface UpdateOutletDTO {
  code?: string
  name?: string
  brand?: string
  address?: string
  is_active?: boolean
}

// API response format (snake_case)
interface OutletApiResponse {
  id: string
  code: string
  name: string
  brand: string
  address: string
  is_active: boolean
  created_at: string
}

// Transform API response to frontend format
function transformOutlet(data: OutletApiResponse): Outlet {
  return {
    id: data.id,
    code: data.code,
    name: data.name,
    brand: data.brand,
    address: data.address,
    isActive: data.is_active,
    createdAt: new Date(data.created_at),
  }
}

class OutletsService extends BaseService<Outlet, CreateOutletDTO, UpdateOutletDTO> {
  constructor() {
    super('/master/outlet')
  }

  // Override getAll to transform response
  async getAll(params?: Record<string, unknown>): Promise<{ data: Outlet[] }> {
    const response = await super.getAll(params)
    const transformedData = (response.data as unknown as OutletApiResponse[]).map(transformOutlet)
    return { ...response, data: transformedData }
  }

  // Override getById to transform response
  async getById(id: string | number): Promise<{ data: Outlet }> {
    const response = await super.getById(id)
    const transformedData = transformOutlet(response.data as unknown as OutletApiResponse)
    return { ...response, data: transformedData }
  }

  // Override create to transform response
  async create(data: CreateOutletDTO): Promise<{ data: Outlet }> {
    const response = await super.create(data)
    const transformedData = transformOutlet(response.data as unknown as OutletApiResponse)
    return { ...response, data: transformedData }
  }

  // Override update to transform response
  async update(id: string | number, data: UpdateOutletDTO): Promise<{ data: Outlet }> {
    const response = await super.update(id, data)
    const transformedData = transformOutlet(response.data as unknown as OutletApiResponse)
    return { ...response, data: transformedData }
  }

  // Toggle outlet active status
  async toggleStatus(id: string): Promise<Outlet> {
    const response = await this.request<OutletApiResponse>('patch', `${id}/toggle-status`)
    return transformOutlet(response.data)
  }

  // Get active outlets only
  async getActive(): Promise<Outlet[]> {
    const response = await this.getAll({ is_active: true })
    return response.data
  }
}

export const outletsService = new OutletsService()
