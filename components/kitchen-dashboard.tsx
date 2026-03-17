"use client"

import { Card, CardContent } from "@/components/ui/card"
import { PlateColorBadge, type PlateColor } from "@/components/plate-color-badge"
import { StatusIndicator, type Status } from "@/components/status-indicator"
import { OutletSelector } from "@/components/outlet-selector"
import { useOutlet } from "@/lib/outlet-context"
import { useProductionStats } from "@/hooks/use-production"
import { usePlateColorsSortedByPrice } from "@/hooks/use-plate-colors"
import { cn, lowercase } from "@/lib/utils"
import { Loader2 } from "lucide-react"
 
const plateColorBg: Record<PlateColor, string> = {
  white: "bg-gray-50 border-gray-200",
  blue: "bg-blue-50 border-blue-200",
  pink: "bg-pink-50 border-pink-200",
  black: "bg-zinc-100 border-zinc-300",
  red: "bg-red-50 border-red-200",
  gold: "bg-yellow-50 border-yellow-300",
  "choco motive": "bg-amber-50 border-amber-300",
  yellow: "bg-yellow-50 border-yellow-200",
  silver: "bg-gray-200 border-gray-400",
}

export function KitchenDashboard() {
  const { selectedOutletId } = useOutlet()
  const { stats, isLoading } = useProductionStats(selectedOutletId)
  const { plateColors } = usePlateColorsSortedByPrice()

  // ✅ O(1) lookup (no more find in loop)
  const priceMap = Object.fromEntries(
    plateColors.map((pc) => [lowercase(pc.name), pc.price])
  )

  const getStatus = (
    produced: number,
    target: number,
    expiringSoon: number
  ): Status => {
    const percentage = target > 0 ? (produced / target) * 100 : 0

    if (expiringSoon > 5) return "critical"
    if (percentage < 80 || expiringSoon > 2) return "warning"
    return "good"
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold">
            Kitchen Dashboard
          </h1>
          <p className="text-muted-foreground mt-1">
            Production overview by plate color
          </p>
        </div>
        <OutletSelector />
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {[...stats]
            .sort((a, b) => {
              const priceA = priceMap[lowercase(a.plateColor)] || 0
              const priceB = priceMap[lowercase(b.plateColor)] || 0
              return priceA - priceB
            })
            .map((stat) => {
              const color = lowercase(stat.plateColor) as PlateColor

              const status = getStatus(
                stat.produced,
                stat.targetToday,
                stat.expiringSoon
              )

              return (
                <Card
                  key={stat.plateColor}
                  className={cn(
                    "border-2",
                    plateColorBg[color] || "bg-gray-50 border-gray-200"
                  )}
                >
                  <CardContent className="p-3 md:p-4">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-3">
                      <PlateColorBadge
                        color={color}
                        className="text-xs px-2 py-0.5"
                      />
                      <StatusIndicator status={status} />
                    </div>

                    {/* Stats */}
                    <div className="space-y-2">
                      <StatRow label="Target" value={stat.targetToday} />
                      <StatRow label="Produced" value={stat.produced} />
                      <StatRow label="Sold" value={stat.sold} />

                      <StatRow
                        label="Expiring"
                        value={stat.expiringSoon}
                        className={cn({
                          "text-red-600": stat.expiringSoon > 5,
                          "text-amber-600":
                            stat.expiringSoon > 2 &&
                            stat.expiringSoon <= 5,
                        })}
                      />
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

// ✅ reusable component (biar clean)
function StatRow({
  label,
  value,
  className,
}: {
  label: string
  value: number
  className?: string
}) {
  return (
    <div className="flex justify-between items-baseline">
      <p className="text-muted-foreground font-medium text-sm">{label}</p>
      <p className={cn("text-xl md:text-2xl font-bold", className)}>
        {value}
      </p>
    </div>
  )
}