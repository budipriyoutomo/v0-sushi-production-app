'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { OutletSelector } from '@/components/outlet-selector'
import { useToast } from '@/hooks/use-toast'
import { useOutlet } from '@/lib/outlet-context'
import { plateColors, mockProductionStats } from '@/lib/mock-data'
import type { PlateColor } from '@/components/plate-color-badge'
import { PlateColorBadge } from '@/components/plate-color-badge'
import { Plus, Trash2, AlertCircle, CheckCircle } from 'lucide-react'

interface SalesEntry {
  id: string
  outletId: string
  plateColor: PlateColor
  quantitySold: number
  systemTotal: number
  discrepancy: number
}

export function SalesInput() {
  const { toast } = useToast()
  const { selectedOutletId } = useOutlet()
  const [salesEntries, setSalesEntries] = useState<SalesEntry[]>([])

  const [formData, setFormData] = useState({
    plateColor: 'white' as PlateColor,
    quantitySold: 0,
  })

  // Filter plate colors and stats by outlet
  const outletColors = plateColors.filter((pc) => pc.outletId === selectedOutletId)
  const outletStats = mockProductionStats.filter((stat) => stat.outletId === selectedOutletId)

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
    const systemStats = outletStats.find((stat) => stat.plateColor === formData.plateColor)
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
        outletId: selectedOutletId,
        plateColor: formData.plateColor,
        quantitySold: formData.quantitySold,
        systemTotal,
        discrepancy,
      }
      setSalesEntries([...salesEntries, newEntry])
      toast({
        title: 'Success',
        description: 'Sales entry added successfully',
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
      variant: 'destructive',
    })
  }

  const handleSubmit = async () => {
    if (salesEntries.length === 0) {
      toast({
        title: 'Error',
        description: 'Please add at least one sales entry',
        variant: 'destructive',
      })
      return
    }

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000))

    toast({
      title: 'Success',
      description: `Submitted ${salesEntries.length} sales entries`,
    })

    setSalesEntries([])
  }

  const totalDiscrepancy = salesEntries.reduce((sum, entry) => sum + entry.discrepancy, 0)
  const hasDiscrepancies = salesEntries.some((entry) => entry.discrepancy !== 0)

  return (
    <div className="space-y-6">
      {/* Outlet Selector */}
      <OutletSelector />

      <div>
        <h1 className="text-3xl md:text-4xl font-bold">Sales Input (POS)</h1>
        <p className="text-muted-foreground mt-1">Input daily sales data and verify against system records</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Entry Form */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Add Sales Entry</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="color-select">Plate Color</Label>
              <Select value={formData.plateColor} onValueChange={(value) => setFormData({ ...formData, plateColor: value as PlateColor })}>
                <SelectTrigger id="color-select">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {outletColors.map((color) => (
                    <SelectItem key={color.id} value={color.name}>
                      <PlateColorBadge color={color.name} />
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="quantity">Quantity Sold</Label>
              <Input
                id="quantity"
                type="number"
                min="0"
                placeholder="Enter quantity"
                value={formData.quantitySold || ''}
                onChange={(e) => setFormData({ ...formData, quantitySold: Number.parseInt(e.target.value) || 0 })}
              />
            </div>

            <Button onClick={handleAddEntry} className="w-full">
              <Plus className="w-4 h-4 mr-2" />
              Add Entry
            </Button>
          </CardContent>
        </Card>

        {/* Sales Entries List */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Sales Entries</CardTitle>
            <CardDescription>Total entries: {salesEntries.length}</CardDescription>
          </CardHeader>
          <CardContent>
            {salesEntries.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No sales entries yet</p>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Color</TableHead>
                      <TableHead className="text-right">Quantity Sold</TableHead>
                      <TableHead className="text-right">System Total</TableHead>
                      <TableHead className="text-right">Discrepancy</TableHead>
                      <TableHead className="w-10"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {salesEntries.map((entry) => (
                      <TableRow key={entry.id}>
                        <TableCell>
                          <PlateColorBadge color={entry.plateColor} />
                        </TableCell>
                        <TableCell className="text-right font-medium">{entry.quantitySold}</TableCell>
                        <TableCell className="text-right">{entry.systemTotal}</TableCell>
                        <TableCell className="text-right">
                          <span className={entry.discrepancy !== 0 ? 'text-destructive font-semibold' : 'text-green-600 font-semibold'}>
                            {entry.discrepancy > 0 ? '+' : ''}{entry.discrepancy}
                          </span>
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteEntry(entry.id)}
                          >
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Summary Card */}
      {salesEntries.length > 0 && (
        <Card className={hasDiscrepancies ? 'border-destructive' : 'border-green-600'}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {hasDiscrepancies ? (
                  <AlertCircle className="w-5 h-5 text-destructive" />
                ) : (
                  <CheckCircle className="w-5 h-5 text-green-600" />
                )}
                <CardTitle>{hasDiscrepancies ? 'Discrepancies Found' : 'All Sales Match System'}</CardTitle>
              </div>
              <span className={`text-2xl font-bold ${hasDiscrepancies ? 'text-destructive' : 'text-green-600'}`}>
                {totalDiscrepancy > 0 ? '+' : ''}{totalDiscrepancy}
              </span>
            </div>
          </CardHeader>
          <CardContent>
            <Button onClick={handleSubmit} className="w-full">
              <CheckCircle className="w-4 h-4 mr-2" />
              Submit Sales Data
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
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
