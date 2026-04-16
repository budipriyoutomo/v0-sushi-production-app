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
import { usePlateColorsSortedByPrice } from '@/hooks/use-plate-colors'
import { reportsService, type POSData } from '@/lib/api'
import type { PlateColor } from '@/components/plate-color-badge'
import { PlateColorBadge } from '@/components/plate-color-badge'
import { Plus, Trash2, AlertCircle, CheckCircle, Download, Loader2 } from 'lucide-react'

interface SalesEntry {
  id: string
  plateColorId: string
  plateColorName: string
  posSold: number
  productionSold: number
  selisih: number
}

export function SalesInput() {
  const { toast } = useToast()
  const { selectedOutletId } = useOutlet()
  const [salesEntries, setSalesEntries] = useState<SalesEntry[]>([])
  const [selectedDate, setSelectedDate] = useState(() => {
    const today = new Date()
    return today.toISOString().split('T')[0]
  })
  const [isLoadingPOS, setIsLoadingPOS] = useState(false)

  const [formData, setFormData] = useState({
    plateColor: 'white' as PlateColor,
    quantitySold: 0,
  })

  // Get plate colors from API
  const { plateColors: outletColors } = usePlateColorsSortedByPrice()

  // Get POS data from API
  const handleGetPOSData = async () => {
    if (!selectedOutletId) {
      toast({
        title: 'Error',
        description: 'Please select an outlet first',
        variant: 'destructive',
      })
      return
    }

    setIsLoadingPOS(true)
    try {
      const posData = await reportsService.getPOSData(selectedOutletId, selectedDate)
      
      // Convert POS data to sales entries
      const newEntries: SalesEntry[] = posData.map((pos: POSData) => ({
        id: pos.plateColorId,
        plateColorId: pos.plateColorId,
        plateColorName: pos.plateColorName,
        posSold: pos.posSold,
        productionSold: pos.productionSold,
        selisih: pos.selisih,
      }))

      setSalesEntries(newEntries)
      toast({
        title: 'Success',
        description: `Loaded ${posData.length} entries from POS`,
      })
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to fetch POS data',
        variant: 'destructive',
      })
    } finally {
      setIsLoadingPOS(false)
    }
  }

  const handleAddEntry = () => {
    if (formData.quantitySold <= 0) {
      toast({
        title: 'Error',
        description: 'Please enter a valid quantity',
        variant: 'destructive',
      })
      return
    }

    // Find selected plate color details
    const selectedColor = outletColors.find((c) => c.name.toLowerCase() === formData.plateColor)
    
    // Check if entry already exists for this plate color
    const existingIndex = salesEntries.findIndex((entry) => entry.plateColorName.toLowerCase() === formData.plateColor)
    
    if (existingIndex >= 0) {
      // Update existing entry
      const updatedEntries = [...salesEntries]
      const existingEntry = updatedEntries[existingIndex]
      updatedEntries[existingIndex] = {
        ...existingEntry,
        posSold: formData.quantitySold,
        selisih: formData.quantitySold - existingEntry.productionSold,
      }
      setSalesEntries(updatedEntries)
      toast({
        title: 'Updated',
        description: `${formData.plateColor} quantity updated`,
      })
    } else {
      // Add new entry
      const newEntry: SalesEntry = {
        id: selectedColor?.id || Date.now().toString(),
        plateColorId: selectedColor?.id || '',
        plateColorName: formData.plateColor,
        posSold: formData.quantitySold,
        productionSold: 0,
        selisih: formData.quantitySold,
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

  const totalSelisih = salesEntries.reduce((sum, entry) => sum + entry.selisih, 0)
  const hasDiscrepancies = salesEntries.some((entry) => entry.selisih !== 0)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold">Sales Input</h1>
          <p className="text-muted-foreground mt-1">Record POS sales transactions and reconcile with production</p>
        </div>
        <OutletSelector />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Entry Form */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Add Sales Entry</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="date-select">Date</Label>
              <Input
                id="date-select"
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
              />
            </div>

            <Button 
              onClick={handleGetPOSData} 
              variant="outline" 
              className="w-full"
              disabled={isLoadingPOS || !selectedOutletId}
            >
              {isLoadingPOS ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Download className="w-4 h-4 mr-2" />
              )}
              Get Data POS
            </Button>

            <div className="border-t pt-4">
              <Label htmlFor="color-select">Plate Color</Label>
              <Select value={formData.plateColor} onValueChange={(value) => setFormData({ ...formData, plateColor: value as PlateColor })}>
                <SelectTrigger id="color-select">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {outletColors
                    .filter((color) => color && color.name)
                    .map((color) => (
                      <SelectItem key={color.id} value={color.name.toLowerCase()}>
                        <PlateColorBadge color={color.name.toLowerCase() as PlateColor} />
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
                      <TableHead>Plate Color</TableHead>
                      <TableHead className="text-right">POS Sold</TableHead>
                      <TableHead className="text-right">Production Sold</TableHead>
                      <TableHead className="text-right">Selisih</TableHead>
                      <TableHead className="w-10"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {salesEntries.map((entry) => (
                      <TableRow key={entry.id}>
                        <TableCell>
                          <PlateColorBadge color={entry.plateColorName.toLowerCase() as PlateColor} />
                        </TableCell>
                        <TableCell className="text-right font-medium">{entry.posSold}</TableCell>
                        <TableCell className="text-right">{entry.productionSold}</TableCell>
                        <TableCell className="text-right">
                          <span className={entry.selisih !== 0 ? 'text-destructive font-semibold' : 'text-green-600 font-semibold'}>
                            {entry.selisih > 0 ? '+' : ''}{entry.selisih}
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
                {totalSelisih > 0 ? '+' : ''}{totalSelisih}
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
