import apiClient from '../client'

export interface SalesDraft {
  id: string
  outletId: string
  outletName: string
  date: string
  status: 'draft' | 'submitted'
  totalPosSold: number
  totalProductionSold: number
  totalWaste: number
  totalAdjustment: number
  totalCompensation: number
  totalSelisih: number
  createdAt: string
  updatedAt: string
  createdBy?: string
  details?: SalesDraftDetail[]
}

export interface SalesDraftDetail {
  id: string
  salesId: string
  plateColorId: string
  plateColorName: string
  posSold: number
  productionSold: number
  productionWaste: number
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

  // Create new sales draft
  async create(data: {
    outletId: string
    date: string
    details: Array<{
      plateColorId: string
      posSold: number
      productionSold: number
      productionWaste: number
      adjustment: number
      compensation: number
    }>
  }): Promise<SalesDraft> {
    const response = await apiClient.post<{ data: SalesDraft }>(this.endpoint, data)
    return response.data.data
  }

  // Update existing sales draft
  async update(
    id: string,
    data: {
      details?: Array<{
        plateColorId: string
        posSold: number
        productionSold: number
        productionWaste: number
        adjustment: number
        compensation: number
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
