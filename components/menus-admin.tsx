"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { PlateColorBadge } from "@/components/plate-color-badge"
import type { SushiMenu } from "@/lib/types"
import { useMenus } from "@/hooks/use-menus"
import { usePlateColors } from "@/hooks/use-plate-colors"
import { getApiError } from "@/lib/api"
import { Plus, Pencil, Trash2, Upload, X, Loader2 } from "lucide-react"
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
import { Switch } from "@/components/ui/switch"
import { useToast } from "@/hooks/use-toast"
import { Textarea } from "@/components/ui/textarea"

export function MenusAdmin() {
  const { toast } = useToast()
  const { menus, isLoading, createMenu, updateMenu, deleteMenu } = useMenus()
  const { plateColors } = usePlateColors()
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<SushiMenu | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string>("")

  const [formData, setFormData] = useState({
    menuname: "",
    description: "",
    image: "",
    price: 0,
    shelf_life: 2,
    plate_color_id: "",
    is_active: true,
  })

  const handleAdd = () => {
    setEditingItem(null)
    setImageFile(null)
    setImagePreview("")
    setFormData({
      menuname: "",
      description: "",
      image: "",
      price: 0,
      shelf_life: 2,
      plate_color_id: plateColors[0]?.id || "",
      is_active: true,
    })
    setIsDialogOpen(true)
  }

  const handleEdit = (item: SushiMenu) => {
    setEditingItem(item)
    setImageFile(null)
    setImagePreview(item.image || "")
    setFormData({
      menuname: item.menuname,
      description: item.description,
      image: item.image,
      price: item.price,
      shelf_life: item.shelfLife,
      plate_color_id: item.plateColorId,
      is_active: item.isActive,
    })
    setIsDialogOpen(true)
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setImageFile(file)
      const reader = new FileReader()
      reader.onload = (event) => {
        setImagePreview(event.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSave = async () => {
    if (!formData.menuname || !formData.plate_color_id) {
      toast({ title: "Error", description: "Please fill in menu name and select plate color", variant: "destructive" })
      return
    }

    setIsSaving(true)
    try {
      // For now, we'll send the image as base64 or path
      // In production, you'd upload to a file server first
      const submitData = {
        ...formData,
        image: imageFile ? `menus/${formData.menuname.toLowerCase().replace(/\s+/g, '-')}.jpg` : formData.image,
      }

      if (editingItem) {
        await updateMenu(editingItem.id, submitData)
        toast({ title: "Updated", description: "Menu item updated successfully" })
      } else {
        await createMenu(submitData)
        toast({ title: "Added", description: "New menu item added successfully" })
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
    try {
      await deleteMenu(id)
      setDeleteConfirm(null)
      toast({ title: "Deleted", description: "Menu item removed", variant: "destructive" })
    } catch (error) {
      const apiError = getApiError(error)
      toast({ title: "Error", description: apiError.message, variant: "destructive" })
    }
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
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-3 font-semibold">Image</th>
                    <th className="text-left p-3 font-semibold">Menu Name</th>
                    <th className="text-left p-3 font-semibold">Description</th>
                    <th className="text-left p-3 font-semibold">Plate Color</th>
                    <th className="text-right p-3 font-semibold">Shelf Life</th>
                    <th className="text-right p-3 font-semibold">Harga Jual</th>
                    <th className="text-center p-3 font-semibold">Status</th>
                    <th className="text-right p-3 font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {menus.map((item) => (
                    <tr key={item.id} className="border-b hover:bg-muted/50">
                      <td className="p-3">
                        {item.image ? (
                          <img src={item.image} alt={item.menuname} className="w-12 h-12 object-cover rounded" />
                        ) : (
                          <div className="w-12 h-12 bg-muted rounded flex items-center justify-center text-xs text-muted-foreground">No Image</div>
                        )}
                      </td>
                      <td className="p-3 font-medium">{item.menuname}</td>
                      <td className="p-3 text-sm text-muted-foreground max-w-[200px] truncate">{item.description}</td>
                      <td className="p-3">
                        <PlateColorBadge color={item.plateColorName?.toLowerCase() as "white" | "blue" | "pink" | "black" | "red" | "gold" | "choco motive" | "yellow" | "silver"} />
                        <span className="ml-2 text-sm">{item.plateColorName}</span>
                      </td>
                      <td className="p-3 text-right">{item.shelfLife} hours</td>
                      <td className="p-3 text-right">Rp {item.price.toLocaleString('id-ID')}</td>
                      <td className="p-3 text-center">
                        <span className={`px-2 py-1 rounded-full text-xs ${item.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                          {item.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
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
            )}
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
                <Label htmlFor="menuname">Menu Name</Label>
                <Input
                  id="menuname"
                  value={formData.menuname}
                  onChange={(e) => setFormData({ ...formData, menuname: e.target.value })}
                  placeholder="e.g. Salmon Sushi"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="e.g. Fresh salmon sushi with premium rice"
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="image">Menu Image</Label>
                <div className="border-2 border-dashed rounded-lg p-4 text-center">
                  {imagePreview ? (
                    <div className="space-y-2">
                      <img src={imagePreview} alt="Preview" className="w-full h-40 object-cover rounded" />
                      <Button
                        variant="outline"
                        size="sm"
                        type="button"
                        onClick={() => {
                          setImageFile(null)
                          setImagePreview("")
                          setFormData({ ...formData, image: "" })
                        }}
                        className="w-full"
                      >
                        <X className="w-4 h-4 mr-2" />
                        Remove Image
                      </Button>
                    </div>
                  ) : (
                    <div>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageChange}
                        className="hidden"
                        id="image-upload"
                      />
                      <label htmlFor="image-upload" className="cursor-pointer">
                        <div className="flex flex-col items-center gap-2">
                          <Upload className="w-8 h-8 text-muted-foreground" />
                          <p className="text-sm text-muted-foreground">Click to upload image</p>
                        </div>
                      </label>
                    </div>
                  )}
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="plateColor">Plate Color</Label>
                <Select
                  value={formData.plate_color_id}
                  onValueChange={(value) => setFormData({ ...formData, plate_color_id: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select plate color" />
                  </SelectTrigger>
                  <SelectContent>
                    {plateColors.map((plate) => (
                      <SelectItem key={plate.id} value={plate.id}>
                        {plate.platename} - Rp {plate.price.toLocaleString('id-ID')}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="shelfLife">Shelf Life (hours)</Label>
                <Input
                  id="shelfLife"
                  type="number"
                  value={formData.shelf_life}
                  onChange={(e) => setFormData({ ...formData, shelf_life: Number.parseInt(e.target.value) || 0 })}
                  placeholder="e.g. 2"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="price">Harga Jual (Rp)</Label>
                <Input
                  id="price"
                  type="number"
                  step="1000"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: Number.parseFloat(e.target.value) || 0 })}
                  placeholder="e.g. 25000"
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="is_active">Active Status</Label>
                <Switch
                  id="is_active"
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
                {editingItem ? "Save Changes" : "Add Item"}
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
