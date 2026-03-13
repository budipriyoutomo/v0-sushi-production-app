import { BaseService } from '../base-service'
import type { PlateColorConfig } from '@/lib/types'

export interface CreatePlateColorDTO {
  platename: string
  price: number
  description: string
  target_foodcost: number
  is_active: boolean
}

export interface UpdatePlateColorDTO {
  platename?: string
  price?: number
  description?: string
  target_foodcost?: number
  is_active?: boolean
}

// API response format (snake_case)
interface PlateColorApiResponse {
  id: string
  platename: string
  price: number
  description: string
  target_foodcost: number
  is_active: boolean
  created_at?: string
}

// Transform API response to frontend format
function transformPlateColor(data: PlateColorApiResponse): PlateColorConfig {
  return {
    id: data.id,
    platename: data.platename,
    price: data.price,
    description: data.description,
    targetFoodCost: data.target_foodcost,
    isActive: data.is_active,
  }
}

class PlateColorsService extends BaseService<PlateColorConfig, CreatePlateColorDTO, UpdatePlateColorDTO> {
  constructor() {
    super('/master/platecolor')
  }

  // Override getAll to transform response
  async getAll(params?: Record<string, unknown>): Promise<{ data: PlateColorConfig[] }> {
    const response = await super.getAll(params)
    const transformedData = (response.data as unknown as PlateColorApiResponse[]).map(transformPlateColor)
    return { ...response, data: transformedData }
  }

  // Override getById to transform response
  async getById(id: string | number): Promise<{ data: PlateColorConfig }> {
    const response = await super.getById(id)
    const transformedData = transformPlateColor(response.data as unknown as PlateColorApiResponse)
    return { ...response, data: transformedData }
  }

  // Override create to transform response
  async create(data: CreatePlateColorDTO): Promise<{ data: PlateColorConfig }> {
    const response = await super.create(data)
    const transformedData = transformPlateColor(response.data as unknown as PlateColorApiResponse)
    return { ...response, data: transformedData }
  }

  // Override update to transform response
  async update(id: string | number, data: UpdatePlateColorDTO): Promise<{ data: PlateColorConfig }> {
    const response = await super.update(id, data)
    const transformedData = transformPlateColor(response.data as unknown as PlateColorApiResponse)
    return { ...response, data: transformedData }
  }

  // Get plate colors sorted by price (cheapest first)
  async getSortedByPrice(): Promise<PlateColorConfig[]> {
    const response = await this.getAll({ sortBy: 'price', sortOrder: 'asc' })
    return response.data
  }

  // Update price for a specific color
  async updatePrice(id: string, price: number): Promise<PlateColorConfig> {
    const response = await this.request<PlateColorApiResponse>('patch', `${id}/price`, { price })
    return transformPlateColor(response.data)
  }
}

export const plateColorsService = new PlateColorsService()
