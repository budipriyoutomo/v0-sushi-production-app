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
import { useOutlet } from '@/lib/outlet-context'
import { useMenus } from '@/hooks/use-menus'
import { usePlateColorsSortedByPrice } from '@/hooks/use-plate-colors'
import { useExpiredItems } from '@/hooks/use-production'
import { useToast } from '@/hooks/use-toast'
import { CheckCircle, AlertCircle, Loader2 } from 'lucide-react'

export function ExpiredItemsManager() {
  const { toast } = useToast()
  const { selectedOutlet } = useOutlet()
  const { menus, isLoading: menusLoading } = useMenus()
  const { plateColors, isLoading: plateColorsLoading } = usePlateColorsSortedByPrice()
  const {
    expiredItems,
    isLoading: expiredLoading,
    updateExpiredItem,
    removeExpiredItem,
    refresh,
  } = useExpiredItems(selectedOutlet?.id || null)

  const [selectedColor, setSelectedColor] = useState<string | null>(null)
  const [updateDialogOpen, setUpdateDialogOpen] = useState(false)
  const [selectedItem, setSelectedItem] = useState<typeof expiredItems[0] | null>(null)
  const [newStatus, setNewStatus] = useState<'sold' | 'waste'>('sold')
  const [notes, setNotes] = useState('')
  const [isUpdating, setIsUpdating] = useState(false)

  const isLoading = menusLoading || plateColorsLoading || expiredLoading

  const filteredItems = selectedColor
    ? expiredItems.filter((item) => item.plateColor === selectedColor)
    : expiredItems

  const handleOpenUpdateDialog = (item: typeof expiredItems[0]) => {
    setSelectedItem(item)
    setNewStatus(item.status || 'sold')
    setNotes(item.notes || '')
    setUpdateDialogOpen(true)
  }

  const handleConfirmUpdate = async () => {
    if (!notes.trim()) {
      toast({
        title: 'Required Field',
        description: 'Please fill in the notes/description',
        variant: 'destructive',
      })
      return
    }

    if (!selectedItem) return

    setIsUpdating(true)
    try {
      await updateExpiredItem(selectedItem.id, newStatus, notes)
      toast({
        title: 'Status Updated',
        description: `${selectedItem.menuName} marked as ${newStatus}`,
        variant: newStatus === 'waste' ? 'destructive' : 'default',
      })
      setUpdateDialogOpen(false)
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update item status',
        variant: 'destructive',
      })
    } finally {
      setIsUpdating(false)
    }
  }

  const calculateExpiredTime = (item: typeof expiredItems[0]) => {
    return new Date(item.expiresAt)
  }

  if (!selectedOutlet) {
    return (
      <div className="space-y-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold">Expired Items</h1>
            <p className="text-muted-foreground mt-1">
              Manage items that have exceeded their shelf life
            </p>
          </div>
          <OutletSelector />
        </div>
        <Card>
          <CardContent className="p-12 text-center">
            <p className="text-muted-foreground text-lg">Please select an outlet first</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold">Expired Items</h1>
          <p className="text-muted-foreground mt-1">
            Manage items that have exceeded their shelf life:{' '}
            <span className="font-semibold text-foreground">{expiredItems.length}</span>
          </p>
        </div>
        <OutletSelector />
      </div>

      {/* Filter by Plate Color */}
      <div className="flex flex-wrap gap-2">
        <Button
          variant={selectedColor === null ? 'default' : 'outline'}
          onClick={() => setSelectedColor(null)}
          className="px-4 py-2"
        >
          All Colors
        </Button>
        {plateColors.map((plate) => (
          <Button
            key={plate.id}
            variant={selectedColor === plate.name ? 'default' : 'outline'}
            onClick={() => setSelectedColor(plate.name)}
            className="px-4 py-2 capitalize"
          >
            {plate.name}
          </Button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      ) : filteredItems.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <p className="text-muted-foreground text-lg">No expired items</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
          {filteredItems.map((item) => {
            const menuItem = menus.find((m) => m.id === item.menuId)
            const productionTime = new Date(item.producedAt)
            const expiredTime = calculateExpiredTime(item)

            return (
              <Card
                key={item.id}
                className="relative h-56 overflow-hidden group ring-1 ring-gray-200"
              >
                {/* FULL IMAGE */}
                {menuItem?.image && (
                  <Image
                    src={menuItem.image}
                    alt={item.menuName}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                )}

                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />

                {/* CONTENT */}
                <div className="absolute inset-0 p-3 flex flex-col justify-between text-gray-900">
                  {/* TOP */}
                  <div className="flex justify-between items-start">
                    <PlateColorBadge color={item.plateColor} />
                  </div>

                  {/* BOTTOM */}
                  <div className="space-y-2">
                    {/* Name */}
                    <h3 className="text-sm font-semibold ">{item.menuName}</h3>

                    {/* Production Details */}
                    <div className="text-xs space-y-1 bg-white/70 backdrop-blur-sm p-2 rounded-md border border-gray-200">
                      <p>
                        Prod:{' '}
                        <span className="font-medium">{productionTime.toLocaleTimeString()}</span>
                      </p>

                      <p>
                        Exp:{' '}
                        <span className="font-medium text-red-600">
                          {expiredTime.toLocaleTimeString()}
                        </span>
                      </p>

                      <p className="flex items-center gap-1 text-red-600 font-semibold">
                        <AlertCircle className="w-3 h-3" />
                        Time Expired
                      </p>
                    </div>

                    {/* Update Button */}
                    <Button
                      size="sm"
                      onClick={() => handleOpenUpdateDialog(item)}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white text-xs h-8"
                    >
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Update
                    </Button>
                  </div>
                </div>
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
                Update the status and add notes for:{' '}
                <span className="font-semibold">{selectedItem.menuName}</span>
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              {/* Menu Details */}
              <div className="bg-muted/30 border rounded-lg p-3 space-y-2">
                <h3 className="font-semibold text-sm">{selectedItem.menuName}</h3>
                <div className="text-xs text-muted-foreground space-y-1">
                  <p>
                    <span className="font-medium">Production:</span>{' '}
                    {new Date(selectedItem.producedAt).toLocaleString()}
                  </p>
                  <p>
                    <span className="font-medium">Expired:</span>{' '}
                    {calculateExpiredTime(selectedItem).toLocaleString()}
                  </p>
                  <p className="flex items-center gap-1 text-red-600 font-medium">
                    <AlertCircle className="w-3 h-3" />
                    Time Expired
                  </p>
                </div>
              </div>

              {/* Status Selection */}
              <div className="space-y-2">
                <Label htmlFor="status" className="font-medium">
                  Status
                </Label>
                <Select
                  value={newStatus}
                  onValueChange={(value) => setNewStatus(value as 'sold' | 'waste')}
                >
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
                <Label htmlFor="notes" className="font-medium">
                  Notes/Keterangan *
                </Label>
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
              <Button variant="outline" onClick={() => setUpdateDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleConfirmUpdate}
                disabled={isUpdating}
                className={`${newStatus === 'waste' ? 'bg-red-600 hover:bg-red-700' : 'bg-emerald-600 hover:bg-emerald-700'}`}
              >
                {isUpdating && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Update Status
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
