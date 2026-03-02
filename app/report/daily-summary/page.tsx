'use client'

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { OutletSelector } from "@/components/outlet-selector"
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'

const dailySalesData = [
  { time: '08:00', sales: 2400, revenue: 2400 },
  { time: '10:00', sales: 3200, revenue: 2210 },
  { time: '12:00', sales: 4100, revenue: 2290 },
  { time: '14:00', sales: 2780, revenue: 2000 },
  { time: '16:00', sales: 1890, revenue: 2181 },
  { time: '18:00', sales: 5390, revenue: 2500 },
  { time: '20:00', sales: 3490, revenue: 2100 },
]

const plateColorSales = [
  { name: 'White Plate', value: 2500 },
  { name: 'Blue Plate', value: 2100 },
  { name: 'Pink Plate', value: 1800 },
  { name: 'Black Plate', value: 1200 },
  { name: 'Others', value: 1400 },
]

const COLORS = ['#3b82f6', '#8b5cf6', '#ec4899', '#000000', '#f59e0b']

export default function DailySummaryPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold">Daily Summary Report</h1>
          <p className="text-muted-foreground mt-1">Today's sales, inventory, and operations overview</p>
        </div>
        <OutletSelector />
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Total Sales</p>
            <p className="text-3xl font-bold mt-2">23,250</p>
            <p className="text-xs text-green-600 mt-1">+12.5% from yesterday</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Total Revenue</p>
            <p className="text-3xl font-bold mt-2">Rp 116.2M</p>
            <p className="text-xs text-green-600 mt-1">+8.3% from yesterday</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Items Produced</p>
            <p className="text-3xl font-bold mt-2">18,500</p>
            <p className="text-xs text-orange-600 mt-1">-3.2% waste rate</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Avg. Serving Time</p>
            <p className="text-3xl font-bold mt-2">4.2 min</p>
            <p className="text-xs text-green-600 mt-1">+0.5 min faster</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Hourly Sales Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={dailySalesData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="time" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="sales" stroke="#3b82f6" strokeWidth={2} />
                <Line type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Sales by Plate Color</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={plateColorSales}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${value}`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {plateColorSales.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Summary Stats */}
      <Card>
        <CardHeader>
          <CardTitle>Daily Operations Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Peak Hour</p>
              <p className="text-2xl font-bold">18:00</p>
              <p className="text-xs text-muted-foreground">5,390 items sold</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Waste Percentage</p>
              <p className="text-2xl font-bold">3.2%</p>
              <p className="text-xs text-green-600">Below target (5%)</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Staff Efficiency</p>
              <p className="text-2xl font-bold">94.8%</p>
              <p className="text-xs text-muted-foreground">Average performance</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Customer Count</p>
              <p className="text-2xl font-bold">5,542</p>
              <p className="text-xs text-muted-foreground">~4.2 items/customer</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
