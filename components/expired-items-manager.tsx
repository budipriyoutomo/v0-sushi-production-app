'use client'

import { useMemo, useState } from 'react'
import Image from 'next/image'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { PlateColorBadge } from '@/components/plate-color-badge'
import { OutletSelector } from '@/components/outlet-selector'
import { PlateQuantityStepper } from '@/components/plate-quantity-stepper'
import { useOutlet } from '@/lib/outlet-context'
import { useMenus } from '@/hooks/use-menus'
import { usePlateColorsSortedByPrice } from '@/hooks/use-plate-colors'
import { useExpiredGroups } from '@/hooks/use-production'
import { useToast } from '@/hooks/use-toast'
import { useActiveWasteReasons } from '@/hooks/use-waste-reasons'
import { getApiError, type ProductionItemGroup } from '@/lib/api'
import { CheckCircle, AlertCircle, Loader2 } from 'lucide-react'
import { lowercase } from '@/lib/utils'

// Ukuran gambar per breakpoint, mengikuti kolom grid di bawah. Lihat catatan
// yang sama di conveyor-screen.tsx.
const CARD_IMAGE_SIZES =
  '(min-width: 1280px) 16vw, (min-width: 1024px) 20vw, (min-width: 768px) 25vw, (min-width: 640px) 33vw, 50vw'

// Siklus warna penanda waktu sesuai production-planning: Biru → Hitam → Merah → Kuning → Hijau
const TIME_SLOT_COLORS = [
  { label: "Biru",   bg: "bg-blue-500",   ring: "ring-blue-300" },
  { label: "Hitam",  bg: "bg-gray-800",   ring: "ring-gray-500" },
  { label: "Merah",  bg: "bg-red-500",    ring: "ring-red-300" },
  { label: "Kuning", bg: "bg-yellow-400", ring: "ring-yellow-300" },
  { label: "Hijau",  bg: "bg-green-500",  ring: "ring-green-300" },
]

// Hitung index slot 30 menit dari jam produksi (slot 0 = 10:00)
function getTimeSlotIndex(producedAt: Date): number {
  const h = producedAt.getHours()
  const m = producedAt.getMinutes()
  const totalMinutes = h * 60 + m
  const baseMinutes = 10 * 60 // 10:00
  const slotIndex = Math.floor((totalMinutes - baseMinutes) / 30)
  return Math.max(0, slotIndex)
}

function getTimeSlotColor(producedAt: Date) {
  const idx = getTimeSlotIndex(producedAt)
  return TIME_SLOT_COLORS[idx % TIME_SLOT_COLORS.length]
}

/** Satu batch dengan tanggalnya sudah diurai, dihitung sekali per perubahan data. */
interface ExpiredBatch extends ProductionItemGroup {
  producedAtDate: Date
  expiresAtDate: Date
}

interface UpdateDialogState {
  open: boolean
  group: ExpiredBatch | null
  quantity: number
  status: 'sold' | 'waste'
  wasteReason: string
  isSubmitting: boolean
}

const CLOSED_UPDATE_DIALOG: UpdateDialogState = {
  open: false,
  group: null,
  quantity: 1,
  status: 'sold',
  wasteReason: '',
  isSubmitting: false,
}

