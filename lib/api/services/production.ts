import apiClient from '../client'
import type { PlateColor } from '@/components/plate-color-badge'
import { plateColorsService } from './plate-colors'


export interface ProductionPlanRow {
  timeSlot: string
  [key: string]: number | string // plate colors as keys with quantities
}

export interface ProductionItem {
  id: string
  menuId: string
  menuName: string
  plateColor: PlateColor
  plateColorName: string
  quantity: number
  producedAt: string
  expiresAt: string
  beltStatus: 'fresh' | 'warning' | 'expired'
  finalStatus: 'sold' | 'waste' | null
  soldAt: string | null
  wastedAt: string | null

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

export interface ExpiredItem {
  id: string
  menuId: string
  menuName: string
  plateColor: string
  plateColorName: string
  producedAt: Date
  expiresAt: Date
  status?: 'sold' | 'waste'
  notes?: string
  outletId: string
}

export interface ProductionStats {
  plateColor: PlateColor
  targetToday: number
  produced: number
  sold: number
  waste: number
  expiringSoon: number
  outletId: string
}

export interface ProductionPlanItemPayload {
  plateColorId: string
  qty: number
}

export interface ProductionPlanRowPayload {
  timeSlot: string
  items: ProductionPlanItemPayload[]
}

function transformPlan(
  plan: ProductionPlanRow[],
  colorMap: Record<string, string>
): ProductionPlanRowPayload[] {
  return plan.map(row => {
    const items = Object.entries(row)
      .filter(([key]) => key !== 'timeSlot')
      .map(([color, qty]) => {

        const normalizedColor = String(color).toLowerCase()
        const plateColorId = colorMap[normalizedColor]

        if (!plateColorId) {
          throw new Error(`Color "${color}" tidak ditemukan di master`)
        }

        return {
          plateColorId,
          qty: Number(qty) || 0
        }
      })

    return {
      timeSlot: row.timeSlot,
      items
    }
  })
}

class ProductionService {
  private endpoint = '/production'

  private colorMap: Record<string, string> = {}
  private isColorLoaded = false

  private async loadPlateColors() {
    if (this.isColorLoaded) return

    const res = await plateColorsService.getAll()

    this.colorMap = Object.fromEntries(
      res.data.map(c => [c.platename.toLowerCase(), c.id])
    )

    this.isColorLoaded = true
  }

  // Get production stats for dashboard
  async getStats(outletId: string): Promise<ProductionStats[]> {
    const response = await apiClient.get<{ data: ProductionStats[] }>(`${this.endpoint}/stats`, {
      params: { outletId },
    })
    return response.data.data
  }

  // Get production plan for a date
  async getPlan(outletId: string, date: string): Promise<ProductionPlanRow[]> {
    const response = await apiClient.get<{ data: ProductionPlanRow[] }>(`${this.endpoint}/plan`, {
      params: { outletId, date },
    })
    return response.data.data
  }

  // Save production plan
  /*async savePlan(outletId: string, date: string, plan: ProductionPlanRow[]): Promise<void> {
    await apiClient.post(`${this.endpoint}/plan`, { outletId, date, plan })
  }*/

  async savePlan(outletId: string, date: string, plan: ProductionPlanRow[]): Promise<void> {
    await this.loadPlateColors()

    const payload = transformPlan(plan, this.colorMap)

    await apiClient.post(`${this.endpoint}/plan`, {
      outletId,
      date,
      plan: payload
    })
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
  /*async removeExpired(itemIds: string[]): Promise<void> {
    await apiClient.post(`${this.endpoint}/remove-expired`, { itemIds })
  }*/
  
  async markSold(itemIds: string[]): Promise<void> {
    await apiClient.post(`${this.endpoint}/mark-sold`, { itemIds })
  }
 
  
  async markWaste(itemIds: string[]): Promise<void> {
    await apiClient.post(`${this.endpoint}/mark-waste`, { itemIds })
  }

  // Record waste
  async recordWaste(data: {
    itemIds: string[] 
    reason: string 
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

  // Get expired items
  async getExpiredItems(outletId: string): Promise<ExpiredItem[]> {
    const response = await apiClient.get<{ data: ExpiredItem[] }>(`${this.endpoint}/expired`, {
      params: { outletId },
    })
    return response.data.data
  }

  // Update expired item status
  async updateExpiredItem(
    itemId: string,
    data: { status: 'sold' | 'waste'; notes: string }
  ): Promise<ExpiredItem> {
    const response = await apiClient.put<{ data: ExpiredItem }>(
      `${this.endpoint}/expired/${itemId}`,
      data
    )
    return response.data.data
  }

  // Remove expired item
  async removeExpiredItem(itemId: string): Promise<void> {
    await apiClient.delete(`${this.endpoint}/expired/${itemId}`)
  }

  
}

export const productionService = new ProductionService()
