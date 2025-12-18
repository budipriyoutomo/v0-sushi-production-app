"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Bar, BarChart, CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, XAxis, YAxis } from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { TrendingUp, TrendingDown } from "lucide-react"

const productionVsSalesData = [
  { hour: "10:00", produced: 50, sold: 45 },
  { hour: "11:00", produced: 68, sold: 62 },
  { hour: "12:00", produced: 85, sold: 80 },
  { hour: "13:00", produced: 68, sold: 65 },
  { hour: "14:00", produced: 53, sold: 50 },
  { hour: "15:00", produced: 44, sold: 42 },
  { hour: "16:00", produced: 30, sold: 28 },
  { hour: "17:00", produced: 35, sold: 33 },
]

const wasteByColorData = [
  { color: "Green", waste: 4, percentage: 2.8 },
  { color: "Blue", waste: 6, percentage: 5.1 },
  { color: "Red", waste: 3, percentage: 3.2 },
  { color: "Black", waste: 2, percentage: 3.4 },
]

export function ReportsDashboard() {
  const [dateRange, setDateRange] = useState("today")

  // KPI calculations
  const totalProduced = productionVsSalesData.reduce((sum, d) => sum + d.produced, 0)
  const totalSold = productionVsSalesData.reduce((sum, d) => sum + d.sold, 0)
  const totalWaste = wasteByColorData.reduce((sum, d) => sum + d.waste, 0)
  const wastePercentage = ((totalWaste / totalProduced) * 100).toFixed(1)
  const salesRate = ((totalSold / totalProduced) * 100).toFixed(1)

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold">Production Reports</h1>
            <p className="text-muted-foreground mt-1">Analytics and performance metrics</p>
          </div>
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="week">This Week</SelectItem>
              <SelectItem value="month">This Month</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Total Produced</p>
                  <p className="text-3xl font-bold">{totalProduced}</p>
                  <div className="flex items-center gap-1 mt-2 text-sm text-emerald-600">
                    <TrendingUp className="w-4 h-4" />
                    <span>+12% vs yesterday</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Total Sold</p>
                  <p className="text-3xl font-bold">{totalSold}</p>
                  <div className="flex items-center gap-1 mt-2 text-sm text-emerald-600">
                    <TrendingUp className="w-4 h-4" />
                    <span>{salesRate}% sales rate</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Total Waste</p>
                  <p className="text-3xl font-bold">{totalWaste}</p>
                  <div className="flex items-center gap-1 mt-2 text-sm text-amber-600">
                    <TrendingDown className="w-4 h-4" />
                    <span>-5% vs yesterday</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Waste Percentage</p>
                  <p className="text-3xl font-bold text-red-600">{wastePercentage}%</p>
                  <div className="flex items-center gap-1 mt-2 text-sm text-muted-foreground">
                    <span>Target: {"<"}5%</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Production vs Sales Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Production vs Sales</CardTitle>
            </CardHeader>
            <CardContent>
              <ChartContainer
                config={{
                  produced: {
                    label: "Produced",
                    color: "hsl(var(--chart-1))",
                  },
                  sold: {
                    label: "Sold",
                    color: "hsl(var(--chart-2))",
                  },
                }}
                className="h-80"
              >
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={productionVsSalesData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="hour" />
                    <YAxis />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Legend />
                    <Line type="monotone" dataKey="produced" stroke="var(--color-produced)" strokeWidth={2} />
                    <Line type="monotone" dataKey="sold" stroke="var(--color-sold)" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </ChartContainer>
            </CardContent>
          </Card>

          {/* Waste by Plate Color Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Waste by Plate Color</CardTitle>
            </CardHeader>
            <CardContent>
              <ChartContainer
                config={{
                  waste: {
                    label: "Waste",
                    color: "hsl(var(--destructive))",
                  },
                }}
                className="h-80"
              >
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={wasteByColorData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="color" />
                    <YAxis />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar dataKey="waste" fill="var(--color-waste)" />
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
            </CardContent>
          </Card>
        </div>

        {/* Detailed Waste Table */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Waste Analysis by Color</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-3 font-semibold">Plate Color</th>
                    <th className="text-right p-3 font-semibold">Total Waste</th>
                    <th className="text-right p-3 font-semibold">Waste %</th>
                    <th className="text-right p-3 font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {wasteByColorData.map((item) => (
                    <tr key={item.color} className="border-b hover:bg-muted/50">
                      <td className="p-3 font-medium">{item.color}</td>
                      <td className="p-3 text-right">{item.waste}</td>
                      <td className="p-3 text-right">{item.percentage}%</td>
                      <td className="p-3 text-right">
                        {item.percentage < 5 ? (
                          <span className="text-emerald-600 font-medium">Good</span>
                        ) : (
                          <span className="text-red-600 font-medium">High</span>
                        )}
                      </td>
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
