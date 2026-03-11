import { BaseService } from '../base-service'
import type { PlateColorConfig } from '@/lib/types'
import type { PlateColor } from '@/components/plate-color-badge'

export interface CreatePlateColorDTO {
  name: PlateColor
  price: number
  sortOrder?: number
}

export interface UpdatePlateColorDTO {
  name?: PlateColor
  price?: number
  sortOrder?: number
}

class PlateColorsService extends BaseService<PlateColorConfig, CreatePlateColorDTO, UpdatePlateColorDTO> {
  constructor() {
    super('/plate-colors')
  }

  // Get plate colors sorted by price (cheapest first)
  async getSortedByPrice(): Promise<PlateColorConfig[]> {
    const response = await this.getAll({ sortBy: 'price', sortOrder: 'asc' })
    return response.data
  }

  // Update price for a specific color
  async updatePrice(id: string, price: number): Promise<PlateColorConfig> {
    const response = await this.request<PlateColorConfig>('patch', `${id}/price`, { price })
    return response.data
  }
}

export const plateColorsService = new PlateColorsService()
