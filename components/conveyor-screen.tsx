"use client"

import { useState } from "react"
import Image from "next/image"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { PlateColorBadge } from "@/components/plate-color-badge"
import { OutletSelector } from "@/components/outlet-selector"
import { ExpirationCountdown } from "@/components/expiration-countdown"
import type { ProductionItem } from "@/lib/types"
import { plateColors, sushiMenus } from "@/lib/mock-data"
import { useToast } from "@/hooks/use-toast"
import Link from "next/link"
import { CheckCircle, XCircle } from "lucide-react"

interface ItemWithWasteReason extends ProductionItem {
  wasteReasonInput?: string
  showWasteReasonForm?: boolean
}

export function ConveyorScreen() {
  const { toast } = useToast()
  const [selectedColor, setSelectedColor] = useState<string | null>(null)

  // Mock active production items
  const [items, setItems] = useState<ItemWithWasteReason[]>([
    {
      id: "1",
      sushiId: "1",
      sushiName: "California Roll",
      plateColor: "white",
      productionTime: new Date(Date.now() - 30 * 60 * 1000), // 30 min ago
      shelfLifeMinutes: 120,
      status: "active",
      wasteReasonInput: "",
      showWasteReasonForm: false,
    },
    {
      id: "2",
      sushiId: "3",
      sushiName: "Salmon Nigiri",
      plateColor: "blue",
      productionTime: new Date(Date.now() - 70 * 60 * 1000), // 70 min ago
      shelfLifeMinutes: 90,
      status: "active",
      wasteReasonInput: "",
      showWasteReasonForm: false,
    },
    {
      id: "3",
      sushiId: "5",
      sushiName: "Spicy Tuna Roll",
      plateColor: "pink",
      productionTime: new Date(Date.now() - 15 * 60 * 1000), // 15 min ago
      shelfLifeMinutes: 90,
      status: "active",
      wasteReasonInput: "",
      showWasteReasonForm: false,
    },
    {
      id: "4",
      sushiId: "7",
      sushiName: "Rainbow Roll",
      plateColor: "gold",
      productionTime: new Date(Date.now() - 60 * 60 * 1000), // 60 min ago
      shelfLifeMinutes: 75,
      status: "active",
      wasteReasonInput: "",
      showWasteReasonForm: false,
    },
  ])

  // Filter out expired items (time remaining <= 0)
  const activeItems = items.filter((item) => {
    const timeRemaining = item.shelfLifeMinutes - Math.floor((Date.now() - item.productionTime.getTime()) / 60000)
    return timeRemaining > 0
  })

  const filteredItems = selectedColor ? activeItems.filter((item) => item.plateColor === selectedColor) : activeItems

  // Sort by time remaining (expiring soon first)
  const sortedItems = [...filteredItems].sort((a, b) => {
    const timeRemainingA = a.shelfLifeMinutes - Math.floor((Date.now() - a.productionTime.getTime()) / 60000)
    const timeRemainingB = b.shelfLifeMinutes - Math.floor((Date.now() - b.productionTime.getTime()) / 60000)
    return timeRemainingA - timeRemainingB
  })

  const handleMarkSold = (itemId: string, sushiName: string) => {
    setItems((prev) => prev.filter((item) => item.id !== itemId))
    toast({
      title: "Marked as Sold",
      description: `${sushiName} removed from conveyor`,
    })
  }

  const handleWasteClick = (itemId: string) => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === itemId ? { ...item, showWasteReasonForm: true } : item
      )
    )
  }

  const handleMarkWaste = (itemId: string, sushiName: string, reason: string) => {
    if (!reason.trim()) {
      toast({
        title: "Error",
        description: "Please enter a reason for waste",
        variant: "destructive",
      })
      return
    }
    setItems((prev) => prev.filter((item) => item.id !== itemId))
    toast({
      title: "Marked as Waste",
      description: `${sushiName} - Reason: ${reason}`,
      variant: "destructive",
    })
  }

  const handleCancelWasteReason = (itemId: string) => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === itemId
          ? { ...item, showWasteReasonForm: false, wasteReasonInput: "" }
          : item
      )
    )
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

      {/* Filter by Plate Color */}
      <div className="flex flex-wrap gap-2">
        <Button
          variant={selectedColor === null ? "default" : "outline"}
          onClick={() => setSelectedColor(null)}
          className="px-4 py-2"
        >
          All Colors
        </Button>
        {plateColors.map((plate) => (
          <Button
            key={plate.id}
            variant={selectedColor === plate.name ? "default" : "outline"}
            onClick={() => setSelectedColor(plate.name)}
            className="px-4 py-2 capitalize"
          >
            {plate.name}
          </Button>
        ))}
      </div>

      {/* Items Grid */}
      {sortedItems.length === 0 ? (
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
            const menuItem = sushiMenus.find((m) => m.id === item.sushiId)
            return (
              <Card key={item.id} className="hover:shadow-lg transition-shadow overflow-hidden">
                <CardContent className="p-2">
                  <div className="space-y-2">
                    {/* Image */}
                    {menuItem?.image && (
                      <div className="relative w-full h-20 bg-muted rounded overflow-hidden">
                        <Image
                          src={menuItem.image}
                          alt={item.sushiName}
                          fill
                          className="object-cover"
                          sizes="(max-width: 640px) 100px, (max-width: 768px) 120px, 150px"
                        />
                      </div>
                    )}

                    {/* Item Info */}
                    <div className="flex items-start justify-between gap-1">
                      <h3 className="text-xs font-semibold leading-tight line-clamp-2 flex-1">{item.sushiName}</h3>
                      <PlateColorBadge color={item.plateColor} />
                    </div>

                    {/* Countdown */}
                    <div className="text-xs">
                      <ExpirationCountdown
                        productionTime={item.productionTime}
                        shelfLifeMinutes={item.shelfLifeMinutes}
                      />
                    </div>

                    {/* Actions */}
                    <div className="flex gap-1 flex-col">
                      <Button
                        size="sm"
                        className="w-full bg-emerald-600 hover:bg-emerald-700 text-white h-7 text-xs"
                        onClick={() => handleMarkSold(item.id, item.sushiName)}
                      >
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Sold
                      </Button>
                      {!item.showWasteReasonForm ? (
                        <Button
                          size="sm"
                          variant="destructive"
                          className="w-full h-7 text-xs"
                          onClick={() => handleWasteClick(item.id)}
                        >
                          <XCircle className="w-3 h-3 mr-1" />
                          Waste
                        </Button>
                      ) : (
                        <div className="space-y-2">
                          <Input
                            placeholder="Reason for waste"
                            value={item.wasteReasonInput}
                            onChange={(e) =>
                              setItems((prev) =>
                                prev.map((i) =>
                                  i.id === item.id
                                    ? { ...i, wasteReasonInput: e.target.value }
                                    : i
                                )
                              )
                            }
                            className="h-7 text-xs"
                          />
                          <div className="flex gap-1">
                            <Button
                              size="sm"
                              className="flex-1 bg-red-600 hover:bg-red-700 text-white h-6 text-xs"
                              onClick={() =>
                                handleMarkWaste(item.id, item.sushiName, item.wasteReasonInput || "")
                              }
                            >
                              Confirm
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="flex-1 h-6 text-xs"
                              onClick={() => handleCancelWasteReason(item.id)}
                            >
                              Cancel
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
