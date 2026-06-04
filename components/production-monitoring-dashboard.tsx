'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { TrendingUp, TrendingDown, RefreshCw, AlertTriangle, CheckCircle, Loader2, Award, Clock, DollarSign, Layers } from 'lucide-react'
import { PlateColorBadge, type PlateColor } from '@/components/plate-color-badge'
import { OutletSelector } from '@/components/outlet-selector' // <-- IMPORT DIKEMBALIKAN
import { useOutlet } from '@/lib/outlet-context'
import { useAuth } from '@/hooks/use-auth'
import { reportsService } from '@/lib/api'
import { useToast } from '@/hooks/use-toast'

// Types & Interfaces
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

interface ReconciliationItem {
  plateColorId: string
  plateColorName: string
  posSold: number
  productionSold: number
  productionWaste: number
  adjustment: number
  compensation: number
  selisih: number
}

interface DailySummaryData {
  date: string
  outletId: string
  outletName: string
  
  // Operational Analytics Payload
  totalProduced?: number
  totalSold?: number
  totalWaste?: number
  totalRevenue?: number
  wastePercentage?: number
  topSellingItems?: Array<{ menuName: string; quantity: number }>
  beltPerformance?: BeltPerformanceItem[]
  colorPlatePerformance?: ColorPlateItem[]
  topProducts?: TopProductItem[]
  wasteCost?: WasteCostItem[]

  // Reconciliation Payload
  totalPOS?: number
  totalProduction?: number
  totalAdjustment?: number
  totalCompensation?: number
  totalSelisih?: number
  items?: ReconciliationItem[]
}

