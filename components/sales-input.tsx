'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { OutletSelector } from '@/components/outlet-selector'
import { useToast } from '@/hooks/use-toast'
import { useOutlet } from '@/lib/outlet-context'
import { reportsService, salesService, type POSData, type ProductionMenuDetailItem, type SalesDraft } from '@/lib/api'
import type { PlateColor } from '@/components/plate-color-badge'
import { PlateColorBadge } from '@/components/plate-color-badge'
import { Pencil, AlertCircle, CheckCircle, Download, Loader2, Save, FileText } from 'lucide-react'

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
  const [detailDialogOpen, setDetailDialogOpen] = useState(false)
  const [selectedEntryDetail, setSelectedEntryDetail] = useState<SalesEntry | null>(null)
  const [productionDetail, setProductionDetail] = useState<ProductionMenuDetailItem[] | null>(null)
  const [editableDetail, setEditableDetail] = useState<ProductionMenuDetailItem[] | null>(null)
  const [isLoadingDetail, setIsLoadingDetail] = useState(false)

  // Sales Draft Dialog state
  const [draftDialogOpen, setDraftDialogOpen] = useState(false)
  const [salesDrafts, setSalesDrafts] = useState<SalesDraft[]>([])
  const [isLoadingDrafts, setIsLoadingDrafts] = useState(false)
  const [expandedDraftId, setExpandedDraftId] = useState<string | null>(null)
  const [draftDetailMap, setDraftDetailMap] = useState<Record<string, SalesDraft>>({})
  const [loadingDetailId, setLoadingDetailId] = useState<string | null>(null)

  // Get Sales Drafts from API
  const handleGetSalesDrafts = async () => {
    setDraftDialogOpen(true)
    setIsLoadingDrafts(true)
    try {
      const drafts = await salesService.getAll({
        outletId: selectedOutletId || undefined,
        status: 'draft',
      })
      setSalesDrafts(drafts)
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to fetch sales drafts',
        variant: 'destructive',
      })
    } finally {
      setIsLoadingDrafts(false)
    }
  }

  // View draft detail from GET /sales/{id}
  const handleViewDraft = async (draft: SalesDraft) => {
    if (expandedDraftId === draft.id) {
      setExpandedDraftId(null)
      return
    }
    // Use cached detail if already fetched
    if (draftDetailMap[draft.id]) {
      setExpandedDraftId(draft.id)
      return
    }
    setLoadingDetailId(draft.id)
    try {
      const detail = await salesService.getById(draft.id)
      setDraftDetailMap((prev) => ({ ...prev, [draft.id]: detail }))
      setExpandedDraftId(draft.id)
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to fetch draft detail',
        variant: 'destructive',
      })
    } finally {
      setLoadingDetailId(null)
    }
  }

  // Load draft into current form
  const handleLoadDraft = async (draft: SalesDraft) => {
    try {
      // Fetch full draft detail
      const fullDraft = await salesService.getById(draft.id)
      
      if (fullDraft.details && fullDraft.details.length > 0) {
        const entries: SalesEntry[] = fullDraft.details.map((d) => ({
          id: d.plateColorId,
          plateColorId: d.plateColorId,
          plateColorName: d.plateColorName,
          posSold: d.posSold,
          productionSold: d.productionSold,
          productionWaste: d.productionWaste,
          adjustment: d.adjustment,
          compensation: d.compensation,
          selisih: d.selisih,
        }))
        setSalesEntries(entries)
        setSelectedDate(fullDraft.date)
        setDraftDialogOpen(false)
        toast({
          title: 'Draft Loaded',
          description: `Loaded draft from ${fullDraft.date} with ${entries.length} entries`,
        })
      } else {
        toast({
          title: 'Error',
          description: 'Draft has no detail entries',
          variant: 'destructive',
        })
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load draft details',
        variant: 'destructive',
      })
    }
  }

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

  const handleOpenDetail = async (entry: SalesEntry) => {
    setSelectedEntryDetail(entry)
    setProductionDetail(null)
    setEditableDetail(null)
    setDetailDialogOpen(true)

    if (!selectedOutletId) return

    setIsLoadingDetail(true)
    try {
      const detail = await reportsService.getProductionMenuDetail(
        selectedOutletId,
        selectedDate,
        entry.plateColorId
      )
      setProductionDetail(detail)
      // Initialize editable detail with current values
      setEditableDetail(detail.map(item => ({
        ...item,
        adjustment: item.adjustment || 0,
        compensation: item.compensation || 0,
      })))
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load production detail',
        variant: 'destructive',
      })
    } finally {
      setIsLoadingDetail(false)
    }
  }

  // Handle adjustment change in detail dialog
  const handleDetailAdjustmentChange = (menuId: string, value: number) => {
    setEditableDetail(prev => 
      prev?.map(item => 
        item.menuId === menuId ? { ...item, adjustment: value } : item
      ) || null
    )
  }

  // Handle compensation change in detail dialog
  const handleDetailCompensationChange = (menuId: string, value: number) => {
    setEditableDetail(prev => 
      prev?.map(item => 
        item.menuId === menuId ? { ...item, compensation: value } : item
      ) || null
    )
  }

  // Save detail totals to parent entry and localStorage
  const handleSaveDetailToParent = () => {
    if (!selectedEntryDetail || !editableDetail || !selectedOutletId) return

    const totalAdjustment = editableDetail.reduce((sum, item) => sum + (item.adjustment || 0), 0)
    const totalCompensation = editableDetail.reduce((sum, item) => sum + (item.compensation || 0), 0)

    // Update the parent entry with totals from detail
    handleAdjustmentChange(selectedEntryDetail.id, totalAdjustment)
    handleCompensationChange(selectedEntryDetail.id, totalCompensation)

    // Update selected entry detail for display
    setSelectedEntryDetail(prev => prev ? {
      ...prev,
      adjustment: totalAdjustment,
      compensation: totalCompensation,
      selisih: prev.posSold - prev.productionSold + totalAdjustment + totalCompensation,
    } : null)

    // Save to localStorage
    const storageKey = `sales-input-detail-${selectedOutletId}-${selectedDate}-${selectedEntryDetail.plateColorId}`
    const dataToStore = {
      plateColorId: selectedEntryDetail.plateColorId,
      plateColorName: selectedEntryDetail.plateColorName,
      outletId: selectedOutletId,
      date: selectedDate,
      totalAdjustment,
      totalCompensation,
      menuDetails: editableDetail.map(item => ({
        menuId: item.menuId,
        menuName: item.menuName,
        totalProduced: item.totalProduced,
        totalSold: item.totalSold,
        totalWasted: item.totalWasted,
        adjustment: item.adjustment || 0,
        compensation: item.compensation || 0,
      })),
      savedAt: new Date().toISOString(),
    }
    localStorage.setItem(storageKey, JSON.stringify(dataToStore))

    toast({
      title: 'Saved',
      description: `Adjustment: ${totalAdjustment}, Compensation: ${totalCompensation} applied to ${selectedEntryDetail.plateColorName} and saved to local storage`,
    })

    setDetailDialogOpen(false)
  }

  const [isSavingDraft, setIsSavingDraft] = useState(false)

  const handleSaveDraft = async () => {
    if (salesEntries.length === 0) {
      toast({
        title: 'Error',
        description: 'No entries to save as draft',
        variant: 'destructive',
      })
      return
    }

    if (!selectedOutletId) {
      toast({
        title: 'Error',
        description: 'Please select an outlet first',
        variant: 'destructive',
      })
      return
    }

    setIsSavingDraft(true)
    try {
      await salesService.create({
        outlet_id: selectedOutletId,
        date: selectedDate,
        status: 'draft',
        items: salesEntries.map((entry) => ({
          plate_color_id: entry.plateColorId,
          pos_sold: entry.posSold,
          production_sold: entry.productionSold,
          production_waste: entry.productionWaste,
          adjustment: entry.adjustment,
          compensation: entry.compensation,
        })),
      })

      toast({
        title: 'Draft Saved',
        description: `${salesEntries.length} entries saved as draft`,
      })
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to save draft',
        variant: 'destructive',
      })
    } finally {
      setIsSavingDraft(false)
    }
  }

  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async () => {
    if (salesEntries.length === 0) {
      toast({
        title: 'Error',
        description: 'Please add at least one sales entry',
        variant: 'destructive',
      })
      return
    }

    if (!selectedOutletId) {
      toast({
        title: 'Error',
        description: 'Please select an outlet first',
        variant: 'destructive',
      })
      return
    }

    setIsSubmitting(true)
    try {
      await salesService.create({
        outlet_id: selectedOutletId,
        date: selectedDate,
        status: 'submitted',
        items: salesEntries.map((entry) => ({
          plate_color_id: entry.plateColorId,
          pos_sold: entry.posSold,
          production_sold: entry.productionSold,
          production_waste: entry.productionWaste,
          adjustment: entry.adjustment,
          compensation: entry.compensation,
        })),
      })

      toast({
        title: 'Success',
        description: `Submitted ${salesEntries.length} sales entries`,
      })

      setSalesEntries([])
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to submit sales data',
        variant: 'destructive',
      })
    } finally {
      setIsSubmitting(false)
    }
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
                <Button
                  onClick={handleGetSalesDrafts}
                  variant="outline"
                >
                  <FileText className="w-4 h-4 mr-2" />
                  Get Sales Draft
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
                      <TableHead className="w-14"></TableHead>
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
                          {entry.selisih !== 0 && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleOpenDetail(entry)}
                              title="Edit / View Detail"
                            >
                              <Pencil className="w-4 h-4 text-destructive" />
                            </Button>
                          )}
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
              <Button onClick={handleSaveDraft} variant="outline" className="flex-1" disabled={isSavingDraft || isSubmitting}>
                {isSavingDraft ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Save className="w-4 h-4 mr-2" />
                )}
                {isSavingDraft ? 'Saving...' : 'Save Draft'}
              </Button>
              <Button onClick={handleSubmit} className="flex-1" disabled={isSavingDraft || isSubmitting}>
                {isSubmitting ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <CheckCircle className="w-4 h-4 mr-2" />
                )}
                {isSubmitting ? 'Submitting...' : 'Submit Sales Data'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Production Detail Dialog */}
      <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
        <DialogContent className="w-[95vw] max-w-[95vw] max-h-[92vh] flex flex-col p-0 gap-0">

          {/* Dialog Header */}
          <div className="flex items-start justify-between gap-4 px-6 pt-6 pb-4 border-b">
            <div className="flex flex-col gap-1">
              <DialogTitle className="text-lg font-semibold flex items-center gap-2">
                Production Menu Detail
                {selectedEntryDetail && (
                  <PlateColorBadge color={selectedEntryDetail.plateColorName.toLowerCase() as PlateColor} />
                )}
              </DialogTitle>
              <DialogDescription className="text-sm text-muted-foreground">
                Tanggal: <span className="font-medium text-foreground">{selectedDate}</span>
                {' '}&mdash;{' '}
                Input adjustment dan compensation per menu, lalu simpan ke plate color.
              </DialogDescription>
            </div>
          </div>

          {/* Scrollable body */}
          <div className="flex-1 overflow-y-auto px-6 py-4 space-y-5">

            {/* Summary Stats */}
            {selectedEntryDetail && editableDetail && (() => {
              const totalAdj = editableDetail.reduce((s, i) => s + (i.adjustment || 0), 0)
              const totalComp = editableDetail.reduce((s, i) => s + (i.compensation || 0), 0)
              const selisih = selectedEntryDetail.posSold - selectedEntryDetail.productionSold + totalAdj + totalComp

              return (
                <div className="space-y-2">
                  {/* Row 1: production facts */}
                  <div className="grid grid-cols-3 gap-3">
                    <div className="rounded-lg border bg-muted/40 px-4 py-3">
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">POS Sold</p>
                      <p className="text-2xl font-bold">{selectedEntryDetail.posSold}</p>
                    </div>
                    <div className="rounded-lg border bg-muted/40 px-4 py-3">
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">Production Sold</p>
                      <p className="text-2xl font-bold">{selectedEntryDetail.productionSold}</p>
                    </div>
                    <div className="rounded-lg border bg-muted/40 px-4 py-3">
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">Production Waste</p>
                      <p className="text-2xl font-bold">{selectedEntryDetail.productionWaste}</p>
                    </div>
                  </div>
                  {/* Row 2: adjustment totals + selisih */}
                  <div className="grid grid-cols-3 gap-3">
                    <div className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-3">
                      <p className="text-xs font-medium text-blue-600 uppercase tracking-wide mb-1">Total Adjustment</p>
                      <p className="text-2xl font-bold text-blue-700">{totalAdj > 0 ? '+' : ''}{totalAdj}</p>
                    </div>
                    <div className="rounded-lg border border-orange-200 bg-orange-50 px-4 py-3">
                      <p className="text-xs font-medium text-orange-600 uppercase tracking-wide mb-1">Total Compensation</p>
                      <p className="text-2xl font-bold text-orange-700">{totalComp > 0 ? '+' : ''}{totalComp}</p>
                    </div>
                    <div className={`rounded-lg border px-4 py-3 ${selisih === 0 ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}>
                      <p className={`text-xs font-medium uppercase tracking-wide mb-1 ${selisih === 0 ? 'text-green-600' : 'text-red-600'}`}>Selisih</p>
                      <p className={`text-2xl font-bold ${selisih === 0 ? 'text-green-700' : 'text-red-700'}`}>
                        {selisih > 0 ? '+' : ''}{selisih}
                      </p>
                    </div>
                  </div>
                </div>
              )
            })()}

            {/* Menu Detail Table */}
            {isLoadingDetail ? (
              <div className="flex items-center justify-center py-16 gap-3 text-muted-foreground">
                <Loader2 className="w-5 h-5 animate-spin" />
                <span className="text-sm">Loading production detail...</span>
              </div>
            ) : editableDetail && editableDetail.length > 0 ? (
              <div className="rounded-lg border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead className="font-semibold w-[40%]">Menu</TableHead>
                      <TableHead className="text-right font-semibold">Produced</TableHead>
                      <TableHead className="text-right font-semibold">Sold</TableHead>
                      <TableHead className="text-right font-semibold">Waste</TableHead>
                      <TableHead className="text-center font-semibold w-32">Adjustment</TableHead>
                      <TableHead className="text-center font-semibold w-32">Compensation</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {editableDetail.map((item) => (
                      <TableRow key={item.menuId} className="hover:bg-muted/30">
                        <TableCell className="font-medium py-3">{item.menuName}</TableCell>
                        <TableCell className="text-right tabular-nums">{item.totalProduced}</TableCell>
                        <TableCell className="text-right tabular-nums">{item.totalSold}</TableCell>
                        <TableCell className="text-right tabular-nums text-destructive">{item.totalWasted}</TableCell>
                        <TableCell className="py-2">
                          <Input
                            type="number"
                            className="h-8 w-24 text-center mx-auto tabular-nums"
                            value={item.adjustment === 0 ? '' : item.adjustment}
                            placeholder="0"
                            onChange={(e) =>
                              handleDetailAdjustmentChange(item.menuId, Number.parseInt(e.target.value) || 0)
                            }
                          />
                        </TableCell>
                        <TableCell className="py-2">
                          <Input
                            type="number"
                            className="h-8 w-24 text-center mx-auto tabular-nums"
                            value={item.compensation === 0 ? '' : item.compensation}
                            placeholder="0"
                            onChange={(e) =>
                              handleDetailCompensationChange(item.menuId, Number.parseInt(e.target.value) || 0)
                            }
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                    <TableRow className="bg-muted/50 font-semibold border-t-2">
                      <TableCell className="py-3">Total</TableCell>
                      <TableCell className="text-right tabular-nums">
                        {editableDetail.reduce((s, i) => s + i.totalProduced, 0)}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {editableDetail.reduce((s, i) => s + i.totalSold, 0)}
                      </TableCell>
                      <TableCell className="text-right tabular-nums text-destructive">
                        {editableDetail.reduce((s, i) => s + i.totalWasted, 0)}
                      </TableCell>
                      <TableCell className="text-center tabular-nums font-bold text-blue-700">
                        {editableDetail.reduce((s, i) => s + (i.adjustment || 0), 0)}
                      </TableCell>
                      <TableCell className="text-center tabular-nums font-bold text-orange-700">
                        {editableDetail.reduce((s, i) => s + (i.compensation || 0), 0)}
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="flex items-center justify-center py-16 text-muted-foreground text-sm">
                No production data available.
              </div>
            )}
          </div>

          {/* Sticky Footer */}
          {editableDetail && editableDetail.length > 0 && selectedEntryDetail && (() => {
            const totalAdj = editableDetail.reduce((s, i) => s + (i.adjustment || 0), 0)
            const totalComp = editableDetail.reduce((s, i) => s + (i.compensation || 0), 0)
            const selisih = selectedEntryDetail.posSold - selectedEntryDetail.productionSold + totalAdj + totalComp
            const isBalanced = selisih === 0

            return (
              <div className="flex items-center justify-between gap-4 px-6 py-4 border-t bg-muted/30">
                <div className="text-sm">
                  {isBalanced ? (
                    <span className="flex items-center gap-1.5 text-green-600 font-medium">
                      <CheckCircle className="w-4 h-4" />
                      Selisih sudah 0, data siap disimpan.
                    </span>
                  ) : (
                    <span className="flex items-center gap-1.5 text-amber-600 font-medium">
                      <AlertCircle className="w-4 h-4" />
                      Selisih {selisih > 0 ? '+' : ''}{selisih} — data dapat disimpan dengan selisih.
                    </span>
                  )}
                </div>
                <Button
                  onClick={handleSaveDetailToParent}
                  variant={isBalanced ? 'default' : 'outline'}
                >
                  <Save className="w-4 h-4 mr-2" />
                  Save to Plate Color
                </Button>
              </div>
            )
          })()}
        </DialogContent>
      </Dialog>

      {/* Sales Draft List Dialog */}
      <Dialog open={draftDialogOpen} onOpenChange={setDraftDialogOpen}>
        <DialogContent className="max-w-3xl w-full max-h-[85vh] flex flex-col p-0 gap-0">
          <div className="px-6 pt-6 pb-4 border-b">
            <DialogTitle className="text-lg font-semibold">Sales Drafts</DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground mt-1">
              Select a draft to load into the current form. Only drafts with status &quot;draft&quot; are shown.
            </DialogDescription>
          </div>

          <div className="flex-1 overflow-y-auto px-6 py-4">
            {isLoadingDrafts ? (
              <div className="flex items-center justify-center py-16 gap-3 text-muted-foreground">
                <Loader2 className="w-5 h-5 animate-spin" />
                <span className="text-sm">Loading sales drafts...</span>
              </div>
            ) : salesDrafts.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                <FileText className="w-12 h-12 mb-3 opacity-30" />
                <p className="text-sm">No draft sales found.</p>
              </div>
            ) : (
              <div className="rounded-lg border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead className="font-semibold">Date</TableHead>
                      <TableHead className="font-semibold">Outlet</TableHead>
                      <TableHead className="text-right font-semibold">POS Sold</TableHead>
                      <TableHead className="text-right font-semibold">Prod. Sold</TableHead>
                      <TableHead className="text-right font-semibold">Selisih</TableHead>
                      <TableHead className="text-center font-semibold">Status</TableHead>
                      <TableHead className="w-36 text-right font-semibold">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {salesDrafts.map((draft) => (
                      <>
                        <TableRow key={draft.id} className="hover:bg-muted/30">
                          <TableCell className="font-medium">{draft.date}</TableCell>
                          <TableCell>{draft.outletName}</TableCell>
                          <TableCell className="text-right tabular-nums">{draft.totalPosSold}</TableCell>
                          <TableCell className="text-right tabular-nums">{draft.totalProductionSold}</TableCell>
                          <TableCell className="text-right tabular-nums">
                            <span className={draft.totalSelisih !== 0 ? 'text-destructive font-semibold' : 'text-green-600 font-semibold'}>
                              {draft.totalSelisih > 0 ? '+' : ''}{draft.totalSelisih}
                            </span>
                          </TableCell>
                          <TableCell className="text-center">
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                              {draft.status}
                            </span>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleViewDraft(draft)}
                                disabled={loadingDetailId === draft.id}
                              >
                                {loadingDetailId === draft.id ? (
                                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                ) : expandedDraftId === draft.id ? (
                                  'Hide'
                                ) : (
                                  'View'
                                )}
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleLoadDraft(draft)}
                              >
                                Load
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                        {expandedDraftId === draft.id && draftDetailMap[draft.id] && (
                          <TableRow key={`${draft.id}-detail`} className="bg-muted/20">
                            <TableCell colSpan={7} className="py-0">
                              <div className="px-4 py-3 space-y-2">
                                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                                  Detail — {draftDetailMap[draft.id].details?.length ?? 0} Plate Color(s)
                                </p>
                                <div className="rounded-md border overflow-hidden">
                                  <Table>
                                    <TableHeader>
                                      <TableRow className="bg-muted/60">
                                        <TableHead className="text-xs font-semibold py-2">Plate Color</TableHead>
                                        <TableHead className="text-right text-xs font-semibold py-2">POS Sold</TableHead>
                                        <TableHead className="text-right text-xs font-semibold py-2">Prod. Sold</TableHead>
                                        <TableHead className="text-right text-xs font-semibold py-2">Waste</TableHead>
                                        <TableHead className="text-right text-xs font-semibold py-2">Adjustment</TableHead>
                                        <TableHead className="text-right text-xs font-semibold py-2">Compensation</TableHead>
                                        <TableHead className="text-right text-xs font-semibold py-2">Selisih</TableHead>
                                      </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                      {(draftDetailMap[draft.id].details ?? []).map((d) => (
                                        <TableRow key={d.id} className="hover:bg-muted/20">
                                          <TableCell className="text-sm py-2">{d.plateColorName}</TableCell>
                                          <TableCell className="text-right tabular-nums text-sm py-2">{d.posSold}</TableCell>
                                          <TableCell className="text-right tabular-nums text-sm py-2">{d.productionSold}</TableCell>
                                          <TableCell className="text-right tabular-nums text-sm py-2 text-destructive">{d.productionWaste}</TableCell>
                                          <TableCell className="text-right tabular-nums text-sm py-2 text-blue-600">{d.adjustment > 0 ? '+' : ''}{d.adjustment}</TableCell>
                                          <TableCell className="text-right tabular-nums text-sm py-2 text-orange-600">{d.compensation > 0 ? '+' : ''}{d.compensation}</TableCell>
                                          <TableCell className="text-right tabular-nums text-sm py-2">
                                            <span className={d.selisih !== 0 ? 'text-destructive font-semibold' : 'text-green-600 font-semibold'}>
                                              {d.selisih > 0 ? '+' : ''}{d.selisih}
                                            </span>
                                          </TableCell>
                                        </TableRow>
                                      ))}
                                    </TableBody>
                                  </Table>
                                </div>
                              </div>
                            </TableCell>
                          </TableRow>
                        )}
                      </>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>

          <div className="flex items-center justify-end gap-3 px-6 py-4 border-t bg-muted/30">
            <Button variant="outline" onClick={() => setDraftDialogOpen(false)}>
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
