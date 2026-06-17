'use client'

import { useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { OutletSelector } from '@/components/outlet-selector'
import { useOutlet } from '@/lib/outlet-context'
import { useWasteAnalysis } from '@/hooks/use-reports'
import { useToast } from '@/hooks/use-toast'
import { formatRupiah } from '@/lib/utils'
import { Loader2, Search, Calendar } from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell,
} from 'recharts'

const COLORS = ['#ef4444', '#f97316', '#eab308', '#84cc16', '#22c55e', '#06b6d4', '#8b5cf6']
const WASTE_TARGET = 5 // % target

function firstOfMonth(): string {
  const d = new Date()
  return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().split('T')[0]
}
function today(): string {
  return new Date().toISOString().split('T')[0]
}

export default function WasteAnalysisPage() {
  const { toast } = useToast()
  const { selectedOutletId } = useOutlet()
  const [startDate, setStartDate] = useState(firstOfMonth)
  const [endDate, setEndDate] = useState(today)
  const [query, setQuery] = useState<{ outletId: string; startDate: string; endDate: string } | null>(null)

  const { analysis, isLoading } = useWasteAnalysis(query)

  const handleFetch = () => {
    if (!selectedOutletId) {
      toast({ title: 'Error', description: 'Please select an outlet first', variant: 'destructive' })
      return
    }
    setQuery({ outletId: selectedOutletId, startDate, endDate })
  }

  const recommendations = useMemo(() => {
    if (!analysis) return []
    const recs: { tone: 'warn' | 'info' | 'ok'; text: string }[] = []

    if (analysis.topReason) {
      const top = analysis.byReason[0]
      recs.push({
        tone: 'warn',
        text: `Focus on reducing "${analysis.topReason}" waste (${top?.percentage ?? 0}%) — it is the leading cause.`,
      })
    }
    const worst = analysis.byPlateColor[0]
    if (worst && worst.wastePercentage > 0) {
      recs.push({
        tone: 'info',
        text: `${worst.plateColorName} plate has the highest waste rate (${worst.wastePercentage}%) — review production schedules.`,
      })
    }
    recs.push(
      analysis.wastePercentage <= WASTE_TARGET
        ? { tone: 'ok', text: `Overall waste rate (${analysis.wastePercentage}%) is within the ${WASTE_TARGET}% target.` }
        : { tone: 'warn', text: `Overall waste rate (${analysis.wastePercentage}%) exceeds the ${WASTE_TARGET}% target.` }
    )
    return recs
  }, [analysis])

  const plateChartData = analysis?.byPlateColor.map((p) => ({ plate: p.plateColorName, waste: p.wasteCount })) ?? []
  const reasonChartData = analysis?.byReason ?? []

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold">Waste Analysis Report</h1>
          <p className="text-muted-foreground mt-1">Track waste patterns and identify improvement areas</p>
        </div>
        <OutletSelector />
      </div>

      {/* Filter bar */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-end">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-muted-foreground">Start Date</label>
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-muted-foreground shrink-0" />
                <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="h-10 w-[160px]" />
              </div>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-muted-foreground">End Date</label>
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-muted-foreground shrink-0" />
                <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="h-10 w-[160px]" />
              </div>
            </div>
            <Button onClick={handleFetch} disabled={isLoading || !selectedOutletId} className="h-10 px-5">
              {isLoading ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Loading...</>
              ) : (
                <><Search className="w-4 h-4 mr-2" />Fetch Data</>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {!query ? (
        <Card>
          <CardContent className="p-12 text-center text-muted-foreground">
            Select an outlet and date range, then click “Fetch Data”.
          </CardContent>
        </Card>
      ) : isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      ) : !analysis ? (
        <Card>
          <CardContent className="p-12 text-center text-muted-foreground">No waste data for this period.</CardContent>
        </Card>
      ) : (
        <>
          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6">
                <p className="text-sm text-muted-foreground">Total Waste</p>
                <p className="text-3xl font-bold mt-2 tabular-nums">{analysis.totalWaste}</p>
                <p className="text-xs text-muted-foreground mt-1">of {analysis.totalProduction} produced</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <p className="text-sm text-muted-foreground">Waste Rate</p>
                <p className="text-3xl font-bold mt-2 tabular-nums">{analysis.wastePercentage}%</p>
                <p className={`text-xs mt-1 ${analysis.wastePercentage <= WASTE_TARGET ? 'text-green-600' : 'text-orange-600'}`}>
                  {analysis.wastePercentage <= WASTE_TARGET ? `Below target (${WASTE_TARGET}%)` : `Above target (${WASTE_TARGET}%)`}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <p className="text-sm text-muted-foreground">Waste Cost</p>
                <p className="text-3xl font-bold mt-2">{formatRupiah(analysis.wasteCost)}</p>
                <p className="text-xs text-muted-foreground mt-1">Estimated loss</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <p className="text-sm text-muted-foreground">Top Waste Cause</p>
                <p className="text-3xl font-bold mt-2">{analysis.topReason ?? '—'}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {analysis.byReason[0] ? `${analysis.byReason[0].percentage}% of waste` : 'No data'}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader><CardTitle>Waste by Plate Color</CardTitle></CardHeader>
              <CardContent>
                {plateChartData.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-12">No data</p>
                ) : (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={plateChartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="plate" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="waste" fill="#ef4444" />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle>Waste Causes Distribution</CardTitle></CardHeader>
              <CardContent>
                {reasonChartData.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-12">No data</p>
                ) : (
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={reasonChartData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ reason, percentage }) => `${reason}: ${percentage}%`}
                        outerRadius={100}
                        dataKey="count"
                      >
                        {reasonChartData.map((entry, index) => (
                          <Cell key={`cell-${entry.reason}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Waste Details by Reason */}
          <Card>
            <CardHeader><CardTitle>Waste Details by Reason</CardTitle></CardHeader>
            <CardContent>
              {reasonChartData.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-6">No waste recorded for this period.</p>
              ) : (
                <div className="space-y-4">
                  {reasonChartData.map((item) => (
                    <div key={item.reason} className="flex items-center justify-between p-4 bg-muted rounded-lg">
                      <div className="flex-1">
                        <p className="font-medium">{item.reason}</p>
                        <p className="text-sm text-muted-foreground">{item.count} items</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-lg tabular-nums">{item.percentage}%</p>
                        <div className="w-24 bg-gray-300 rounded-full h-2 mt-1">
                          <div className="bg-orange-500 h-2 rounded-full" style={{ width: `${Math.min(item.percentage, 100)}%` }} />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recommendations */}
          {recommendations.length > 0 && (
            <Card>
              <CardHeader><CardTitle>Improvement Recommendations</CardTitle></CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {recommendations.map((rec, i) => (
                    <li key={i} className="flex gap-3">
                      <span className={
                        rec.tone === 'warn' ? 'text-orange-600 font-bold'
                          : rec.tone === 'ok' ? 'text-green-600 font-bold'
                          : 'text-blue-600 font-bold'
                      }>
                        {rec.tone === 'warn' ? '!' : rec.tone === 'ok' ? '✓' : '📋'}
                      </span>
                      <span>{rec.text}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  )
}
