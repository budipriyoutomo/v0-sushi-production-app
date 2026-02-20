'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { useToast } from '@/hooks/use-toast'
import { plateColors, mockProductionStats } from '@/lib/mock-data'
import type { PlateColor } from '@/components/plate-color-badge'
import { PlateColorBadge } from '@/components/plate-color-badge'
import { Plus, Trash2, AlertCircle, CheckCircle } from 'lucide-react'

interface SalesEntry {
  id: string
  plateColor: PlateColor
  quantitySold: number
  systemTotal: number
  discrepancy: number
}

export function SalesInput() {
  const { toast } = useToast()
  const [salesEntries, setSalesEntries] = useState<SalesEntry[]>([])

  const [formData, setFormData] = useState({
    plateColor: 'white' as PlateColor,
    quantitySold: 0,
  })

  const handleAddEntry = () => {
    if (formData.quantitySold <= 0) {
      toast({
        title: 'Error',
        description: 'Please enter a valid quantity',
        variant: 'destructive',
      })
      return
    }

    // Find system total for this plate color
    const systemStats = mockProductionStats.find((stat) => stat.plateColor === formData.plateColor)
    const systemTotal = systemStats?.sold || 0
    const discrepancy = formData.quantitySold - systemTotal

    // Check if entry already exists for this plate color
    const existingIndex = salesEntries.findIndex((entry) => entry.plateColor === formData.plateColor)
    
    if (existingIndex >= 0) {
      // Update existing entry
      const updatedEntries = [...salesEntries]
      updatedEntries[existingIndex] = {
        ...updatedEntries[existingIndex],
        quantitySold: formData.quantitySold,
        discrepancy,
      }
      setSalesEntries(updatedEntries)
      toast({
        title: 'Updated',
        description: `${formData.plateColor} quantity updated`,
      })
    } else {
      // Add new entry
      const newEntry: SalesEntry = {
        id: Date.now().toString(),
        plateColor: formData.plateColor,
        quantitySold: formData.quantitySold,
        systemTotal,
        discrepancy,
      }
      setSalesEntries([...salesEntries, newEntry])
      toast({
        title: 'Success',
        description: 'Sales entry added',
      })
    }

    setFormData({
      plateColor: 'white',
      quantitySold: 0,
    })
  }

  const handleDeleteEntry = (id: string) => {
    setSalesEntries(salesEntries.filter((entry) => entry.id !== id))
    toast({
      title: 'Deleted',
      description: 'Sales entry removed',
    })
  }

  const totalSold = salesEntries.reduce((sum, entry) => sum + entry.quantitySold, 0)
  const totalDiscrepancy = salesEntries.reduce((sum, entry) => sum + Math.abs(entry.discrepancy), 0)
  const hasDiscrepancies = salesEntries.some((entry) => entry.discrepancy !== 0)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Sales Input (POS)</h1>
        <p className="text-muted-foreground mt-1">Input daily sales by plate color and compare with system records</p>
      </div>

      {/* Input Form */}
      <Card>
        <CardHeader>
          <CardTitle>Add Sales Entry</CardTitle>
          <CardDescription>Enter quantity sold by plate color</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="plateColor">Plate Color</Label>
              <Select value={formData.plateColor} onValueChange={(value: any) => setFormData({ ...formData, plateColor: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {plateColors.map((plate) => (
                    <SelectItem key={plate.id} value={plate.name}>
                      {plate.name.charAt(0).toUpperCase() + plate.name.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="quantitySold">Quantity Sold</Label>
              <Input
                id="quantitySold"
                type="number"
                placeholder="0"
                value={formData.quantitySold || ''}
                onChange={(e) => setFormData({ ...formData, quantitySold: parseInt(e.target.value) || 0 })}
              />
            </div>
            <div className="flex items-end">
              <Button onClick={handleAddEntry} className="w-full gap-2">
                <Plus className="w-4 h-4" />
                Add Entry
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Total Items Sold (POS)</p>
              <p className="text-2xl font-bold">{totalSold}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Entries Recorded</p>
              <p className="text-2xl font-bold">{salesEntries.length} / {plateColors.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card className={hasDiscrepancies ? 'border-red-200 bg-red-50' : 'border-emerald-200 bg-emerald-50'}>
          <CardContent className="pt-6">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground flex items-center gap-2">
                {hasDiscrepancies ? (
                  <>
                    <AlertCircle className="w-4 h-4 text-red-600" />
                    Total Discrepancies
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4 text-emerald-600" />
                    All Matched
                  </>
                )}
              </p>
              <p className={`text-2xl font-bold ${hasDiscrepancies ? 'text-red-600' : 'text-emerald-600'}`}>
                {hasDiscrepancies ? `±${totalDiscrepancy}` : '0'}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Sales Table */}
      <Card>
        <CardHeader>
          <CardTitle>Sales Entries Comparison</CardTitle>
          <CardDescription>Compare POS sales with system records</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Plate Color</TableHead>
                  <TableHead className="text-right">POS Qty</TableHead>
                  <TableHead className="text-right">System Qty</TableHead>
                  <TableHead className="text-right">Discrepancy</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {salesEntries.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-4 text-muted-foreground">
                      No sales entries yet
                    </TableCell>
                  </TableRow>
                ) : (
                  salesEntries.map((entry) => (
                    <TableRow key={entry.id} className={entry.discrepancy !== 0 ? 'bg-red-50' : ''}>
                      <TableCell>
                        <PlateColorBadge color={entry.plateColor} />
                      </TableCell>
                      <TableCell className="text-right font-semibold">{entry.quantitySold}</TableCell>
                      <TableCell className="text-right">{entry.systemTotal}</TableCell>
                      <TableCell className={`text-right font-semibold ${entry.discrepancy > 0 ? 'text-red-600' : entry.discrepancy < 0 ? 'text-orange-600' : 'text-emerald-600'}`}>
                        {entry.discrepancy > 0 ? '+' : ''}{entry.discrepancy}
                      </TableCell>
                      <TableCell>
                        {entry.discrepancy === 0 ? (
                          <div className="flex items-center gap-1 text-emerald-600">
                            <CheckCircle className="w-4 h-4" />
                            <span className="text-sm">Match</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1 text-red-600">
                            <AlertCircle className="w-4 h-4" />
                            <span className="text-sm">Mismatch</span>
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteEntry(entry.id)}
                        >
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex gap-2 justify-end">
        <Button variant="outline" onClick={() => setSalesEntries([])}>Clear All</Button>
        <Button className="gap-2" disabled={salesEntries.length === 0}>
          Save & Export
        </Button>
      </div>
    </div>
  )
}
