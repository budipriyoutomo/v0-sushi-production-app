'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { useToast } from '@/hooks/use-toast'
import { Plus, Trash2, Save } from 'lucide-react'

interface SalesEntry {
  id: string
  itemName: string
  quantity: number
  unitPrice: number
  total: number
  paymentMethod: 'cash' | 'card' | 'qris' | 'other'
  timestamp: Date
}

export function SalesInput() {
  const { toast } = useToast()
  const [salesEntries, setSalesEntries] = useState<SalesEntry[]>([
    {
      id: '1',
      itemName: 'California Roll',
      quantity: 5,
      unitPrice: 45000,
      total: 225000,
      paymentMethod: 'cash',
      timestamp: new Date(),
    },
    {
      id: '2',
      itemName: 'Salmon Nigiri',
      quantity: 3,
      unitPrice: 55000,
      total: 165000,
      paymentMethod: 'card',
      timestamp: new Date(),
    },
  ])

  const [formData, setFormData] = useState({
    itemName: '',
    quantity: 0,
    unitPrice: 0,
    paymentMethod: 'cash' as const,
  })

  const handleAddEntry = () => {
    if (!formData.itemName || formData.quantity <= 0 || formData.unitPrice <= 0) {
      toast({
        title: 'Error',
        description: 'Please fill in all fields correctly',
        variant: 'destructive',
      })
      return
    }

    const newEntry: SalesEntry = {
      id: Date.now().toString(),
      itemName: formData.itemName,
      quantity: formData.quantity,
      unitPrice: formData.unitPrice,
      total: formData.quantity * formData.unitPrice,
      paymentMethod: formData.paymentMethod,
      timestamp: new Date(),
    }

    setSalesEntries([...salesEntries, newEntry])
    setFormData({
      itemName: '',
      quantity: 0,
      unitPrice: 0,
      paymentMethod: 'cash',
    })

    toast({
      title: 'Success',
      description: 'Sales entry added',
    })
  }

  const handleDeleteEntry = (id: string) => {
    setSalesEntries(salesEntries.filter((entry) => entry.id !== id))
    toast({
      title: 'Deleted',
      description: 'Sales entry removed',
    })
  }

  const totalSales = salesEntries.reduce((sum, entry) => sum + entry.total, 0)
  const totalQuantity = salesEntries.reduce((sum, entry) => sum + entry.quantity, 0)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Sales Input (POS)</h1>
        <p className="text-muted-foreground mt-1">Record sales transactions from Point of Sale system</p>
      </div>

      {/* Input Form */}
      <Card>
        <CardHeader>
          <CardTitle>Add Sales Entry</CardTitle>
          <CardDescription>Enter sales data from your POS system</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="space-y-2">
              <Label htmlFor="itemName">Item Name</Label>
              <Input
                id="itemName"
                placeholder="e.g., California Roll"
                value={formData.itemName}
                onChange={(e) => setFormData({ ...formData, itemName: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="quantity">Quantity</Label>
              <Input
                id="quantity"
                type="number"
                placeholder="0"
                value={formData.quantity || ''}
                onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) || 0 })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="unitPrice">Unit Price (IDR)</Label>
              <Input
                id="unitPrice"
                type="number"
                placeholder="0"
                value={formData.unitPrice || ''}
                onChange={(e) => setFormData({ ...formData, unitPrice: parseInt(e.target.value) || 0 })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="payment">Payment Method</Label>
              <Select value={formData.paymentMethod} onValueChange={(value: any) => setFormData({ ...formData, paymentMethod: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="card">Card</SelectItem>
                  <SelectItem value="qris">QRIS</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
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
              <p className="text-sm text-muted-foreground">Total Sales</p>
              <p className="text-2xl font-bold">IDR {totalSales.toLocaleString('id-ID')}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Total Items Sold</p>
              <p className="text-2xl font-bold">{totalQuantity}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Transactions</p>
              <p className="text-2xl font-bold">{salesEntries.length}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Sales Table */}
      <Card>
        <CardHeader>
          <CardTitle>Sales Entries</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Item Name</TableHead>
                  <TableHead className="text-right">Quantity</TableHead>
                  <TableHead className="text-right">Unit Price</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead>Payment Method</TableHead>
                  <TableHead>Time</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {salesEntries.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-4 text-muted-foreground">
                      No sales entries yet
                    </TableCell>
                  </TableRow>
                ) : (
                  salesEntries.map((entry) => (
                    <TableRow key={entry.id}>
                      <TableCell className="font-medium">{entry.itemName}</TableCell>
                      <TableCell className="text-right">{entry.quantity}</TableCell>
                      <TableCell className="text-right">IDR {entry.unitPrice.toLocaleString('id-ID')}</TableCell>
                      <TableCell className="text-right font-semibold">IDR {entry.total.toLocaleString('id-ID')}</TableCell>
                      <TableCell className="capitalize">{entry.paymentMethod}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{entry.timestamp.toLocaleTimeString('id-ID')}</TableCell>
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
        <Button variant="outline">Cancel</Button>
        <Button className="gap-2">
          <Save className="w-4 h-4" />
          Save & Export
        </Button>
      </div>
    </div>
  )
}
