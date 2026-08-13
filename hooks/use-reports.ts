import useSWR from 'swr'
import {
  reportsService,
  type DailySummary,
  type WasteAnalysis,
} from '@/lib/api'

const REPORTS_KEY = '/reports'

// NOTE: useClosingReports() used to live here and hit /reports/closing, a route
// that does not exist. Closing reports are served by /closing-reports/* — use
// closingReportService. Nothing consumed this hook.

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

// NOTE: useSalesInput() used to live here and hit POST /reports/sales, a route
// that does not exist. Sales input goes through salesService.create()
// (POST /sales), which is what components/sales-input.tsx already calls.
