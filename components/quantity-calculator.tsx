'use client'

import React from "react"
import Image from "next/image"
import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { PlateColorBadge } from '@/components/plate-color-badge'
import { Minus, Plus } from 'lucide-react'
import type { SushiMenu } from '@/lib/types'

interface QuantityCalculatorProps {
  open: boolean
  item: SushiMenu
  onConfirm: (quantity: number) => void
  onCancel: () => void
}

export function QuantityCalculator({ open, item, onConfirm, onCancel }: QuantityCalculatorProps) {
  const [quantity, setQuantity] = useState(1)

  const handleDecrement = () => {
    if (quantity > 1) {
      setQuantity(quantity - 1)
    }
  }

  const handleIncrement = () => {
    setQuantity(quantity + 1)
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value, 10)
    if (!Number.isNaN(value) && value > 0) {
      setQuantity(value)
    }
  }

  const handleConfirm = () => {
    onConfirm(quantity)
    setQuantity(1)
  }

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      setQuantity(1)
      onCancel()
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Produce {item.name}</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Left Column - Menu Description */}
          <div className="space-y-4">
            {/* Image */}
            {item.image && (
              <div className="relative w-full h-56 bg-muted rounded-lg overflow-hidden">
                <Image
                  src={item.image}
                  alt={item.name}
                  fill
                  className="object-cover"
                  sizes="400px"
                />
              </div>
            )}

            {/* Menu Info Card */}
            <div className="border rounded-lg p-4 space-y-3 bg-muted/30">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1">
                  <h3 className="font-semibold text-lg">{item.name}</h3>
                  <p className="text-sm text-muted-foreground">Menu Item</p>
                </div>
                <PlateColorBadge color={item.plateColor} />
              </div>

              {/* Details Grid */}
              <div className="space-y-2 pt-3 border-t">
                <div className="flex justify-between items-center">
                  <p className="text-sm text-muted-foreground">Plate Color</p>
                  <p className="font-semibold text-sm capitalize">{item.plateColor}</p>
                </div>
                <div className="flex justify-between items-center">
                  <p className="text-sm text-muted-foreground">Shelf Life</p>
                  <p className="font-semibold text-sm">{item.shelfLifeMinutes} minutes</p>
                </div>
                <div className="flex justify-between items-center">
                  <p className="text-sm text-muted-foreground">Cost Estimate</p>
                  <p className="font-semibold text-sm">${item.costEstimate.toFixed(2)}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Quantity Input */}
          <div className="space-y-6 flex flex-col justify-between">
            {/* Quantity Display */}
            <div className="space-y-4">
              <div className="flex items-center justify-center bg-muted/50 rounded-lg py-8">
                <div className="text-6xl font-bold text-center">{quantity}</div>
              </div>

              {/* Quantity Display Label */}
              <p className="text-center text-sm text-muted-foreground">Units to Produce</p>
            </div>

            {/* Calculator Buttons */}
            <div className="grid grid-cols-3 gap-2">
              <Button
                variant="outline"
                size="lg"
                onClick={() => setQuantity(Math.max(1, quantity - 10))}
                className="text-base font-semibold py-6"
              >
                -10
              </Button>
              <Button
                variant="outline"
                size="lg"
                onClick={handleDecrement}
                className="text-base font-semibold py-6 bg-transparent"
              >
                <Minus className="w-5 h-5" />
              </Button>
              <Button
                variant="outline"
                size="lg"
                onClick={handleIncrement}
                className="text-base font-semibold py-6 bg-transparent"
              >
                <Plus className="w-5 h-5" />
              </Button>

              <Button
                variant="outline"
                size="lg"
                onClick={() => setQuantity(quantity + 10)}
                className="text-base font-semibold py-6"
              >
                +10
              </Button>
              <Button
                variant="outline"
                size="lg"
                onClick={() => setQuantity(5)}
                className="text-base font-semibold py-6"
              >
                5
              </Button>
              <Button
                variant="outline"
                size="lg"
                onClick={() => setQuantity(10)}
                className="text-base font-semibold py-6"
              >
                10
              </Button>
            </div>

            {/* Manual Input */}
            <div>
              <label className="text-sm font-medium block mb-2">Enter quantity</label>
              <Input
                type="number"
                min="1"
                value={quantity}
                onChange={handleInputChange}
                className="w-full text-center text-lg font-semibold py-2 h-12"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={onCancel}
                className="flex-1 bg-transparent h-11"
              >
                Cancel
              </Button>
              <Button
                onClick={handleConfirm}
                className="flex-1 bg-emerald-600 hover:bg-emerald-700 h-11"
              >
                Produce {quantity}x
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