export function ProductionMonitoringDashboard() {
  const { selectedOutletId } = useOutlet()
  const { user } = useAuth()
  const { toast } = useToast()

  const today = new Date().toISOString().split('T')[0]
  const [date, setDate] = useState(today)
  const [isLoading, setIsLoading] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [summaryData, setSummaryData] = useState<DailySummaryData | null>(null)
  const [activeTab, setActiveTab] = useState<'reconciliation' | 'analytics' | 'products'>('reconciliation')

  const outletId = selectedOutletId || user?.outlet?.[0] || null

  // Destructuring Arrays dari Response API
  const beltPerformanceData = summaryData?.beltPerformance || []
  const colorPlateData = summaryData?.colorPlatePerformance || []
  const topProductsData = summaryData?.topProducts || []
  const wasteCostData = summaryData?.wasteCost || []
  const itemsData = summaryData?.items || []

  // Fungsi Fetch Utama dengan Proteksi Struktur Data Flexibel
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
      
      if (response) {
        const extractedData = (response as any).status !== undefined && (response as any).data
          ? (response as any).data
          : response;

        setSummaryData(extractedData as DailySummaryData)
        toast({
          title: 'Data Loaded',
          description: `Daily data for ${date} loaded successfully`,
        })
      } else {
        throw new Error('No data received from the server')
      }
    } catch (error: any) {
      console.error('Error fetching daily summary:', error)
      toast({
        title: 'Error',
        description: error.message || 'Failed to load daily summary data',
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

  // Kalkulasi Gabungan Metrik & KPI
  const totalPlatesReleased = summaryData?.totalProduced || summaryData?.totalProduction || colorPlateData.reduce((sum, item) => sum + item.released, 0)
  const totalSoldPlates = summaryData?.totalSold || summaryData?.totalPOS || colorPlateData.reduce((sum, item) => sum + item.sold, 0)
  const totalExpiredPlates = summaryData?.totalWaste || colorPlateData.reduce((sum, item) => sum + item.expired, 0)
  const totalRevenue = summaryData?.totalRevenue || colorPlateData.reduce((sum, item) => sum + item.revenue, 0) || 0
  const totalSelisih = summaryData?.totalSelisih || 0

  const sellThroughRate = totalPlatesReleased > 0 ? ((totalSoldPlates / totalPlatesReleased) * 100).toFixed(1) : '0'
  const wastePercentage = summaryData?.wastePercentage?.toFixed(1) || (totalPlatesReleased > 0 ? ((totalExpiredPlates / totalPlatesReleased) * 100).toFixed(1) : '0')
  const totalWasteCost = wasteCostData.reduce((sum, item) => sum + item.cost, 0)

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Production & Operations Dashboard</h1>
          <p className="text-muted-foreground">
            {summaryData?.outletName ? `${summaryData.outletName} — ` : ''} Daily Operational Efficiency & Reconciliation
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isRefreshing || isLoading}
            className="gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button variant="outline" size="sm">Export Data</Button>
        </div>
      </div>

      {/* Filter Toolbar dengan OutletSelector */}
      <div className="flex flex-wrap items-center gap-4 bg-muted/40 p-4 rounded-xl">
        {/* DIKEMBALIKAN KE SINI */}
        <OutletSelector /> 

        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">Reporting Date:</span>
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
          {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
          {isLoading ? 'Loading...' : 'Get Data'}
        </Button>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="flex flex-col items-center justify-center p-12 text-muted-foreground gap-2">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p>Processing metrics and analytics data...</p>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !summaryData && (
        <div className="flex items-center justify-center p-12 text-muted-foreground border-2 border-dashed rounded-xl">
          No records loaded. Please choose an outlet & date target and click "Get Data".
        </div>
      )}

      {/* Dashboard Content */}
      {summaryData && !isLoading && (
        <>
          {/* Global KPI Cards Grid */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <KPICard 
              label="Total Production / Released" 
              value={totalPlatesReleased.toLocaleString()} 
              description="Total items placed on conveyor belt"
              icon={Layers} 
            />
            <KPICard 
              label="Sales (POS / Total Sold)" 
              value={totalSoldPlates.toLocaleString()} 
              description={`Sell-Through Rate: ${sellThroughRate}%`}
              icon={CheckCircle} 
            />
            <KPICard 
              label="Expired / Waste Items" 
              value={totalExpiredPlates.toLocaleString()} 
              description={`Waste Ratio: ${wastePercentage}%`}
              icon={TrendingDown}
              variant={totalExpiredPlates > 0 ? 'warning' : 'default'}
            />
            <KPICard 
              label="Total Revenue Received" 
              value={`Rp ${totalRevenue.toLocaleString('id-ID')}`} 
              description={totalWasteCost > 0 ? `Waste cost loss: Rp ${totalWasteCost.toLocaleString('id-ID')}` : 'No significant waste losses'}
              icon={DollarSign}
            />
          </div>

          {/* Navigation Tabs Header */}
          <div className="flex border-b border-muted gap-2">
            <button
              onClick={() => setActiveTab('reconciliation')}
              className={`pb-3 px-4 text-sm font-medium transition-colors border-b-2 -mb-[2px] ${
                activeTab === 'reconciliation' ? 'border-primary text-primary font-semibold' : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              POS & Belt Reconciliation
            </button>
            <button
              onClick={() => setActiveTab('analytics')}
              className={`pb-3 px-4 text-sm font-medium transition-colors border-b-2 -mb-[2px] ${
                activeTab === 'analytics' ? 'border-primary text-primary font-semibold' : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              Belt & Plate Analytics
            </button>
            <button
              onClick={() => setActiveTab('products')}
              className={`pb-3 px-4 text-sm font-medium transition-colors border-b-2 -mb-[2px] ${
                activeTab === 'products' ? 'border-primary text-primary font-semibold' : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              Product Performance
            </button>
          </div>

          {/* TAB 1: RECONCILIATION */}
          {activeTab === 'reconciliation' && (
            <div className="space-y-6">
              {totalSelisih !== 0 && (
                <div className="flex items-center gap-3 p-4 bg-red-50 text-red-800 dark:bg-red-950/30 dark:text-red-300 rounded-xl border border-red-200">
                  <AlertTriangle className="w-5 h-5 flex-shrink-0" />
                  <span className="text-sm font-medium">
                    Attention: Variance discrepancy detected! Total unresolved difference amounts to <strong>{totalSelisih.toLocaleString()}</strong> plates.
                  </span>
                </div>
              )}

              {itemsData.length > 0 ? (
                <>
                  <Card>
                    <CardHeader>
                      <CardTitle>Reconciliation Deviation Chart</CardTitle>
                      <CardDescription>Comparison matrix between Cashier POS data versus kitchen belt counters</CardDescription>
                    </CardHeader>
                    <CardContent className="h-[320px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={itemsData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="plateColorName" />
                          <YAxis />
                          <Tooltip />
                          <Legend />
                          <Bar dataKey="posSold" name="POS Cashier Sold" fill="#10b981" radius={[4, 4, 0, 0]} />
                          <Bar dataKey="productionSold" name="Kitchen Belt Sold" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                          <Bar dataKey="productionWaste" name="Recorded Waste" fill="#ef4444" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Detailed Reconciliation Matrix</CardTitle>
                    </CardHeader>
                    <CardContent className="overflow-x-auto p-0">
                      <table className="w-full text-sm text-left border-collapse">
                        <thead>
                          <tr className="border-b bg-muted/50 font-medium text-muted-foreground">
                            <th className="p-4">Plate Color</th>
                            <th className="p-4 text-right">POS Sold</th>
                            <th className="p-4 text-right">Prod Sold</th>
                            <th className="p-4 text-right">Waste</th>
                            <th className="p-4 text-right">Adjustment</th>
                            <th className="p-4 text-right">Compensation</th>
                            <th className="p-4 text-right">Variance (Selisih)</th>
                          </tr>
                        </thead>
                        <tbody>
                          {itemsData.map((row) => (
                            <tr key={row.plateColorId} className="border-b hover:bg-muted/50 transition-colors">
                              <td className="p-4 font-medium">
                                <PlateColorBadge color={row.plateColorName.toLowerCase() as PlateColor} />
                              </td>
                              <td className="p-4 text-right font-semibold">{row.posSold.toLocaleString()}</td>
                              <td className="p-4 text-right">{row.productionSold.toLocaleString()}</td>
                              <td className={`p-4 text-right ${row.productionWaste > 0 ? 'text-red-500 font-medium' : ''}`}>
                                {row.productionWaste.toLocaleString()}
                              </td>
                              <td className="p-4 text-right">{row.adjustment.toLocaleString()}</td>
                              <td className="p-4 text-right">{row.compensation.toLocaleString()}</td>
                              <td className={`p-4 text-right font-bold ${row.selisih !== 0 ? 'text-red-600 bg-red-50/50' : 'text-green-600'}`}>
                                {row.selisih > 0 ? `+${row.selisih}` : row.selisih}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </CardContent>
                  </Card>
                </>
              ) : (
                <div className="p-8 text-center text-muted-foreground bg-muted/20 border rounded-xl">No reconciliation items available for this date payload.</div>
              )}
            </div>
          )}

          {/* TAB 2: OPERATIONAL & BELT ANALYTICS */}
          {activeTab === 'analytics' && (
            <div className="space-y-6">
              {beltPerformanceData.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Belt Performance Timeline</CardTitle>
                    <CardDescription>Sold vs Expired plates over operational time intervals</CardDescription>
                  </CardHeader>
                  <CardContent className="h-[350px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={beltPerformanceData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="time" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Line type="monotone" dataKey="sold" stroke="#10b981" strokeWidth={2} dot={{ r: 4 }} name="Plates Sold" />
                        <Line type="monotone" dataKey="expired" stroke="#ef4444" strokeWidth={2} dot={{ r: 4 }} name="Plates Expired" />
                      </LineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              )}

              {colorPlateData.length > 0 ? (
                <Card>
                  <CardHeader>
                    <CardTitle>Color Plate Efficiency Statistics</CardTitle>
                    <CardDescription>Breakdown by pricing matrix categories</CardDescription>
                  </CardHeader>
                  <CardContent className="overflow-x-auto p-0">
                    <table className="w-full text-sm text-left border-collapse">
                      <thead>
                        <tr className="border-b bg-muted/50 font-medium text-muted-foreground">
                          <th className="p-4">Color Category</th>
                          <th className="p-4 text-right">Unit Price</th>
                          <th className="p-4 text-right">Released</th>
                          <th className="p-4 text-right">Total Sold</th>
                          <th className="p-4 text-right">Total Expired</th>
                          <th className="p-4 text-right">Sell-Through %</th>
                          <th className="p-4 text-right">Generated Revenue</th>
                        </tr>
                      </thead>
                      <tbody>
                        {colorPlateData.map((row, index) => {
                          const sellThrough = row.released > 0 ? ((row.sold / row.released) * 100).toFixed(1) : '0'
                          return (
                            <tr key={index} className="border-b hover:bg-muted/50 transition-colors">
                              <td className="p-4 font-medium">
                                <PlateColorBadge color={row.color.toLowerCase() as PlateColor} />
                              </td>
                              <td className="p-4 text-right">Rp {row.price.toLocaleString('id-ID')}</td>
                              <td className="p-4 text-right">{row.released.toLocaleString()}</td>
                              <td className="p-4 text-right">{row.sold.toLocaleString()}</td>
                              <td className="p-4 text-right text-red-500">{row.expired.toLocaleString()}</td>
                              <td className={`p-4 text-right font-medium ${Number(sellThrough) >= 80 ? 'text-green-600' : 'text-orange-600'}`}>
                                {sellThrough}%
                              </td>
                              <td className="p-4 text-right font-semibold text-primary">
                                Rp {row.revenue.toLocaleString('id-ID')}
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </CardContent>
                </Card>
              ) : (
                <div className="p-8 text-center text-muted-foreground bg-muted/20 border rounded-xl">No explicit plate color categorization analytics array present.</div>
              )}
            </div>
          )}

          {/* TAB 3: PRODUCT PERFORMANCE */}
          {activeTab === 'products' && (
            <div className="grid gap-6 md:grid-cols-3">
              {/* Left Column: Top Selling Quick-List */}
              {summaryData.topSellingItems && summaryData.topSellingItems.length > 0 && (
                <Card className="md:col-span-1">
                  <CardHeader>
                    <div className="flex items-center gap-2">
                      <Award className="w-5 h-5 text-yellow-500" />
                      <CardTitle>Top Selling Items</CardTitle>
                    </div>
                    <CardDescription>Highest quantities sold</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {summaryData.topSellingItems.map((item, index) => (
                        <div key={index} className="flex items-center justify-between border-b pb-2 last:border-0 last:pb-0">
                          <span className="font-medium text-sm">{item.menuName}</span>
                          <span className="text-emerald-600 font-semibold text-sm">{item.quantity} sold</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Right Column: Detailed Matrix Product */}
              <Card className={summaryData.topSellingItems && summaryData.topSellingItems.length > 0 ? 'md:col-span-2' : 'md:col-span-3'}>
                <CardHeader>
                  <CardTitle>Detailed Menu Product Metrics</CardTitle>
                  <CardDescription>Ranked by efficiency and sell-through rate factors</CardDescription>
                </CardHeader>
                <CardContent className="overflow-x-auto p-0">
                  {topProductsData.length > 0 ? (
                    <table className="w-full text-sm text-left border-collapse">
                      <thead>
                        <tr className="border-b bg-muted/50 font-medium text-muted-foreground">
                          <th className="p-4 w-12">Rank</th>
                          <th className="p-4">Product Name</th>
                          <th className="p-4 text-right">Released</th>
                          <th className="p-4 text-right">Sold</th>
                          <th className="p-4 text-right">Expired</th>
                          <th className="p-4 text-right">Avg Belt Time</th>
                          <th className="p-4 text-right">Sell Through</th>
                        </tr>
                      </thead>
                      <tbody>
                        {topProductsData.map((row) => (
                          <tr key={row.rank} className={`border-b hover:bg-muted/50 transition-colors ${row.rank <= 3 ? 'bg-amber-50/40 dark:bg-amber-950/10' : ''}`}>
                            <td className="p-4 font-bold text-center">{row.rank}</td>
                            <td className="p-4 font-medium">{row.name}</td>
                            <td className="p-4 text-right">{row.released}</td>
                            <td className="p-4 text-right font-medium text-emerald-600">{row.sold}</td>
                            <td className="p-4 text-right text-red-500">{row.expired}</td>
                            <td className="p-4 text-right text-muted-foreground">
                              <span className="inline-flex items-center gap-1">
                                <Clock className="w-3 h-3" /> {row.avgTime}m
                              </span>
                            </td>
                            <td className="p-4 text-right font-bold text-emerald-600">{row.sellThrough}%</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <div className="p-8 text-center text-muted-foreground">No detailed top products analytics table received.</div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </>
      )}
    </div>
  )
}

function KPICard({ label, value, description, icon: Icon, variant }: { 
  label: string; 
  value: string; 
  description?: string;
  icon: React.ComponentType<{ className?: string }>;
  variant?: 'default' | 'warning' | 'danger'
}) {
  const getIconColor = () => {
    if (variant === 'danger') return 'text-red-500 bg-red-100 dark:bg-red-950/40 p-1 rounded'
    if (variant === 'warning') return 'text-amber-500 bg-amber-100 dark:bg-amber-950/40 p-1 rounded'
    return 'text-muted-foreground bg-muted p-1 rounded'
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
        <Icon className={`h-6 w-6 ${getIconColor()}`} />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold tracking-tight">{value}</div>
        {description && (
          <p className="text-xs text-muted-foreground mt-1 font-medium">{description}</p>
        )}
      </CardContent>
    </Card>
  )
}