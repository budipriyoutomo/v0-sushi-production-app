"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { PlateColorBadge, type PlateColor } from "@/components/plate-color-badge"
import { useToast } from "@/hooks/use-toast"
import { Save } from "lucide-react"

interface HourlyPlan {
  hour: string
  green: number
  blue: number
  red: number
  black: number
}

const initialPlan: HourlyPlan[] = [
  { hour: "10:00-11:00", green: 20, blue: 15, red: 10, black: 5 },
  { hour: "11:00-12:00", green: 25, blue: 20, red: 15, black: 8 },
  { hour: "12:00-13:00", green: 30, blue: 25, red: 20, black: 10 },
  { hour: "13:00-14:00", green: 25, blue: 20, red: 15, black: 8 },
  { hour: "14:00-15:00", green: 20, blue: 15, red: 12, black: 6 },
  { hour: "15:00-16:00", green: 15, blue: 12, red: 10, black: 5 },
  { hour: "16:00-17:00", green: 10, blue: 8, red: 8, black: 4 },
  { hour: "17:00-18:00", green: 15, blue: 10, red: 10, black: 5 },
]

export function ProductionPlanning() {
  const { toast } = useToast()
  const [plan, setPlan] = useState<HourlyPlan[]>(initialPlan)

  const handleChange = (index: number, color: PlateColor, value: string) => {
    const newPlan = [...plan]
    newPlan[index][color] = Number.parseInt(value) || 0
    setPlan(newPlan)
  }

  const getRowTotal = (row: HourlyPlan) => {
    return row.green + row.blue + row.red + row.black
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
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold">Production Planning</h1>
          <p className="text-muted-foreground mt-1">Plan hourly production targets by plate color</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Daily Production Schedule</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-3 font-semibold">Time Slot</th>
                    <th className="text-center p-3">
                      <PlateColorBadge color="green" />
                    </th>
                    <th className="text-center p-3">
                      <PlateColorBadge color="blue" />
                    </th>
                    <th className="text-center p-3">
                      <PlateColorBadge color="red" />
                    </th>
                    <th className="text-center p-3">
                      <PlateColorBadge color="black" />
                    </th>
                    <th className="text-right p-3 font-semibold">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {plan.map((row, index) => (
                    <tr key={row.hour} className="border-b hover:bg-muted/50">
                      <td className="p-3 font-medium">{row.hour}</td>
                      <td className="p-3">
                        <Input
                          type="number"
                          min="0"
                          value={row.green}
                          onChange={(e) => handleChange(index, "green", e.target.value)}
                          className="text-center"
                        />
                      </td>
                      <td className="p-3">
                        <Input
                          type="number"
                          min="0"
                          value={row.blue}
                          onChange={(e) => handleChange(index, "blue", e.target.value)}
                          className="text-center"
                        />
                      </td>
                      <td className="p-3">
                        <Input
                          type="number"
                          min="0"
                          value={row.red}
                          onChange={(e) => handleChange(index, "red", e.target.value)}
                          className="text-center"
                        />
                      </td>
                      <td className="p-3">
                        <Input
                          type="number"
                          min="0"
                          value={row.black}
                          onChange={(e) => handleChange(index, "black", e.target.value)}
                          className="text-center"
                        />
                      </td>
                      <td className="p-3 text-right font-semibold">{getRowTotal(row)}</td>
                    </tr>
                  ))}
                  <tr className="bg-muted/50 font-semibold">
                    <td className="p-3">Total</td>
                    <td className="p-3 text-center">{getColumnTotal("green")}</td>
                    <td className="p-3 text-center">{getColumnTotal("blue")}</td>
                    <td className="p-3 text-center">{getColumnTotal("red")}</td>
                    <td className="p-3 text-center">{getColumnTotal("black")}</td>
                    <td className="p-3 text-right">{getGrandTotal()}</td>
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
