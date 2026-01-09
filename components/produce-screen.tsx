"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { PlateColorBadge } from "@/components/plate-color-badge"
import { sushiMenus } from "@/lib/mock-data"
import { useToast } from "@/hooks/use-toast"
import Link from "next/link"
import { ArrowLeft, Plus } from "lucide-react"

export function ProduceScreen() {
  const { toast } = useToast()
  const [producing, setProducing] = useState<string | null>(null)
  const [selectedColor, setSelectedColor] = useState<string | null>(null)

  const handleProduce = (sushiId: string, sushiName: string) => {
    setProducing(sushiId)

    // Simulate production
    setTimeout(() => {
      toast({
        title: "Plate Produced",
        description: `Successfully produced 1x ${sushiName}`,
      })
      setProducing(null)
    }, 500)
  }

  const filteredSushi = selectedColor ? sushiMenus.filter((sushi) => sushi.plateColor === selectedColor) : sushiMenus

  const colors = ["green", "blue", "red", "black"]

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
        <h1 className="text-3xl md:text-4xl font-bold">Produce Sushi</h1>
        <p className="text-muted-foreground mt-1">Tap to produce one plate</p>
      </div>

      <div className="mb-6 flex gap-2 flex-wrap">
        <Button
          variant={selectedColor === null ? "default" : "outline"}
          onClick={() => setSelectedColor(null)}
          className="px-4 py-2"
        >
          All Colors
        </Button>
        {colors.map((color) => (
          <Button
            key={color}
            variant={selectedColor === color ? "default" : "outline"}
            onClick={() => setSelectedColor(color)}
            className={`px-4 py-2 capitalize ${
              selectedColor === color
                ? color === "green"
                  ? "bg-green-600 hover:bg-green-700"
                  : color === "blue"
                    ? "bg-blue-600 hover:bg-blue-700"
                    : color === "red"
                      ? "bg-red-600 hover:bg-red-700"
                      : "bg-gray-800 hover:bg-gray-900"
                : ""
            }`}
          >
            {color}
          </Button>
        ))}
      </div>

      {/* Sushi Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
        {filteredSushi.map((sushi) => (
          <Card key={sushi.id} className="hover:shadow-lg transition-shadow">
            <CardContent className="p-3">
              <div className="space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="text-xs font-semibold leading-tight line-clamp-2">{sushi.name}</h3>
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
    </div>
  )
}
