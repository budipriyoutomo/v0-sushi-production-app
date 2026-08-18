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
  notes?: string | null
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

  // outlet id -> (platename lowercased -> plate color id).
  //
  // Dikunci PER OUTLET, dan itu wajib sejak warna piring jadi milik brand: dua
  // brand boleh sama-sama punya "Merah" dengan id dan harga berbeda. Satu peta
  // global akan menyimpan salah satunya lalu memakainya untuk outlet mana pun —
  // tanpa error, hanya target plan yang menempel ke piring brand lain.
  //
  // Tetap di-cache karena savePlan() membutuhkannya setiap panggilan; lihat
  // invalidatePlateColors(): peta basi dulu berarti "Color X tidak ditemukan di
  // master" sampai seluruh halaman di-reload.
  private colorMapByOutlet: Record<string, Record<string, string>> = {}

  private async loadPlateColors(outletId: string, force = false): Promise<Record<string, string>> {
    if (!force && this.colorMapByOutlet[outletId]) {
      return this.colorMapByOutlet[outletId]
    }

    const colors = await plateColorsService.getForOutlet(outletId)

    this.colorMapByOutlet[outletId] = Object.fromEntries(
      colors.map(c => [c.platename.toLowerCase(), c.id])
    )

    return this.colorMapByOutlet[outletId]
  }

  /**
   * Drop the cached plate colors. Call after the master data changes so the
   * next savePlan() sees newly added colors without a page reload.
   */
  invalidatePlateColors(): void {
    this.colorMapByOutlet = {}
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

  async savePlan(outletId: string, date: string, plan: ProductionPlanRow[]): Promise<void> {
    let colorMap = await this.loadPlateColors(outletId)

    let payload: ProductionPlanRowPayload[]

    try {
      payload = transformPlan(plan, colorMap)
    } catch {
      // An unknown colour usually means the master gained a plate color while
      // this session was open. Refetch once and retry before giving up, so the
      // operator does not have to reload the page.
      colorMap = await this.loadPlateColors(outletId, true)
      payload = transformPlan(plan, colorMap)
    }

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

  // Tutup hari: semua plate hari ini yang belum difinalisasi jadi sold.
  // Operator hanya menandai waste per plate; sisanya dianggap terjual.
  async closeDay(outletId: string): Promise<number> {
    const response = await apiClient.post<{ data: { closed: number } }>(
      `${this.endpoint}/close-day`,
      { outletId }
    )
    return response.data.data.closed
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

  // Get production item list filtered by date
  async getProductionItemList(params: {
    outletId: string
    date: string
  }): Promise<ProductionItem[]> {
    const response = await apiClient.get<{ data: ProductionItem[] }>(`${this.endpoint}/items`, {
      params,
    })
    return response.data.data
  }
}

export const productionService = new ProductionService()
