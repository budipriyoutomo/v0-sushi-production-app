import useSWR from 'swr'
import {
  reportsService,
  type ClosingReport,
  type DailySummary,
  type SalesAnalysis,
  type WasteAnalysis,
} from '@/lib/api'

const REPORTS_KEY = '/reports'

export function useClosingReports(params: {
  outletId?: string
  startDate?: string
  endDate?: string
}) {
  const key = `${REPORTS_KEY}/closing?${JSON.stringify(params)}`

  const { data, error, isLoading, mutate } = useSWR<ClosingReport[]>(key, async () => {
    const reports = await reportsService.getClosingReports(params)
    return reports
  })

  const submitClosingReport = async (outletId: string, date: string, notes?: string): Promise<ClosingReport> => {
    const report = await reportsService.submitClosingReport({ outletId, date, notes })
    await mutate()
    return report
  }

  return {
    reports: data || [],
    isLoading,
    error,
    submitClosingReport,
    refresh: mutate,
  }
}

export function useDailySummary(outletId: string | null, date: string | null) {
  const { data, error, isLoading, mutate } = useSWR<DailySummary | null>(
    outletId && date ? `${REPORTS_KEY}/daily-summary/${outletId}/${date}` : null,
    async () => {
      if (!outletId || !date) return null
      const summary = await reportsService.getDailySummary(outletId, date)
      return summary
    }
  )

  return {
    summary: data,
    isLoading,
    error,
    refresh: mutate,
  }
}

export function useSalesAnalysis(params: {
  outletId?: string
  startDate: string
  endDate: string
} | null) {
  const key = params ? `${REPORTS_KEY}/sales-analysis?${JSON.stringify(params)}` : null

  const { data, error, isLoading, mutate } = useSWR<SalesAnalysis | null>(key, async () => {
    if (!params) return null
    const analysis = await reportsService.getSalesAnalysis(params)
    return analysis
  })

  return {
    analysis: data,
    isLoading,
    error,
    refresh: mutate,
  }
}

export function useWasteAnalysis(params: {
  outletId?: string
  startDate: string
  endDate: string
} | null) {
  const key = params ? `${REPORTS_KEY}/waste-analysis?${JSON.stringify(params)}` : null

  const { data, error, isLoading, mutate } = useSWR<WasteAnalysis | null>(key, async () => {
    if (!params) return null
    const analysis = await reportsService.getWasteAnalysis(params)
    return analysis
  })

  return {
    analysis: data,
    isLoading,
    error,
    refresh: mutate,
  }
}

export function useSalesInput(outletId: string | null) {
  const submitSales = async (date: string, sales: Array<{ menuId: string; quantity: number }>): Promise<void> => {
    if (!outletId) return
    await reportsService.submitSales({ outletId, date, sales })
  }

  return {
    submitSales,
  }
}
