'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { PlateColorBadge } from '@/components/plate-color-badge'
import { OutletSelector } from '@/components/outlet-selector'
import type { ProductionItem } from '@/lib/types'
import { useToast } from '@/hooks/use-toast'
import { sushiMenus, plateColors } from '@/lib/mock-data'
import { CheckCircle, AlertCircle } from 'lucide-react'

interface ExpiredItem extends ProductionItem {
  status?: 'sold' | 'waste'
  notes?: string
  expiredAt?: Date
}

interface ExpiredItemsManagerProps {
  expiredItems: ExpiredItem[]
  onRemove: (itemId: string) => void
}

export function ExpiredItemsManager({ expiredItems, onRemove }: ExpiredItemsManagerProps) {
  const { toast } = useToast()
  const [selectedColor, setSelectedColor] = useState<string | null>(null)
  const [updateDialogOpen, setUpdateDialogOpen] = useState(false)
  const [selectedItem, setSelectedItem] = useState<ExpiredItem | null>(null)
  const [newStatus, setNewStatus] = useState<'sold' | 'waste'>('sold')
  const [notes, setNotes] = useState('')

  const filteredItems = selectedColor 
    ? expiredItems.filter((item) => item.plateColor === selectedColor)
    : expiredItems

  const handleOpenUpdateDialog = (item: ExpiredItem) => {
    setSelectedItem(item)
    setNewStatus(item.status || 'sold')
    setNotes(item.notes || '')
    setUpdateDialogOpen(true)
  }

  const handleConfirmUpdate = () => {
    if (!notes.trim()) {
      toast({
        title: 'Required Field',
        description: 'Please fill in the notes/description',
        variant: 'destructive',
      })
      return
    }

    if (selectedItem) {
      toast({
        title: 'Status Updated',
        description: `${selectedItem.sushiName} marked as ${newStatus}`,
        variant: newStatus === 'waste' ? 'destructive' : 'default',
      })
    }
    
    setUpdateDialogOpen(false)
  }

  const calculateExpiredTime = (item: ExpiredItem) => {
    const productionTime = new Date(item.productionTime)
    const expiredTime = new Date(productionTime.getTime() + item.shelfLifeMinutes * 60000)
    return expiredTime
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold">Expired Items</h1>
          <p className="text-muted-foreground mt-1">
            Manage items that have exceeded their shelf life: <span className="font-semibold text-foreground">{expiredItems.length}</span>
          </p>
        </div>
        <OutletSelector />
      </div>

      {/* Filter by Plate Color */}
      <div className="flex flex-wrap gap-2">
        <Button
          variant={selectedColor === null ? "default" : "outline"}
          onClick={() => setSelectedColor(null)}
          className="px-4 py-2"
        >
          All Colors
        </Button>
        {plateColors.map((plate) => (
          <Button
            key={plate.id}
            variant={selectedColor === plate.name ? "default" : "outline"}
            onClick={() => setSelectedColor(plate.name)}
            className="px-4 py-2 capitalize"
          >
            {plate.name}
          </Button>
        ))}
      </div>

      {filteredItems.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <p className="text-muted-foreground text-lg">No expired items</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
          {filteredItems.map((item) => {
            const menuItem = sushiMenus.find((m) => m.id === item.sushiId)
            const productionTime = new Date(item.productionTime)
            const expiredTime = calculateExpiredTime(item)

            return (
              <Card key={item.id} className="border-red-200 hover:shadow-lg transition-shadow overflow-hidden">
                <CardContent className="p-2">
                  <div className="space-y-2">
                    {/* Image */}
                    {menuItem?.image && (
                      <div className="relative w-full h-20 bg-muted rounded overflow-hidden">
                        <Image
                          src={menuItem.image}
                          alt={item.sushiName}
                          fill
                          className="object-cover"
                          sizes="(max-width: 640px) 100px, (max-width: 768px) 120px, 150px"
                        />
                      </div>
                    )}

                    {/* Item Info */}
                    <div className="flex items-start justify-between gap-1">
                      <h3 className="text-xs font-semibold leading-tight line-clamp-2 flex-1">{item.sushiName}</h3>
                      <PlateColorBadge color={item.plateColor} />
                    </div>

                    {/* Production Details */}
                    <div className="text-xs text-muted-foreground space-y-0.5 border-t pt-1">
                      <p>
                        Prod: <span className="font-medium">{productionTime.toLocaleTimeString()}</span>
                      </p>
                      <p>
                        Exp: <span className="font-medium text-red-600">{expiredTime.toLocaleTimeString()}</span>
                      </p>
                      <p className="flex items-center gap-1 text-red-600 font-medium">
                        <AlertCircle className="w-3 h-3" />
                        Time Expired
                      </p>
                    </div>

                    {/* Update Button */}
                    <div className="flex gap-1 pt-1">
                      <Button
                        size="sm"
                        onClick={() => handleOpenUpdateDialog(item)}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white text-xs h-7"
                      >
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Update
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Update Dialog */}
      {selectedItem && (
        <Dialog open={updateDialogOpen} onOpenChange={setUpdateDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Update Expired Item</DialogTitle>
              <DialogDescription>
                Update the status and add notes for: <span className="font-semibold">{selectedItem.sushiName}</span>
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              {/* Menu Details */}
              <div className="bg-muted/30 border rounded-lg p-3 space-y-2">
                <h3 className="font-semibold text-sm">{selectedItem.sushiName}</h3>
                <div className="text-xs text-muted-foreground space-y-1">
                  <p>
                    <span className="font-medium">Production:</span> {new Date(selectedItem.productionTime).toLocaleString()}
                  </p>
                  <p>
                    <span className="font-medium">Expired:</span> {calculateExpiredTime(selectedItem).toLocaleString()}
                  </p>
                  <p className="flex items-center gap-1 text-red-600 font-medium">
                    <AlertCircle className="w-3 h-3" />
                    Time Expired
                  </p>
                </div>
              </div>

              {/* Status Selection */}
              <div className="space-y-2">
                <Label htmlFor="status" className="font-medium">Status</Label>
                <Select value={newStatus} onValueChange={(value) => setNewStatus(value as 'sold' | 'waste')}>
                  <SelectTrigger id="status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sold">Sold</SelectItem>
                    <SelectItem value="waste">Waste</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Notes/Description */}
              <div className="space-y-2">
                <Label htmlFor="notes" className="font-medium">Notes/Keterangan *</Label>
                <Input
                  id="notes"
                  placeholder="Enter description or reason..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="text-sm"
                />
                <p className="text-xs text-muted-foreground">This field is required</p>
              </div>
            </div>

            <DialogFooter className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setUpdateDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={handleConfirmUpdate}
                className={`${newStatus === 'waste' ? 'bg-red-600 hover:bg-red-700' : 'bg-emerald-600 hover:bg-emerald-700'}`}
              >
                Update Status
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
