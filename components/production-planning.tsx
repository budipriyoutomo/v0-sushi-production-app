"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { PlateColorBadge, type PlateColor } from "@/components/plate-color-badge"
import { OutletSelector } from "@/components/outlet-selector"
import { useToast } from "@/hooks/use-toast"
import { useOutlet } from "@/lib/outlet-context"
import { plateColors } from "@/lib/mock-data"
import { Save, RotateCcw, TrendingUp } from "lucide-react"

interface TimeSlotPlan {
  timeSlot: string
  white: number
  blue: number
  pink: number
  black: number
  red: number
  gold: number
  "choco motive": number
  yellow: number
  silver: number
}

// Generate 30-minute time slots from 10:00 to 20:30
const generateTimeSlots = (): string[] => {
  const slots: string[] = []
  for (let hour = 10; hour <= 20; hour++) {
    slots.push(`${String(hour).padStart(2, "0")}:00-${String(hour).padStart(2, "0")}:30`)
    if (hour < 20) {
      slots.push(`${String(hour).padStart(2, "0")}:30-${String(hour + 1).padStart(2, "0")}:00`)
    } else {
      slots.push(`${String(hour).padStart(2, "0")}:30-${String(hour + 1).padStart(2, "0")}:00`)
    }
  }
  return slots
}

// Cycle: Biru → Hitam → Merah → Kuning → Hijau
const TIME_SLOT_COLORS = [
  { label: "Biru",   bg: "bg-blue-500",   ring: "ring-blue-400",   text: "text-blue-700",   rowBg: "bg-blue-50/60" },
  { label: "Hitam",  bg: "bg-gray-800",   ring: "ring-gray-600",   text: "text-gray-800",   rowBg: "bg-gray-50/60" },
  { label: "Merah",  bg: "bg-red-500",    ring: "ring-red-400",    text: "text-red-700",    rowBg: "bg-red-50/60" },
  { label: "Kuning", bg: "bg-yellow-400", ring: "ring-yellow-300", text: "text-yellow-700", rowBg: "bg-yellow-50/60" },
  { label: "Hijau",  bg: "bg-green-500",  ring: "ring-green-400",  text: "text-green-700",  rowBg: "bg-green-50/60" },
]

const getTimeSlotColor = (index: number) => TIME_SLOT_COLORS[index % TIME_SLOT_COLORS.length]

const initialPlan: TimeSlotPlan[] = generateTimeSlots().map((timeSlot) => ({
  timeSlot,
  white: 10,
  blue: 8,
  pink: 7,
  black: 5,
  red: 6,
  gold: 4,
  "choco motive": 5,
  yellow: 9,
  silver: 5,
}))

