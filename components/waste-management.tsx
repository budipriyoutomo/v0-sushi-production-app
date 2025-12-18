"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { PlateColorBadge, type PlateColor } from "@/components/plate-color-badge"
import type { WasteEntry } from "@/lib/types"

const mockWasteEntries: WasteEntry[] = [
  {
    id: "1",
    time: new Date(Date.now() - 2 * 60 * 60 * 1000),
    sushiName: "California Roll",
    plateColor: "green",
    quantity: 2,
    reason: "Expired on conveyor",
  },
  {
    id: "2",
    time: new Date(Date.now() - 3 * 60 * 60 * 1000),
    sushiName: "Salmon Nigiri",
    plateColor: "blue",
    quantity: 3,
    reason: "Expired on conveyor",
  },
  {
    id: "3",
    time: new Date(Date.now() - 5 * 60 * 60 * 1000),
    sushiName: "Spicy Tuna Roll",
    plateColor: "red",
    quantity: 1,
    reason: "Quality issue",
  },
  {
    id: "4",
    time: new Date(Date.now() - 6 * 60 * 60 * 1000),
    sushiName: "Rainbow Roll",
    plateColor: "black",
    quantity: 1,
    reason: "Overproduction",
  },
  {
    id: "5",
    time: new Date(Date.now() - 7 * 60 * 60 * 1000),
    sushiName: "Cucumber Roll",
    plateColor: "green",
    quantity: 2,
    reason: "Expired on conveyor",
  },
]

export function WasteManagement() {
  const [filterColor, setFilterColor] = useState<PlateColor | "all">("all")
  const [entries] = useState<WasteEntry[]>(mockWasteEntries)

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

  const stats = getWasteStats()
  const totalWaste = Object.values(stats).reduce((sum, stat) => sum + stat.count, 0)
  const totalProduced = 500 // Mock value
  const wastePercentage = ((totalWaste / totalProduced) * 100).toFixed(1)

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold">Waste Management</h1>
          <p className="text-muted-foreground mt-1">Track and analyze production waste</p>
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
                  {filteredEntries.map((entry) => (
                    <tr key={entry.id} className="border-b hover:bg-muted/50">
                      <td className="p-3">{entry.time.toLocaleTimeString()}</td>
                      <td className="p-3 font-medium">{entry.sushiName}</td>
                      <td className="p-3">
                        <PlateColorBadge color={entry.plateColor} />
                      </td>
                      <td className="p-3 text-center">{entry.quantity}</td>
                      <td className="p-3 text-muted-foreground">{entry.reason}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
