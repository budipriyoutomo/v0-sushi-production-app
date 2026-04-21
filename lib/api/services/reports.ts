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

export interface SalesAnalysis {
  period: string
  totalRevenue: number
  totalQuantity: number
  averageOrderValue: number
  salesByDay: Array<{ date: string; revenue: number; quantity: number }>
  salesByPlateColor: Record<PlateColor, { quantity: number; revenue: number; percentage: number }>
  topItems: Array<{ menuName: string; quantity: number; revenue: number }>
}

export interface WasteAnalysis {
  period: string
  totalWaste: number
  wasteByReason: Record<string, number>
  wasteByPlateColor: Record<PlateColor, number>
  wasteByDay: Array<{ date: string; quantity: number }>
  wasteTrend: 'increasing' | 'decreasing' | 'stable'
}

class ReportsService {
  private endpoint = '/reports'

  // Submit sales data
  async submitSales(data: {
    outletId: string
    date: string
    sales: Array<{ menuId: string; quantity: number }>
  }): Promise<void> {
    await apiClient.post(`${this.endpoint}/sales`, data)
  }

  // Get closing reports
  async getClosingReports(params: {
    outletId?: string
    startDate?: string
    endDate?: string
  }): Promise<ClosingReport[]> {
    const response = await apiClient.get<{ data: ClosingReport[] }>(`${this.endpoint}/closing`, { params })
    return response.data.data
  }

  // Submit closing report
  async submitClosingReport(data: {
    outletId: string
    date: string
    notes?: string
  }): Promise<ClosingReport> {
    const response = await apiClient.post<{ data: ClosingReport }>(`${this.endpoint}/closing`, data)
    return response.data.data
  }

  // Get daily summary
  async getDailySummary(outletId: string, date: string): Promise<DailySummary> {
    const response = await apiClient.get<{ data: DailySummary }>(`${this.endpoint}/daily-summary`, {
      params: { outletId, date },
    })
    return response.data.data
  }

  // Get sales analysis
  async getSalesAnalysis(params: {
    outletId?: string
    startDate: string
    endDate: string
  }): Promise<SalesAnalysis> {
    const response = await apiClient.get<{ data: SalesAnalysis }>(`${this.endpoint}/sales-analysis`, { params })
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
