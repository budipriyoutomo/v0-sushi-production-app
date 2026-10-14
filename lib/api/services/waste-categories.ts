import { BaseService } from '../base-service'

/**
 * Kategori waste: pengelompokan di atas waste reason. `code` adalah kunci di
 * BI — backend menolak mengubahnya setelah kategori dipakai, dan menormalkannya
 * ke huruf besar.
 */
export interface WasteCategory {
  id: string
  code: string
  category_name: string
  description: string | null
  sort_order: number
  is_active: boolean
  /** Jumlah reason yang menunjuk kategori ini. */
  reasons_count?: number
  created_at?: string
}

export interface CreateWasteCategoryDTO {
  code: string
  category_name: string
  description?: string | null
  sort_order?: number
  is_active: boolean
}

export type UpdateWasteCategoryDTO = CreateWasteCategoryDTO

class WasteCategoriesService extends BaseService<WasteCategory, CreateWasteCategoryDTO, UpdateWasteCategoryDTO> {
  constructor() {
    super('/master/waste-category')
  }

  async list(): Promise<WasteCategory[]> {
    const response = await this.getAll({ per_page: 'all' })
    return response.data
  }
}

export const wasteCategoriesService = new WasteCategoriesService()
