import apiClient from '../client'
import type { PlateColor } from '@/components/plate-color-badge'

export interface SalesData {
  menuId: string
  menuName: string
  plateColor: PlateColor
  quantity: number
  revenue: number
  date: string
}

export interface POSData {
  plateColorId: string
  plateColorName: string
  posSold: number
  productionSold: number
  productionWaste: number
  selisih: number
}

export interface ProductionMenuDetailItem {
  menuId: string
  menuName: string
  totalProduced: number
  totalSold: number
  totalWasted: number
  adjustment: number
  compensation: number
}

export type ProductionMenuDetailResponse = ProductionMenuDetailItem[]

export interface ClosingReport {
  id: string
  outletId: string
  date: string
  totalProduced: number
  totalSold: number
  totalWaste: number
  totalRevenue: number
  wastePercentage: number
  salesByPlateColor: Record<PlateColor, { quantity: number; revenue: number }>
  submittedBy: string
  submittedAt: Date
  notes?: string
}

export interface DailySummary {
  date: string
  outletId: string
  outletName: string
  totalProduced: number
  totalSold: number
  totalWaste: number
  totalRevenue: number
  wastePercentage: number
  topSellingItems: Array<{ menuName: string; quantity: number }>
}

export interface WasteAnalysisPlateColor {
  plateColorId: string
  plateColorName: string
  wasteCount: number
  productionCount: number
  wastePercentage: number
}

export interface WasteAnalysisReason {
  reason: string
  count: number
  percentage: number
}

/**
 * Waste per kategori, dari snapshot yang dibekukan saat waste dicatat.
 * `categoryId` null = belum dikategorikan (`categoryCode` UNCATEGORIZED).
 */
export interface WasteAnalysisCategory {
  categoryId: string | null
  categoryCode: string
  categoryName: string
  count: number
  percentage: number
}

export interface WasteAnalysis {
  period: { startDate: string; endDate: string }
  totalWaste: number
  totalProduction: number
  wastePercentage: number
  wasteCost: number
  topReason: string | null
  byPlateColor: WasteAnalysisPlateColor[]
  byReason: WasteAnalysisReason[]
  /** Opsional: respons dari backend sebelum fitur kategori tidak membawanya. */
  byCategory?: WasteAnalysisCategory[]
  byDay: Array<{ date: string; quantity: number }>
}

/** `close_day` = tombol Tutup Hari (sisa → sold), `auto_waste` = sisa hari lalu → waste. */
export type CloseDayLogAction = 'close_day' | 'auto_waste'

/** `button` (layar conveyor), `scheduler` (00:05), `command` (artisan manual), `get_data_pos`. */
export type CloseDayLogTrigger = 'button' | 'scheduler' | 'command' | 'get_data_pos'

export interface CloseDayLog {
  id: string
  outletId: string
  outletCode: string | null
  outletName: string | null
  action: CloseDayLogAction
  trigger: CloseDayLogTrigger
  /** Hari produksi yang ditutup (Y-m-d), bukan hari eksekusinya. */
  businessDate: string | null
  closedCount: number
  executedAt: string | null
  clientRequestId: string | null
  ipAddress: string | null
  userAgent: string | null
  /** null untuk auto-waste dari scheduler/artisan — tidak ada user login. */
  executedBy: string | null
  executedByName: string | null
}

export interface CloseDayLogParams {
  outletId: string
  startDate?: string
  endDate?: string
  action?: CloseDayLogAction
  page?: number
}

export interface CloseDayLogPage {
  rows: CloseDayLog[]
  total: number
  page: number
  lastPage: number
}

const CLOSE_DAY_LOG_PER_PAGE = 25

class ReportsService {
  private endpoint = '/reports'

  // NOTE: sales and closing reports are NOT served under /reports.
  // Three methods used to live here calling POST /reports/sales and
  // GET|POST /reports/closing — none of those routes exist. Use salesService
  // (POST /sales) and closingReportService (/closing-reports/*) instead.

  // Get daily summary
  async getDailySummary(outletId: string, date: string): Promise<DailySummary> {
    const response = await apiClient.get<{ data: DailySummary }>(`${this.endpoint}/daily-summary`, {
      params: { outletId, date },
    })
    return response.data.data
  }

  // Get waste analysis
  async getWasteAnalysis(params: {
    outletId?: string
    startDate: string
    endDate: string
  }): Promise<WasteAnalysis> {
    const response = await apiClient.get<{ data: WasteAnalysis }>(`${this.endpoint}/waste-analysis`, { params })
    return response.data.data
  }

  // Audit Tutup Hari + auto-waste, terbaru dulu
  async getCloseDayLogs(params: CloseDayLogParams): Promise<CloseDayLogPage> {
    const response = await apiClient.get<{
      data: CloseDayLog[]
      meta?: { total: number; current_page: number; last_page: number }
    }>(`${this.endpoint}/close-day-logs`, {
      params: { ...params, per_page: CLOSE_DAY_LOG_PER_PAGE },
    })

    const rows = response.data.data
    const meta = response.data.meta

    return {
      rows,
      total: meta?.total ?? rows.length,
      page: meta?.current_page ?? 1,
      lastPage: meta?.last_page ?? 1,
    }
  }

  // Get POS data for a specific outlet and date
  async getPOSData(outletId: string, date: string): Promise<POSData[]> {
    const response = await apiClient.get<{ data: POSData[] }>(`${this.endpoint}/pos-data`, {
      params: { outletId, date },
    })
    return response.data.data
  }

  // Get production menu detail per plate color
  async getProductionMenuDetail(
    outletId: string,
    date: string,
    plateColorId: string
  ): Promise<ProductionMenuDetailItem[]> {
    const response = await apiClient.get<{ data: ProductionMenuDetailItem[] }>(
      `${this.endpoint}/production-menu-detail`,
      { params: { outletId, date, plateColorId } }
    )
    return response.data.data
  }
}

export const reportsService = new ReportsService()
