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
    startDate?: string
    endDate?: string
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

  // Update existing sales draft
  async update(
    id: string,
    data: {
      items?: Array<{
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
    }
  ): Promise<SalesDraft> {
    const response = await apiClient.put<{ data: SalesDraft }>(`${this.endpoint}/${id}`, data)
    return response.data.data
  }

  // Submit sales (change status from draft to submitted)
  async submit(id: string): Promise<SalesDraft> {
    const response = await apiClient.post<{ data: SalesDraft }>(`${this.endpoint}/${id}/submit`)
    return response.data.data
  }

  // Delete sales draft
  async delete(id: string): Promise<void> {
    await apiClient.delete(`${this.endpoint}/${id}`)
  }
}

export const salesService = new SalesService()
