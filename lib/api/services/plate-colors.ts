import { BaseService } from '../base-service'
import { text } from '../transform'
import type { PlateColorConfig } from '@/lib/types'

export interface CreatePlateColorDTO {
  platename: string
  price: number
  description: string
  target_foodcost: number
  brand_id?: string
  is_active: boolean
}

export interface UpdatePlateColorDTO {
  platename?: string
  price?: number
  description?: string
  target_foodcost?: number
  brand_id?: string
  is_active?: boolean
}

/**
 * API response format (snake_case).
 *
 * `platename` dan `description` bisa datang sebagai number: `BaseResource`
 * menebak tipe dari isi nilai, jadi varchar yang seluruhnya digit ikut
 * dikonversi. Lihat `$textFields` di backend.
 */
interface PlateColorApiResponse {
  id: string
  platename: string | number
  price: number
  description: string | number
  target_foodcost: number
  brand_id: string | null
  brand?: { id: string; name: string } | null
  is_active: boolean
  created_at?: string
}

// Transform API response to frontend format
function transformPlateColor(data: PlateColorApiResponse): PlateColorConfig {
  return {
    id: data.id,
    platename: text(data.platename),
    price: data.price,
    description: text(data.description),
    targetFoodCost: data.target_foodcost,
    brandId: data.brand_id ?? null,
    brandName: data.brand?.name,
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

  /**
   * Warna piring milik brand outlet ini (plus yang belum punya brand).
   * `outlet_id` yang dikirim, bukan `brand_id` — pemetaan outlet → brand adalah
   * aturan bisnis dan hidup di backend.
   *
   * `per_page: 'all'` sama alasannya dengan `menusService.getForOutlet()`:
   * default backend adalah 15 baris. Satu brand jarang punya lebih dari 15
   * warna, jadi kelalaian ini belum pernah menggigit — tapi kalau nanti
   * menggigit, gejalanya adalah harga yang hilang dari layar, bukan error.
   */
  async getForOutlet(outletId: string, params?: Record<string, unknown>): Promise<PlateColorConfig[]> {
    const response = await this.getAll({ per_page: 'all', ...params, outlet_id: outletId })
    return response.data
  }

  // CATATAN: `updatePrice()` dibuang. Ia memanggil
  // `PATCH /master/platecolor/{id}/price` — route yang tidak pernah ada, dan
  // nol pemakai di layar mana pun. Harga diubah lewat `update(id, { price })`.
}

export const plateColorsService = new PlateColorsService()
