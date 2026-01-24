"use client"

import { Card, CardContent } from "@/components/ui/card"
import { PlateColorBadge, type PlateColor } from "@/components/plate-color-badge"
import { StatusIndicator, type Status } from "@/components/status-indicator"
import { mockProductionStats } from "@/lib/mock-data"
import { cn } from "@/lib/utils"
import Link from "next/link"

const plateColorBg: Record<PlateColor, string> = {
  green: "bg-emerald-50 border-emerald-200",
  blue: "bg-blue-50 border-blue-200",
  red: "bg-red-50 border-red-200",
  black: "bg-zinc-100 border-zinc-300",
}

export function KitchenDashboard() {
  const getStatus = (produced: number, target: number, expiringSoon: number): Status => {
    const percentage = (produced / target) * 100
    if (expiringSoon > 5) return "critical"
    if (percentage < 80 || expiringSoon > 2) return "warning"
    return "good"
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold">Kitchen Dashboard</h1>
          <p className="text-muted-foreground mt-1">Production overview by plate color</p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/kitchen/produce"
            className="px-4 py-2 bg-accent text-accent-foreground rounded-lg font-medium hover:bg-accent/90"
          >
            Produce
          </Link>
          <Link
            href="/kitchen/conveyor"
            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90"
          >
            Conveyor
          </Link>
        </div>
      </div>

      {/* Production Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
        {mockProductionStats.map((stat) => {
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
                    <p className="text-xs text-muted-foreground font-medium">Target</p>
                    <p className="text-xl md:text-2xl font-bold">{stat.targetToday}</p>
                  </div>

                  {/* Produced */}
                  <div className="flex justify-between items-baseline">
                    <p className="text-xs text-muted-foreground font-medium">Produced</p>
                    <p className="text-xl md:text-2xl font-bold">{stat.produced}</p>
                  </div>

                  {/* Sold */}
                  <div className="flex justify-between items-baseline">
                    <p className="text-xs text-muted-foreground font-medium">Sold</p>
                    <p className="text-xl md:text-2xl font-bold">{stat.sold}</p>
                  </div>

                  {/* Expiring Soon */}
                  <div className="flex justify-between items-baseline">
                    <p className="text-xs text-muted-foreground font-medium">Expiring</p>
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
    </div>
  )
}
