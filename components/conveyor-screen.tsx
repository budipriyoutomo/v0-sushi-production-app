"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { PlateColorBadge } from "@/components/plate-color-badge"
import { ExpirationCountdown } from "@/components/expiration-countdown"
import type { ProductionItem } from "@/lib/types"
import { useToast } from "@/hooks/use-toast"
import Link from "next/link"
import { ArrowLeft, CheckCircle, XCircle } from "lucide-react"

export function ConveyorScreen() {
  const { toast } = useToast()

  // Mock active production items
  const [items, setItems] = useState<ProductionItem[]>([
    {
      id: "1",
      sushiId: "1",
      sushiName: "California Roll",
      plateColor: "green",
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
      plateColor: "red",
      productionTime: new Date(Date.now() - 15 * 60 * 1000), // 15 min ago
      shelfLifeMinutes: 90,
      status: "active",
    },
    {
      id: "4",
      sushiId: "7",
      sushiName: "Rainbow Roll",
      plateColor: "black",
      productionTime: new Date(Date.now() - 60 * 60 * 1000), // 60 min ago
      shelfLifeMinutes: 75,
      status: "active",
    },
  ])

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
          Active plates on conveyor: <span className="font-semibold text-foreground">{items.length}</span>
        </p>
      </div>

      {/* Items List */}
      {items.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <p className="text-muted-foreground text-lg">No active plates on conveyor</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {items.map((item) => (
            <Card key={item.id}>
              <CardContent className="p-6">
                <div className="flex flex-col lg:flex-row lg:items-center gap-6">
                  {/* Item Info */}
                  <div className="flex-1 space-y-3">
                    <div className="flex items-center gap-3">
                      <h3 className="text-xl font-semibold">{item.sushiName}</h3>
                      <PlateColorBadge color={item.plateColor} />
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Produced at: <span className="font-medium">{item.productionTime.toLocaleTimeString()}</span>
                    </p>

                    {/* Countdown */}
                    <div className="max-w-md">
                      <ExpirationCountdown
                        productionTime={item.productionTime}
                        shelfLifeMinutes={item.shelfLifeMinutes}
                      />
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-3 lg:flex-col">
                    <Button
                      size="lg"
                      className="flex-1 lg:flex-none lg:w-40 bg-emerald-600 hover:bg-emerald-700 text-white"
                      onClick={() => handleMarkSold(item.id, item.sushiName)}
                    >
                      <CheckCircle className="w-5 h-5 mr-2" />
                      Sold
                    </Button>
                    <Button
                      size="lg"
                      variant="destructive"
                      className="flex-1 lg:flex-none lg:w-40"
                      onClick={() => handleMarkWaste(item.id, item.sushiName)}
                    >
                      <XCircle className="w-5 h-5 mr-2" />
                      Waste
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
