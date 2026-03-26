"use client"

import { useState } from "react"
import Image from "next/image"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { PlateColorBadge } from "@/components/plate-color-badge"
import { OutletSelector } from "@/components/outlet-selector"
import { ExpirationCountdown } from "@/components/expiration-countdown"
import { useOutlet } from "@/lib/outlet-context"
import { useConveyorItems } from "@/hooks/use-production"
import { usePlateColorsSortedByPrice } from "@/hooks/use-plate-colors"
import { useMenus } from "@/hooks/use-menus"
import { useToast } from "@/hooks/use-toast"
import { productionService, getApiError } from "@/lib/api"
import { CheckCircle, XCircle, Loader2 } from "lucide-react"
import { formatRupiah, lowercase } from "@/lib/utils"
import type { PlateColor, SushiMenu } from "@/lib/types"

interface ItemWithWasteReason {
  id: string
  menuId: string
  menuName: string
  plateColor: string
  producedAt: Date
  expiresAt: Date
  wasteReasonInput?: string
  showWasteReasonForm?: boolean
  finalStatus: 'sold' | 'waste' | null
  soldAt: Date | null
  wastedAt: Date | null
  beltStatus: 'fresh' | 'warning' | 'expired'
}

export function ConveyorScreen() {
  const { toast } = useToast()
  const { selectedOutletId } = useOutlet()
  const { items: conveyorItems, isLoading, refresh } = useConveyorItems(selectedOutletId)
  const { plateColors } = usePlateColorsSortedByPrice()
  const { menus } = useMenus() 
  const [selectedColorId, setSelectedColorId] = useState<string | null>(null)
  const [itemStates, setItemStates] = useState<Record<string, { wasteReasonInput: string; showWasteReasonForm: boolean }>>({})

  // Map conveyor items to include local state
  const items: ItemWithWasteReason[] = conveyorItems.map((item) => ({
    ...item,
    producedAt: new Date(item.producedAt),
    expiresAt: new Date(item.expiresAt),
    soldAt: item.soldAt ? new Date(item.soldAt) : null,
    wastedAt: item.wastedAt ? new Date(item.wastedAt) : null,
    wasteReasonInput: itemStates[item.id]?.wasteReasonInput || "",
    showWasteReasonForm: itemStates[item.id]?.showWasteReasonForm || false,
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
 const sortedItems = [...activeItems].sort(
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

  const handleWasteClick = (itemId: string) => {
    setItemStates((prev) => ({
      ...prev,
      [itemId]: { ...prev[itemId], showWasteReasonForm: true, wasteReasonInput: prev[itemId]?.wasteReasonInput || "" },
    }))
  }

  const handleMarkWaste = async (itemId: string, menuId: string, menuName: string, reason: string) => {
    if (!reason.trim()) {
      toast({
        title: "Error",
        description: "Please enter a reason for waste",
        variant: "destructive",
      })
      return
    }
    try {

      await productionService.recordWaste({ itemIds: [itemId], reason })
      //await productionService.removeExpired([itemId])
      await productionService.markWaste([itemId])
      await refresh()
      setItemStates((prev) => {
        const newState = { ...prev }
        delete newState[itemId]
        return newState
      })
      toast({
        title: "Marked as Waste",
        description: `${menuName} - Reason: ${reason}`,
        variant: "destructive",
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

  const handleCancelWasteReason = (itemId: string) => {
    setItemStates((prev) => ({
      ...prev,
      [itemId]: { ...prev[itemId], showWasteReasonForm: false, wasteReasonInput: "" },
    }))
  }

  const handleWasteReasonChange = (itemId: string, value: string) => {
    setItemStates((prev) => ({
      ...prev,
      [itemId]: { ...prev[itemId], wasteReasonInput: value, showWasteReasonForm: prev[itemId]?.showWasteReasonForm || false },
    }))
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
                    <PlateColorBadge color={(lowercase(item.plateColor) as PlateColor) || "white" }  />
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
                        className="w-full bg-emerald-600 hover:bg-emerald-700 text-white h-8 text-xs"
                        onClick={() => handleMarkSold(item.id, item.menuName)}
                      >
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Sold
                      </Button>

                      {/* WASTE SECTION */}
                      {!item.showWasteReasonForm ? (
                        <Button
                          size="sm"
                          variant="destructive"
                          className="w-full h-8 text-xs"
                          onClick={() => handleWasteClick(item.id)}
                        >
                          <XCircle className="w-3 h-3 mr-1" />
                          Waste
                        </Button>
                      ) : (
                        <div className="space-y-2 bg-black/50 p-2 rounded-md">
                          <Input
                            placeholder="Reason for waste"
                            value={item.wasteReasonInput}
                            onChange={(e) => handleWasteReasonChange(item.id, e.target.value)}
                            className="h-7 text-xs bg-white text-black"
                          />
                          <div className="flex gap-1">
                            <Button
                              size="sm"
                              className="flex-1 bg-red-600 hover:bg-red-700 text-white h-7 text-xs"
                              onClick={() =>
                                handleMarkWaste(
                                  item.id,
                                  item.menuId,
                                  item.menuName,
                                  item.wasteReasonInput || ""
                                )
                              }
                            >
                              Confirm
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="flex-1 h-7 text-xs bg-white text-black"
                              onClick={() => handleCancelWasteReason(item.id)}
                            >
                              Cancel
                            </Button>
                          </div>
                        </div>
                      )}

                    </div>
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
