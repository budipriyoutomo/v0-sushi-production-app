'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { OutletSelector } from '@/components/outlet-selector'
import { useToast } from '@/hooks/use-toast'
import { useOutlet } from '@/lib/outlet-context'
import { PlateColorBadge } from '@/components/plate-color-badge'
import { Textarea } from '@/components/ui/textarea'
import { CheckCircle, AlertCircle, Download, Upload, FileText, Loader2, MessageSquare, MessageSquarePlus } from 'lucide-react'
import { salesService, type SalesDraft, closingReportService, type ClosingReportEntry, getApiError } from '@/lib/api'

interface MenuSalesEntry {
  menuId: string
  menuName: string
  code: string
  plateColor: string
  sellingPrice: number
  produced: number
  sold: number
  waste: number
  posSold: number
  adjustment: number
  compensation: number
  compensationReason?: string
}

export function ClosingReport() {
  const { toast } = useToast()
  const { selectedOutletId } = useOutlet()
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [salesEntries, setSalesEntries] = useState<MenuSalesEntry[]>([])
  const [closingEntries, setClosingEntries] = useState<ClosingReportEntry[]>([])
  const [wastePhotos, setWastePhotos] = useState<File[]>([])
  const [uploadedPhotoUrls, setUploadedPhotoUrls] = useState<string[]>([])
  const [kitchenLeader, setKitchenLeader] = useState('')
  const [operationLeader, setOperationLeader] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLoadingData, setIsLoadingData] = useState(false)
  const [isSavingDraft, setIsSavingDraft] = useState(false)
  const [isUploadingPhotos, setIsUploadingPhotos] = useState(false)
  const [currentReportId, setCurrentReportId] = useState<string | null>(null)
  const [status, setStatus] = useState<'draft' | 'submitted' | 'verified'>('draft')

  // Compensation note dialog state
  const [noteDialogOpen, setNoteDialogOpen] = useState(false)
  const [noteTarget, setNoteTarget] = useState<{ draftId: string; detailId: string; plateColorName: string } | null>(null)
  const [noteValue, setNoteValue] = useState('')
  // Store notes per detail id: { [detailId]: string }
  const [compensationNotes, setCompensationNotes] = useState<Record<string, string>>({})

  const handleOpenNoteDialog = (draftId: string, detailId: string, plateColorName: string) => {
    setNoteTarget({ draftId, detailId, plateColorName })
    setNoteValue(compensationNotes[detailId] ?? '')
    setNoteDialogOpen(true)
  }

  const handleSaveNote = () => {
    if (!noteTarget) return
    setCompensationNotes((prev) => ({ ...prev, [noteTarget.detailId]: noteValue }))
    setNoteDialogOpen(false)
    setNoteTarget(null)
  }

  // Sales Draft Dialog state
  const [draftDialogOpen, setDraftDialogOpen] = useState(false)
  const [salesDrafts, setSalesDrafts] = useState<SalesDraft[]>([])
  const [isLoadingDrafts, setIsLoadingDrafts] = useState(false)
  const [expandedDraftId, setExpandedDraftId] = useState<string | null>(null)
  const [draftDetailMap, setDraftDetailMap] = useState<Record<string, SalesDraft>>({})
  const [loadingDetailId, setLoadingDetailId] = useState<string | null>(null)
  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const files = Array.from(e.target.files)
      setWastePhotos(files)
      
      // Upload photos to server
      setIsUploadingPhotos(true)
      try {
        const urls = await closingReportService.uploadWastePhotos(files)
        setUploadedPhotoUrls(urls)
        toast({
          title: 'Success',
          description: `${files.length} photo(s) uploaded successfully`,
        })
      } catch (error) {
        toast({
          title: 'Error',
          description: getApiError(error),
          variant: 'destructive',
        })
      } finally {
        setIsUploadingPhotos(false)
      }
    }
  }

  // Fetch closing report data from API
  const handleGetData = async () => {
    if (!selectedOutletId) {
      toast({
        title: 'Error',
        description: 'Please select an outlet first',
        variant: 'destructive',
      })
      return
    }

    setIsLoadingData(true)
    try {
      const data = await closingReportService.getData({
        outletId: selectedOutletId,
        date: date,
      })

      // Store the closing report entries
      setClosingEntries(data.entries)
      setCurrentReportId(data.id || null)
      setStatus(data.status || 'draft')
      setKitchenLeader(data.kitchenLeader || '')
      setOperationLeader(data.operationLeader || '')
      setUploadedPhotoUrls(data.wastePhotoUrls || [])

      // Transform to MenuSalesEntry format for display
      const entries: MenuSalesEntry[] = data.entries.map((entry) => ({
        menuId: entry.plateColorId,
        menuName: entry.plateColorName,
        code: entry.plateColorCode,
        plateColor: entry.plateColorName.toLowerCase(),
        sellingPrice: entry.sellingPrice,
        produced: entry.produced,
        sold: entry.sold,
        waste: entry.waste,
        posSold: entry.posSold,
        adjustment: entry.adjustment,
        compensation: entry.compensation,
        compensationReason: entry.compensationReason,
      }))
      setSalesEntries(entries)

      // Update compensation notes
      const notes: Record<string, string> = {}
      data.entries.forEach((entry) => {
        if (entry.compensationReason) {
          notes[entry.id] = entry.compensationReason
        }
      })
      setCompensationNotes(notes)

      toast({
        title: 'Data Loaded',
        description: `Loaded ${entries.length} entries for ${date}`,
      })
    } catch (error) {
      toast({
        title: 'Error',
        description: getApiError(error),
        variant: 'destructive',
      })
    } finally {
      setIsLoadingData(false)
    }
  }

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
      const fullDraft = await salesService.getById(draft.id)
      
      if (fullDraft.details && fullDraft.details.length > 0) {
        // Transform draft details to MenuSalesEntry format
        const entries: MenuSalesEntry[] = fullDraft.details.map((d) => ({
          menuId: d.plateColorId,
          menuName: d.plateColorName,
          code: '',
          plateColor: d.plateColorName.toLowerCase(),
          sellingPrice: 0,
          produced: d.productionSold + d.productionWaste,
          sold: d.productionSold,
          waste: d.productionWaste,
          posSold: d.posSold,
          adjustment: d.adjustment,
          compensation: d.compensation,
        }))
        setSalesEntries(entries)
        setDate(fullDraft.date)
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

  const totals = {
    produced: salesEntries.reduce((sum, e) => sum + e.produced, 0),
    sold: salesEntries.reduce((sum, e) => sum + e.sold, 0),
    waste: salesEntries.reduce((sum, e) => sum + e.waste, 0),
    adjustment: salesEntries.reduce((sum, e) => sum + e.adjustment, 0),
    compensation: salesEntries.reduce((sum, e) => sum + e.compensation, 0),
    compensationValue: salesEntries.reduce((sum, e) => sum + (e.compensation * e.sellingPrice), 0),
  }

  // Save as draft
  const handleSaveDraft = async () => {
    if (!selectedOutletId) {
      toast({
        title: 'Error',
        description: 'Please select an outlet first',
        variant: 'destructive',
      })
      return
    }

    if (closingEntries.length === 0) {
      toast({
        title: 'Error',
        description: 'Please load data first using "Get Data" button',
        variant: 'destructive',
      })
      return
    }

    setIsSavingDraft(true)
    try {
      const payload = {
        outletId: selectedOutletId,
        date: date,
        kitchenLeader: kitchenLeader || undefined,
        operationLeader: operationLeader || undefined,
        entries: closingEntries.map((entry) => ({
          plateColorId: entry.plateColorId,
          posSold: entry.posSold,
          adjustment: entry.adjustment,
          compensation: entry.compensation,
          compensationReason: compensationNotes[entry.id] || undefined,
        })),
      }

      if (currentReportId) {
        await closingReportService.updateDraft(currentReportId, payload)
      } else {
        const result = await closingReportService.saveDraft(payload)
        setCurrentReportId(result.id)
      }

      toast({
        title: 'Success',
        description: 'Draft saved successfully',
      })
    } catch (error) {
      toast({
        title: 'Error',
        description: getApiError(error),
        variant: 'destructive',
      })
    } finally {
      setIsSavingDraft(false)
    }
  }

  const handleSubmit = async () => {
    if (!selectedOutletId) {
      toast({
        title: 'Error',
        description: 'Please select an outlet first',
        variant: 'destructive',
      })
      return
    }

    if (!kitchenLeader || !operationLeader) {
      toast({
        title: 'Error',
        description: 'Please fill in both Kitchen Leader and Operation Leader fields',
        variant: 'destructive',
      })
      return
    }

    if (salesEntries.length === 0) {
      toast({
        title: 'Error',
        description: 'Please add at least one menu entry',
        variant: 'destructive',
      })
      return
    }

    setIsSubmitting(true)
    try {
      await closingReportService.submit({
        outletId: selectedOutletId,
        date: date,
        kitchenLeader: kitchenLeader,
        operationLeader: operationLeader,
        wastePhotoUrls: uploadedPhotoUrls.length > 0 ? uploadedPhotoUrls : undefined,
      })

      setStatus('submitted')
      toast({
        title: 'Success',
        description: 'Closing report submitted successfully',
      })
    } catch (error) {
      toast({
        title: 'Error',
        description: getApiError(error),
        variant: 'destructive',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold">Daily Closing Report</h1>
          <p className="text-muted-foreground mt-1">Complete end-of-day sales and inventory report</p>
        </div>
        <OutletSelector />
      </div>

      {/* Status Banner */}
      {status === 'submitted' && (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="pt-6 flex items-center gap-3">
            <CheckCircle className="w-6 h-6 text-green-600" />
            <div>
              <p className="font-semibold text-green-900">Report Submitted</p>
              <p className="text-sm text-green-700">This closing report has been submitted for verification</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Discrepancy Alert */}
      {salesEntries.some((e) => Math.abs(e.adjustment) > 0 || Math.abs(e.compensation) > 0) && status !== 'submitted' && (
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="pt-6 flex items-center gap-3">
            <AlertCircle className="w-6 h-6 text-amber-600" />
            <div>
              <p className="font-semibold text-amber-900">Differences Detected</p>
              <p className="text-sm text-amber-700">
                There are differences between COLORPLATE and POS sales data
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Report Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div>
              <CardTitle>Sales Report by Menu</CardTitle>
              <CardDescription>Date: {date}</CardDescription>
            </div>
            <div className="flex gap-2">
              <Input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                disabled={status === 'submitted'}
                className="w-32"
              />
              <Button 
                onClick={handleGetData}
                variant="outline"
                disabled={status === 'submitted' || isLoadingData}
                className="gap-2"
              >
                {isLoadingData ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Download className="w-4 h-4" />
                )}
                {isLoadingData ? 'Loading...' : 'Get Data'}
              </Button>
              <Button
                onClick={handleGetSalesDrafts}
                variant="outline"
                disabled={status === 'submitted'}
                className="gap-2"
              >
                <FileText className="w-4 h-4" />
                Get Sales Draft
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Sales Table */}
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Code</TableHead>
                  <TableHead>Menu</TableHead>
                  <TableHead>Color</TableHead>
                  <TableHead className="text-right">Harga Jual</TableHead>
                  <TableHead colSpan={3} className="text-center">COLORPLATE</TableHead>
                  <TableHead className="text-center">Adjustment</TableHead>
                  <TableHead className="text-center">Compensation</TableHead>
                </TableRow>
                <TableRow className="bg-muted/50">
                  <TableHead></TableHead>
                  <TableHead></TableHead>
                  <TableHead></TableHead>
                  <TableHead></TableHead>
                  <TableHead className="text-right text-xs">Produce</TableHead>
                  <TableHead className="text-right text-xs">Sold</TableHead>
                  <TableHead className="text-right text-xs">Waste</TableHead>
                  <TableHead className="text-right text-xs">Adj</TableHead>
                  <TableHead className="text-right text-xs">Qty</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {salesEntries.map((entry, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-mono font-semibold text-sm">{entry.code}</TableCell>
                    <TableCell className="font-medium">{entry.menuName}</TableCell>
                    <TableCell>
                      <PlateColorBadge color={entry.plateColor as any} />
                    </TableCell>
                    <TableCell className="text-right">
                      {entry.sellingPrice.toLocaleString('id-ID')}
                    </TableCell>
                    <TableCell className="text-right">{entry.produced}</TableCell>
                    <TableCell className="text-right">{entry.sold}</TableCell>
                    <TableCell className="text-right text-destructive">{entry.waste}</TableCell>
                    <TableCell className="text-right">{entry.adjustment > 0 ? '+' : ''}{entry.adjustment}</TableCell>
                    <TableCell className="text-right">{entry.compensation > 0 ? '+' : ''}{entry.compensation}</TableCell>
                  </TableRow>
                ))}
                <TableRow className="bg-muted/50 font-semibold">
                  <TableCell colSpan={4}>TOTAL</TableCell>
                  <TableCell className="text-right">{totals.produced}</TableCell>
                  <TableCell className="text-right">{totals.sold}</TableCell>
                  <TableCell className="text-right text-destructive">{totals.waste}</TableCell>
                  <TableCell className="text-right">{totals.adjustment > 0 ? '+' : ''}{totals.adjustment}</TableCell>
                  <TableCell className="text-right">{totals.compensation > 0 ? '+' : ''}{totals.compensation}</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>

          {/* Waste Photos Upload */}
          {status !== 'submitted' && (
            <div className="border-2 border-dashed rounded-lg p-4 text-center">
              <div className="flex flex-col items-center gap-3">
                <Upload className="w-6 h-6 text-muted-foreground" />
                <div>
                  <p className="font-medium">Upload Waste Photos</p>
                  <p className="text-sm text-muted-foreground">Multiple photos allowed</p>
                </div>
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  className="hidden"
                  id="waste-photos"
                />
                <label htmlFor="waste-photos">
                  <Button asChild variant="outline">
                    <span>Choose Photos</span>
                  </Button>
                </label>
                {isUploadingPhotos && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Uploading photos...
                  </div>
                )}
                {wastePhotos.length > 0 && !isUploadingPhotos && (
                  <p className="text-sm text-green-600">
                    {wastePhotos.length} photo(s) {uploadedPhotoUrls.length > 0 ? 'uploaded' : 'selected'}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Summary Statistics */}
          <div className="space-y-4 mt-6">
            {/* Row 1: Plate Color, POS, Adjustment */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="bg-blue-50 border-blue-200">
                <CardContent className="pt-4">
                  <p className="text-xs text-muted-foreground mb-2">COLORPLATE SUMMARY</p>
                  <div className="space-y-1">
                    <p className="text-sm"><span className="text-muted-foreground">Produced:</span> <span className="font-bold">{totals.produced}</span></p>
                    <p className="text-sm"><span className="text-muted-foreground">Sold:</span> <span className="font-bold text-green-600">{totals.sold}</span></p>
                    <p className="text-sm"><span className="text-muted-foreground">Waste:</span> <span className="font-bold text-red-600">{totals.waste}</span></p>
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-orange-50 border-orange-200">
                <CardContent className="pt-4">
                  <p className="text-xs text-muted-foreground mb-2">TOTAL ADJUSTMENT</p>
                  <p className="text-2xl font-bold text-orange-600">{totals.adjustment > 0 ? '+' : ''}{totals.adjustment}</p>
                </CardContent>
              </Card>
            </div>

            {/* Row 2: Compensation */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card className="bg-purple-50 border-purple-200">
                <CardContent className="pt-4">
                  <p className="text-xs text-muted-foreground mb-2">TOTAL COMPENSATION (QTY)</p>
                  <p className="text-2xl font-bold text-purple-600">{totals.compensation}</p>
                </CardContent>
              </Card>
              <Card className="bg-indigo-50 border-indigo-200">
                <CardContent className="pt-4">
                  <p className="text-xs text-muted-foreground mb-2">TOTAL COMPENSATION VALUE</p>
                  <p className="text-2xl font-bold text-indigo-600">Rp {totals.compensationValue.toLocaleString('id-ID')}</p>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Signature Section */}
          <div className="pt-4 border-t space-y-4">
            <p className="font-semibold text-sm">Signed By:</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="kitchenLeader">1. Kitchen Leader</Label>
                <Input
                  id="kitchenLeader"
                  placeholder="Name & Title"
                  value={kitchenLeader}
                  onChange={(e) => setKitchenLeader(e.target.value)}
                  disabled={status === 'submitted'}
                  className="mt-2"
                />
              </div>
              <div>
                <Label htmlFor="operationLeader">2. Operation Leader</Label>
                <Input
                  id="operationLeader"
                  placeholder="Name & Title"
                  value={operationLeader}
                  onChange={(e) => setOperationLeader(e.target.value)}
                  disabled={status === 'submitted'}
                  className="mt-2"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex gap-2 justify-end">
        <Button 
          variant="outline" 
          disabled={status === 'submitted' || isSavingDraft || salesEntries.length === 0}
          onClick={handleSaveDraft}
          className="gap-2"
        >
          {isSavingDraft ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Saving...
            </>
          ) : (
            'Save as Draft'
          )}
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={isSubmitting || status === 'submitted'}
          className="gap-2"
        >
          <CheckCircle className="w-4 h-4" />
          {isSubmitting ? 'Submitting...' : 'Submit Closing Report'}
        </Button>
      </div>

      {/* Compensation Note Dialog */}
      <Dialog open={noteDialogOpen} onOpenChange={setNoteDialogOpen}>
        <DialogContent className="max-w-sm w-full">
          <div className="pb-2">
            <DialogTitle className="text-base font-semibold">Keterangan Kompensasi</DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground mt-1">
              {noteTarget?.plateColorName} — isi keterangan alasan kompensasi
            </DialogDescription>
          </div>
          <div className="space-y-3">
            <Textarea
              placeholder="Contoh: Piring jatuh, komplain pelanggan, dll."
              value={noteValue}
              onChange={(e) => setNoteValue(e.target.value)}
              rows={4}
              className="resize-none"
            />
            <div className="flex justify-end gap-2">
              <Button variant="outline" size="sm" onClick={() => setNoteDialogOpen(false)}>
                Batal
              </Button>
              <Button size="sm" onClick={handleSaveNote}>
                Simpan
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Sales Draft List Dialog */}
      <Dialog open={draftDialogOpen} onOpenChange={setDraftDialogOpen}>
        <DialogContent className="max-w-3xl w-full max-h-[85vh] flex flex-col p-0 gap-0">
          <div className="px-6 pt-6 pb-4 border-b">
            <DialogTitle className="text-lg font-semibold">Sales Drafts</DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground mt-1">
              Select a draft to load into the closing report. Only drafts with status &quot;draft&quot; are shown.
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
                                        <TableHead className="text-center text-xs font-semibold py-2">Keterangan</TableHead>
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
                                          <TableCell className="text-center py-2">
                                            <Button
                                              size="sm"
                                              variant="ghost"
                                              className="h-7 w-7 p-0"
                                              title={compensationNotes[d.id] ? compensationNotes[d.id] : 'Tambah keterangan kompensasi'}
                                              onClick={() => handleOpenNoteDialog(draft.id, d.id, d.plateColorName)}
                                            >
                                              {compensationNotes[d.id]
                                                ? <MessageSquare className="w-3.5 h-3.5 text-orange-500" />
                                                : <MessageSquarePlus className="w-3.5 h-3.5 text-muted-foreground" />
                                              }
                                            </Button>
                                          </TableCell>
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
