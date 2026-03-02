'use client'

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { OutletSelector } from "@/components/outlet-selector"
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

const monthlySalesData = [
  { week: 'W1', sales: 18000, revenue: 90000 },
  { week: 'W2', sales: 22000, revenue: 110000 },
  { week: 'W3', sales: 20500, revenue: 102500 },
  { week: 'W4', sales: 25000, revenue: 125000 },
]

const productPerformance = [
  { name: 'White Plate', sales: 8500, trend: '+15%' },
  { name: 'Blue Plate', sales: 7200, trend: '+8%' },
  { name: 'Pink Plate', sales: 5800, trend: '-3%' },
  { name: 'Black Plate', sales: 4200, trend: '+12%' },
]

export default function SalesAnalysisPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold">Sales Analysis Report</h1>
          <p className="text-muted-foreground mt-1">Detailed sales trends and product performance</p>
        </div>
        <OutletSelector />
      </div>

      {/* Period Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Monthly Revenue</p>
            <p className="text-3xl font-bold mt-2">Rp 427.5M</p>
            <p className="text-xs text-green-600 mt-1">+22.3% vs last month</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Avg Daily Sales</p>
            <p className="text-3xl font-bold mt-2">21,375</p>
            <p className="text-xs text-green-600 mt-1">Growing trend</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Best Selling Product</p>
            <p className="text-3xl font-bold mt-2">White Plate</p>
            <p className="text-xs text-muted-foreground">39.8% of total sales</p>
          </CardContent>
        </Card>
      </div>

      {/* Weekly Trend */}
      <Card>
        <CardHeader>
          <CardTitle>Weekly Sales Trend</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={monthlySalesData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="week" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="sales" stroke="#3b82f6" strokeWidth={2} />
              <Line type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Product Performance */}
      <Card>
        <CardHeader>
          <CardTitle>Product Performance Analysis</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {productPerformance.map((product) => (
              <div key={product.name} className="flex items-center justify-between p-4 bg-muted rounded-lg">
                <div>
                  <p className="font-medium">{product.name}</p>
                  <p className="text-sm text-muted-foreground">{product.sales.toLocaleString()} units</p>
                </div>
                <div className={`px-3 py-1 rounded text-sm font-medium ${product.trend.includes('+') ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                  {product.trend}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Sales Insights */}
      <Card>
        <CardHeader>
          <CardTitle>Key Insights</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-3">
            <li className="flex gap-3">
              <span className="text-green-600 font-bold">✓</span>
              <span>Sales increased 22.3% compared to last month</span>
            </li>
            <li className="flex gap-3">
              <span className="text-green-600 font-bold">✓</span>
              <span>White plate shows strongest performance at 39.8% market share</span>
            </li>
            <li className="flex gap-3">
              <span className="text-orange-600 font-bold">!</span>
              <span>Pink plate experiencing slight decline (-3%), recommend promotional campaign</span>
            </li>
            <li className="flex gap-3">
              <span className="text-green-600 font-bold">✓</span>
              <span>Week 4 shows peak performance with 25,000 items sold</span>
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}
