"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { PlateColorBadge, type PlateColor } from "@/components/plate-color-badge"
import { OutletSelector } from "@/components/outlet-selector"
import { useOutlet } from "@/lib/outlet-context"
import { useToast } from "@/hooks/use-toast"
import { Loader2, Search, Calendar } from "lucide-react"
import type { WasteEntry } from "@/lib/types"

export function WasteManagement() {
  const { toast } = useToast()
  const { selectedOutletId } = useOutlet()
  const [filterColor, setFilterColor] = useState<PlateColor | "all">("all")
  const [entries, setEntries] = useState<WasteEntry[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [selectedDate, setSelectedDate] = useState(() => {
    const today = new Date()
    return today.toISOString().split('T')[0]
  })

  const filteredEntries = entries.filter((entry) => filterColor === "all" || entry.plateColor === filterColor)

  const getWasteStats = () => {
    const stats = {
      green: { count: 0, total: 0 },
      blue: { count: 0, total: 0 },
      red: { count: 0, total: 0 },
      black: { count: 0, total: 0 },
    }

    entries.forEach((entry) => {
      stats[entry.plateColor].count += entry.quantity
      stats[entry.plateColor].total += 1
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
      
      // For now, show empty state or mock data
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
  const totalProduced = 500 // Mock value
  const wastePercentage = ((totalWaste / totalProduced) * 100).toFixed(1)

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl md:text-4xl font-bold">Waste Management</h1>
          <p className="text-muted-foreground mt-1">Track and analyze production waste</p>
        </div>

        {/* Outlet and Date Selection */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <OutletSelector />
          <Card className="px-4 py-3 border border-border shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 min-w-[110px]">
                <Calendar className="w-5 h-5 text-primary" />
                <span className="text-sm font-medium text-muted-foreground">Date</span>
              </div>
              <Input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="h-9 bg-background min-w-[160px]"
              />
            </div>
          </Card>
          <Button 
            onClick={handleFetchWasteData} 
            disabled={isLoading || !selectedOutletId}
            className="h-auto md:h-[54px]"
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

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Total Waste</p>
              <p className="text-3xl font-bold">{totalWaste}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Waste %</p>
              <p className="text-3xl font-bold text-red-600">{wastePercentage}%</p>
            </CardContent>
          </Card>
          <Card className="bg-emerald-50">
            <CardContent className="p-4">
              <PlateColorBadge color="green" className="mb-2" />
              <p className="text-2xl font-bold">{stats.green.count}</p>
            </CardContent>
          </Card>
          <Card className="bg-blue-50">
            <CardContent className="p-4">
              <PlateColorBadge color="blue" className="mb-2" />
              <p className="text-2xl font-bold">{stats.blue.count}</p>
            </CardContent>
          </Card>
          <Card className="bg-red-50">
            <CardContent className="p-4">
              <PlateColorBadge color="red" className="mb-2" />
              <p className="text-2xl font-bold">{stats.red.count}</p>
            </CardContent>
          </Card>
        </div>

        {/* Waste Log */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Waste Log</CardTitle>
              <Select value={filterColor} onValueChange={(value) => setFilterColor(value as PlateColor | "all")}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Colors</SelectItem>
                  <SelectItem value="green">Green</SelectItem>
                  <SelectItem value="blue">Blue</SelectItem>
                  <SelectItem value="red">Red</SelectItem>
                  <SelectItem value="black">Black</SelectItem>
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
