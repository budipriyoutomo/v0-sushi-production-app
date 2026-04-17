'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { OutletSelector } from '@/components/outlet-selector'
import { useToast } from '@/hooks/use-toast'
import { useOutlet } from '@/lib/outlet-context'
import { reportsService, type POSData } from '@/lib/api'
import type { PlateColor } from '@/components/plate-color-badge'
import { PlateColorBadge } from '@/components/plate-color-badge'
import { Eye, AlertCircle, CheckCircle, Download, Loader2, Save } from 'lucide-react'

interface SalesEntry {
  id: string
  plateColorId: string
  plateColorName: string
  posSold: number
  productionSold: number
  productionWaste: number
  adjustment: number
  compensation: number
  selisih: number
}

export function SalesInput() {
  const { toast } = useToast()
  const { selectedOutletId } = useOutlet()
  const [salesEntries, setSalesEntries] = useState<SalesEntry[]>([])
  const [selectedDate, setSelectedDate] = useState(() => {
    const today = new Date()
    return today.toISOString().split('T')[0]
  })
  const [isLoadingPOS, setIsLoadingPOS] = useState(false)

  // Get POS data from API
  const handleGetPOSData = async () => {
    if (!selectedOutletId) {
      toast({
        title: 'Error',
        description: 'Please select an outlet first',
        variant: 'destructive',
      })
      return
    }

    setIsLoadingPOS(true)
    try {
      const posData = await reportsService.getPOSData(selectedOutletId, selectedDate)
      
      // Convert POS data to sales entries
      const newEntries: SalesEntry[] = posData.map((pos: POSData) => ({
        id: pos.plateColorId,
        plateColorId: pos.plateColorId,
        plateColorName: pos.plateColorName,
        posSold: pos.posSold,
        productionSold: pos.productionSold,
        productionWaste: (pos as POSData & { productionWaste?: number }).productionWaste || 0,
        adjustment: 0,
        compensation: 0,
        selisih: pos.selisih,
      }))

      setSalesEntries(newEntries)
      toast({
        title: 'Success',
        description: `Loaded ${posData.length} entries from POS`,
      })
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to fetch POS data',
        variant: 'destructive',
      })
    } finally {
      setIsLoadingPOS(false)
    }
  }

  const handleAdjustmentChange = (id: string, value: number) => {
    setSalesEntries((prev) =>
      prev.map((entry) => {
        if (entry.id !== id) return entry
        const selisih = entry.posSold - entry.productionSold + value + entry.compensation
        return { ...entry, adjustment: value, selisih }
      })
    )
  }

  const handleCompensationChange = (id: string, value: number) => {
    setSalesEntries((prev) =>
      prev.map((entry) => {
        if (entry.id !== id) return entry
        const selisih = entry.posSold - entry.productionSold + entry.adjustment + value
        return { ...entry, compensation: value, selisih }
      })
    )
  }

  const handleViewDetail = (entry: SalesEntry) => {
    toast({
      title: `Detail: ${entry.plateColorName}`,
      description: `POS: ${entry.posSold}, Prod: ${entry.productionSold}, Waste: ${entry.productionWaste}, Adj: ${entry.adjustment}, Comp: ${entry.compensation}`,
    })
  }

  const handleSaveDraft = async () => {
    if (salesEntries.length === 0) {
      toast({
        title: 'Error',
        description: 'No entries to save as draft',
        variant: 'destructive',
      })
      return
    }

    await new Promise((resolve) => setTimeout(resolve, 500))

    toast({
      title: 'Draft Saved',
      description: `${salesEntries.length} entries saved as draft`,
    })
  }

  const handleSubmit = async () => {
    if (salesEntries.length === 0) {
      toast({
        title: 'Error',
        description: 'Please add at least one sales entry',
        variant: 'destructive',
      })
      return
    }

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000))

    toast({
      title: 'Success',
      description: `Submitted ${salesEntries.length} sales entries`,
    })

    setSalesEntries([])
  }

  // Calculate totals
  const totals = {
    posSold: salesEntries.reduce((sum, entry) => sum + entry.posSold, 0),
    productionSold: salesEntries.reduce((sum, entry) => sum + entry.productionSold, 0),
    productionWaste: salesEntries.reduce((sum, entry) => sum + entry.productionWaste, 0),
    adjustment: salesEntries.reduce((sum, entry) => sum + entry.adjustment, 0),
    compensation: salesEntries.reduce((sum, entry) => sum + entry.compensation, 0),
    selisih: salesEntries.reduce((sum, entry) => sum + entry.selisih, 0),
  }
  const hasDiscrepancies = salesEntries.some((entry) => entry.selisih !== 0)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold">Sales Input</h1>
          <p className="text-muted-foreground mt-1">Record POS sales transactions and reconcile with production</p>
        </div>
        <OutletSelector />
      </div>

      {/* Sales Entries List */}
      <Card>
          <CardHeader>
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div>
                <CardTitle>Sales Entries</CardTitle>
                <CardDescription>Total entries: {salesEntries.length}</CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-40"
                />
                <Button
                  onClick={handleGetPOSData}
                  variant="outline"
                  disabled={isLoadingPOS || !selectedOutletId}
                >
                  {isLoadingPOS ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Download className="w-4 h-4 mr-2" />
                  )}
                  Get Data POS
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {salesEntries.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No sales entries yet</p>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Plate Color</TableHead>
                      <TableHead className="text-right">POS Sold</TableHead>
                      <TableHead className="text-right">Prod. Sold</TableHead>
                      <TableHead className="text-right">Prod. Waste</TableHead>
                      <TableHead className="text-center w-28">Adjustment</TableHead>
                      <TableHead className="text-center w-28">Compensation</TableHead>
                      <TableHead className="text-right">Selisih</TableHead>
                      <TableHead className="w-10"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {salesEntries.map((entry) => (
                      <TableRow key={entry.id}>
                        <TableCell>
                          <PlateColorBadge color={entry.plateColorName.toLowerCase() as PlateColor} />
                        </TableCell>
                        <TableCell className="text-right font-medium">{entry.posSold}</TableCell>
                        <TableCell className="text-right">{entry.productionSold}</TableCell>
                        <TableCell className="text-right">{entry.productionWaste}</TableCell>
                        <TableCell className="text-center">
                          <Input
                            type="number"
                            className="h-8 w-20 text-center mx-auto"
                            value={entry.adjustment === 0 ? '' : entry.adjustment}
                            placeholder="0"
                            onChange={(e) =>
                              handleAdjustmentChange(entry.id, Number.parseInt(e.target.value) || 0)
                            }
                          />
                        </TableCell>
                        <TableCell className="text-center">
                          <Input
                            type="number"
                            className="h-8 w-20 text-center mx-auto"
                            value={entry.compensation === 0 ? '' : entry.compensation}
                            placeholder="0"
                            onChange={(e) =>
                              handleCompensationChange(entry.id, Number.parseInt(e.target.value) || 0)
                            }
                          />
                        </TableCell>
                        <TableCell className="text-right">
                          <span className={entry.selisih !== 0 ? 'text-destructive font-semibold' : 'text-green-600 font-semibold'}>
                            {entry.selisih > 0 ? '+' : ''}{entry.selisih}
                          </span>
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleViewDetail(entry)}
                            title="View Detail"
                          >
                            <Eye className="w-4 h-4 text-muted-foreground" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                    {/* Totals Row */}
                    <TableRow className="bg-muted/50 font-semibold border-t-2">
                      <TableCell>Total</TableCell>
                      <TableCell className="text-right">{totals.posSold}</TableCell>
                      <TableCell className="text-right">{totals.productionSold}</TableCell>
                      <TableCell className="text-right">{totals.productionWaste}</TableCell>
                      <TableCell className="text-center">{totals.adjustment}</TableCell>
                      <TableCell className="text-center">{totals.compensation}</TableCell>
                      <TableCell className="text-right">
                        <span className={totals.selisih !== 0 ? 'text-destructive' : 'text-green-600'}>
                          {totals.selisih > 0 ? '+' : ''}{totals.selisih}
                        </span>
                      </TableCell>
                      <TableCell></TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

      {/* Summary Card */}
      {salesEntries.length > 0 && (
        <Card className={hasDiscrepancies ? 'border-destructive' : 'border-green-600'}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {hasDiscrepancies ? (
                  <AlertCircle className="w-5 h-5 text-destructive" />
                ) : (
                  <CheckCircle className="w-5 h-5 text-green-600" />
                )}
                <CardTitle>{hasDiscrepancies ? 'Discrepancies Found' : 'All Sales Match System'}</CardTitle>
              </div>
              <span className={`text-2xl font-bold ${hasDiscrepancies ? 'text-destructive' : 'text-green-600'}`}>
                {totals.selisih > 0 ? '+' : ''}{totals.selisih}
              </span>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex gap-3">
              <Button onClick={handleSaveDraft} variant="outline" className="flex-1">
                <Save className="w-4 h-4 mr-2" />
                Save Draft
              </Button>
              <Button onClick={handleSubmit} className="flex-1">
                <CheckCircle className="w-4 h-4 mr-2" />
                Submit Sales Data
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
