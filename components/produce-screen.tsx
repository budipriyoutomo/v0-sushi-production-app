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

      {/* Sushi Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {sushiMenus.map((sushi) => (
          <Card key={sushi.id} className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="space-y-4">
                <div className="flex items-start justify-between">
                  <h3 className="text-lg font-semibold leading-tight">{sushi.name}</h3>
                  <PlateColorBadge color={sushi.plateColor} />
                </div>

                <div className="text-sm text-muted-foreground">
                  <p>
                    Shelf Life: <span className="font-medium text-foreground">{sushi.shelfLifeMinutes} min</span>
                  </p>
                  <p>
                    Cost: <span className="font-medium text-foreground">${sushi.costEstimate.toFixed(2)}</span>
                  </p>
                </div>

                <Button
                  className="w-full"
                  size="lg"
                  onClick={() => handleProduce(sushi.id, sushi.name)}
                  disabled={producing === sushi.id}
                >
                  <Plus className="w-5 h-5 mr-2" />
                  {producing === sushi.id ? "Producing..." : "Produce"}
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
