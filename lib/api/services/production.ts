import apiClient from '../client'
import type { PlateColor } from '@/components/plate-color-badge'

export interface ProductionPlanRow {
  timeSlot: string
  [key: string]: number | string // plate colors as keys with quantities
}

export interface ProductionItem {
  id: string
  menuId: string
  menuName: string
  plateColor: PlateColor
  quantity: number
  producedAt: Date
  expiresAt: Date
  status: 'fresh' | 'warning' | 'expired'
  outletId: string
}

export interface ConveyorItem extends ProductionItem {
  timeOnBelt: number // minutes
}

export interface WasteRecord {
  id: string
  menuId: string
  menuName: string
  plateColor: PlateColor
  quantity: number
  reason: string
  recordedAt: Date
  outletId: string
}

class ProductionService {
  private endpoint = '/production'

  // Get production plan for a date
  async getPlan(outletId: string, date: string): Promise<ProductionPlanRow[]> {
    const response = await apiClient.get<{ data: ProductionPlanRow[] }>(`${this.endpoint}/plan`, {
      params: { outletId, date },
    })
    return response.data.data
  }

  // Save production plan
  async savePlan(outletId: string, date: string, plan: ProductionPlanRow[]): Promise<void> {
    await apiClient.post(`${this.endpoint}/plan`, { outletId, date, plan })
  }

  // Get conveyor items (currently on belt)
  async getConveyorItems(outletId: string): Promise<ConveyorItem[]> {
    const response = await apiClient.get<{ data: ConveyorItem[] }>(`${this.endpoint}/conveyor`, {
      params: { outletId },
    })
    return response.data.data
  }

  // Produce item (add to conveyor)
  async produceItem(data: {
    menuId: string
    quantity: number
    outletId: string
  }): Promise<ProductionItem[]> {
    const response = await apiClient.post<{ data: ProductionItem[] }>(`${this.endpoint}/produce`, data)
    return response.data.data
  }

  // Remove expired items
  async removeExpired(itemIds: string[]): Promise<void> {
    await apiClient.post(`${this.endpoint}/remove-expired`, { itemIds })
  }

  // Record waste
  async recordWaste(data: {
    menuId: string
    quantity: number
    reason: string
    outletId: string
  }): Promise<WasteRecord> {
    const response = await apiClient.post<{ data: WasteRecord }>(`${this.endpoint}/waste`, data)
    return response.data.data
  }

  // Get waste records
  async getWasteRecords(outletId: string, startDate: string, endDate: string): Promise<WasteRecord[]> {
    const response = await apiClient.get<{ data: WasteRecord[] }>(`${this.endpoint}/waste`, {
      params: { outletId, startDate, endDate },
    })
    return response.data.data
  }
}

export const productionService = new ProductionService()
