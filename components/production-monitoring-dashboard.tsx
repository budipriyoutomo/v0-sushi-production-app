'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { TrendingUp, TrendingDown, Download, RefreshCw, Calendar, Loader2 } from 'lucide-react'
import { PlateColorBadge, type PlateColor } from '@/components/plate-color-badge'
import { OutletSelector } from '@/components/outlet-selector'
import { useOutlet } from '@/lib/outlet-context'
import { useAuth } from '@/hooks/use-auth'
import { reportsService } from '@/lib/api'
import { useToast } from '@/hooks/use-toast'

// Types for API response
interface BeltPerformanceItem {
  time: string
  sold: number
  expired: number
}

interface ColorPlateItem {
  color: PlateColor
  price: number
  released: number
  sold: number
  expired: number
  revenue: number
}

interface TopProductItem {
  rank: number
  name: string
  released: number
  sold: number
  expired: number
  avgTime: number
  sellThrough: number
}

interface WasteCostItem {
  product: string
  cost: number
}

interface DailySummaryData {
  date: string
  outletId: string
  outletName: string
  totalProduced: number
  totalSold: number
  totalWaste: number
  totalRevenue: number
  wastePercentage: number
  topSellingItems: Array<{ menuName: string; quantity: number }>
  beltPerformance?: BeltPerformanceItem[]
  colorPlatePerformance?: ColorPlateItem[]
  topProducts?: TopProductItem[]
  wasteCost?: WasteCostItem[]
}

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
  const { selectedOutlet } = useOutlet()
  const { user } = useAuth()
  const { toast } = useToast()
  
  // Get today's date in YYYY-MM-DD format
  const today = new Date().toISOString().split('T')[0]
  const [date, setDate] = useState(today)
  const [isLoading, setIsLoading] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [summaryData, setSummaryData] = useState<DailySummaryData | null>(null)
  
  // Derived data from API response
  const beltPerformanceData = summaryData?.beltPerformance || []
  const colorPlateData = summaryData?.colorPlatePerformance || []
  const topProductsData = summaryData?.topProducts || []
  const wasteCostData = summaryData?.wasteCost || []

  // Get outlet ID from user's outlets or selected outlet
  const outletId = selectedOutlet?.id || user?.outlet?.[0] || null

  const fetchDailySummary = async () => {
    if (!outletId || !date) {
      toast({
        title: 'Missing Information',
        description: 'Please select an outlet and date',
        variant: 'destructive',
      })
      return
    }

    setIsLoading(true)
    try {
      const response = await reportsService.getDailySummary(outletId, date)
      setSummaryData(response as unknown as DailySummaryData)
      toast({
        title: 'Data Loaded',
        description: `Daily summary for ${date} loaded successfully`,
      })
    } catch (error) {
      console.error('Error fetching daily summary:', error)
      toast({
        title: 'Error',
        description: 'Failed to load daily summary data',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleRefresh = async () => {
    setIsRefreshing(true)
    await fetchDailySummary()
    setIsRefreshing(false)
  }

  // Calculate KPI values from data
  const totalPlatesReleased = summaryData?.totalProduced || colorPlateData.reduce((sum, item) => sum + item.released, 0)
  const totalSoldPlates = summaryData?.totalSold || colorPlateData.reduce((sum, item) => sum + item.sold, 0)
  const totalExpiredPlates = summaryData?.totalWaste || colorPlateData.reduce((sum, item) => sum + item.expired, 0)
  const sellThroughRate = totalPlatesReleased > 0 ? ((totalSoldPlates / totalPlatesReleased) * 100).toFixed(1) : '0'
  const totalWasteCost = wasteCostData.reduce((sum, item) => sum + item.cost, 0)
  const wastePercentage = summaryData?.wastePercentage?.toFixed(1) || (totalPlatesReleased > 0 ? ((totalExpiredPlates / totalPlatesReleased) * 100).toFixed(1) : '0')
  const potentialRevenueLost = (totalExpiredPlates * 30000).toLocaleString('id-ID')
  const totalRevenue = summaryData?.totalRevenue || 0

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold">Daily Summary</h1>
          <p className="text-muted-foreground mt-1">Daily operational efficiency and revenue performance</p>
        </div>
        <div className="flex items-center gap-2">
          <OutletSelector />
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
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Date:</span>
          <Input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-40"
          />
        </div>
        <Button 
          onClick={fetchDailySummary}
          disabled={isLoading || !outletId}
          className="gap-2"
        >
          {isLoading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Calendar className="w-4 h-4" />
          )}
          {isLoading ? 'Loading...' : 'Get Data'}
        </Button>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          <span className="ml-2 text-muted-foreground">Loading daily summary...</span>
        </div>
      )}

      {/* No Data State */}
      {!isLoading && !summaryData && (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">No data loaded. Select a date and click &quot;Get Data&quot; to load the daily summary.</p>
          </CardContent>
        </Card>
      )}

      {/* Data Sections - Only show when data is loaded */}
      {summaryData && (
        <>
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

          {/* Total Revenue Card */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Revenue</p>
                  <p className="text-3xl font-bold mt-2">Rp {totalRevenue.toLocaleString('id-ID')}</p>
                </div>
                <TrendingUp className="w-8 h-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          {/* Top Selling Items */}
          {summaryData.topSellingItems && summaryData.topSellingItems.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Top Selling Items</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {summaryData.topSellingItems.map((item, index) => (
                    <div key={index} className="flex items-center justify-between p-2 border-b last:border-0">
                      <span className="font-medium">{item.menuName}</span>
                      <span className="text-muted-foreground">{item.quantity} sold</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Section 1: Belt Performance */}
          {beltPerformanceData.length > 0 && (
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
          )}

          {/* Section 2: Color Plate Performance */}
          {colorPlateData.length > 0 && (
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
          )}

          {/* Section 3: Top Product Performance */}
          {topProductsData.length > 0 && (
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
                              {row.rank <= 3 && <span className="text-lg">{'Trophy'}</span>}
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
          )}

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
          {wasteCostData.length > 0 && (
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
          )}
        </>
      )}
    </div>
  )
}
