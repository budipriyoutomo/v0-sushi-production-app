"use client"

import { Card, CardContent } from "@/components/ui/card"
import { PlateColorBadge, type PlateColor } from "@/components/plate-color-badge"
import { StatusIndicator, type Status } from "@/components/status-indicator"
import { OutletSelector } from "@/components/outlet-selector"
import { useOutlet } from "@/lib/outlet-context"
import { useProductionStats } from "@/hooks/use-production"
import { usePlateColorsSortedByPrice } from "@/hooks/use-plate-colors"
import { cn } from "@/lib/utils"
import { Loader2 } from "lucide-react"

const plateColorBg: Record<PlateColor, string> = {
  green: "bg-emerald-50 border-emerald-200",
  blue: "bg-blue-50 border-blue-200",
  red: "bg-red-50 border-red-200",
  black: "bg-zinc-100 border-zinc-300",
}

export function KitchenDashboard() {
  const { selectedOutletId } = useOutlet()
  const { stats, isLoading } = useProductionStats(selectedOutletId)
  const { plateColors } = usePlateColorsSortedByPrice()

  const getStatus = (produced: number, target: number, expiringSoon: number): Status => {
    const percentage = (produced / target) * 100
    if (expiringSoon > 5) return "critical"
    if (percentage < 80 || expiringSoon > 2) return "warning"
    return "good"
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold">Kitchen Dashboard</h1>
          <p className="text-muted-foreground mt-1">Production overview by plate color</p>
        </div>
        <OutletSelector />
      </div>

      {/* Production Cards Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
        {stats
          .sort((a, b) => {
            const priceA = plateColors.find((pc) => pc.name === a.plateColor)?.price || 0
            const priceB = plateColors.find((pc) => pc.name === b.plateColor)?.price || 0
            return priceA - priceB
          })
          .map((stat) => {
          const status = getStatus(stat.produced, stat.targetToday, stat.expiringSoon)

          return (
            <Card key={stat.plateColor} className={cn("border-2", plateColorBg[stat.plateColor])}>
              <CardContent className="p-3 md:p-4">
                <div className="flex items-center justify-between mb-3">
                  <PlateColorBadge color={stat.plateColor} className="text-xs px-2 py-0.5" />
                  <StatusIndicator status={status} />
                </div>

                <div className="space-y-2">
                  {/* Target Today */}
                  <div className="flex justify-between items-baseline">
                    <p className="text-muted-foreground font-medium text-sm">Target</p>
                    <p className="text-xl md:text-2xl font-bold">{stat.targetToday}</p>
                  </div>

                  {/* Produced */}
                  <div className="flex justify-between items-baseline">
                    <p className="text-muted-foreground font-medium text-sm">Produced</p>
                    <p className="text-xl md:text-2xl font-bold">{stat.produced}</p>
                  </div>

                  {/* Sold */}
                  <div className="flex justify-between items-baseline">
                    <p className="text-muted-foreground font-medium text-sm">Sold</p>
                    <p className="text-xl md:text-2xl font-bold">{stat.sold}</p>
                  </div>

                  {/* Expiring Soon */}
                  <div className="flex justify-between items-baseline">
                    <p className="text-muted-foreground font-medium text-sm">Expiring</p>
                    <p
                      className={cn("text-xl md:text-2xl font-bold", {
                        "text-red-600": stat.expiringSoon > 5,
                        "text-amber-600": stat.expiringSoon > 2 && stat.expiringSoon <= 5,
                      })}
                    >
                      {stat.expiringSoon}
                    </p>
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
