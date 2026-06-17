'use client'

import { useState } from 'react'
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
import { useOutlet } from '@/lib/outlet-context'
import { useMenus } from '@/hooks/use-menus'
import { usePlateColorsSortedByPrice } from '@/hooks/use-plate-colors'
import { useExpiredItems } from '@/hooks/use-production'
import { useToast } from '@/hooks/use-toast'
import { CheckCircle, AlertCircle, Loader2 } from 'lucide-react'
import type { PlateColor, SushiMenu } from "@/lib/types"
import { formatRupiah, lowercase } from "@/lib/utils"
import { useActiveWasteReasons } from '@/hooks/use-waste-reasons'

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

export function ExpiredItemsManager() {
  const { toast } = useToast() 
  const { menus, isLoading: menusLoading } = useMenus()
  const { selectedOutletId } = useOutlet()
  const { plateColors, isLoading: plateColorsLoading } = usePlateColorsSortedByPrice() 
  const {
    expiredItems,
    isLoading: expiredLoading,
    updateExpiredItem,
    removeExpiredItem,
    refresh,
  } = useExpiredItems(selectedOutletId)

  const { wasteReasons } = useActiveWasteReasons()

  const [selectedColor, setSelectedColor] = useState<string | null>(null)
  const [updateDialogOpen, setUpdateDialogOpen] = useState(false)
  const [selectedItem, setSelectedItem] = useState<typeof expiredItems[0] | null>(null)
  const [newStatus, setNewStatus] = useState<'sold' | 'waste'>('sold')
  const [wasteReason, setWasteReason] = useState('')
  const [isUpdating, setIsUpdating] = useState(false)

  const isLoading = menusLoading || plateColorsLoading || expiredLoading

  const filteredItems = selectedColor
    ? expiredItems.filter((item) => item.plateColor === selectedColor)
    : expiredItems

  const handleOpenUpdateDialog = (item: typeof expiredItems[0]) => {
    setSelectedItem(item)
    setNewStatus(item.status || 'sold')
    setWasteReason(item.notes || '')
    setUpdateDialogOpen(true)
  }

  const handleConfirmUpdate = async () => {
    if (newStatus === 'waste' && !wasteReason.trim()) {
      toast({
        title: 'Required Field',
        description: 'Please select a waste reason',
        variant: 'destructive',
      })
      return
    }

    if (!selectedItem) return
    // Guard against double-clicks while the update request is in flight.
    if (isUpdating) return

    setIsUpdating(true)
    try {
      await updateExpiredItem(selectedItem.id, newStatus, newStatus === 'waste' ? wasteReason : '')
      toast({
        title: 'Status Updated',
        description: `${selectedItem.menuName} marked as ${newStatus}`,
        variant: newStatus === 'waste' ? 'destructive' : 'default',
      })
      setUpdateDialogOpen(false)
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update item status',
        variant: 'destructive',
      })
    } finally {
      setIsUpdating(false)
    }
  }

  const calculateExpiredTime = (item: typeof expiredItems[0]) => {
    return new Date(item.expiresAt)
  }
   
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold">Expired Items</h1>
          <p className="text-muted-foreground mt-1">
            Manage items that have exceeded their shelf life:{' '}
            <span className="font-semibold text-foreground">{expiredItems.length}</span>
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
      ) : filteredItems.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <p className="text-muted-foreground text-lg">No expired items</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
          {filteredItems.map((item) => {
            const menuItem = menus.find((m) => m.id === item.menuId)
            const productionTime = new Date(item.producedAt)
            const expiredTime = calculateExpiredTime(item)

            return (
              <Card
                key={item.id}
                className="relative h-56 overflow-hidden group ring-1 ring-gray-200"
              >
                {/* FULL IMAGE */}
                {menuItem?.image && (
                  <Image
                    src={menuItem.image}
                    alt={item.menuName}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                )}

                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />

                {/* CONTENT */}
                <div className="absolute inset-0 p-3 flex flex-col justify-between text-gray-900">
                  {/* TOP */}
                  <div className="flex justify-between items-start">
                    <PlateColorBadge color={(lowercase(item.plateColorName) as PlateColor) || "white" } />
                    {/* Penanda waktu produksi */}
                    {(() => {
                      const slotColor = getTimeSlotColor(productionTime)
                      return (
                        <span
                          className={`inline-flex items-center justify-center w-6 h-6 rounded-full ${slotColor.bg} text-white text-[10px] font-bold ring-2 ${slotColor.ring} shadow-md`}
                          title={`${slotColor.label} — ${productionTime.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}`}
                        >
                          {slotColor.label[0]}
                        </span>
                      )
                    })()}
                  </div>

                  {/* BOTTOM */}
                  <div className="space-y-2">
                    {/* Name */}
                    <h3 className="text-sm font-semibold ">{item.menuName}</h3>

                    {/* Production Details */}
                    <div className="text-xs space-y-1 bg-white/70 backdrop-blur-sm p-2 rounded-md border border-gray-200">
                      <p>
                        Prod:{' '}
                        <span className="font-medium">{productionTime.toLocaleTimeString()}</span>
                      </p>

                      <p>
                        Exp:{' '}
                        <span className="font-medium text-red-600">
                          {expiredTime.toLocaleTimeString()}
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
                      onClick={() => handleOpenUpdateDialog(item)}
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
      {selectedItem && (
        <Dialog open={updateDialogOpen} onOpenChange={setUpdateDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Update Expired Item</DialogTitle>
              <DialogDescription>
                Update the status and add notes for:{' '}
                <span className="font-semibold">{selectedItem.menuName}</span>
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              {/* Menu Details */}
              <div className="bg-muted/30 border rounded-lg p-3 space-y-2">
                <h3 className="font-semibold text-sm">{selectedItem.menuName}</h3>
                <div className="text-xs text-muted-foreground space-y-1">
                  <p>
                    <span className="font-medium">Production:</span>{' '}
                    {new Date(selectedItem.producedAt).toLocaleString()}
                  </p>
                  <p>
                    <span className="font-medium">Expired:</span>{' '}
                    {calculateExpiredTime(selectedItem).toLocaleString()}
                  </p>
                  <p className="flex items-center gap-1 text-red-600 font-medium">
                    <AlertCircle className="w-3 h-3" />
                    Time Expired
                  </p>
                </div>
              </div>

              {/* Status Selection */}
              <div className="space-y-2">
                <Label htmlFor="status" className="font-medium">
                  Status
                </Label>
                <Select
                  value={newStatus}
                  onValueChange={(value) => setNewStatus(value as 'sold' | 'waste')}
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
              {newStatus === 'waste' && (
                <div className="space-y-2">
                  <Label htmlFor="waste-reason" className="font-medium">
                    Waste Reason <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    value={wasteReason}
                    onValueChange={setWasteReason}
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
              <Button variant="outline" onClick={() => setUpdateDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleConfirmUpdate}
                disabled={isUpdating}
                className={`${newStatus === 'waste' ? 'bg-red-600 hover:bg-red-700' : 'bg-emerald-600 hover:bg-emerald-700'}`}
              >
                {isUpdating && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Update Status
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
