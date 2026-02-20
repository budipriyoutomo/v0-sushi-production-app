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
import { PlateColorBadge } from '@/components/plate-color-badge'
import type { ProductionItem } from '@/lib/types'
import { useToast } from '@/hooks/use-toast'
import { sushiMenus, plateColors } from '@/lib/mock-data'
import { Trash2 } from 'lucide-react'

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
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingStatus, setEditingStatus] = useState<'sold' | 'waste'>('sold')
  const [editingNotes, setEditingNotes] = useState('')
  const [selectedColor, setSelectedColor] = useState<string | null>(null)

  const filteredItems = selectedColor 
    ? expiredItems.filter((item) => item.plateColor === selectedColor)
    : expiredItems

  const handleStatusChange = (itemId: string, newStatus: 'sold' | 'waste', notes: string) => {
    toast({
      title: 'Status Updated',
      description: `${expiredItems.find((i) => i.id === itemId)?.sushiName} marked as ${newStatus}`,
      variant: newStatus === 'waste' ? 'destructive' : 'default',
    })
    setEditingId(null)
  }

  const handleRemove = (itemId: string) => {
    onRemove(itemId)
    toast({
      title: 'Item Removed',
      description: 'Item has been removed from the expired list',
    })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl md:text-4xl font-bold">Expired Items</h1>
        <p className="text-muted-foreground mt-1">
          Manage items that have exceeded their shelf life: <span className="font-semibold text-foreground">{expiredItems.length}</span>
        </p>
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
        <div className="space-y-3">
          {filteredItems.map((item) => {
            const menuItem = sushiMenus.find((m) => m.id === item.sushiId)
            return (
              <Card key={item.id} className="border-red-200">
                <CardContent className="p-4">
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                    {/* Image */}
                    {menuItem?.image && (
                      <div className="md:col-span-2">
                        <div className="relative w-full h-24 bg-muted rounded overflow-hidden">
                          <Image
                            src={menuItem.image}
                            alt={item.sushiName}
                            fill
                            className="object-cover"
                            sizes="(max-width: 768px) 100%, 16%"
                          />
                        </div>
                      </div>
                    )}

                    {/* Item Info */}
                    <div className={`${menuItem?.image ? 'md:col-span-2' : 'md:col-span-3'} space-y-2`}>
                      <div className="flex items-center gap-2">
                        <h3 className="text-lg font-semibold flex-1">{item.sushiName}</h3>
                        <PlateColorBadge color={item.plateColor} />
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Produced: {item.productionTime.toLocaleString()}
                      </p>
                      <p className="text-sm text-red-600 font-semibold">
                        Shelf Life: {item.shelfLifeMinutes} min
                      </p>
                    </div>

                  {/* Status Selection */}
                  <div className="md:col-span-2">
                    <Label className="text-sm font-medium mb-2 block">Status</Label>
                    <Select
                      value={item.status || 'sold'}
                      onValueChange={(value) => {
                        setEditingId(item.id)
                        setEditingStatus(value as 'sold' | 'waste')
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="sold">Sold</SelectItem>
                        <SelectItem value="waste">Waste</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Notes */}
                  <div className="md:col-span-4">
                    <Label className="text-sm font-medium mb-2 block">Keterangan (Notes)</Label>
                    <Input
                      placeholder="Add notes..."
                      value={item.notes || ''}
                      onChange={(e) => setEditingNotes(e.target.value)}
                      className="text-sm"
                    />
                  </div>

                  {/* Expired Info */}
                  <div className="md:col-span-2 flex flex-col gap-2">
                    <p className="text-xs text-muted-foreground font-medium">
                      Status: <span className="text-red-600">Expired</span>
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Time: {item.expiredAt?.toLocaleTimeString() || 'Just now'}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="md:col-span-1 flex gap-2 flex-col">
                    <Button
                      size="sm"
                      onClick={() => handleStatusChange(item.id, item.status || 'sold', item.notes || '')}
                      className="bg-blue-600 hover:bg-blue-700 text-white text-xs"
                      disabled={!editingId || editingId !== item.id}
                    >
                      Save
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleRemove(item.id)}
                      className="text-xs"
                    >
                      <Trash2 className="w-3 h-3 mr-1" />
                      Delete
                    </Button>
                  </div>
                  </div>

                  {/* Changed Note */}
                  <div className="mt-3 pt-3 border-t border-border">
                    <p className="text-xs text-amber-600 font-medium">
                      📝 Status changed when time remaining expired
                    </p>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
