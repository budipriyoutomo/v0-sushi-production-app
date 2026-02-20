"use client"

import { useState } from "react"
import Image from "next/image"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { PlateColorBadge } from "@/components/plate-color-badge"
import { QuantityCalculator } from "@/components/quantity-calculator"
import { sushiMenus, plateColors } from "@/lib/mock-data"
import { useToast } from "@/hooks/use-toast"
import { Plus } from "lucide-react"

export function ProduceScreen() {
  const { toast } = useToast()
  const [producing, setProducing] = useState<string | null>(null)
  const [selectedColor, setSelectedColor] = useState<string | null>(null)
  const [calculatorOpen, setCalculatorOpen] = useState(false)
  const [selectedItem, setSelectedItem] = useState<{ id: string; name: string } | null>(null)

  const handleProduce = (sushiId: string, sushiName: string) => {
    setSelectedItem({ id: sushiId, name: sushiName })
    setCalculatorOpen(true)
  }

  const handleConfirmQuantity = (quantity: number) => {
    if (!selectedItem) return

    setProducing(selectedItem.id)
    setCalculatorOpen(false)

    // Simulate production
    setTimeout(() => {
      toast({
        title: "Plates Produced",
        description: `Successfully produced ${quantity}x ${selectedItem.name}`,
      })
      setProducing(null)
      setSelectedItem(null)
    }, 500)
  }

  const handleCancelCalculator = () => {
    setCalculatorOpen(false)
    setSelectedItem(null)
  }

  const filteredSushi = selectedColor ? sushiMenus.filter((sushi) => sushi.plateColor === selectedColor) : sushiMenus

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl md:text-4xl font-bold">Produce Sushi</h1>
        <p className="text-muted-foreground mt-1">Tap to produce one plate</p>
      </div>

      {/* Filter by Plate Color */}
      <div className="flex gap-2 flex-wrap">
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

      {/* Sushi Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
        {filteredSushi.map((sushi) => (
          <Card key={sushi.id} className="hover:shadow-lg transition-shadow overflow-hidden">
            <CardContent className="p-2">
              <div className="space-y-2">
                {/* Image */}
                {sushi.image && (
                  <div className="relative w-full h-20 bg-muted rounded overflow-hidden">
                    <Image
                      src={sushi.image}
                      alt={sushi.name}
                      fill
                      className="object-cover"
                      sizes="(max-width: 640px) 100px, (max-width: 768px) 120px, 150px"
                    />
                  </div>
                )}

                <div className="flex items-start justify-between gap-1">
                  <h3 className="text-xs font-semibold leading-tight line-clamp-2 flex-1">{sushi.name}</h3>
                  <PlateColorBadge color={sushi.plateColor} />
                </div>

                <div className="text-xs text-muted-foreground space-y-0.5">
                  <p>
                    Life: <span className="font-medium text-foreground">{sushi.shelfLifeMinutes}m</span>
                  </p>
                  <p>
                    Cost: <span className="font-medium text-foreground">${sushi.costEstimate.toFixed(2)}</span>
                  </p>
                </div>

                <Button
                  className="w-full h-8 text-xs"
                  size="sm"
                  onClick={() => handleProduce(sushi.id, sushi.name)}
                  disabled={producing === sushi.id}
                >
                  <Plus className="w-3 h-3 mr-1" />
                  {producing === sushi.id ? "..." : "Make"}
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredSushi.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No items available for this color</p>
        </div>
      )}

      {/* Quantity Calculator */}
      {selectedItem && (
        <QuantityCalculator
          open={calculatorOpen}
          itemName={selectedItem.name}
          onConfirm={handleConfirmQuantity}
          onCancel={handleCancelCalculator}
        />
      )}
    </div>
  )
}
