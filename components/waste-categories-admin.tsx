"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useWasteCategories } from "@/hooks/use-waste-categories"
import { getApiError } from "@/lib/api"
import { Plus, Pencil, Trash2, Loader2 } from "lucide-react"
import type { WasteCategory } from "@/lib/api/services/waste-categories"
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

/**
 * Sama dengan aturan backend (WasteCategoryRequest): huruf besar, angka, garis
 * bawah. Dinormalkan saat diketik supaya admin melihat kode yang akan tersimpan.
 */
const normalizeCode = (value: string) => value.toUpperCase().replace(/[^A-Z0-9_]/g, "_")

const EMPTY_FORM = {
  code: "",
  category_name: "",
  description: "",
  sort_order: 0,
  is_active: true,
}

export function WasteCategoriesAdmin() {
  const { toast } = useToast()
  const { wasteCategories, isLoading, createWasteCategory, updateWasteCategory, deleteWasteCategory } =
    useWasteCategories()
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<WasteCategory | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<WasteCategory | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [formData, setFormData] = useState(EMPTY_FORM)

  // Kode menjadi kunci di BI. Begitu ada reason yang menunjuknya, backend
  // menolak perubahannya — kunci di sini supaya admin tidak perlu menebak.
  const codeLocked = !!editingItem && (editingItem.reasons_count ?? 0) > 0

  const handleAdd = () => {
    setEditingItem(null)
    setFormData(EMPTY_FORM)
    setIsDialogOpen(true)
  }

  const handleEdit = (item: WasteCategory) => {
    setEditingItem(item)
    setFormData({
      code: item.code,
      category_name: item.category_name,
      description: item.description ?? "",
      sort_order: item.sort_order ?? 0,
      is_active: item.is_active,
    })
    setIsDialogOpen(true)
  }

  const handleSave = async () => {
    // Guard against double-clicks while a save is already in flight.
    if (isSaving) return

    if (!formData.code || !formData.category_name) {
      toast({ title: "Error", description: "Code and name are required", variant: "destructive" })
      return
    }

    setIsSaving(true)
    try {
      const payload = {
        code: formData.code,
        category_name: formData.category_name,
        description: formData.description || null,
        sort_order: formData.sort_order,
        is_active: formData.is_active,
      }

      if (editingItem) {
        await updateWasteCategory(editingItem.id, payload)
        toast({ title: "Updated", description: "Waste category updated successfully" })
      } else {
        await createWasteCategory(payload)
        toast({ title: "Created", description: "Waste category created successfully" })
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
      await deleteWasteCategory(id)
      setDeleteConfirm(null)
      toast({ title: "Deleted", description: "Waste category removed", variant: "destructive" })
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
            <h1 className="text-3xl md:text-4xl font-bold">Waste Categories</h1>
            <p className="text-muted-foreground mt-1">
              Group waste reasons into categories. The category code is sent to BI.
            </p>
          </div>
          <Button onClick={handleAdd} size="lg">
            <Plus className="w-5 h-5 mr-2" />
            Add Category
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Waste Category Configuration</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            ) : wasteCategories.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">No waste categories configured</p>
            ) : (
              <div className="space-y-3">
                {wasteCategories.map((category) => {
                  const inUse = (category.reasons_count ?? 0) > 0

                  return (
                    <div
                      key={category.id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-medium">{category.category_name}</p>
                          <span className="rounded bg-muted px-2 py-0.5 font-mono text-xs">{category.code}</span>
                        </div>
                        {category.description && (
                          <p className="text-sm text-muted-foreground">{category.description}</p>
                        )}
                        <p className="text-xs text-muted-foreground mt-1">
                          {category.reasons_count ?? 0} reason(s)
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-muted-foreground">Active</span>
                          <Switch checked={category.is_active} disabled />
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          aria-label={`Edit ${category.category_name}`}
                          onClick={() => handleEdit(category)}
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          aria-label={`Delete ${category.category_name}`}
                          disabled={inUse}
                          title={inUse ? "Move its reasons to another category first" : undefined}
                          onClick={() => setDeleteConfirm(category)}
                        >
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Edit Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingItem ? "Edit Waste Category" : "Add Waste Category"}</DialogTitle>
              <DialogDescription>Configure waste category details</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="category_code">Code</Label>
                <Input
                  id="category_code"
                  placeholder="e.g., SHELF_LIFE"
                  value={formData.code}
                  disabled={codeLocked}
                  onChange={(e) => setFormData({ ...formData, code: normalizeCode(e.target.value) })}
                />
                <p className="text-xs text-muted-foreground">
                  {codeLocked
                    ? "Code can no longer change: it is already used and is the key for BI."
                    : "Letters, numbers and underscores. Cannot change once the category is used."}
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="category_name">Name</Label>
                <Input
                  id="category_name"
                  placeholder="e.g., Shelf Life"
                  value={formData.category_name}
                  onChange={(e) => setFormData({ ...formData, category_name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="category_description">Description</Label>
                <Input
                  id="category_description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="category_sort">Sort Order</Label>
                <Input
                  id="category_sort"
                  type="number"
                  min={0}
                  value={formData.sort_order}
                  onChange={(e) => setFormData({ ...formData, sort_order: Math.max(0, Number(e.target.value) || 0) })}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="category_active">Active Status</Label>
                <Switch
                  id="category_active"
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
                Delete category {deleteConfirm?.category_name}? This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDeleteConfirm(null)} disabled={isDeleting}>
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={() => deleteConfirm && handleDelete(deleteConfirm.id)}
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
