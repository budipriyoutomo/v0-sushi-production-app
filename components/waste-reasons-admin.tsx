"use client"

import { useMemo, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useWasteReasons } from "@/hooks/use-waste-reasons"
import { useWasteCategories } from "@/hooks/use-waste-categories"
import { getApiError } from "@/lib/api"
import { Plus, Pencil, Trash2, Loader2 } from "lucide-react"
import type { WasteReason } from "@/lib/api/services/waste-reasons"
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

const FILTER_ALL = "__all__"
const FILTER_UNCATEGORIZED = "__uncategorized__"

export function WasteReasonsAdmin() {
  const { toast } = useToast()
  // `withSystem`: layar ini satu-satunya tempat reason sistem (Auto-waste,
  // Import backdate) terlihat — supaya kategorinya bisa diatur.
  const { wasteReasons, isLoading, createWasteReason, updateWasteReason, deleteWasteReason } = useWasteReasons({
    withSystem: true,
  })
  const { wasteCategories } = useWasteCategories()
  const [categoryFilter, setCategoryFilter] = useState<string>(FILTER_ALL)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<WasteReason | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const [formData, setFormData] = useState({
    reason_name: "",
    description: "",
    waste_category_id: "",
    is_active: true,
  })

  const uncategorizedCount = wasteReasons.filter((r) => !r.waste_category_id).length

  const visibleReasons = useMemo(() => {
    if (categoryFilter === FILTER_ALL) return wasteReasons
    if (categoryFilter === FILTER_UNCATEGORIZED) return wasteReasons.filter((r) => !r.waste_category_id)
    return wasteReasons.filter((r) => r.waste_category_id === categoryFilter)
  }, [wasteReasons, categoryFilter])

  // Hanya kategori aktif yang boleh dipilih (backend menolak yang lain), tapi
  // kategori reason yang sedang diedit tetap ditampilkan walau sudah nonaktif.
  const categoryOptions = wasteCategories.filter(
    (c) => c.is_active || c.id === editingItem?.waste_category_id
  )

  const handleAdd = () => {
    setEditingItem(null)
    setFormData({ reason_name: "", description: "", waste_category_id: "", is_active: true })
    setIsDialogOpen(true)
  }

  const handleEdit = (item: WasteReason) => {
    setEditingItem(item)
    setFormData({
      reason_name: item.reason_name,
      description: item.description,
      waste_category_id: item.waste_category_id ?? "",
      is_active: item.is_active,
    })
    setIsDialogOpen(true)
  }

  const handleSave = async () => {
    // Guard against double-clicks while a save is already in flight.
    if (isSaving) return

    // Reason baru wajib berkategori. Reason lama boleh disimpan tanpa kategori
    // (belum di-backfill) — sama dengan aturan backend.
    if (!formData.reason_name || (!editingItem && !formData.waste_category_id)) {
      toast({ title: "Error", description: "Please fill in all required fields", variant: "destructive" })
      return
    }

    setIsSaving(true)
    try {
      if (editingItem) {
        await updateWasteReason(editingItem.id, {
          reason_name: formData.reason_name,
          description: formData.description,
          // Kosong = jangan kirim, supaya kategori yang ada tidak terhapus.
          ...(formData.waste_category_id ? { waste_category_id: formData.waste_category_id } : {}),
          is_active: formData.is_active,
        })
        toast({ title: "Updated", description: "Waste reason updated successfully" })
      } else {
        await createWasteReason({
          reason_name: formData.reason_name,
          description: formData.description,
          waste_category_id: formData.waste_category_id,
          is_active: formData.is_active,
        })
        toast({ title: "Created", description: "Waste reason created successfully" })
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
      await deleteWasteReason(id)
      setDeleteConfirm(null)
      toast({ title: "Deleted", description: "Waste reason removed", variant: "destructive" })
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
            <h1 className="text-3xl md:text-4xl font-bold">Waste Reasons</h1>
            <p className="text-muted-foreground mt-1">Manage waste reason configurations</p>
          </div>
          <Button onClick={handleAdd} size="lg">
            <Plus className="w-5 h-5 mr-2" />
            Add Reason
          </Button>
        </div>

        <Card>
          <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-3">
            <CardTitle>Waste Reason Configuration</CardTitle>
            <select
              aria-label="Filter by category"
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-3 py-2 border border-input rounded-md bg-background text-sm"
            >
              <option value={FILTER_ALL}>All categories</option>
              <option value={FILTER_UNCATEGORIZED}>Uncategorized ({uncategorizedCount})</option>
              {wasteCategories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.category_name}
                </option>
              ))}
            </select>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            ) : visibleReasons.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">No waste reasons configured</p>
            ) : (
              <div className="space-y-3">
                {visibleReasons.map((reason) => (
                  <div
                    key={reason.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50"
                  >
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-medium">{reason.reason_name}</p>
                        {reason.waste_category_id ? (
                          <span className="rounded bg-muted px-2 py-0.5 text-xs">
                            {reason.waste_category_name ?? reason.waste_category_code}
                          </span>
                        ) : (
                          <span className="rounded bg-amber-100 px-2 py-0.5 text-xs text-amber-800 dark:bg-amber-900/40 dark:text-amber-200">
                            Uncategorized
                          </span>
                        )}
                        {reason.is_system && (
                          <span className="rounded border px-2 py-0.5 text-xs text-muted-foreground">System</span>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">{reason.description}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">Active</span>
                        <Switch checked={reason.is_active} disabled />
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(reason)}
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        aria-label={`Delete ${reason.reason_name}`}
                        disabled={reason.is_system}
                        title={reason.is_system ? "System reasons cannot be deleted" : undefined}
                        onClick={() => setDeleteConfirm(reason.id)}
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
              <DialogTitle>{editingItem ? "Edit Waste Reason" : "Add Waste Reason"}</DialogTitle>
              <DialogDescription>Configure waste reason details</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="reason_name">Reason Name</Label>
                <Input
                  id="reason_name"
                  placeholder="e.g., Expired"
                  value={formData.reason_name}
                  disabled={!!editingItem?.is_system}
                  onChange={(e) => setFormData({ ...formData, reason_name: e.target.value })}
                />
                {editingItem?.is_system && (
                  <p className="text-xs text-muted-foreground">System reasons are used by the app and cannot be renamed.</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="waste_category_id">Category</Label>
                <select
                  id="waste_category_id"
                  value={formData.waste_category_id}
                  onChange={(e) => setFormData({ ...formData, waste_category_id: e.target.value })}
                  className="w-full px-3 py-2 border border-input rounded-md bg-background"
                >
                  <option value="">Select a category</option>
                  {categoryOptions.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.category_name} ({c.code})
                    </option>
                  ))}
                </select>
                <p className="text-xs text-muted-foreground">
                  Changing the category only affects waste recorded from now on.
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  placeholder="e.g., Food has passed expiration time"
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
                Are you sure you want to delete this waste reason? This action cannot be undone.
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
