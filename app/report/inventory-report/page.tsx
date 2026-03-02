'use client'

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { OutletSelector } from "@/components/outlet-selector"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts'

const inventoryData = [
  { plate: 'White', current: 850, minimum: 500, maximum: 1500 },
  { plate: 'Blue', current: 620, minimum: 400, maximum: 1200 },
  { plate: 'Pink', current: 1200, minimum: 300, maximum: 1000 },
  { plate: 'Black', current: 450, minimum: 300, maximum: 800 },
  { plate: 'Red', current: 780, minimum: 400, maximum: 1000 },
]

const stockTrend = [
  { day: 'Mon', stock: 5200 },
  { day: 'Tue', stock: 4800 },
  { day: 'Wed', stock: 5400 },
  { day: 'Thu', stock: 5100 },
  { day: 'Fri', stock: 6200 },
  { day: 'Sat', stock: 4500 },
  { day: 'Sun', stock: 5800 },
]

export default function InventoryReportPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold">Inventory Report</h1>
          <p className="text-muted-foreground mt-1">Current stock levels and inventory trends</p>
        </div>
        <OutletSelector />
      </div>

      {/* Inventory Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Total Inventory</p>
            <p className="text-3xl font-bold mt-2">3,900</p>
            <p className="text-xs text-muted-foreground">5 plate colors</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Stock Health</p>
            <p className="text-3xl font-bold mt-2">92%</p>
            <p className="text-xs text-green-600 mt-1">Optimal levels</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Low Stock Items</p>
            <p className="text-3xl font-bold mt-2">1</p>
            <p className="text-xs text-orange-600 mt-1">Black plate low</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Over Stock Items</p>
            <p className="text-3xl font-bold mt-2">1</p>
            <p className="text-xs text-orange-600 mt-1">Pink plate</p>
          </CardContent>
        </Card>
      </div>

      {/* Weekly Stock Trend */}
      <Card>
        <CardHeader>
          <CardTitle>Weekly Stock Trend</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={stockTrend}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="day" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="stock" stroke="#3b82f6" strokeWidth={2} dot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Current Inventory */}
      <Card>
        <CardHeader>
          <CardTitle>Current Stock Levels</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {inventoryData.map((item) => {
              const percentage = (item.current / item.maximum) * 100
              const status = item.current < item.minimum ? 'low' : item.current > item.maximum ? 'high' : 'optimal'
              
              return (
                <div key={item.plate}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium">{item.plate} Plate</span>
                    <span className={`text-sm font-medium ${
                      status === 'low' ? 'text-red-600' : 
                      status === 'high' ? 'text-orange-600' : 
                      'text-green-600'
                    }`}>
                      {item.current} / {item.maximum}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${
                        status === 'low' ? 'bg-red-500' :
                        status === 'high' ? 'bg-orange-500' :
                        'bg-green-500'
                      }`}
                      style={{ width: `${Math.min(percentage, 100)}%` }}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">Min: {item.minimum} | Max: {item.maximum}</p>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle>Inventory Recommendations</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-3">
            <li className="flex gap-3">
              <span className="text-red-600 font-bold">⚠</span>
              <span>Black plate stock is low (450 units). Recommend restocking to 800 units</span>
            </li>
            <li className="flex gap-3">
              <span className="text-orange-600 font-bold">!</span>
              <span>Pink plate is over maximum (1,200 units). Consider selling promotions</span>
            </li>
            <li className="flex gap-3">
              <span className="text-green-600 font-bold">✓</span>
              <span>Other plate colors at optimal levels</span>
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}
