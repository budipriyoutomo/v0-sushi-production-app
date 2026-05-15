'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts'
import { TrendingUp, TrendingDown, Download, RefreshCw, Calendar } from 'lucide-react'
import { PlateColorBadge, type PlateColor } from '@/components/plate-color-badge'

// Belt Performance Data
const beltPerformanceData: { time: string; sold: number; expired: number }[] = []

// Color Plate Performance
const colorPlateData: { color: PlateColor; price: number; released: number; sold: number; expired: number; revenue: number }[] = []

// Top Product Performance
const topProductsData: { rank: number; name: string; released: number; sold: number; expired: number; avgTime: number; sellThrough: number }[] = []

// Waste Cost Summary
const wasteCostData: { product: string; cost: number }[] = []

function KPICard({ label, value, trend, icon: Icon }: { label: string; value: string; trend: number; icon: React.ComponentType<{ className?: string }> }) {
  const isPositive = trend > 0
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{label}</p>
            <p className="text-3xl font-bold mt-2">{value}</p>
            <div className="flex items-center gap-1 mt-2">
              {isPositive ? (
                <>
                  <TrendingUp className="w-4 h-4 text-green-600" />
                  <p className="text-xs text-green-600">+{trend}% vs yesterday</p>
                </>
              ) : (
                <>
                  <TrendingDown className="w-4 h-4 text-red-600" />
                  <p className="text-xs text-red-600">{trend}% vs yesterday</p>
                </>
              )}
            </div>
          </div>
          <Icon className="w-8 h-8 text-muted-foreground" />
        </div>
      </CardContent>
    </Card>
  )
}

