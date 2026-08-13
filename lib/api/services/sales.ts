import apiClient from '../client'

export interface SalesDraft {
  id: string
  date: string
  outlet_name: string
  items: SalesDraftItem[]
  created_at: string
  updated_at: string
  deleted_at: string | null
  created_by: string
  updated_by: string
  deleted_by: string | null
}

export interface SalesDraftItem {
  platecolor: string
  price: number
  pos: number
  sold: number
  production: number
  waste: number
  adjustment: number
  compensation: number
  selisih: number
}

class SalesService {
  private endpoint = '/sales'

  // Get all sales (with optional filters)
  async getAll(params?: {
    outletId?: string
    status?: 'draft' | 'submitted'
    date?: string 
  }): Promise<SalesDraft[]> {
    const response = await apiClient.get<{ data: SalesDraft[] }>(this.endpoint, { params })
    return response.data.data
  }

  // Get single sales by ID
  async getById(id: string): Promise<SalesDraft> {
    const response = await apiClient.get<{ data: SalesDraft }>(`${this.endpoint}/${id}`)
    return response.data.data
  }

  // Create new sales (draft or submitted)
  async create(data: {
    outlet_id: string
    date: string
    status: 'draft' | 'submitted'
    items: Array<{
      plate_color_id: string
      pos_sold: number
      production_sold: number
      production_waste?: number
      adjustment?: number
      compensation?: number
      details?: Array<{
        menu_id: string
        menu_name: string
        total_produced: number
        total_sold: number
        total_wasted: number
        adjustment?: number
        compensation?: number
      }>
    }>
  }): Promise<SalesDraft> {
    const response = await apiClient.post<{ data: SalesDraft }>(this.endpoint, data)
    return response.data.data
  }

  // NOTE: there is deliberately no update/submit/delete here.
  // The backend exposes no such routes — create() upserts on (outlet_id, date)
  // and carries the draft/submitted status in its payload. The methods that
  // used to live here called PUT /sales/{id}, POST /sales/{id}/submit and
  // DELETE /sales/{id}, none of which exist; every one would have 404'd.
}

export const salesService = new SalesService()
