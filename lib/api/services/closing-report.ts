import apiClient from '../client'

export interface ClosingReportPlateColor {
  id: string
  name: string
  code: string
}

// Closing Report Entry per Menu
export interface ClosingReportEntry {
  id: string
  menuId: string
  menuCode: string | null
  menuName: string | null
  categoryName: string | null
  plateColor: ClosingReportPlateColor | null
  plateColorId?: string | null
  plateColorName?: string | null
  plateColorCode?: string | null
  sellingPrice: number
  produced: number
  sold: number
  waste: number
  posSold: number
  adjustment: number
  compensation: number
  compensationReason?: string | null
  selisih: number
  revenue: number
}

// Closing Report Summary
export interface ClosingReportSummary {
  id: string
  outletId: string
  outletName: string
  date: string
  status: 'draft' | 'submitted' | 'verified'
  totalProduced: number
  totalSold: number
  totalWaste: number
  totalPosSold: number
  totalAdjustment: number
  totalCompensation: number
  totalCompensationValue: number
  wastePercentage: number
  kitchenLeader?: string
  operationLeader?: string
  wastePhotoUrls?: string[]
  notes?: string
  entries: ClosingReportEntry[]
  summary?: {
    totalRevenue: number
    averageSellingPrice: number
    topSellingMenu: string | null
    topSellingQty: number
  }
  createdAt: string
  updatedAt: string
  submittedAt?: string
  submittedBy?: string
}

// Params for fetching closing report data
export interface ClosingReportParams {
  outletId: string
  date: string
}

// Params for listing closing reports
export interface ClosingReportListParams {
  outletId?: string
  startDate?: string
  endDate?: string
  status?: 'draft' | 'submitted' | 'verified'
}

// Create/Update closing report payload
export interface ClosingReportPayload {
  outletId: string
  date: string
  kitchenLeader?: string
  operationLeader?: string
  notes?: string
  entries: Array<{
    plateColorId: string
    posSold: number
    adjustment: number
    compensation: number
    compensationReason?: string
  }>
}

// Submit closing report payload
export interface SubmitClosingReportPayload {
  outletId: string
  date: string
  kitchenLeader: string
  operationLeader: string
  wastePhotoUrls?: string[]
  notes?: string
}

class ClosingReportService {
  private endpoint = '/closing-reports'

  // Get closing report data for a specific outlet and date
  // This fetches production data, POS data, and calculates differences
  async getData(params: ClosingReportParams): Promise<ClosingReportSummary> {
    const response = await apiClient.get<{ data: ClosingReportSummary }>(
      `${this.endpoint}/data`,
      { params }
    )
    return response.data.data
  }

  // Get list of closing reports
  async getAll(params?: ClosingReportListParams): Promise<ClosingReportSummary[]> {
    const response = await apiClient.get<{ data: ClosingReportSummary[] }>(
      this.endpoint,
      { params }
    )
    return response.data.data
  }

  // Get single closing report by ID
  async getById(id: string): Promise<ClosingReportSummary> {
    const response = await apiClient.get<{ data: ClosingReportSummary }>(
      `${this.endpoint}/${id}`
    )
    return response.data.data
  }

  // Save closing report as draft
  async saveDraft(data: ClosingReportPayload): Promise<ClosingReportSummary> {
    const response = await apiClient.post<{ data: ClosingReportSummary }>(
      `${this.endpoint}/draft`,
      data
    )
    return response.data.data
  }

  // Update existing closing report draft
  async updateDraft(id: string, data: Partial<ClosingReportPayload>): Promise<ClosingReportSummary> {
    const response = await apiClient.put<{ data: ClosingReportSummary }>(
      `${this.endpoint}/${id}`,
      data
    )
    return response.data.data
  }

  // Submit closing report (finalize)
  async submit(data: SubmitClosingReportPayload): Promise<ClosingReportSummary> {
    const response = await apiClient.post<{ data: ClosingReportSummary }>(
      `${this.endpoint}/submit`,
      data
    )
    return response.data.data
  }

  // Upload waste photos
  async uploadWastePhotos(files: File[]): Promise<string[]> {
    const formData = new FormData()
    files.forEach((file, index) => {
      formData.append(`photos[${index}]`, file)
    })
    
    const response = await apiClient.post<{ data: { urls: string[] } }>(
      `${this.endpoint}/upload-photos`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    )
    return response.data.data.urls
  }

  // Delete closing report draft
  async delete(id: string): Promise<void> {
    await apiClient.delete(`${this.endpoint}/${id}`)
  }
}

export const closingReportService = new ClosingReportService()
