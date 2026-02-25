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
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
          {filteredItems.map((item) => {
            const menuItem = sushiMenus.find((m) => m.id === item.sushiId)
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

                    <div className="text-xs text-muted-foreground space-y-0.5">
                      <p>
                        Life: <span className="font-medium text-red-600">{item.shelfLifeMinutes}m</span>
                      </p>
                      <p>
                        Status: <span className="font-medium text-red-600">Expired</span>
                      </p>
                    </div>

                    {/* Status Selection */}
                    <div>
                      <Label className="text-xs font-medium mb-1 block">Mark as</Label>
                      <Select
                        value={item.status || 'sold'}
                        onValueChange={(value) => {
                          setEditingId(item.id)
                          setEditingStatus(value as 'sold' | 'waste')
                          handleStatusChange(item.id, value as 'sold' | 'waste', item.notes || '')
                        }}
                      >
                        <SelectTrigger className="h-7 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="sold">Sold</SelectItem>
                          <SelectItem value="waste">Waste</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-1">
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleRemove(item.id)}
                        className="w-full text-xs h-7"
                      >
                        <Trash2 className="w-3 h-3 mr-1" />
                        Delete
                      </Button>
                    </div>
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
