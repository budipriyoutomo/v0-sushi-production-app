'use client'

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { OutletSelector } from "@/components/outlet-selector"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'

const wasteData = [
  { plate: 'White', waste: 120, percentage: 2.1 },
  { plate: 'Blue', waste: 98, percentage: 3.2 },
  { plate: 'Pink', waste: 145, percentage: 4.8 },
  { plate: 'Black', waste: 45, percentage: 2.5 },
  { plate: 'Red', waste: 72, percentage: 2.3 },
]

const wasteReasons = [
  { reason: 'Expiration', count: 198, percentage: 45 },
  { reason: 'Damaged', count: 132, percentage: 30 },
  { reason: 'Quality Issue', count: 99, percentage: 22 },
  { reason: 'Customer Return', count: 21, percentage: 5 },
]

const COLORS = ['#ef4444', '#f97316', '#eab308', '#84cc16', '#22c55e']

export default function WasteAnalysisPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold">Waste Analysis Report</h1>
          <p className="text-muted-foreground mt-1">Track waste patterns and identify improvement areas</p>
        </div>
        <OutletSelector />
      </div>

      {/* Waste Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Total Waste</p>
            <p className="text-3xl font-bold mt-2">480</p>
            <p className="text-xs text-orange-600 mt-1">This month</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Waste Rate</p>
            <p className="text-3xl font-bold mt-2">3.0%</p>
            <p className="text-xs text-green-600 mt-1">Below target (5%)</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Waste Cost</p>
            <p className="text-3xl font-bold mt-2">Rp 2.4M</p>
            <p className="text-xs text-muted-foreground">Monthly loss</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Top Waste Cause</p>
            <p className="text-3xl font-bold mt-2">Expiration</p>
            <p className="text-xs text-muted-foreground">45% of waste</p>
          </CardContent>
        </Card>
      </div>

      {/* Waste by Plate Color */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Waste by Plate Color</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={wasteData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="plate" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="waste" fill="#ef4444" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Waste Causes Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={wasteReasons}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ reason, percentage }) => `${reason}: ${percentage}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="count"
                >
                  {wasteReasons.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Waste Details */}
      <Card>
        <CardHeader>
          <CardTitle>Waste Details by Reason</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {wasteReasons.map((item) => (
              <div key={item.reason} className="flex items-center justify-between p-4 bg-muted rounded-lg">
                <div className="flex-1">
                  <p className="font-medium">{item.reason}</p>
                  <p className="text-sm text-muted-foreground">{item.count} items</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-lg">{item.percentage}%</p>
                  <div className="w-24 bg-gray-300 rounded-full h-2 mt-1">
                    <div
                      className="bg-orange-500 h-2 rounded-full"
                      style={{ width: `${item.percentage}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle>Improvement Recommendations</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-3">
            <li className="flex gap-3">
              <span className="text-orange-600 font-bold">!</span>
              <span>Focus on reducing expiration waste (45%) - Implement better inventory rotation</span>
            </li>
            <li className="flex gap-3">
              <span className="text-blue-600 font-bold">📋</span>
              <span>Pink plate has highest waste rate (4.8%) - Review production schedules</span>
            </li>
            <li className="flex gap-3">
              <span className="text-green-600 font-bold">✓</span>
              <span>Overall waste rate (3.0%) is performing well below target (5%)</span>
            </li>
            <li className="flex gap-3">
              <span className="text-blue-600 font-bold">📋</span>
              <span>Train staff on quality inspection to reduce damaged items (30%)</span>
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}
