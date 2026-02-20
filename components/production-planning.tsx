"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { PlateColorBadge, type PlateColor } from "@/components/plate-color-badge"
import { useToast } from "@/hooks/use-toast"
import { plateColors } from "@/lib/mock-data"
import { Save } from "lucide-react"

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

// Generate 30-minute time slots from 10:00 to 21:00
const generateTimeSlots = (): string[] => {
  const slots: string[] = []
  for (let hour = 10; hour < 21; hour++) {
    slots.push(`${String(hour).padStart(2, "0")}:00-${String(hour).padStart(2, "0")}:30`)
    slots.push(`${String(hour).padStart(2, "0")}:30-${String(hour + 1).padStart(2, "0")}:00`)
  }
  return slots
}

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
  const [plan, setPlan] = useState<TimeSlotPlan[]>(initialPlan)

  const colorKeys: PlateColor[] = ["white", "blue", "pink", "black", "red", "gold", "choco motive", "yellow", "silver"]

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
      title: "Plan Saved",
      description: "Production plan has been saved successfully",
    })
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-full mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold">Production Planning</h1>
          <p className="text-muted-foreground mt-1">Plan 30-minute production targets by plate color</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Daily Production Schedule (30-Minute Slots)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-3 font-semibold">Time Slot</th>
                    {colorKeys.map((color) => (
                      <th key={color} className="text-center p-3 min-w-24">
                        <PlateColorBadge color={color as PlateColor} />
                      </th>
                    ))}
                    <th className="text-right p-3 font-semibold min-w-20">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {plan.map((row, index) => (
                    <tr key={row.timeSlot} className="border-b hover:bg-muted/50">
                      <td className="p-3 font-medium text-sm">{row.timeSlot}</td>
                      {colorKeys.map((color) => (
                        <td key={color} className="p-3">
                          <Input
                            type="number"
                            min="0"
                            value={row[color]}
                            onChange={(e) => handleChange(index, color as PlateColor, e.target.value)}
                            className="text-center h-8"
                          />
                        </td>
                      ))}
                      <td className="p-3 text-right font-semibold text-sm">{getRowTotal(row)}</td>
                    </tr>
                  ))}
                  <tr className="bg-muted/50 font-semibold">
                    <td className="p-3">Total</td>
                    {colorKeys.map((color) => (
                      <td key={color} className="p-3 text-center text-sm">
                        {getColumnTotal(color as PlateColor)}
                      </td>
                    ))}
                    <td className="p-3 text-right text-sm">{getGrandTotal()}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="mt-6 flex justify-end">
              <Button size="lg" onClick={handleSave}>
                <Save className="w-5 h-5 mr-2" />
                Save Plan
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
