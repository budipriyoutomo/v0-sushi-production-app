'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { OutletSelector } from '@/components/outlet-selector'
import { useToast } from '@/hooks/use-toast'
import { useOutlet } from '@/lib/outlet-context'
import { sushiMenus } from '@/lib/mock-data'
import { PlateColorBadge } from '@/components/plate-color-badge'
import { CheckCircle, AlertCircle, Plus, Trash2 } from 'lucide-react'

interface MenuSalesEntry {
  menuId: string
  menuName: string
  plateColor: string
  produced: number
  sold: number
  waste: number
  discrepancy: number
  price: number
}

export function ClosingReport() {
  const { toast } = useToast()
  const { selectedOutletId } = useOutlet()
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [salesEntries, setSalesEntries] = useState<MenuSalesEntry[]>([
    { menuId: '1', menuName: 'California Roll', plateColor: 'white', produced: 45, sold: 38, waste: 2, discrepancy: 5, price: 25000 },
    { menuId: '3', menuName: 'Salmon Nigiri', plateColor: 'blue', produced: 32, sold: 28, waste: 1, discrepancy: 3, price: 35000 },
    { menuId: '5', menuName: 'Spicy Tuna Roll', plateColor: 'pink', produced: 28, sold: 24, waste: 2, discrepancy: 2, price: 40000 },
  ])
  const [signedBy, setSignedBy] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [status, setStatus] = useState<'draft' | 'submitted'>('draft')

  // Filter menus by outlet
  const outletMenus = sushiMenus.filter((m) => m.outletId === selectedOutletId)

  const addMenuEntry = () => {
    if (outletMenus.length === 0) {
      toast({
        title: 'Error',
        description: 'No menus available for this outlet',
        variant: 'destructive',
      })
      return
    }

    const menu = outletMenus[0]
    const newEntry: MenuSalesEntry = {
      menuId: menu.id,
      menuName: menu.name,
      plateColor: menu.plateColor,
      produced: 0,
      sold: 0,
      waste: 0,
      discrepancy: 0,
      price: 25000,
    }
    setSalesEntries([...salesEntries, newEntry])
  }

  const updateEntry = (index: number, field: keyof MenuSalesEntry, value: any) => {
    const newEntries = [...salesEntries]
    newEntries[index][field] = value

    // Calculate discrepancy: produced - (sold + waste) = discrepancy
    if (field === 'produced' || field === 'sold' || field === 'waste') {
      newEntries[index].discrepancy = newEntries[index].produced - (newEntries[index].sold + newEntries[index].waste)
    }

    setSalesEntries(newEntries)
  }

  const deleteEntry = (index: number) => {
    setSalesEntries(salesEntries.filter((_, i) => i !== index))
    toast({
      title: 'Deleted',
      description: 'Menu entry removed',
      variant: 'destructive',
    })
  }

  const totals = {
    produced: salesEntries.reduce((sum, e) => sum + e.produced, 0),
    sold: salesEntries.reduce((sum, e) => sum + e.sold, 0),
    waste: salesEntries.reduce((sum, e) => sum + e.waste, 0),
    discrepancy: salesEntries.reduce((sum, e) => sum + e.discrepancy, 0),
    revenue: salesEntries.reduce((sum, e) => sum + (e.sold * e.price), 0),
  }

  const hasDiscrepancies = salesEntries.some((e) => Math.abs(e.discrepancy) > 0)

  const handleSubmit = async () => {
    if (!signedBy) {
      toast({
        title: 'Error',
        description: 'Please fill in signature field',
        variant: 'destructive',
      })
      return
    }

    if (salesEntries.length === 0) {
      toast({
        title: 'Error',
        description: 'Please add at least one menu entry',
        variant: 'destructive',
      })
      return
    }

    setIsSubmitting(true)
    setTimeout(() => {
      setIsSubmitting(false)
      setStatus('submitted')
      toast({
        title: 'Success',
        description: 'Closing report submitted successfully',
      })
    }, 1000)
  }

  return (
    <div className="space-y-6">
      {/* Outlet Selector */}
      <OutletSelector />

      {/* Header */}
      <div>
        <h1 className="text-3xl md:text-4xl font-bold">Daily Closing Report</h1>
        <p className="text-muted-foreground mt-1">Sales summary by menu item with waste and discrepancy</p>
      </div>

      {/* Status Banner */}
      {status === 'submitted' && (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="pt-6 flex items-center gap-3">
            <CheckCircle className="w-6 h-6 text-green-600" />
            <div>
              <p className="font-semibold text-green-900">Report Submitted</p>
              <p className="text-sm text-green-700">This closing report has been submitted for verification</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Discrepancy Alert */}
      {hasDiscrepancies && status !== 'submitted' && (
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="pt-6 flex items-center gap-3">
            <AlertCircle className="w-6 h-6 text-amber-600" />
            <div>
              <p className="font-semibold text-amber-900">Discrepancies Detected</p>
              <p className="text-sm text-amber-700">
                Total discrepancy: {totals.discrepancy > 0 ? '+' : ''}{totals.discrepancy} units
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Report Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Sales Report by Menu</CardTitle>
              <CardDescription>Date: {date}</CardDescription>
            </div>
            <Input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              disabled={status === 'submitted'}
              className="w-32"
            />
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Sales Table */}
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Menu Item</TableHead>
                  <TableHead>Color</TableHead>
                  <TableHead className="text-right">Price</TableHead>
                  <TableHead className="text-right">Produced</TableHead>
                  <TableHead className="text-right">Sold</TableHead>
                  <TableHead className="text-right">Waste</TableHead>
                  <TableHead className="text-right">Discrepancy</TableHead>
                  <TableHead className="text-right">Revenue</TableHead>
                  <TableHead className="w-10"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {salesEntries.map((entry, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-medium">{entry.menuName}</TableCell>
                    <TableCell>
                      <PlateColorBadge color={entry.plateColor as any} />
                    </TableCell>
                    <TableCell className="text-right">
                      <Input
                        type="number"
                        value={entry.price}
                        onChange={(e) => updateEntry(index, 'price', parseInt(e.target.value) || 0)}
                        disabled={status === 'submitted'}
                        className="w-24 text-right text-sm"
                      />
                    </TableCell>
                    <TableCell className="text-right">
                      <Input
                        type="number"
                        value={entry.produced}
                        onChange={(e) => updateEntry(index, 'produced', parseInt(e.target.value) || 0)}
                        disabled={status === 'submitted'}
                        className="w-20 text-right text-sm"
                      />
                    </TableCell>
                    <TableCell className="text-right">
                      <Input
                        type="number"
                        value={entry.sold}
                        onChange={(e) => updateEntry(index, 'sold', parseInt(e.target.value) || 0)}
                        disabled={status === 'submitted'}
                        className="w-20 text-right text-sm"
                      />
                    </TableCell>
                    <TableCell className="text-right">
                      <Input
                        type="number"
                        value={entry.waste}
                        onChange={(e) => updateEntry(index, 'waste', parseInt(e.target.value) || 0)}
                        disabled={status === 'submitted'}
                        className="w-20 text-right text-sm"
                      />
                    </TableCell>
                    <TableCell className={`text-right font-semibold ${entry.discrepancy !== 0 ? 'text-destructive' : 'text-green-600'}`}>
                      {entry.discrepancy > 0 ? '+' : ''}{entry.discrepancy}
                    </TableCell>
                    <TableCell className="text-right font-semibold">
                      IDR {(entry.sold * entry.price).toLocaleString('id-ID')}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteEntry(index)}
                        disabled={status === 'submitted'}
                      >
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                <TableRow className="bg-muted/50 font-semibold">
                  <TableCell colSpan={3}>TOTAL</TableCell>
                  <TableCell className="text-right">{totals.produced}</TableCell>
                  <TableCell className="text-right">{totals.sold}</TableCell>
                  <TableCell className="text-right">{totals.waste}</TableCell>
                  <TableCell className={`text-right ${totals.discrepancy !== 0 ? 'text-destructive' : 'text-green-600'}`}>
                    {totals.discrepancy > 0 ? '+' : ''}{totals.discrepancy}
                  </TableCell>
                  <TableCell className="text-right">IDR {totals.revenue.toLocaleString('id-ID')}</TableCell>
                  <TableCell></TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>

          {/* Add Menu Button */}
          {status !== 'submitted' && (
            <Button onClick={addMenuEntry} variant="outline" className="w-full gap-2">
              <Plus className="w-4 h-4" />
              Add Menu Item
            </Button>
          )}

          {/* Summary Statistics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
            <Card className="bg-blue-50 border-blue-200">
              <CardContent className="pt-4">
                <p className="text-sm text-muted-foreground">Total Produced</p>
                <p className="text-2xl font-bold text-blue-600">{totals.produced}</p>
              </CardContent>
            </Card>
            <Card className="bg-green-50 border-green-200">
              <CardContent className="pt-4">
                <p className="text-sm text-muted-foreground">Total Sold</p>
                <p className="text-2xl font-bold text-green-600">{totals.sold}</p>
              </CardContent>
            </Card>
            <Card className="bg-red-50 border-red-200">
              <CardContent className="pt-4">
                <p className="text-sm text-muted-foreground">Total Waste</p>
                <p className="text-2xl font-bold text-red-600">{totals.waste}</p>
              </CardContent>
            </Card>
            <Card className={`${totals.discrepancy === 0 ? 'bg-green-50 border-green-200' : 'bg-amber-50 border-amber-200'}`}>
              <CardContent className="pt-4">
                <p className="text-sm text-muted-foreground">Discrepancy</p>
                <p className={`text-2xl font-bold ${totals.discrepancy === 0 ? 'text-green-600' : 'text-amber-600'}`}>
                  {totals.discrepancy > 0 ? '+' : ''}{totals.discrepancy}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Signature Section */}
          <div className="pt-4 border-t space-y-4">
            <div>
              <Label htmlFor="signedBy">Signed By (Name & Title)</Label>
              <Input
                id="signedBy"
                placeholder="e.g., John Doe - Operations Manager"
                value={signedBy}
                onChange={(e) => setSignedBy(e.target.value)}
                disabled={status === 'submitted'}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex gap-2 justify-end">
        <Button variant="outline" disabled={status === 'submitted'}>
          Save as Draft
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={isSubmitting || status === 'submitted'}
          className="gap-2"
        >
          <CheckCircle className="w-4 h-4" />
          {isSubmitting ? 'Submitting...' : 'Submit Closing Report'}
        </Button>
      </div>
    </div>
  )
}