export function ProductionPlanning() {
  const { toast } = useToast()
  const { selectedOutletId } = useOutlet()
  const [plan, setPlan] = useState<TimeSlotPlan[]>(initialPlan)
  const [planDate, setPlanDate] = useState(new Date().toISOString().split('T')[0])

  // Sort colors by price (cheapest first)
  const colorKeys: PlateColor[] = plateColors
    .sort((a, b) => a.price - b.price)
    .map((pc) => pc.name as PlateColor)

  const handleChange = (index: number, color: PlateColor, value: string) => {
    const newPlan = [...plan]
    newPlan[index][color] = Number.parseInt(value) || 0
    setPlan(newPlan)
  }

  const getRowTotal = (row: TimeSlotPlan) => {
    return colorKeys.reduce((sum, color) => sum + row[color], 0)
  }

  const getColumnTotal = (color: PlateColor) => {
    return plan.reduce((sum, row) => sum + row[color], 0)
  }

  const getGrandTotal = () => {
    return plan.reduce((sum, row) => sum + getRowTotal(row), 0)
  }

  const handleSave = () => {
    toast({
      title: "Production Plan Saved",
      description: `Daily target: ${getGrandTotal()} items across ${colorKeys.length} plate colors`,
    })
  }

  const handleReset = () => {
    setPlan(initialPlan)
    toast({
      title: "Plan Reset",
      description: "Production plan has been reset to default values",
    })
  }

  // Calculate highest producing color
  const topColor = colorKeys.reduce((max, color) => {
    return getColumnTotal(color as PlateColor) > getColumnTotal(max as PlateColor) ? color : max
  })

  return (
    <div className="space-y-6">
      {/* Header with Outlet Selector */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold">Production Planning</h1>
          <p className="text-muted-foreground mt-1">Set 30-minute production targets by plate color for today</p>
        </div>
        <OutletSelector />
      </div>

      {/* Summary Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Total Daily Target</p>
            <p className="text-3xl font-bold text-blue-700 mt-2">{getGrandTotal()}</p>
            <p className="text-xs text-blue-600 mt-1">items to produce</p>
          </CardContent>
        </Card> 

        <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Top Producer</p>
            <div className="mt-2">
              <PlateColorBadge color={topColor as PlateColor} />
            </div>
            <p className="text-xs text-orange-600 mt-2">{getColumnTotal(topColor as PlateColor)} pieces</p>
          </CardContent>
        </Card>
      </div>

      {/* Production Schedule Table */}
      <Card className="shadow-lg">
        <CardHeader className="bg-gradient-to-r from-slate-50 to-slate-100 border-b">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                Daily Production Schedule
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">Input target quantities for each 30-minute time slot</p>
            </div>
            <Input
              type="date"
              value={planDate}
              onChange={(e) => setPlanDate(e.target.value)}
              className="w-40"
            />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th colSpan={colorKeys.length + 2} className="px-4 py-2">
                    <div className="flex flex-wrap items-center gap-3">
                      <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Penanda Waktu:</span>
                      {TIME_SLOT_COLORS.map((c) => (
                        <span key={c.label} className="flex items-center gap-1.5">
                          <span className={`inline-block w-3 h-3 rounded-full ${c.bg}`} />
                          <span className="text-xs text-slate-600">{c.label}</span>
                        </span>
                      ))}
                    </div>
                  </th>
                </tr>
                <tr className="bg-slate-100 border-b-2 border-slate-300">
                  <th className="text-left p-4 font-semibold text-slate-700">Time Slot</th>
                  {colorKeys.map((color) => (
                    <th key={color} className="text-center p-4 min-w-28">
                      <PlateColorBadge color={color as PlateColor} />
                    </th>
                  ))}
                  <th className="text-center p-4 font-semibold text-slate-700 min-w-20 bg-slate-50">Total</th>
                </tr>
              </thead>
              <tbody>
                {plan.map((row, index) => {
                  const slotColor = getTimeSlotColor(index)
                  return (
                    <tr key={row.timeSlot} className={`border-b transition-colors hover:brightness-95 ${slotColor.rowBg}`}>
                      <td className="p-3 bg-white/70 border-r border-slate-200">
                        <div className="flex items-center gap-2">
                          <span
                            className={`inline-flex items-center justify-center w-6 h-6 rounded-full ${slotColor.bg} text-white text-[10px] font-bold ring-2 ${slotColor.ring} shrink-0`}
                            title={slotColor.label}
                          >
                            {slotColor.label[0]}
                          </span>
                          <span className={`font-semibold text-sm ${slotColor.text}`}>
                            {row.timeSlot.split("-")[0]}
                          </span>
                        </div>
                      </td>
                      {colorKeys.map((color) => (
                        <td key={color} className="p-3 text-center">
                          <Input
                            type="number"
                            min={0}
                            value={row[color] ?? ""}
                            onChange={(e) => handleChange(index, color as PlateColor, e.target.value === "" ? "0" : e.target.value)}
                            className="w-20 text-center mx-auto h-9 text-sm font-medium"
                          />
                        </td>
                      ))}
                      <td className="p-4 text-center font-bold text-slate-700 bg-white/60 text-sm border-l border-slate-200">
                        {getRowTotal(row)}
                      </td>
                    </tr>
                  )
                })}
                <tr className="bg-gradient-to-r from-slate-100 to-slate-50 border-t-2 border-slate-300 font-bold">
                  <td className="p-4 text-slate-800">Daily Total</td>
                  {colorKeys.map((color) => (
                    <td key={color} className="p-4 text-center text-slate-800 text-sm">
                      {getColumnTotal(color as PlateColor)}
                    </td>
                  ))}
                  <td className="p-4 text-center text-lg text-slate-900 bg-blue-100 rounded-md">
                    {getGrandTotal()}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex justify-end gap-3">
        <Button variant="outline" onClick={handleReset} className="gap-2">
          <RotateCcw className="w-4 h-4" />
          Reset Plan
        </Button>
        <Button onClick={handleSave} size="lg" className="gap-2 bg-blue-600 hover:bg-blue-700">
          <Save className="w-5 h-5" />
          Save Production Plan
        </Button>
      </div>
    </div>
  )
}
