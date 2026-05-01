"use client"

import { useState } from "react"
import Image from "next/image"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { PlateColorBadge } from "@/components/plate-color-badge"
import { OutletSelector } from "@/components/outlet-selector"
import { QuantityCalculator } from "@/components/quantity-calculator"
import { useOutlet } from "@/lib/outlet-context"
import { useMenus } from "@/hooks/use-menus"
import { usePlateColorsSortedByPrice } from "@/hooks/use-plate-colors"
import { useConveyorItems } from "@/hooks/use-production"
import { getApiError } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"
import type { PlateColor, SushiMenu } from "@/lib/types"
import { Loader2 } from "lucide-react"
import { formatRupiah, lowercase } from "@/lib/utils"

export function ProduceScreen() {
  const { toast } = useToast()
  const { selectedOutletId } = useOutlet()
  const { menus, isLoading: menusLoading } = useMenus()
  const { plateColors, isLoading: plateColorsLoading } = usePlateColorsSortedByPrice()
  const { produceItem } = useConveyorItems(selectedOutletId)
  const [producing, setProducing] = useState<string | null>(null)
  const [selectedColorId, setSelectedColorId] = useState<string | null>(null)
  const [calculatorOpen, setCalculatorOpen] = useState(false)
  const [selectedItem, setSelectedItem] = useState<SushiMenu | null>(null)

  const isLoading = menusLoading || plateColorsLoading

  console.log("[v0] produce-screen menus count:", menus.length, "plateColors count:", plateColors.length)
  console.log("[v0] produce-screen menus:", menus.map(m => ({ id: m.id, name: m.menuname, plateColorId: m.plateColorId, plateColorName: m.plateColorName, isActive: m.isActive })))
  console.log("[v0] produce-screen plateColors:", plateColors.map(p => ({ id: p.id, name: p.platename, isActive: p.isActive })))

  const handleProduce = (sushi: SushiMenu) => {
    setSelectedItem(sushi)
    setCalculatorOpen(true)
  }

  const handleConfirmQuantity = async (quantity: number) => {
    if (!selectedItem) return

    setProducing(selectedItem.id)
    setCalculatorOpen(false)

    try {
      await produceItem(selectedItem.id, quantity)
      toast({
        title: "Plates Produced",
        description: `Successfully produced ${quantity}x ${selectedItem.menuname} plates!`,
      })
    } catch (error) {
      const apiError = getApiError(error)
      toast({
        title: "Error",
        description: apiError.message,
        variant: "destructive",
      })
    } finally {
      setProducing(null)
      setSelectedItem(null)
    }
  }

  const handleCancelCalculator = () => {
    setCalculatorOpen(false)
    setSelectedItem(null)
  }

  const filteredSushi = selectedColorId ? menus.filter((sushi) => sushi.plateColorId === selectedColorId) : menus

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold">Produce Sushi</h1>
          <p className="text-muted-foreground mt-1">Tap to produce one plate</p>
        </div>
        <OutletSelector />
      </div>

      {/* Filter by Plate Color */}
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

      {/* Sushi Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
  {filteredSushi.map((sushi) => {
    const isProducing = producing === sushi.id

    return (
      <Card
        key={sushi.id}
        className="relative h-44 overflow-hidden cursor-pointer group"
      >  
        {/* FULL IMAGE */}
        {sushi.image && (
          <Image
            src={sushi.image}
            alt={sushi.menuname}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
          />
        )}

        {/* DARK GRADIENT OVERLAY */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />

        {/* CONTENT OVER IMAGE */}
        <div className="absolute inset-0 p-3 flex flex-col justify-between text-white">

          {/* Top */}
          <div className="flex justify-between items-start">
            <PlateColorBadge color={(lowercase(sushi.plateColorName) as PlateColor) || "white" }  />
          </div>

          {/* Bottom Info */}
          <div>
            <h3 className="text-sm font-semibold leading-tight line-clamp-2">
              {sushi.menuname}
            </h3>

            <div className="text-xs opacity-90 mt-1">
              ⏱ {sushi.shelfLife}m • {formatRupiah(sushi.price) }
            </div>

            <Button
              size="sm"
              className="mt-2 w-full h-8 text-xs bg-white text-black hover:bg-gray-200"
              onClick={() => handleProduce(sushi)}
              disabled={isProducing}
            >
              {isProducing ? "Producing..." : "Make"}
            </Button>
          </div>
        </div>
      </Card>
    )
          })}
</div>
      )}

      {filteredSushi.length === 0 && !isLoading && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No items available for this color</p>
        </div>
      )}

      {/* Quantity Calculator */}
      {selectedItem && (
        <QuantityCalculator
          open={calculatorOpen}
          item={selectedItem}
          onConfirm={handleConfirmQuantity}
          onCancel={handleCancelCalculator}
        />
      )}
    </div>
  )
}
