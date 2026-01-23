'use client'

import React from "react"

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Minus, Plus } from 'lucide-react'

interface QuantityCalculatorProps {
  open: boolean
  itemName: string
  onConfirm: (quantity: number) => void
  onCancel: () => void
}

export function QuantityCalculator({ open, itemName, onConfirm, onCancel }: QuantityCalculatorProps) {
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
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Produce {itemName}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Quantity Display */}
          <div className="flex items-center justify-center">
            <div className="text-5xl font-bold text-center">{quantity}</div>
          </div>

          {/* Calculator Buttons */}
          <div className="grid grid-cols-3 gap-2">
            <Button
              variant="outline"
              size="lg"
              onClick={() => setQuantity(Math.max(1, quantity - 10))}
              className="text-lg font-semibold"
            >
              -10
            </Button>
            <Button
              variant="outline"
              size="lg"
              onClick={handleDecrement}
              className="text-lg font-semibold bg-transparent"
            >
              <Minus className="w-5 h-5" />
            </Button>
            <Button
              variant="outline"
              size="lg"
              onClick={handleIncrement}
              className="text-lg font-semibold bg-transparent"
            >
              <Plus className="w-5 h-5" />
            </Button>

            <Button
              variant="outline"
              size="lg"
              onClick={() => setQuantity(quantity + 10)}
              className="text-lg font-semibold"
            >
              +10
            </Button>
            <Button
              variant="outline"
              size="lg"
              onClick={() => setQuantity(5)}
              className="text-lg font-semibold"
            >
              5
            </Button>
            <Button
              variant="outline"
              size="lg"
              onClick={() => setQuantity(10)}
              className="text-lg font-semibold"
            >
              10
            </Button>
          </div>

          {/* Manual Input */}
          <div>
            <label className="text-sm font-medium">Enter quantity</label>
            <Input
              type="number"
              min="1"
              value={quantity}
              onChange={handleInputChange}
              className="mt-1 text-center text-lg font-semibold"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={onCancel}
              className="flex-1 bg-transparent"
            >
              Cancel
            </Button>
            <Button
              onClick={handleConfirm}
              className="flex-1 bg-emerald-600 hover:bg-emerald-700"
            >
              Produce {quantity}x
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
