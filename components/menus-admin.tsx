"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { PlateColorBadge, type PlateColor } from "@/components/plate-color-badge"
import type { SushiMenu } from "@/lib/types"
import { sushiMenus as initialMenus, plateColors } from "@/lib/mock-data"
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"

export function MenusAdmin() {
  const { toast } = useToast()
  const [menus, setMenus] = useState<SushiMenu[]>(initialMenus)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<SushiMenu | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    name: "",
    plateColor: (plateColors[0]?.name || "white") as PlateColor,
    shelfLifeMinutes: 90,
    costEstimate: 0,
  })

  const handleAdd = () => {
    setEditingItem(null)
    setFormData({ name: "", plateColor: (plateColors[0]?.name || "white") as PlateColor, shelfLifeMinutes: 90, costEstimate: 0 })
    setIsDialogOpen(true)
  }

  const handleEdit = (item: SushiMenu) => {
    setEditingItem(item)
    setFormData({
      name: item.name,
      plateColor: item.plateColor,
      shelfLifeMinutes: item.shelfLifeMinutes,
      costEstimate: item.costEstimate,
    })
    setIsDialogOpen(true)
  }

  const handleSave = () => {
    if (editingItem) {
      setMenus(menus.map((item) => (item.id === editingItem.id ? { ...item, ...formData } : item)))
      toast({ title: "Updated", description: "Menu item updated successfully" })
    } else {
      const newMenu: SushiMenu = {
        id: Date.now().toString(),
        ...formData,
      }
      setMenus([...menus, newMenu])
      toast({ title: "Added", description: "New menu item added successfully" })
    }
    setIsDialogOpen(false)
  }

  const handleDelete = (id: string) => {
    setMenus(menus.filter((item) => item.id !== id))
    setDeleteConfirm(null)
    toast({ title: "Deleted", description: "Menu item removed", variant: "destructive" })
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold">Menu Management</h1>
            <p className="text-muted-foreground mt-1">Manage sushi menu items and configurations</p>
          </div>
          <Button onClick={handleAdd} size="lg">
            <Plus className="w-5 h-5 mr-2" />
            Add Menu Item
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Sushi Menu Items</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-3 font-semibold">Sushi Name</th>
                    <th className="text-left p-3 font-semibold">Plate Color</th>
                    <th className="text-right p-3 font-semibold">Shelf Life</th>
                    <th className="text-right p-3 font-semibold">Cost Estimate</th>
                    <th className="text-right p-3 font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {menus.map((item) => (
                    <tr key={item.id} className="border-b hover:bg-muted/50">
                      <td className="p-3 font-medium">{item.name}</td>
                      <td className="p-3">
                        <PlateColorBadge color={item.plateColor} />
                      </td>
                      <td className="p-3 text-right">{item.shelfLifeMinutes} min</td>
                      <td className="p-3 text-right">${item.costEstimate.toFixed(2)}</td>
                      <td className="p-3">
                        <div className="flex gap-2 justify-end">
                          <Button variant="ghost" size="sm" onClick={() => handleEdit(item)}>
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => setDeleteConfirm(item.id)}>
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Edit/Add Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingItem ? "Edit Menu Item" : "Add Menu Item"}</DialogTitle>
              <DialogDescription>Configure menu item details and pricing</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Sushi Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. California Roll"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="plateColor">Plate Color</Label>
                <Select
                  value={formData.plateColor}
                  onValueChange={(value) => setFormData({ ...formData, plateColor: value as PlateColor })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {plateColors.map((plate) => (
                      <SelectItem key={plate.id} value={plate.name}>
                        {plate.name.charAt(0).toUpperCase() + plate.name.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="shelfLife">Shelf Life (minutes)</Label>
                <Input
                  id="shelfLife"
                  type="number"
                  value={formData.shelfLifeMinutes}
                  onChange={(e) => setFormData({ ...formData, shelfLifeMinutes: Number.parseInt(e.target.value) || 0 })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cost">Cost Estimate ($)</Label>
                <Input
                  id="cost"
                  type="number"
                  step="0.01"
                  value={formData.costEstimate}
                  onChange={(e) => setFormData({ ...formData, costEstimate: Number.parseFloat(e.target.value) || 0 })}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSave}>{editingItem ? "Save Changes" : "Add Item"}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation */}
        <Dialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Confirm Delete</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete this menu item? This action cannot be undone.
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
