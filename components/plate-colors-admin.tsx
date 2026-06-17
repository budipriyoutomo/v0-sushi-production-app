"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { PlateColorBadge } from "@/components/plate-color-badge"
import type { PlateColorConfig } from "@/lib/types"
import { usePlateColors } from "@/hooks/use-plate-colors"
import { getApiError } from "@/lib/api"
import { Plus, Pencil, Trash2, Loader2 } from "lucide-react"
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
  const { plateColors, isLoading, createPlateColor, updatePlateColor, deletePlateColor } = usePlateColors()
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<PlateColorConfig | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const [formData, setFormData] = useState({
    platename: "",
    price: 0,
    description: "",
    target_foodcost: 0,
    is_active: true,
  })

  const handleAdd = () => {
    setEditingItem(null)
    setFormData({ platename: "", price: 0, description: "", target_foodcost: 0, is_active: true })
    setIsDialogOpen(true)
  }

  const handleEdit = (item: PlateColorConfig) => {
    setEditingItem(item)
    setFormData({
      platename: item.platename,
      price: item.price,
      description: item.description,
      target_foodcost: item.targetFoodCost,
      is_active: item.isActive,
    })
    setIsDialogOpen(true)
  }

  const handleSave = async () => {
    // Guard against double-clicks while a save is already in flight.
    if (isSaving) return

    if (!formData.platename || formData.price <= 0) {
      toast({ title: "Error", description: "Please fill in all required fields", variant: "destructive" })
      return
    }

    setIsSaving(true)
    try {
      if (editingItem) {
        await updatePlateColor(editingItem.id, {
          platename: formData.platename,
          price: formData.price,
          description: formData.description,
          target_foodcost: formData.target_foodcost,
          is_active: formData.is_active,
        })
        toast({ title: "Updated", description: "Plate color updated successfully" })
      } else {
        await createPlateColor({
          platename: formData.platename,
          price: formData.price,
          description: formData.description,
          target_foodcost: formData.target_foodcost,
          is_active: formData.is_active,
        })
        toast({ title: "Created", description: "Plate color created successfully" })
      }
      setIsDialogOpen(false)
    } catch (error) {
      const apiError = getApiError(error)
      toast({ title: "Error", description: apiError.message, variant: "destructive" })
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    // Guard against double-clicks firing the delete more than once.
    if (isDeleting) return
    setIsDeleting(true)
    try {
      await deletePlateColor(id)
      setDeleteConfirm(null)
      toast({ title: "Deleted", description: "Plate color removed", variant: "destructive" })
    } catch (error) {
      const apiError = getApiError(error)
      toast({ title: "Error", description: apiError.message, variant: "destructive" })
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold">Plate Colors</h1>
            <p className="text-muted-foreground mt-1">Manage plate color configurations and pricing</p>
          </div>
          <Button onClick={handleAdd} size="lg">
            <Plus className="w-5 h-5 mr-2" />
            Add Color
          </Button>
        </div>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <div>
              <CardTitle>Color Plate Configuration</CardTitle>
            </div>
            
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            ) : plateColors.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">No plate colors configured</p>
            ) : (
              <div className="space-y-3">
                {plateColors.map((color) => (
                  <div
                    key={color.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50"
                  >
                    <div className="flex items-center gap-4 flex-1">
                      <PlateColorBadge color={color.platename.toLowerCase() as "white" | "blue" | "pink" | "black" | "red" | "gold" | "choco motive" | "yellow" | "silver"} />
                      <div className="flex-1">
                        <p className="font-medium capitalize">{color.platename}</p>
                        <p className="text-sm text-muted-foreground">
                          Price: Rp {color.price.toLocaleString()} | Target Food Cost: {color.targetFoodCost}% | {color.description}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">Active</span>
                        <Switch checked={color.isActive} disabled />
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
                <Label htmlFor="platename">Plate Name</Label>
                <Input
                  id="platename"
                  placeholder="e.g., White"
                  value={formData.platename}
                  onChange={(e) => setFormData({ ...formData, platename: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="price">Price (Rp)</Label>
                <Input
                  id="price"
                  type="number"
                  step="1000"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: Number.parseFloat(e.target.value) || 0 })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  placeholder="e.g., White Plate"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="foodCost">Target Food Cost (%)</Label>
                <Input
                  id="foodCost"
                  type="number"
                  step="0.01"
                  value={formData.target_foodcost}
                  onChange={(e) => setFormData({ ...formData, target_foodcost: Number.parseFloat(e.target.value) || 0 })}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="active">Active Status</Label>
                <Switch
                  id="active"
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)} disabled={isSaving}>
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={isSaving}>
                {isSaving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Save Changes
              </Button>
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
              <Button variant="outline" onClick={() => setDeleteConfirm(null)} disabled={isDeleting}>
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={() => deleteConfirm && handleDelete(deleteConfirm)}
                disabled={isDeleting}
              >
                {isDeleting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Delete
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
