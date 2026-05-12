"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { OutletSelector } from "@/components/outlet-selector"
import { PlateColorBadge } from "@/components/plate-color-badge"
import { useOutlet } from "@/lib/outlet-context"
import { usePlateColors } from "@/hooks/use-plate-colors"
import { useToast } from "@/hooks/use-toast"
import { Loader2, Search, Calendar } from "lucide-react"
import type { WasteEntry } from "@/lib/types"

export function WasteManagement() {
  const { toast } = useToast()
  const { selectedOutletId } = useOutlet()
  const { plateColors, isLoading: isLoadingPlateColors } = usePlateColors()
  
  const [filterColorId, setFilterColorId] = useState<string>("all")
  const [entries, setEntries] = useState<WasteEntry[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [selectedDate, setSelectedDate] = useState(() => {
    const today = new Date()
    return today.toISOString().split('T')[0]
  })

  // Filter entries by selected plate color
  const filteredEntries = entries.filter((entry) => {
    if (filterColorId === "all") return true
    const plateColor = plateColors.find(pc => pc.id === filterColorId)
    return plateColor && entry.plateColor === plateColor.platename.toLowerCase()
  })

  // Calculate waste stats per plate color from entries
  const getWasteStats = () => {
    const stats: Record<string, { count: number; total: number }> = {}
    
    plateColors.forEach(pc => {
      stats[pc.id] = { count: 0, total: 0 }
    })

    entries.forEach((entry) => {
      const plateColor = plateColors.find(pc => pc.platename.toLowerCase() === entry.plateColor)
      if (plateColor && stats[plateColor.id]) {
        stats[plateColor.id].count += entry.quantity
        stats[plateColor.id].total += 1
      }
    })

    return stats
  }

  // Fetch waste data from API
  const handleFetchWasteData = async () => {
    if (!selectedOutletId) {
      toast({
        title: 'Error',
        description: 'Please select an outlet first',
        variant: 'destructive',
      })
      return
    }

    setIsLoading(true)
    try {
      // TODO: Replace with actual API call when available
      // const data = await wasteService.getAll({ outletId: selectedOutletId, date: selectedDate })
      // setEntries(data)
      
      toast({
        title: 'Info',
        description: `Fetching waste data for ${selectedDate}...`,
      })
      setEntries([])
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to fetch waste data',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  const stats = getWasteStats()
  const totalWaste = Object.values(stats).reduce((sum, stat) => sum + stat.count, 0)
  // totalProduction is a placeholder — replace with real API data when available
  const totalProduction = 0
  const wastePercentage = totalProduction > 0 ? ((totalWaste / totalProduction) * 100).toFixed(1) : '0.0'

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl md:text-4xl font-bold">Waste Management</h1>
          <p className="text-muted-foreground mt-1">Track and analyze production waste</p>
        </div>

        {/* Filter Bar - Outlet, Date, Fetch Button */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
              <div className="flex-1 min-w-0">
                <OutletSelector />
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Calendar className="w-4 h-4 text-muted-foreground shrink-0" />
                <Input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="h-10 bg-background w-[160px]"
                />
              </div>
              <Button
                onClick={handleFetchWasteData}
                disabled={isLoading || !selectedOutletId}
                className="h-10 px-5 shrink-0"
              >
                {isLoading ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Loading...</>
                ) : (
                  <><Search className="w-4 h-4 mr-2" />Fetch Data</>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Stats Row: Plate Colors Card + Summary Card */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">

          {/* Plate Colors Card — all from master, default 0 */}
          <Card className="lg:col-span-2">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold">Waste by Plate Color</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              {isLoadingPlateColors ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                </div>
              ) : plateColors.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">No plate colors found in master data</p>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {plateColors.map((pc) => (
                    <div key={pc.id} className="flex items-center justify-between rounded-lg border bg-muted/30 px-4 py-3">
                      <PlateColorBadge color={pc.platename} />
                      <span className="text-2xl font-bold tabular-nums">{stats[pc.id]?.count ?? 0}</span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Summary Card — Total Waste, Total Production, % Waste */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold">Summary</CardTitle>
            </CardHeader>
            <CardContent className="pt-0 space-y-4">
              <div className="rounded-lg border bg-muted/30 px-4 py-4">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">Total Waste</p>
                <p className="text-3xl font-bold tabular-nums">{totalWaste}</p>
              </div>
              <div className="rounded-lg border bg-muted/30 px-4 py-4">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">Total Production</p>
                <p className="text-3xl font-bold tabular-nums">{totalProduction}</p>
              </div>
              <div className="rounded-lg border bg-muted/30 px-4 py-4">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">% Waste from Production</p>
                <p className="text-3xl font-bold tabular-nums">
                  {wastePercentage}
                  <span className="text-lg font-medium text-muted-foreground ml-1">%</span>
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Waste Log */}
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <CardTitle>Waste Log</CardTitle>
              <Select value={filterColorId} onValueChange={setFilterColorId}>
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue placeholder="Filter by color" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Colors</SelectItem>
                  {plateColors.filter(pc => pc.isActive).map((plateColor) => (
                    <SelectItem key={plateColor.id} value={plateColor.id}>
                      {plateColor.platename}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-3 font-semibold">Time</th>
                    <th className="text-left p-3 font-semibold">Sushi Name</th>
                    <th className="text-left p-3 font-semibold">Plate Color</th>
                    <th className="text-center p-3 font-semibold">Quantity</th>
                    <th className="text-left p-3 font-semibold">Reason</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredEntries.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-muted-foreground">
                        {!selectedOutletId 
                          ? 'Please select an outlet and click "Fetch Data" to view waste entries'
                          : 'No waste entries found. Click "Fetch Data" to load data.'}
                      </td>
                    </tr>
                  ) : (
                    filteredEntries.map((entry) => (
                      <tr key={entry.id} className="border-b hover:bg-muted/50">
                        <td className="p-3">{entry.time.toLocaleTimeString()}</td>
                        <td className="p-3 font-medium">{entry.sushiName}</td>
                        <td className="p-3">
                          <PlateColorBadge color={entry.plateColor} />
                        </td>
                        <td className="p-3 text-center">{entry.quantity}</td>
                        <td className="p-3 text-muted-foreground">{entry.reason}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
