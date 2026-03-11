import { BaseService } from '../base-service'
import type { SushiMenu } from '@/lib/types'
import type { PlateColor } from '@/components/plate-color-badge'

export interface CreateMenuDTO {
  name: string
  plateColor: PlateColor
  shelfLifeMinutes: number
  costEstimate: number
  image?: string
}

export interface UpdateMenuDTO {
  name?: string
  plateColor?: PlateColor
  shelfLifeMinutes?: number
  costEstimate?: number
  image?: string
}

class MenusService extends BaseService<SushiMenu, CreateMenuDTO, UpdateMenuDTO> {
  constructor() {
    super('/menus')
  }

  // Get menus by plate color
  async getByPlateColor(plateColor: PlateColor): Promise<SushiMenu[]> {
    const response = await this.getAll({ plateColor })
    return response.data
  }

  // Upload menu image
  async uploadImage(id: string, imageData: string): Promise<SushiMenu> {
    const response = await this.request<SushiMenu>('patch', `${id}/image`, { image: imageData })
    return response.data
  }
}

export const menusService = new MenusService()
