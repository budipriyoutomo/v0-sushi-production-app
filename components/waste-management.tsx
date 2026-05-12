"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { OutletSelector } from "@/components/outlet-selector"
import { useOutlet } from "@/lib/outlet-context"
import { usePlateColors } from "@/hooks/use-plate-colors"
import { useToast } from "@/hooks/use-toast"
import { Loader2, Search, Calendar, Store } from "lucide-react"
import type { WasteEntry, PlateColorConfig } from "@/lib/types"

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

  // Get background color class for plate color card
  const getPlateColorBg = (platename: string) => {
    const colorMap: Record<string, string> = {
      'white': 'bg-gray-50',
      'blue': 'bg-blue-50',
      'pink': 'bg-pink-50',
      'black': 'bg-gray-800 text-white',
      'red': 'bg-red-50',
      'gold': 'bg-amber-50',
      'choco motive': 'bg-amber-100',
      'yellow': 'bg-yellow-50',
      'silver': 'bg-slate-100',
      'green': 'bg-emerald-50',
    }
    return colorMap[platename.toLowerCase()] || 'bg-muted'
  }

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
            <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center">
              {/* Outlet Selection */}
              <div className="flex items-center gap-3 flex-1 min-w-[200px]">
                <Store className="w-5 h-5 text-muted-foreground shrink-0" />
                <div className="flex-1">
                  <OutletSelector />
                </div>
              </div>

              {/* Date Selection */}
              <div className="flex items-center gap-3">
                <Calendar className="w-5 h-5 text-muted-foreground shrink-0" />
                <Input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="h-10 bg-background w-[180px]"
                />
              </div>

              {/* Fetch Button */}
              <Button 
                onClick={handleFetchWasteData} 
                disabled={isLoading || !selectedOutletId}
                className="h-10 px-6"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Loading...
                  </>
                ) : (
                  <>
                    <Search className="w-4 h-4 mr-2" />
                    Fetch Data
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
          {/* Total Waste Card */}
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Total Waste</p>
              <p className="text-3xl font-bold">{totalWaste}</p>
            </CardContent>
          </Card>

          {/* Plate Color Stats - Dynamic from master data */}
          {isLoadingPlateColors ? (
            <Card>
              <CardContent className="p-4 flex items-center justify-center">
                <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
              </CardContent>
            </Card>
          ) : (
            plateColors.filter(pc => pc.isActive).slice(0, 5).map((plateColor) => (
              <Card key={plateColor.id} className={getPlateColorBg(plateColor.platename)}>
                <CardContent className="p-4">
                  <p className="text-sm font-medium capitalize mb-1">{plateColor.platename}</p>
                  <p className="text-2xl font-bold">{stats[plateColor.id]?.count || 0}</p>
                </CardContent>
              </Card>
            ))
          )}
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
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize bg-muted">
                            {entry.plateColor}
                          </span>
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
