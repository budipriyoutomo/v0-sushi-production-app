"use client"

import { useState } from "react"
import Image from "next/image"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { PlateColorBadge } from "@/components/plate-color-badge"
import { OutletSelector } from "@/components/outlet-selector"
import { ExpirationCountdown } from "@/components/expiration-countdown"
import { useOutlet } from "@/lib/outlet-context"
import { useConveyorItems } from "@/hooks/use-production"
import { usePlateColorsSortedByPrice } from "@/hooks/use-plate-colors"
import { useMenus } from "@/hooks/use-menus"
import { useActiveWasteReasons } from "@/hooks/use-waste-reasons"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/hooks/use-auth"
import { productionService, getApiError } from "@/lib/api"
import { CheckCircle, XCircle, Loader2 } from "lucide-react"
import { formatRupiah, lowercase } from "@/lib/utils"
import type { PlateColor, SushiMenu } from "@/lib/types"

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

interface ItemWithWasteReason {
  id: string
  menuId: string
  menuName: string
  plateColor: string
  plateColorName: string
  producedAt: Date
  expiresAt: Date
  finalStatus: 'sold' | 'waste' | null
  soldAt: Date | null
  wastedAt: Date | null
  beltStatus: 'fresh' | 'warning' | 'expired'
}

export function ConveyorScreen() {
  const { toast } = useToast()
  const { user } = useAuth()
  const { selectedOutletId } = useOutlet()
  
  // Check if user can use Sold and Waste buttons
  // Kitchen role should have these buttons disabled
  const canUseSoldWasteButtons = user?.role?.toLowerCase() !== 'kitchen'
  const { items: conveyorItems, isLoading, refresh } = useConveyorItems(selectedOutletId)
  const { plateColors } = usePlateColorsSortedByPrice()
  const { menus } = useMenus()
  const { wasteReasons } = useActiveWasteReasons()
  const [selectedColorId, setSelectedColorId] = useState<string | null>(null)
  const [wasteDialog, setWasteDialog] = useState<{
    open: boolean
    itemId: string
    menuId: string
    menuName: string
    plateColorName: string
    producedAt: Date | null
    reason: string
    isSubmitting: boolean
  }>({ open: false, itemId: "", menuId: "", menuName: "", plateColorName: "", producedAt: null, reason: "", isSubmitting: false })

  // Map conveyor items to include local state
  const items: ItemWithWasteReason[] = conveyorItems.map((item) => ({
    ...item,
    producedAt: new Date(item.producedAt),
    expiresAt: new Date(item.expiresAt),
    soldAt: item.soldAt ? new Date(item.soldAt) : null,
    wastedAt: item.wastedAt ? new Date(item.wastedAt) : null,
  }))

  // Filter out expired items (time remaining <= 0)
/* const activeItems = items.filter((item) => {
  return new Date(item.expiresAt).getTime() > Date.now()
})*/
  
const activeItems = items.filter(
  (item) => item.finalStatus === null
)

  const filteredItems = selectedColorId ? activeItems.filter((item) => item.plateColor === selectedColorId) : activeItems

  // Sort by time remaining (expiring soon first)
 const sortedItems = [...filteredItems].sort(
  (a, b) => a.expiresAt.getTime() - b.expiresAt.getTime()
)

  const handleMarkSold = async (itemId: string, menuName: string) => {
    try {
      //await productionService.removeExpired([itemId])
      await productionService.markSold([itemId])
      await refresh()
      toast({
        title: "Marked as Sold",
        description: `${menuName} removed from conveyor`,
      })
    } catch (error) {
      const apiError = getApiError(error)
      toast({
        title: "Error",
        description: apiError.message,
        variant: "destructive",
      })
    }
  }

  const handleWasteClick = (item: ItemWithWasteReason) => {
    setWasteDialog({
      open: true,
      itemId: item.id,
      menuId: item.menuId,
      menuName: item.menuName,
      plateColorName: item.plateColorName,
      producedAt: item.producedAt,
      reason: "",
      isSubmitting: false,
    })
  }

  const handleWasteDialogClose = () => {
    if (!wasteDialog.isSubmitting) {
      setWasteDialog((prev) => ({ ...prev, open: false, reason: "" }))
    }
  }

  const handleConfirmWaste = async () => {
    if (!wasteDialog.reason.trim()) {
      toast({
        title: "Error",
        description: "Please select a reason for waste",
        variant: "destructive",
      })
      return
    }
    setWasteDialog((prev) => ({ ...prev, isSubmitting: true }))
    try {
      await productionService.recordWaste({ itemIds: [wasteDialog.itemId], reason: wasteDialog.reason })
      await productionService.markWaste([wasteDialog.itemId])
      await refresh()
      setWasteDialog({ open: false, itemId: "", menuId: "", menuName: "", plateColorName: "", producedAt: null, reason: "", isSubmitting: false })
      toast({
        title: "Marked as Waste",
        description: `${wasteDialog.menuName} - Reason: ${wasteDialog.reason}`,
        variant: "destructive",
      })
    } catch (error) {
      const apiError = getApiError(error)
      setWasteDialog((prev) => ({ ...prev, isSubmitting: false }))
      toast({
        title: "Error",
        description: apiError.message,
        variant: "destructive",
      })
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold">Conveyor Management</h1>
          <p className="text-muted-foreground mt-1">Monitor and manage active production</p>
        </div>
        <OutletSelector />
      </div>

      { /* Filter by Plate Color */ }
      <div className="flex gap-2 flex-wrap">
        <Button
          variant={selectedColorId === null ? "default" : "outline"}
          onClick={() => setSelectedColorId(null)}
          className="px-4 py-2"
        >
          All Colors
        </Button>
        {plateColors.map((plate) => (
            <Button
              key={plate.id}
              variant={selectedColorId === plate.id ? "default" : "outline"}
              onClick={() => setSelectedColorId(plate.id)}
              className="px-4 py-2 capitalize"
            >
              {plate.platename}
            </Button>
          ))}
      </div>

      {/* Items Grid */}  
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      ) : sortedItems.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <p className="text-muted-foreground text-lg">
              {items.length === 0 ? "No active plates on conveyor" : "No plates with selected color"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
          {sortedItems.map((item) => {
            const menuItem = menus.find((m) => m.id === item.menuId)
            const shelfLifeMinutes = Math.floor((item.expiresAt.getTime() - item.producedAt.getTime()) / 60000)
            return (
              <Card
                key={item.id}
                className="relative h-56 overflow-hidden group cursor-pointer"
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

                {/* DARK GRADIENT OVERLAY */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />

                {/* CONTENT */}
                <div className="absolute inset-0 p-3 flex flex-col justify-between text-white">

                  {/* TOP SECTION */}
                  <div className="flex justify-between items-start">
                    <PlateColorBadge color={(lowercase(item.plateColorName) as PlateColor) || "white"} />
                    {/* Penanda waktu produksi */}
                    {(() => {
                      const slotColor = getTimeSlotColor(item.producedAt)
                      return (
                        <span
                          className={`inline-flex items-center justify-center w-6 h-6 rounded-full ${slotColor.bg} text-white text-[10px] font-bold ring-2 ${slotColor.ring} shadow-md`}
                          title={`${slotColor.label} — ${item.producedAt.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}`}
                        >
                          {slotColor.label[0]}
                        </span>
                      )
                    })()}
                  </div>

                  {/* BOTTOM SECTION */}
                  <div className="space-y-2">

                    {/* Name */}
                    <h3 className="text-sm font-semibold leading-tight line-clamp-2">
                      {item.menuName}  
                    </h3>

                    {/* Countdown */}
                    <div className="text-xs">
                      <ExpirationCountdown
                        productionTime={item.producedAt}
                        shelfLifeMinutes={shelfLifeMinutes}
                      />
                    </div>

                    {/* ACTIONS */}
                    <div className="space-y-1">

                      {/* SOLD BUTTON */}
                      <Button
                        size="sm"
                        className="w-full bg-emerald-600 hover:bg-emerald-700 text-white h-8 text-xs disabled:opacity-50 disabled:cursor-not-allowed"
                        onClick={() => handleMarkSold(item.id, item.menuName)}
                        disabled={!canUseSoldWasteButtons}
                        title={!canUseSoldWasteButtons ? "Not available for kitchen role" : undefined}
                      >
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Sold
                      </Button>

                      {/* WASTE BUTTON */}
                      <Button
                        size="sm"
                        variant="destructive"
                        className="w-full h-8 text-xs disabled:opacity-50 disabled:cursor-not-allowed"
                        onClick={() => handleWasteClick(item)}
                        disabled={!canUseSoldWasteButtons}
                        title={!canUseSoldWasteButtons ? "Not available for kitchen role" : undefined}
                      >
                        <XCircle className="w-3 h-3 mr-1" />
                        Waste
                      </Button>

                    </div>
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
      )}

      {/* Waste Reason Dialog */}
      <Dialog open={wasteDialog.open} onOpenChange={handleWasteDialogClose}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Mark as Waste</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {/* Item Details */}
            <div className="flex items-center gap-4 p-3 bg-muted rounded-lg">
              {(() => {
                const menuItem = menus.find((m) => m.id === wasteDialog.menuId)
                return menuItem?.image ? (
                  <div className="relative w-16 h-16 rounded-md overflow-hidden flex-shrink-0">
                    <Image
                      src={menuItem.image}
                      alt={wasteDialog.menuName}
                      fill
                      className="object-cover"
                    />
                  </div>
                ) : null
              })()}
              <div className="flex-1 min-w-0">
                <h4 className="font-semibold text-foreground truncate">{wasteDialog.menuName}</h4>
                <div className="mt-1 flex items-center gap-2">
                  <PlateColorBadge color={(lowercase(wasteDialog.plateColorName) as PlateColor) || "white"} />
                </div>
                {wasteDialog.producedAt && (
                  <p className="text-xs text-muted-foreground mt-2">
                    Prod: {wasteDialog.producedAt.toLocaleDateString("id-ID")} {wasteDialog.producedAt.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}
                  </p>
                )}
              </div>
            </div>

            {/* Waste Reason */}
            <div>
              <Label htmlFor="waste-reason" className="mb-2 block">
                Reason for Waste
              </Label>
              <Select
                value={wasteDialog.reason}
                onValueChange={(value) => setWasteDialog((prev) => ({ ...prev, reason: value }))}
              >
                <SelectTrigger id="waste-reason">
                  <SelectValue placeholder="Select a reason..." />
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
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={handleWasteDialogClose}
              disabled={wasteDialog.isSubmitting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirmWaste}
              disabled={wasteDialog.isSubmitting || !wasteDialog.reason}
            >
              {wasteDialog.isSubmitting ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <XCircle className="w-4 h-4 mr-2" />
              )}
              Confirm Waste
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
