import { BaseService } from '../base-service'
import { text } from '../transform'
import type { Brand } from '@/lib/types'

export interface CreateBrandDTO {
  code: string
  name: string
  description?: string
  is_active: boolean
}

export interface UpdateBrandDTO {
  code?: string
  name?: string
  description?: string
  is_active?: boolean
}

// API response format (snake_case)
/** `string | number` dengan alasan yang sama seperti outlet — lihat `$textFields`. */
interface BrandApiResponse {
  id: string
  code: string | number
  name: string | number
  description: string | number | null
  logo_url?: string | null
  is_active: boolean
  created_at?: string
}

function transformBrand(data: BrandApiResponse): Brand {
  return {
    id: data.id,
    code: text(data.code),
    name: text(data.name),
    description: text(data.description),
    logo: data.logo_url || undefined,
    isActive: data.is_active,
  }
}

class BrandsService extends BaseService<Brand, CreateBrandDTO, UpdateBrandDTO> {
  constructor() {
    super('/master/brand')
  }

  async getAll(params?: Record<string, unknown>): Promise<{ data: Brand[] }> {
    const response = await super.getAll(params)
    const transformedData = (response.data as unknown as BrandApiResponse[]).map(transformBrand)
    return { ...response, data: transformedData }
  }

  async getById(id: string | number): Promise<{ data: Brand }> {
    const response = await super.getById(id)
    return { ...response, data: transformBrand(response.data as unknown as BrandApiResponse) }
  }

  async create(data: CreateBrandDTO): Promise<{ data: Brand }> {
    const response = await super.create(data)
    return { ...response, data: transformBrand(response.data as unknown as BrandApiResponse) }
  }

  async update(id: string | number, data: UpdateBrandDTO): Promise<{ data: Brand }> {
    const response = await super.update(id, data)
    return { ...response, data: transformBrand(response.data as unknown as BrandApiResponse) }
  }
}

export const brandsService = new BrandsService()