export function ProductionMonitoringDashboard() {
  const [dateRange, setDateRange] = useState('today')
  const [isRefreshing, setIsRefreshing] = useState(false)

  const totalPlatesReleased = colorPlateData.reduce((sum, item) => sum + item.released, 0)
  const totalSoldPlates = colorPlateData.reduce((sum, item) => sum + item.sold, 0)
  const totalExpiredPlates = colorPlateData.reduce((sum, item) => sum + item.expired, 0)
  const sellThroughRate = ((totalSoldPlates / totalPlatesReleased) * 100).toFixed(1)
  const totalWasteCost = wasteCostData.reduce((sum, item) => sum + item.cost, 0)
  const wastePercentage = ((totalExpiredPlates / totalPlatesReleased) * 100).toFixed(1)
  const potentialRevenueLost = (totalExpiredPlates * 30000).toLocaleString('id-ID')

  const handleRefresh = () => {
    setIsRefreshing(true)
    setTimeout(() => setIsRefreshing(false), 1000)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold">Production Monitoring Dashboard</h1>
          <p className="text-muted-foreground mt-1">Real-time operational efficiency and revenue performance</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button variant="outline" size="sm" className="gap-2">
            <Download className="w-4 h-4" />
            Export PDF
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2">
        <select
          value={dateRange}
          onChange={(e) => setDateRange(e.target.value)}
          className="px-3 py-2 text-sm border rounded-md bg-background"
        >
          <option value="today">Today</option>
          <option value="yesterday">Yesterday</option>
          <option value="week">This Week</option>
          <option value="month">This Month</option>
          <option value="custom">Custom Range</option>
        </select>
        <Button variant="outline" size="sm" className="gap-2">
          <Calendar className="w-4 h-4" />
          Custom
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          label="Total Plates Released"
          value={totalPlatesReleased.toLocaleString()}
          trend={8.5}
          icon={TrendingUp}
        />
        <KPICard
          label="Total Sold Plates"
          value={totalSoldPlates.toLocaleString()}
          trend={12.3}
          icon={TrendingUp}
        />
        <KPICard
          label="Expired Plates"
          value={totalExpiredPlates.toLocaleString()}
          trend={-5.2}
          icon={TrendingDown}
        />
        <KPICard
          label="Sell Through Rate"
          value={`${sellThroughRate}%`}
          trend={3.1}
          icon={TrendingUp}
        />
      </div>

      {/* Section 1: Belt Performance */}
      <Card>
        <CardHeader>
          <CardTitle>Belt Performance</CardTitle>
          <p className="text-sm text-muted-foreground">Sold vs Expired plates over time (30-minute intervals)</p>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={beltPerformanceData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="time" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line
                type="monotone"
                dataKey="sold"
                stroke="#10b981"
                strokeWidth={2}
                dot={{ r: 4 }}
                name="Sold"
              />
              <Line
                type="monotone"
                dataKey="expired"
                stroke="#ef4444"
                strokeWidth={2}
                dot={{ r: 4 }}
                name="Expired"
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Section 2: Color Plate Performance */}
      <Card>
        <CardHeader>
          <CardTitle>Color Plate Performance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">Plate Color</th>
                  <th className="text-center p-2">Price</th>
                  <th className="text-center p-2">Released</th>
                  <th className="text-center p-2">Sold</th>
                  <th className="text-center p-2">Expired</th>
                  <th className="text-center p-2">Sell Through %</th>
                  <th className="text-right p-2">Revenue</th>
                </tr>
              </thead>
              <tbody>
                {colorPlateData.map((row) => {
                  const sellThrough = ((row.sold / row.released) * 100).toFixed(1)
                  return (
                    <tr key={row.color} className="border-b hover:bg-muted/50">
                      <td className="p-2">
                        <PlateColorBadge color={row.color} />
                      </td>
                      <td className="text-center p-2">Rp {row.price.toLocaleString('id-ID')}</td>
                      <td className="text-center p-2 font-medium">{row.released}</td>
                      <td className="text-center p-2 font-medium text-green-600">{row.sold}</td>
                      <td className="text-center p-2 font-medium text-red-600">{row.expired}</td>
                      <td className="text-center p-2">
                        <span className={parseFloat(sellThrough) >= 94 ? 'text-green-600' : 'text-orange-600'}>
                          {sellThrough}%
                        </span>
                      </td>
                      <td className="text-right p-2 font-semibold">Rp {(row.revenue / 1000000).toFixed(1)}M</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Section 3: Top Product Performance */}
      <Card>
        <CardHeader>
          <CardTitle>Top Product Performance</CardTitle>
          <p className="text-sm text-muted-foreground">Ranked by sell-through rate and efficiency</p>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">Rank</th>
                  <th className="text-left p-2">Product Name</th>
                  <th className="text-center p-2">Released</th>
                  <th className="text-center p-2">Sold</th>
                  <th className="text-center p-2">Expired</th>
                  <th className="text-center p-2">Avg Time (min)</th>
                  <th className="text-center p-2">Sell Through %</th>
                </tr>
              </thead>
              <tbody>
                {topProductsData.map((row) => (
                  <tr
                    key={row.rank}
                    className={`border-b hover:bg-muted/50 ${
                      row.rank <= 3 ? 'bg-yellow-50/50' : ''
                    }`}
                  >
                    <td className="p-2">
                      <div className="flex items-center gap-2">
                        {row.rank <= 3 && <span className="text-lg">🏆</span>}
                        <span className="font-bold">{row.rank}</span>
                      </div>
                    </td>
                    <td className="p-2 font-medium">{row.name}</td>
                    <td className="text-center p-2">{row.released}</td>
                    <td className="text-center p-2 text-green-600">{row.sold}</td>
                    <td className="text-center p-2 text-red-600">{row.expired}</td>
                    <td className="text-center p-2">{row.avgTime}m</td>
                    <td className="text-center p-2">
                      <span className="font-semibold text-green-600">{row.sellThrough}%</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Section 4: Waste Cost Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Total Waste Cost Today</p>
            <p className="text-3xl font-bold mt-2">Rp {(totalWasteCost / 1000000).toFixed(1)}M</p>
            <p className="text-xs text-red-600 mt-2">Wasted: {totalExpiredPlates} items</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Waste % from Production</p>
            <p className="text-3xl font-bold mt-2">{wastePercentage}%</p>
            <p className="text-xs text-muted-foreground mt-2">Target: &lt;5%</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Potential Revenue Lost</p>
            <p className="text-3xl font-bold mt-2">Rp {potentialRevenueLost}</p>
            <p className="text-xs text-red-600 mt-2">At avg price Rp 30k</p>
          </CardContent>
        </Card>
      </div>

      {/* Waste by Product Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Waste Cost by Product</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={wasteCostData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="product" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="cost" fill="#ef4444" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

    </div>
  )
}