export function ExpiredItemsManager() {
  const { toast } = useToast()
  const { selectedOutletId } = useOutlet()
  const { menus, isLoading: menusLoading } = useMenus(selectedOutletId)
  const { plateColors, isLoading: plateColorsLoading } = usePlateColorsSortedByPrice(selectedOutletId)
  const { groups, isLoading: expiredLoading, updateItems } = useExpiredGroups(selectedOutletId)
  const { wasteReasons } = useActiveWasteReasons()

  const [selectedColor, setSelectedColor] = useState<string | null>(null)
  const [dialog, setDialog] = useState<UpdateDialogState>(CLOSED_UPDATE_DIALOG)

  const isLoading = menusLoading || plateColorsLoading || expiredLoading

  // Peta sekali, bukan `menus.find()` per kartu di tiap render.
  const menuById = useMemo(() => new Map(menus.map((menu) => [menu.id, menu])), [menus])

  const batches: ExpiredBatch[] = useMemo(
    () =>
      groups.map((group) => ({
        ...group,
        producedAtDate: new Date(group.producedAt),
        expiresAtDate: new Date(group.expiresAt),
      })),
    [groups]
  )

  const visibleBatches = useMemo(
    () =>
      selectedColor ? batches.filter((batch) => batch.plateColor === selectedColor) : batches,
    [batches, selectedColor]
  )

  // Piring, bukan batch — ini angka yang berarti buat operator.
  const expiredPlateCount = useMemo(
    () => batches.reduce((total, batch) => total + batch.quantity, 0),
    [batches]
  )

  const handleOpenUpdateDialog = (group: ExpiredBatch) => {
    // Default seluruh batch: tidak seperti waste di conveyor, halaman ini
    // menutup sisa hari dan yang lazim adalah menutup semuanya sekaligus.
    setDialog({
      open: true,
      group,
      quantity: group.quantity,
      status: 'sold',
      wasteReason: '',
      isSubmitting: false,
    })
  }

  const handleCloseDialog = () => {
    if (!dialog.isSubmitting) {
      setDialog(CLOSED_UPDATE_DIALOG)
    }
  }

  const handleConfirmUpdate = async () => {
    const group = dialog.group
    if (!group) return

    if (dialog.status === 'waste' && !dialog.wasteReason.trim()) {
      toast({
        title: 'Required Field',
        description: 'Please select a waste reason',
        variant: 'destructive',
      })
      return
    }

    // Guard against double-clicks while the update request is in flight.
    if (dialog.isSubmitting) return

    setDialog((prev) => ({ ...prev, isSubmitting: true }))
    try {
      const result = await updateItems(
        group.itemIds.slice(0, dialog.quantity),
        dialog.status,
        dialog.status === 'waste' ? dialog.wasteReason : undefined
      )

      setDialog(CLOSED_UPDATE_DIALOG)
      toast({
        title: 'Status Updated',
        description:
          // `skipped` bukan kegagalan: piring itu sudah ditutup tablet lain.
          // Tetap disebut supaya angka di layar tidak terlihat "kurang".
          result.skipped > 0
            ? `${result.updated} × ${group.menuName} → ${dialog.status}. ${result.skipped} sudah ditutup di tempat lain.`
            : `${result.updated} × ${group.menuName} → ${dialog.status}`,
        variant: dialog.status === 'waste' ? 'destructive' : 'default',
      })
    } catch (error) {
      const apiError = getApiError(error)
      setDialog((prev) => ({ ...prev, isSubmitting: false }))
      toast({
        title: 'Error',
        description: apiError.message,
        variant: 'destructive',
      })
    }
  }

  const dialogMenu = dialog.group ? menuById.get(dialog.group.menuId) : undefined

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold">Expired Items</h1>
          <p className="text-muted-foreground mt-1">
            Manage items that have exceeded their shelf life:{' '}
            <span className="font-semibold text-foreground">{expiredPlateCount}</span>
          </p>
        </div>
        <OutletSelector />
      </div>

      {/* Filter by Plate Color */}
      <div className="flex flex-wrap gap-2">
        <Button
          variant={selectedColor === null ? 'default' : 'outline'}
          onClick={() => setSelectedColor(null)}
          className="px-4 py-2"
        >
          All Colors
        </Button>
        {plateColors.map((plate) => (
          <Button
            key={plate.id}
            variant={selectedColor === plate.id ? 'default' : 'outline'}
            onClick={() => setSelectedColor(plate.id)}
            className="px-4 py-2 capitalize"
          >
            {plate.platename}
          </Button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      ) : visibleBatches.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <p className="text-muted-foreground text-lg">No expired items</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
          {visibleBatches.map((batch) => {
            const menuItem = menuById.get(batch.menuId)
            const slotColor = getTimeSlotColor(batch.producedAtDate)

            return (
              <Card
                key={batch.groupKey}
                className="relative h-56 overflow-hidden group ring-1 ring-gray-200"
              >
                {/* FULL IMAGE */}
                {menuItem?.image && (
                  <Image
                    src={menuItem.image}
                    alt={batch.menuName}
                    fill
                    sizes={CARD_IMAGE_SIZES}
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                )}

                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />

                {/* CONTENT */}
                <div className="absolute inset-0 p-3 flex flex-col justify-between text-gray-900">
                  {/* TOP */}
                  <div className="flex justify-between items-start">
                    <PlateColorBadge color={lowercase(batch.plateColorName) || 'white'} />

                    <div className="flex items-center gap-1">
                      <span
                        className="inline-flex items-center justify-center min-w-7 h-6 px-1.5 rounded-full bg-black/70 text-white text-xs font-bold ring-1 ring-white/40 shadow-md"
                        aria-label={`${batch.quantity} plate`}
                      >
                        ×{batch.quantity}
                      </span>

                      {/* Penanda waktu produksi */}
                      <span
                        className={`inline-flex items-center justify-center w-6 h-6 rounded-full ${slotColor.bg} text-white text-[10px] font-bold ring-2 ${slotColor.ring} shadow-md`}
                        title={`${slotColor.label} — ${batch.producedAtDate.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}`}
                      >
                        {slotColor.label[0]}
                      </span>
                    </div>
                  </div>

                  {/* BOTTOM */}
                  <div className="space-y-2">
                    {/* Name */}
                    <h3 className="text-sm font-semibold ">{batch.menuName}</h3>

                    {/* Production Details */}
                    <div className="text-xs space-y-1 bg-white/70 backdrop-blur-sm p-2 rounded-md border border-gray-200">
                      <p>
                        Prod:{' '}
                        <span className="font-medium">
                          {batch.producedAtDate.toLocaleTimeString()}
                        </span>
                      </p>

                      <p>
                        Exp:{' '}
                        <span className="font-medium text-red-600">
                          {batch.expiresAtDate.toLocaleTimeString()}
                        </span>
                      </p>

                      <p className="flex items-center gap-1 text-red-600 font-semibold">
                        <AlertCircle className="w-3 h-3" />
                        Time Expired
                      </p>
                    </div>

                    {/* Update Button */}
                    <Button
                      size="sm"
                      onClick={() => handleOpenUpdateDialog(batch)}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white text-xs h-8"
                    >
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Update
                    </Button>
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
      )}

      {/* Update Dialog */}
      {dialog.group && (
        <Dialog open={dialog.open} onOpenChange={handleCloseDialog}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Update Expired Item</DialogTitle>
              <DialogDescription>
                Update the status and add notes for:{' '}
                <span className="font-semibold">{dialog.group.menuName}</span>
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              {/* Menu Details */}
              <div className="bg-muted/30 border rounded-lg p-3 flex items-center gap-3">
                {dialogMenu?.image && (
                  <div className="relative w-14 h-14 rounded-md overflow-hidden flex-shrink-0">
                    <Image
                      src={dialogMenu.image}
                      alt={dialog.group.menuName}
                      fill
                      sizes="56px"
                      className="object-cover"
                    />
                  </div>
                )}
                <div className="min-w-0 space-y-1">
                  <h3 className="font-semibold text-sm">{dialog.group.menuName}</h3>
                  <div className="text-xs text-muted-foreground space-y-1">
                    <p>
                      <span className="font-medium">Production:</span>{' '}
                      {dialog.group.producedAtDate.toLocaleString()}
                    </p>
                    <p>
                      <span className="font-medium">Expired:</span>{' '}
                      {dialog.group.expiresAtDate.toLocaleString()}
                    </p>
                    <p className="flex items-center gap-1 text-red-600 font-medium">
                      <AlertCircle className="w-3 h-3" />
                      {dialog.group.quantity} plate di batch ini
                    </p>
                  </div>
                </div>
              </div>

              {/* Berapa piring dari batch ini yang ditutup */}
              <PlateQuantityStepper
                value={dialog.quantity}
                max={dialog.group.quantity}
                disabled={dialog.isSubmitting}
                label="Jumlah diproses"
                onChange={(quantity) => setDialog((prev) => ({ ...prev, quantity }))}
              />

              {/* Status Selection */}
              <div className="space-y-2">
                <Label htmlFor="status" className="font-medium">
                  Status
                </Label>
                <Select
                  value={dialog.status}
                  onValueChange={(value) =>
                    setDialog((prev) => ({ ...prev, status: value as 'sold' | 'waste' }))
                  }
                >
                  <SelectTrigger id="status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sold">Sold</SelectItem>
                    <SelectItem value="waste">Waste</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Waste Reason Dropdown - only shown when status is waste */}
              {dialog.status === 'waste' && (
                <div className="space-y-2">
                  <Label htmlFor="waste-reason" className="font-medium">
                    Waste Reason <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    value={dialog.wasteReason}
                    onValueChange={(value) =>
                      setDialog((prev) => ({ ...prev, wasteReason: value }))
                    }
                  >
                    <SelectTrigger id="waste-reason">
                      <SelectValue placeholder="Select a waste reason..." />
                    </SelectTrigger>
                    <SelectContent>
                      {wasteReasons
                        .filter((reason) => reason && reason.reason_name)
                        .map((reason) => (
                          <SelectItem key={reason.id} value={reason.reason_name}>
                            {reason.reason_name}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">This field is required when status is Waste</p>
                </div>
              )}
            </div>

            <DialogFooter className="flex gap-2">
              <Button variant="outline" onClick={handleCloseDialog} disabled={dialog.isSubmitting}>
                Cancel
              </Button>
              <Button
                onClick={handleConfirmUpdate}
                disabled={dialog.isSubmitting}
                className={`${dialog.status === 'waste' ? 'bg-red-600 hover:bg-red-700' : 'bg-emerald-600 hover:bg-emerald-700'}`}
              >
                {dialog.isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Update Status
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
