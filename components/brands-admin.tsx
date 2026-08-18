"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import type { Brand } from "@/lib/types"
import { useBrands } from "@/hooks/use-brands"
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

const emptyForm = { code: "", name: "", description: "", is_active: true }

export function BrandsAdmin() {
  const { toast } = useToast()
  const { brands, isLoading, createBrand, updateBrand, deleteBrand } = useBrands()
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<Brand | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const [formData, setFormData] = useState(emptyForm)

  const handleAdd = () => {
    setEditingItem(null)
    setFormData(emptyForm)
    setIsDialogOpen(true)
  }

  const handleEdit = (item: Brand) => {
    setEditingItem(item)
    setFormData({
      code: item.code,
      name: item.name,
      description: item.description,
      is_active: item.isActive,
    })
    setIsDialogOpen(true)
  }

  const handleSave = async () => {
    // Guard against double-clicks while a save is already in flight.
    if (isSaving) return

    if (!formData.code || !formData.name) {
      toast({ title: "Error", description: "Code and name are required", variant: "destructive" })
      return
    }

    setIsSaving(true)
    try {
      if (editingItem) {
        await updateBrand(editingItem.id, formData)
        toast({ title: "Updated", description: "Brand updated successfully" })
      } else {
        await createBrand(formData)
        toast({ title: "Created", description: "Brand created successfully" })
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
      await deleteBrand(id)
      setDeleteConfirm(null)
      toast({ title: "Deleted", description: "Brand removed", variant: "destructive" })
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
            <h1 className="text-3xl md:text-4xl font-bold">Brands</h1>
            <p className="text-muted-foreground mt-1">
              Setiap outlet melayani satu brand. Menu dan warna piring menempel ke brand,
              jadi menghapus brand memutus keduanya.
            </p>
          </div>
          <Button onClick={handleAdd} size="lg">
            <Plus className="w-5 h-5 mr-2" />
            Add Brand
          </Button>
        </div>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle>Brand Configuration</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            ) : brands.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">No brands configured</p>
            ) : (
              <div className="space-y-3">
                {brands.map((brand) => (
                  <div
                    key={brand.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50"
                  >
                    <div className="flex-1">
                      <p className="font-medium">
                        {brand.name}
                        <span className="ml-2 text-xs font-mono text-muted-foreground">{brand.code}</span>
                      </p>
                      {brand.description && (
                        <p className="text-sm text-muted-foreground">{brand.description}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">Active</span>
                        <Switch checked={brand.isActive} disabled />
                      </div>
                      <Button variant="outline" size="sm" onClick={() => handleEdit(brand)}>
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => setDeleteConfirm(brand.id)}>
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
              <DialogTitle>{editingItem ? "Edit Brand" : "Add Brand"}</DialogTitle>
              <DialogDescription>Kode dipakai sebagai kunci brand dan harus unik.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="code">Code</Label>
                <Input
                  id="code"
                  placeholder="e.g., MHR"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  placeholder="e.g., Maharasa"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  placeholder="Optional"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
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
                Menu, warna piring, dan outlet yang menempel ke brand ini akan kehilangan
                brand-nya. Lanjutkan?
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
