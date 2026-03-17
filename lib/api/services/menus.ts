import { BaseService } from '../base-service'
import type { SushiMenu } from '@/lib/types'

export interface CreateMenuDTO {
  menuname: string
  description: string
  image: File
  price: number
  shelf_life: number
  plate_color_id: string
  is_active: boolean
}

export interface UpdateMenuDTO {
  menuname?: string
  description?: string
  image?: File
  price?: number
  shelf_life?: number
  plate_color_id?: string
  is_active?: boolean
}

// API response format (snake_case)
interface MenuApiResponse {
  id: string
  menuname: string
  description: string
  image: string
  price: number
  shelf_life: number
  plate_color_id: string
  plate_color?: {
    id: string
    platename: string
  }
  is_active: boolean
  created_at?: string
}

// Transform API response to frontend format
function transformMenu(data: MenuApiResponse): SushiMenu {
  return {
    id: data.id,
    menuname: data.menuname,
    description: data.description,
    image: data.image,
    price: data.price,
    shelfLife: data.shelf_life,
    plateColorId: data.plate_color_id,
    plateColorName: data.plate_color?.platename || '',
    isActive: data.is_active,
  }
}

class MenusService extends BaseService<SushiMenu, CreateMenuDTO, UpdateMenuDTO> {
  constructor() {
    super('/master/menu')
  }

  // Override getAll to transform response
  async getAll(params?: Record<string, unknown>): Promise<{ data: SushiMenu[] }> {
    const response = await super.getAll(params)
    const transformedData = (response.data as unknown as MenuApiResponse[]).map(transformMenu)
    return { ...response, data: transformedData }
  }

  // Override getById to transform response
  async getById(id: string | number): Promise<{ data: SushiMenu }> {
    const response = await super.getById(id)
    const transformedData = transformMenu(response.data as unknown as MenuApiResponse)
    return { ...response, data: transformedData }
  }

  // Override create to transform response
  async create(data: CreateMenuDTO): Promise<{ data: SushiMenu }> {

    const formData = new FormData()

    formData.append('menuname', data.menuname)
    formData.append('description', data.description)
    formData.append('price', String(data.price))
    formData.append('shelf_life', String(data.shelf_life))
    formData.append('plate_color_id', data.plate_color_id)
    formData.append('is_active', String(data.is_active ? 1 : 0))

    if (data.image) {
      formData.append('image', data.image)  
    }

    const response = await this.request('post', '', formData)

    const transformedData = transformMenu(response.data as unknown as MenuApiResponse)

    return { ...response, data: transformedData }
  }

  // Override update to transform response
  async update(id: string | number, data: UpdateMenuDTO): Promise<{ data: SushiMenu }> {

    const formData = new FormData()

    if (data.menuname) formData.append('menuname', data.menuname)
    if (data.description) formData.append('description', data.description)
    if (data.price) formData.append('price', String(data.price))
    if (data.shelf_life) formData.append('shelf_life', String(data.shelf_life))
    if (data.plate_color_id) formData.append('plate_color_id', data.plate_color_id)
    if (data.is_active !== undefined) formData.append('is_active', String(data.is_active ? 1 : 0))

    if (data.image) {
      formData.append('image', data.image)
    }

    const response = await this.request('post', `${id}`, formData)

    const transformedData = transformMenu(response.data as unknown as MenuApiResponse)

    return { ...response, data: transformedData }
  }

  // Get menus by plate color
  async getByPlateColorId(plateColorId: string): Promise<SushiMenu[]> {
    const response = await this.getAll({ plate_color_id: plateColorId })
    return response.data
  }

  // Upload menu image - returns the image path
  async uploadImage(id: string, imageFile: File): Promise<string> {
    const formData = new FormData()
    formData.append('image', imageFile)
    const response = await this.request<{ image: string }>('patch', `${id}/image`, formData)
    return response.data.image
  }
}

export const menusService = new MenusService()
