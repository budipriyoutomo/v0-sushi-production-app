"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useWasteReasons } from "@/hooks/use-waste-reasons"
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

export function WasteReasonsAdmin() {
  const { toast } = useToast()
  const { wasteReasons, isLoading, createWasteReason, updateWasteReason, deleteWasteReason } = useWasteReasons()
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<WasteReason | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const [formData, setFormData] = useState({
    reason_name: "",
    description: "",
    is_active: true,
  })

  const handleAdd = () => {
    setEditingItem(null)
    setFormData({ reason_name: "", description: "", is_active: true })
    setIsDialogOpen(true)
  }

  const handleEdit = (item: WasteReason) => {
    setEditingItem(item)
    setFormData({
      reason_name: item.reason_name,
      description: item.description,
      is_active: item.is_active,
    })
    setIsDialogOpen(true)
  }

  const handleSave = async () => {
    // Guard against double-clicks while a save is already in flight.
    if (isSaving) return

    if (!formData.reason_name) {
      toast({ title: "Error", description: "Please fill in all required fields", variant: "destructive" })
      return
    }

    setIsSaving(true)
    try {
      if (editingItem) {
        await updateWasteReason(editingItem.id, {
          reason_name: formData.reason_name,
          description: formData.description,
          is_active: formData.is_active,
        })
        toast({ title: "Updated", description: "Waste reason updated successfully" })
      } else {
        await createWasteReason({
          reason_name: formData.reason_name,
          description: formData.description,
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
          <CardHeader>
            <CardTitle>Waste Reason Configuration</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            ) : wasteReasons.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">No waste reasons configured</p>
            ) : (
              <div className="space-y-3">
                {wasteReasons.map((reason) => (
                  <div
                    key={reason.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50"
                  >
                    <div className="flex-1">
                      <p className="font-medium">{reason.reason_name}</p>
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
                  onChange={(e) => setFormData({ ...formData, reason_name: e.target.value })}
                />
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
