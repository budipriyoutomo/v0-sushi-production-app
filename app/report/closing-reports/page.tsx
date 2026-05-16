'use client'

import { useState, useMemo, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { OutletSelector } from '@/components/outlet-selector'
import { useToast } from '@/hooks/use-toast'
import { PlateColorBadge } from '@/components/plate-color-badge'
import { RefreshCw, Download, FileText, Loader2 } from 'lucide-react'
import { useOutlet } from '@/lib/outlet-context'
import { closingReportService, type ClosingReportSummary, getApiError } from '@/lib/api'

export default function ClosingReportsPage() {
  const { toast } = useToast()
  const { selectedOutletId } = useOutlet()
  const [dateRange, setDateRange] = useState<'today' | 'yesterday' | 'custom'>('today')
  const [customStartDate, setCustomStartDate] = useState('')
  const [customEndDate, setCustomEndDate] = useState('')
  const [reports, setReports] = useState<ClosingReportSummary[]>([])
  const [isLoading, setIsLoading] = useState(false)

  const today = new Date().toISOString().split('T')[0]
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0]

  const fetchReports = useCallback(async () => {
    if (!selectedOutletId) {
      toast({
        title: 'Error',
        description: 'Please select an outlet first',
        variant: 'destructive',
      })
      return
    }

    setIsLoading(true)
    try {
      let startDate: string
      let endDate: string

      if (dateRange === 'today') {
        startDate = today
        endDate = today
      } else if (dateRange === 'yesterday') {
        startDate = yesterday
        endDate = yesterday
      } else {
        startDate = customStartDate
        endDate = customEndDate
      }

      if (!startDate || !endDate) {
        toast({
          title: 'Error',
          description: 'Please select a valid date range',
          variant: 'destructive',
        })
        setIsLoading(false)
        return
      }

      const data = await closingReportService.getAll({
        outletId: selectedOutletId,
        startDate,
        endDate,
        status: 'submitted',
      })

      setReports(data)
      toast({
        title: 'Success',
        description: `Loaded ${data.length} closing report(s)`,
      })
    } catch (error) {
      toast({
        title: 'Error',
        description: getApiError(error),
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }, [selectedOutletId, dateRange, today, yesterday, customStartDate, customEndDate, toast])

  const allItems = useMemo(() => {
    return reports.flatMap((report) =>
      report.entries.map(entry => ({
        code: entry.plateColorCode,
        menuName: entry.plateColorName,
        sellingPrice: entry.sellingPrice,
        plateColor: entry.plateColorName.toLowerCase(),
        produced: entry.produced,
        sold: entry.sold,
        waste: entry.waste,
        posSold: entry.posSold,
        adjustment: entry.adjustment,
        compensation: entry.compensation,
        reportId: report.id,
        reportDate: report.date,
      }))
    )
  }, [reports])

  const handleRefresh = () => {
    fetchReports()
  }

  const handleExportExcel = () => {
    toast({
      title: 'Exporting',
      description: 'Generating Excel file...',
    })
    // Excel export logic would go here
  }

  const handleExportPDF = () => {
    toast({
      title: 'Exporting',
      description: 'Generating PDF file...',
    })
    // PDF export logic would go here
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl md:text-4xl font-bold">Closing Reports Summary</h1>
        <p className="text-muted-foreground mt-1">Historical data from submitted closing reports</p>
      </div>

      {/* Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filters & Export</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Row 1: Date Filter & Outlet Selector */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Date Range</Label>
              <div className="flex gap-2">
                <Button
                  variant={dateRange === 'today' ? 'default' : 'outline'}
                  onClick={() => setDateRange('today')}
                  className="flex-1"
                >
                  Today
                </Button>
                <Button
                  variant={dateRange === 'yesterday' ? 'default' : 'outline'}
                  onClick={() => setDateRange('yesterday')}
                  className="flex-1"
                >
                  Yesterday
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Outlet</Label>
              <OutletSelector />
            </div>

            <div className="flex items-end gap-2">
              <Button
                onClick={handleRefresh}
                variant="outline"
                className="w-full gap-2"
                disabled={isLoading}
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <RefreshCw className="w-4 h-4" />
                )}
                {isLoading ? 'Loading...' : 'Get Data'}
              </Button>
            </div>
          </div>

          {/* Row 2: Custom Date Range */}
          {dateRange === 'custom' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2 border-t">
              <div className="space-y-2">
                <Label htmlFor="startDate">Start Date</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={customStartDate}
                  onChange={(e) => setCustomStartDate(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endDate">End Date</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={customEndDate}
                  onChange={(e) => setCustomEndDate(e.target.value)}
                />
              </div>
              <div className="flex items-end gap-2">
                <Button
                  onClick={() => setDateRange('today')}
                  variant="outline"
                  className="w-full"
                >
                  Clear
                </Button>
              </div>
            </div>
          )}

          {/* Row 3: Custom Option & Export */}
          <div className="flex gap-2 pt-2 border-t">
            <Button
              variant={dateRange === 'custom' ? 'default' : 'outline'}
              onClick={() => setDateRange('custom')}
              className="flex-1"
            >
              Custom Range
            </Button>
            <Button
              onClick={handleExportExcel}
              variant="outline"
              className="gap-2"
              disabled={allItems.length === 0}
            >
              <Download className="w-4 h-4" />
              Excel
            </Button>
            <Button
              onClick={handleExportPDF}
              variant="outline"
              className="gap-2"
              disabled={allItems.length === 0}
            >
              <FileText className="w-4 h-4" />
              PDF
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Data Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Report Data</CardTitle>
            <span className="text-sm text-muted-foreground">
              {allItems.length} items from {reports.length} report(s)
            </span>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Code</TableHead>
                  <TableHead>Menu</TableHead>
                  <TableHead className="text-right">Harga Jual</TableHead>
                  <TableHead>Color</TableHead>
                  <TableHead colSpan={3} className="text-center">COLORPLATE</TableHead>
                  <TableHead className="text-center">POS</TableHead>
                  <TableHead className="text-center">Adjustment</TableHead>
                  <TableHead colSpan={2} className="text-center">COMPENSATION</TableHead>
                  <TableHead className="text-center">Date</TableHead>
                </TableRow>
                <TableRow className="bg-muted/50">
                  <TableHead></TableHead>
                  <TableHead></TableHead>
                  <TableHead></TableHead>
                  <TableHead></TableHead>
                  <TableHead className="text-right text-xs">Produce</TableHead>
                  <TableHead className="text-right text-xs">Sold</TableHead>
                  <TableHead className="text-right text-xs">Waste</TableHead>
                  <TableHead className="text-right text-xs">Sold</TableHead>
                  <TableHead className="text-right text-xs">Adj</TableHead>
                  <TableHead className="text-right text-xs">Qty</TableHead>
                  <TableHead className="text-right text-xs">Value</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={12} className="text-center py-6">
                      <div className="flex items-center justify-center gap-2 text-muted-foreground">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Loading data...
                      </div>
                    </TableCell>
                  </TableRow>
                ) : allItems.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={12} className="text-center py-6 text-muted-foreground">
                      No data available. Click &quot;Get Data&quot; to load closing reports.
                    </TableCell>
                  </TableRow>
                ) : (
                  allItems.map((item, idx) => (
                    <TableRow key={idx}>
                      <TableCell className="font-mono font-semibold text-sm">{item.code}</TableCell>
                      <TableCell className="font-medium">{item.menuName}</TableCell>
                      <TableCell className="text-right">Rp {item.sellingPrice.toLocaleString('id-ID')}</TableCell>
                      <TableCell>
                        <PlateColorBadge color={item.plateColor as 'white' | 'blue' | 'pink' | 'black' | 'red' | 'gold' | 'yellow'} />
                      </TableCell>
                      <TableCell className="text-right text-sm">{item.produced}</TableCell>
                      <TableCell className="text-right text-sm text-green-600">{item.sold}</TableCell>
                      <TableCell className="text-right text-sm text-red-600">{item.waste}</TableCell>
                      <TableCell className="text-right text-sm">{item.posSold}</TableCell>
                      <TableCell className={`text-right text-sm ${item.adjustment > 0 ? 'text-orange-600' : item.adjustment < 0 ? 'text-red-600' : 'text-muted-foreground'}`}>
                        {item.adjustment > 0 ? '+' : ''}{item.adjustment}
                      </TableCell>
                      <TableCell className="text-right text-sm">{item.compensation}</TableCell>
                      <TableCell className="text-right text-sm font-semibold">
                        Rp {(item.compensation * item.sellingPrice).toLocaleString('id-ID')}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">{item.reportDate}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      {reports.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="pt-4">
              <p className="text-xs text-muted-foreground mb-2">Total Produced</p>
              <p className="text-2xl font-bold text-blue-600">
                {allItems.reduce((sum, i) => sum + i.produced, 0)}
              </p>
            </CardContent>
          </Card>
          <Card className="bg-green-50 border-green-200">
            <CardContent className="pt-4">
              <p className="text-xs text-muted-foreground mb-2">Total Sold</p>
              <p className="text-2xl font-bold text-green-600">
                {allItems.reduce((sum, i) => sum + i.sold, 0)}
              </p>
            </CardContent>
          </Card>
          <Card className="bg-red-50 border-red-200">
            <CardContent className="pt-4">
              <p className="text-xs text-muted-foreground mb-2">Total Waste</p>
              <p className="text-2xl font-bold text-red-600">
                {allItems.reduce((sum, i) => sum + i.waste, 0)}
              </p>
            </CardContent>
          </Card>
          <Card className="bg-purple-50 border-purple-200">
            <CardContent className="pt-4">
              <p className="text-xs text-muted-foreground mb-2">Total Compensation Value</p>
              <p className="text-2xl font-bold text-purple-600">
                Rp {allItems.reduce((sum, i) => sum + (i.compensation * i.sellingPrice), 0).toLocaleString('id-ID')}
              </p>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
