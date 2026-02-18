"use client"

import { useState } from "react"
import Image from "next/image"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { PlateColorBadge } from "@/components/plate-color-badge"
import { ExpirationCountdown } from "@/components/expiration-countdown"
import type { ProductionItem } from "@/lib/types"
import { plateColors, sushiMenus } from "@/lib/mock-data"
import { useToast } from "@/hooks/use-toast"
import Link from "next/link"
import { ArrowLeft, CheckCircle, XCircle } from "lucide-react"

export function ConveyorScreen() {
  const { toast } = useToast()
  const [selectedColor, setSelectedColor] = useState<string | null>(null)

  // Mock active production items
  const [items, setItems] = useState<ProductionItem[]>([
    {
      id: "1",
      sushiId: "1",
      sushiName: "California Roll",
      plateColor: "white",
      productionTime: new Date(Date.now() - 30 * 60 * 1000), // 30 min ago
      shelfLifeMinutes: 120,
      status: "active",
    },
    {
      id: "2",
      sushiId: "3",
      sushiName: "Salmon Nigiri",
      plateColor: "blue",
      productionTime: new Date(Date.now() - 70 * 60 * 1000), // 70 min ago
      shelfLifeMinutes: 90,
      status: "active",
    },
    {
      id: "3",
      sushiId: "5",
      sushiName: "Spicy Tuna Roll",
      plateColor: "pink",
      productionTime: new Date(Date.now() - 15 * 60 * 1000), // 15 min ago
      shelfLifeMinutes: 90,
      status: "active",
    },
    {
      id: "4",
      sushiId: "7",
      sushiName: "Rainbow Roll",
      plateColor: "gold",
      productionTime: new Date(Date.now() - 60 * 60 * 1000), // 60 min ago
      shelfLifeMinutes: 75,
      status: "active",
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

  const handleMarkWaste = (itemId: string, sushiName: string) => {
    setItems((prev) => prev.filter((item) => item.id !== itemId))
    toast({
      title: "Marked as Waste",
      description: `${sushiName} logged as waste`,
      variant: "destructive",
    })
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      {/* Header */}
      <div className="mb-8">
        <Link
          href="/kitchen/dashboard"
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </Link>
        <h1 className="text-3xl md:text-4xl font-bold">Conveyor Control</h1>
        <p className="text-muted-foreground mt-1">
          Active plates on conveyor: <span className="font-semibold text-foreground">{filteredItems.length}</span>
        </p>
      </div>

      <div className="mb-8 flex flex-wrap gap-2">
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {sortedItems.map((item) => {
            const menuItem = sushiMenus.find((m) => m.id === item.sushiId)
            return (
              <Card key={item.id} className="flex flex-col overflow-hidden">
                <CardContent className="p-3 flex flex-col h-full">
                  {/* Image */}
                  {menuItem?.image && (
                    <div className="relative w-full h-32 bg-muted rounded mb-3 -mx-3 -mt-3">
                      <Image
                        src={menuItem.image}
                        alt={item.sushiName}
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 100%, (max-width: 1024px) 50%, 33%"
                      />
                    </div>
                  )}

                  {/* Item Info */}
                  <div className="flex-1 space-y-2 mb-3">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-lg font-semibold flex-1">{item.sushiName}</h3>
                      <PlateColorBadge color={item.plateColor} />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {item.productionTime.toLocaleTimeString()}
                    </p>

                    {/* Countdown */}
                    <div>
                      <ExpirationCountdown
                        productionTime={item.productionTime}
                        shelfLifeMinutes={item.shelfLifeMinutes}
                      />
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 flex-col">
                    <Button
                      size="sm"
                      className="w-full bg-emerald-600 hover:bg-emerald-700 text-white text-sm"
                      onClick={() => handleMarkSold(item.id, item.sushiName)}
                    >
                      <CheckCircle className="w-4 h-4 mr-1" />
                      Sold
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      className="w-full text-sm"
                      onClick={() => handleMarkWaste(item.id, item.sushiName)}
                    >
                      <XCircle className="w-4 h-4 mr-1" />
                      Waste
                    </Button>
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
