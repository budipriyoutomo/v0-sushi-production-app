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
  code: string
  plateColor: string
  produced: number
  sold: number
  waste: number
  posSold: number
}

export function ClosingReport() {
  const { toast } = useToast()
  const { selectedOutletId } = useOutlet()
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [salesEntries, setSalesEntries] = useState<MenuSalesEntry[]>([
    { menuId: '1', menuName: 'California Roll', code: 'MN0021', plateColor: 'white', produced: 30, sold: 25, waste: 5, posSold: 21 },
    { menuId: '3', menuName: 'Salmon Nigiri', code: 'MN0022', plateColor: 'blue', produced: 45, sold: 45, waste: 0, posSold: 47 },
    { menuId: '5', menuName: 'Spicy Tuna Roll', code: 'MN0023', plateColor: 'pink', produced: 60, sold: 56, waste: 4, posSold: 43 },
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
      code: menu.id,
      plateColor: menu.plateColor,
      produced: 0,
      sold: 0,
      waste: 0,
      posSold: 0,
    }
    setSalesEntries([...salesEntries, newEntry])
  }

  const updateEntry = (index: number, field: keyof MenuSalesEntry, value: any) => {
    const newEntries = [...salesEntries]
    newEntries[index][field] = value
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
    posSold: salesEntries.reduce((sum, e) => sum + e.posSold, 0),
  }

  const getSelisih = (entry: MenuSalesEntry) => entry.posSold - entry.sold

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
      {salesEntries.some((e) => Math.abs(getSelisih(e)) > 0) && status !== 'submitted' && (
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="pt-6 flex items-center gap-3">
            <AlertCircle className="w-6 h-6 text-amber-600" />
            <div>
              <p className="font-semibold text-amber-900">Differences Detected</p>
              <p className="text-sm text-amber-700">
                There are differences between COLORPLATE and POS sales data
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
                  <TableHead>Code</TableHead>
                  <TableHead>Menu</TableHead>
                  <TableHead>Color</TableHead>
                  <TableHead colSpan={3} className="text-center">COLORPLATE</TableHead>
                  <TableHead className="text-center">POS</TableHead>
                  <TableHead className="text-center">Selisih</TableHead>
                  <TableHead className="w-10"></TableHead>
                </TableRow>
                <TableRow className="bg-muted/50">
                  <TableHead></TableHead>
                  <TableHead></TableHead>
                  <TableHead></TableHead>
                  <TableHead className="text-right text-xs">Produce</TableHead>
                  <TableHead className="text-right text-xs">Sold</TableHead>
                  <TableHead className="text-right text-xs">Waste</TableHead>
                  <TableHead className="text-right text-xs">Sold</TableHead>
                  <TableHead className="text-center text-xs"></TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {salesEntries.map((entry, index) => {
                  const selisih = getSelisih(entry)
                  return (
                    <TableRow key={index}>
                      <TableCell className="font-mono font-semibold text-sm">{entry.code}</TableCell>
                      <TableCell className="font-medium">{entry.menuName}</TableCell>
                      <TableCell>
                        <PlateColorBadge color={entry.plateColor as any} />
                      </TableCell>
                      <TableCell className="text-right">
                        <Input
                          type="number"
                          value={entry.produced}
                          onChange={(e) => updateEntry(index, 'produced', parseInt(e.target.value) || 0)}
                          disabled={status === 'submitted'}
                          className="w-16 text-right text-sm"
                        />
                      </TableCell>
                      <TableCell className="text-right">
                        <Input
                          type="number"
                          value={entry.sold}
                          onChange={(e) => updateEntry(index, 'sold', parseInt(e.target.value) || 0)}
                          disabled={status === 'submitted'}
                          className="w-16 text-right text-sm"
                        />
                      </TableCell>
                      <TableCell className="text-right">
                        <Input
                          type="number"
                          value={entry.waste}
                          onChange={(e) => updateEntry(index, 'waste', parseInt(e.target.value) || 0)}
                          disabled={status === 'submitted'}
                          className="w-16 text-right text-sm"
                        />
                      </TableCell>
                      <TableCell className="text-right">
                        <Input
                          type="number"
                          value={entry.posSold}
                          onChange={(e) => updateEntry(index, 'posSold', parseInt(e.target.value) || 0)}
                          disabled={status === 'submitted'}
                          className="w-16 text-right text-sm"
                        />
                      </TableCell>
                      <TableCell className={`text-right font-semibold ${selisih !== 0 ? 'text-destructive' : 'text-green-600'}`}>
                        {selisih > 0 ? '+' : ''}{selisih}
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
                  )
                })}
                <TableRow className="bg-muted/50 font-semibold">
                  <TableCell colSpan={3}>TOTAL</TableCell>
                  <TableCell className="text-right">{totals.produced}</TableCell>
                  <TableCell className="text-right">{totals.sold}</TableCell>
                  <TableCell className="text-right">{totals.waste}</TableCell>
                  <TableCell className="text-right">{totals.posSold}</TableCell>
                  <TableCell className={`text-right ${salesEntries.reduce((sum, e) => sum + getSelisih(e), 0) !== 0 ? 'text-destructive' : 'text-green-600'}`}>
                    {salesEntries.reduce((sum, e) => sum + getSelisih(e), 0) > 0 ? '+' : ''}{salesEntries.reduce((sum, e) => sum + getSelisih(e), 0)}
                  </TableCell>
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
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-6">
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
