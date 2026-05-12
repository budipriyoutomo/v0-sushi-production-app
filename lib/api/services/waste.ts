import apiClient from '../client'

export interface WasteEntry {
  id: string
  outletId: string
  time: string
  menuId: string
  menuName: string
  plateColorId: string
  plateColorName: string
  quantity: number
  reason: string
  createdAt: string
}

export interface WasteSummary {
  totalWaste: number
  totalProduction: number
  wastePercentage: number
  byPlateColor: {
    plateColorId: string
    plateColorName: string
    wasteCount: number
    productionCount: number
  }[]
}

export interface WasteListParams {
  outletId: string
  date: string
  plateColorId?: string
}

export interface WasteSummaryParams {
  outletId: string
  date: string
}

class WasteService {
  private endpoint = '/waste'

  // Get waste entries for a specific outlet and date
  async getAll(params: WasteListParams): Promise<WasteEntry[]> {
    const response = await apiClient.get<{ data: WasteEntry[] }>(this.endpoint, {
      params,
    })
    return response.data.data
  }

  // Get waste summary (total waste, total production, percentage, by plate color)
  async getSummary(params: WasteSummaryParams): Promise<WasteSummary> {
    const response = await apiClient.get<{ data: WasteSummary }>(`${this.endpoint}/summary`, {
      params,
    })
    return response.data.data
  }

  // Get waste entry by ID
  async getById(id: string): Promise<WasteEntry> {
    const response = await apiClient.get<{ data: WasteEntry }>(`${this.endpoint}/${id}`)
    return response.data.data
  }
}

export const wasteService = new WasteService()
