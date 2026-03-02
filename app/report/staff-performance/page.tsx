'use client'

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { OutletSelector } from "@/components/outlet-selector"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

const staffPerformance = [
  { name: 'Chef John', items: 2850, efficiency: 95, accuracy: 98, shift: 'Morning' },
  { name: 'Chef Maria', items: 3120, efficiency: 98, accuracy: 96, shift: 'Full Day' },
  { name: 'Chef Alex', items: 2650, efficiency: 92, accuracy: 94, shift: 'Afternoon' },
  { name: 'Chef Lisa', items: 1890, efficiency: 94, accuracy: 97, shift: 'Evening' },
  { name: 'Chef David', items: 2240, efficiency: 91, accuracy: 92, shift: 'Night' },
]

const performanceData = [
  { name: 'Chef John', productivity: 2850, efficiency: 95 },
  { name: 'Chef Maria', productivity: 3120, efficiency: 98 },
  { name: 'Chef Alex', productivity: 2650, efficiency: 92 },
  { name: 'Chef Lisa', productivity: 1890, efficiency: 94 },
  { name: 'Chef David', productivity: 2240, efficiency: 91 },
]

export default function StaffPerformancePage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold">Staff Performance Report</h1>
          <p className="text-muted-foreground mt-1">Monitor team productivity and quality metrics</p>
        </div>
        <OutletSelector />
      </div>

      {/* Overall Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Avg Productivity</p>
            <p className="text-3xl font-bold mt-2">2,750</p>
            <p className="text-xs text-muted-foreground">items/staff/day</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Avg Efficiency</p>
            <p className="text-3xl font-bold mt-2">94%</p>
            <p className="text-xs text-green-600 mt-1">Team average</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Avg Quality</p>
            <p className="text-3xl font-bold mt-2">95.4%</p>
            <p className="text-xs text-green-600 mt-1">Accuracy rate</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Top Performer</p>
            <p className="text-3xl font-bold mt-2">Chef Maria</p>
            <p className="text-xs text-muted-foreground">98% efficiency</p>
          </CardContent>
        </Card>
      </div>

      {/* Performance Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Staff Productivity & Efficiency</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={performanceData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis yAxisId="left" />
              <YAxis yAxisId="right" orientation="right" />
              <Tooltip />
              <Legend />
              <Bar yAxisId="left" dataKey="productivity" fill="#3b82f6" name="Items Produced" />
              <Bar yAxisId="right" dataKey="efficiency" fill="#10b981" name="Efficiency %" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Staff Details */}
      <Card>
        <CardHeader>
          <CardTitle>Detailed Staff Performance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4 font-semibold">Staff Name</th>
                  <th className="text-center py-3 px-4 font-semibold">Items Produced</th>
                  <th className="text-center py-3 px-4 font-semibold">Efficiency</th>
                  <th className="text-center py-3 px-4 font-semibold">Accuracy</th>
                  <th className="text-center py-3 px-4 font-semibold">Shift</th>
                </tr>
              </thead>
              <tbody>
                {staffPerformance.map((staff) => (
                  <tr key={staff.name} className="border-b hover:bg-muted/50">
                    <td className="py-3 px-4">{staff.name}</td>
                    <td className="text-center py-3 px-4">{staff.items.toLocaleString()}</td>
                    <td className="text-center py-3 px-4">
                      <span className="inline-block px-3 py-1 rounded-full bg-green-100 text-green-800 font-medium">
                        {staff.efficiency}%
                      </span>
                    </td>
                    <td className="text-center py-3 px-4">
                      <span className="inline-block px-3 py-1 rounded-full bg-blue-100 text-blue-800 font-medium">
                        {staff.accuracy}%
                      </span>
                    </td>
                    <td className="text-center py-3 px-4 text-sm text-muted-foreground">{staff.shift}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Insights & Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Performance Insights</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-3">
            <li className="flex gap-3">
              <span className="text-green-600 font-bold">✓</span>
              <span>Chef Maria leads team with 98% efficiency and 3,120 items produced</span>
            </li>
            <li className="flex gap-3">
              <span className="text-green-600 font-bold">✓</span>
              <span>Team accuracy rate of 95.4% shows consistent quality standards</span>
            </li>
            <li className="flex gap-3">
              <span className="text-orange-600 font-bold">!</span>
              <span>Chef David needs efficiency improvement - Consider additional training</span>
            </li>
            <li className="flex gap-3">
              <span className="text-blue-600 font-bold">📋</span>
              <span>Evening shift (Chef Lisa) has lower productivity - Review workload distribution</span>
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}
