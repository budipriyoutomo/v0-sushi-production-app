"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { PlateColorBadge } from "@/components/plate-color-badge"
import { OutletSelector } from "@/components/outlet-selector"
import type { PlateColorConfig } from "@/lib/types"
import { plateColors as initialPlateColors } from "@/lib/mock-data"
import { useOutlet } from "@/lib/outlet-context"
import { Plus, Pencil, Trash2 } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { useToast } from "@/hooks/use-toast"

export function PlateColorsAdmin() {
  const { toast } = useToast()
  const { selectedOutletId } = useOutlet()
  const [plateColors, setPlateColors] = useState<PlateColorConfig[]>(initialPlateColors)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<PlateColorConfig | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    name: "",
    price: 0,
    targetFoodCost: 0,
    active: true,
  })

  // Filter plate colors by selected outlet
  const outletPlateColors = plateColors.filter((pc) => pc.outletId === selectedOutletId)

  const handleEdit = (item: PlateColorConfig) => {
    setEditingItem(item)
    setFormData({
      name: item.name,
      price: item.price,
      targetFoodCost: item.targetFoodCost,
      active: item.active,
    })
    setIsDialogOpen(true)
  }

  const handleSave = () => {
    if (editingItem) {
      setPlateColors(
        plateColors.map((item) =>
          item.id === editingItem.id
            ? { ...item, price: formData.price, targetFoodCost: formData.targetFoodCost, active: formData.active }
            : item,
        ),
      )
      toast({ title: "Updated", description: "Plate color updated successfully" })
    }
    setIsDialogOpen(false)
  }

  const handleDelete = (id: string) => {
    setPlateColors(plateColors.filter((item) => item.id !== id))
    setDeleteConfirm(null)
    toast({ title: "Deleted", description: "Plate color removed", variant: "destructive" })
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        <OutletSelector />
        <div>
          <h1 className="text-3xl md:text-4xl font-bold">Plate Colors</h1>
          <p className="text-muted-foreground mt-1">Manage plate color configurations and pricing</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Color Configuration</CardTitle>
          </CardHeader>
          <CardContent>
            {outletPlateColors.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">No plate colors configured for this outlet</p>
            ) : (
              <div className="space-y-3">
                {outletPlateColors.map((color) => (
                  <div
                    key={color.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50"
                  >
                    <div className="flex items-center gap-4 flex-1">
                      <PlateColorBadge color={color.name} />
                      <div className="flex-1">
                        <p className="font-medium capitalize">{color.name}</p>
                        <p className="text-sm text-muted-foreground">Price: ${color.price.toFixed(2)} • Target Food Cost: {color.targetFoodCost}%</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">Active</span>
                        <Switch checked={color.active} disabled />
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(color)}
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setDeleteConfirm(color.id)}
                      >
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Edit Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingItem ? "Edit Plate Color" : "Add Plate Color"}</DialogTitle>
              <DialogDescription>Configure plate color pricing and settings</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="price">Price ($)</Label>
                <Input
                  id="price"
                  type="number"
                  step="0.50"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: Number.parseFloat(e.target.value) || 0 })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="foodCost">Target Food Cost (%)</Label>
                <Input
                  id="foodCost"
                  type="number"
                  value={formData.targetFoodCost}
                  onChange={(e) => setFormData({ ...formData, targetFoodCost: Number.parseInt(e.target.value) || 0 })}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="active">Active Status</Label>
                <Switch
                  id="active"
                  checked={formData.active}
                  onCheckedChange={(checked) => setFormData({ ...formData, active: checked })}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSave}>Save Changes</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation */}
        <Dialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Confirm Delete</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete this plate color? This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDeleteConfirm(null)}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={() => deleteConfirm && handleDelete(deleteConfirm)}>
                Delete
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
