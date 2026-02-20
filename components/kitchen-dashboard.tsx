"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { PlateColorBadge, type PlateColor } from "@/components/plate-color-badge"
import { StatusIndicator, type Status } from "@/components/status-indicator"
import { mockProductionStats } from "@/lib/mock-data"
import { cn } from "@/lib/utils"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { LogOut } from "lucide-react"

const plateColorBg: Record<PlateColor, string> = {
  green: "bg-emerald-50 border-emerald-200",
  blue: "bg-blue-50 border-blue-200",
  red: "bg-red-50 border-red-200",
  black: "bg-zinc-100 border-zinc-300",
}

export function KitchenDashboard() {
  const router = useRouter()

  const handleLogout = () => {
    router.push("/login/kitchen")
  }

  const getStatus = (produced: number, target: number, expiringSoon: number): Status => {
    const percentage = (produced / target) * 100
    if (expiringSoon > 5) return "critical"
    if (percentage < 80 || expiringSoon > 2) return "warning"
    return "good"
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      {/* Header */}
      <div className="mb-8 bg-card border border-border rounded-xl p-6 shadow-sm">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          {/* Title Section */}
          <div className="flex-1">
            <h1 className="text-3xl md:text-4xl font-bold text-foreground">Kitchen Dashboard</h1>
            <p className="text-sm text-muted-foreground mt-2">Production overview by plate color</p>
          </div>

          {/* Navigation and Action Section */}
          <div className="w-full md:w-auto flex flex-col sm:flex-row gap-3">
            {/* Navigation Buttons Group */}
            <div className="flex gap-2 bg-secondary/50 rounded-lg p-1">
              <Link
                href="/kitchen/produce"
                className="px-4 py-2 rounded-md text-sm font-medium text-secondary-foreground hover:bg-primary/20 transition-colors"
              >
                Produce
              </Link>
              <Link
                href="/kitchen/conveyor"
                className="px-4 py-2 rounded-md text-sm font-medium text-secondary-foreground hover:bg-primary/20 transition-colors"
              >
                Conveyor
              </Link>
              <Link
                href="/kitchen/expired"
                className="px-4 py-2 rounded-md text-sm font-medium text-secondary-foreground hover:bg-destructive/20 transition-colors"
              >
                Expired
              </Link>
            </div>

            {/* Logout Button */}
            <Button
              onClick={handleLogout}
              variant="destructive"
              size="sm"
              className="gap-2 w-full sm:w-auto justify-center"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </Button>
          </div>
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
    </div>
  )
}
