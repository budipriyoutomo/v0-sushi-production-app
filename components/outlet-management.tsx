'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Switch } from '@/components/ui/switch'
import { useToast } from '@/hooks/use-toast'
import { useOutlets } from '@/hooks/use-outlets'
import { getApiError } from '@/lib/api'
import type { Outlet } from '@/lib/types'
import { Plus, Trash2, Edit2, MapPin, Loader2 } from 'lucide-react'

export function OutletManagement() {
  const { toast } = useToast()
  const { outlets, isLoading, createOutlet, updateOutlet, deleteOutlet, toggleOutletStatus } = useOutlets()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingOutlet, setEditingOutlet] = useState<Outlet | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    brand: '',
    address: '',
    is_active: true,
  })

  const handleAdd = () => {
    setEditingOutlet(null)
    setFormData({ code: '', name: '', brand: '', address: '', is_active: true })
    setDialogOpen(true)
  }

  const handleEdit = (outlet: Outlet) => {
    setEditingOutlet(outlet)
    setFormData({
      code: outlet.code,
      name: outlet.name,
      brand: outlet.brand,
      address: outlet.address,
      is_active: outlet.isActive,
    })
    setDialogOpen(true)
  }

  const handleSave = async () => {
    if (!formData.name || !formData.brand || !formData.address || !formData.code) {
      toast({
        title: 'Error',
        description: 'Please fill in all required fields',
        variant: 'destructive',
      })
      return
    }

    if (formData.code.length > 5) {
      toast({
        title: 'Error',
        description: 'Code must be 5 characters or less',
        variant: 'destructive',
      })
      return
    }

    setIsSaving(true)
    try {
      if (editingOutlet) {
        await updateOutlet(editingOutlet.id, formData)
        toast({
          title: 'Success',
          description: 'Outlet updated successfully',
        })
      } else {
        await createOutlet(formData)
        toast({
          title: 'Success',
          description: 'Outlet added successfully',
        })
      }
      setDialogOpen(false)
    } catch (error) {
      const apiError = getApiError(error)
      toast({
        title: 'Error',
        description: apiError.message,
        variant: 'destructive',
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async (outletId: string) => {
    if (window.confirm('Are you sure you want to delete this outlet?')) {
      try {
        await deleteOutlet(outletId)
        toast({
          title: 'Success',
          description: 'Outlet deleted successfully',
        })
      } catch (error) {
        const apiError = getApiError(error)
        toast({
          title: 'Error',
          description: apiError.message,
          variant: 'destructive',
        })
      }
    }
  }

  const handleToggleActive = async (outletId: string) => {
    try {
      await toggleOutletStatus(outletId)
    } catch (error) {
      const apiError = getApiError(error)
      toast({
        title: 'Error',
        description: apiError.message,
        variant: 'destructive',
      })
    }
  }

  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-emerald-500/30 p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
              <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Colorplate System</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight">Outlet Management</h1>
            <p className="text-muted-foreground mt-0.5">Manage all outlet locations and settings</p>
          </div>
          <Button
            onClick={handleAdd}
            size="lg"
            className="bg-emerald-600 hover:bg-emerald-500 text-white border border-emerald-500/30 shadow-sm transition-all duration-200"
          >
            <Plus className="w-5 h-5 mr-2" />
            Add Outlet
          </Button>
        </div>

        {/* Outlets Table */}
        <Card className="shadow-sm">
          <CardHeader className="border-b">
            <CardTitle className="text-base font-semibold tracking-wide">Active Outlets</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-emerald-500" />
              </div>
            ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Code</TableHead>
                    <TableHead className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Name</TableHead>
                    <TableHead className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Brand</TableHead>
                    <TableHead className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Address</TableHead>
                    <TableHead className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Status</TableHead>
                    <TableHead className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Created</TableHead>
                    <TableHead className="w-20 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {outlets.length === 0 ? (
                    <TableRow className="hover:bg-transparent">
                      <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                        No outlets found
                      </TableCell>
                    </TableRow>
                  ) : (
                    outlets.map((outlet) => (
                      <TableRow key={outlet.id} className="hover:bg-muted/50 transition-colors">
                        <TableCell className="font-semibold">{outlet.code}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <MapPin className="w-4 h-4 text-emerald-500/70" />
                            {outlet.name}
                          </div>
                        </TableCell>
                        <TableCell>{outlet.brand}</TableCell>
                        <TableCell className="text-muted-foreground">{outlet.address}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Switch
                              checked={outlet.isActive}
                              onCheckedChange={() => handleToggleActive(outlet.id)}
                              className="data-[state=checked]:bg-emerald-500"
                            />
                            <span className={`text-xs font-medium ${outlet.isActive ? 'text-emerald-600 dark:text-emerald-400' : 'text-muted-foreground'}`}>
                              {outlet.isActive ? 'Active' : 'Inactive'}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {outlet.createdAt.toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEdit(outlet)}
                              className="text-muted-foreground hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-500/10"
                            >
                              <Edit2 className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(outlet.id)}
                              className="text-muted-foreground hover:text-red-600 dark:hover:text-red-400 hover:bg-red-500/10"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
            )}
          </CardContent>
        </Card>

        {/* Dialog */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingOutlet ? 'Edit Outlet' : 'Add New Outlet'}</DialogTitle>
              <DialogDescription>
                {editingOutlet
                  ? 'Update the outlet details'
                  : 'Create a new outlet location'}
              </DialogDescription>
            </DialogHeader>
    <div className="grid gap-4 py-4">

      <div className="grid gap-2">
        <Label htmlFor="name">Outlet Name</Label>
        <Input
          id="name"
          placeholder="Main Branch"
          value={formData.name}
          onChange={(e) =>
            setFormData({ ...formData, name: e.target.value })
          }
          className="focus-visible:ring-emerald-500/40"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="grid gap-2">
          <Label htmlFor="brand">Brand</Label>
          <Input
            id="brand"
            placeholder="Sushi King"
            value={formData.brand}
            onChange={(e) =>
              setFormData({ ...formData, brand: e.target.value })
            }
            className="focus-visible:ring-emerald-500/40"
          />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="code">Outlet Code</Label>
          <Input
            id="code"
            maxLength={5}
            placeholder="STPVJ"
            value={formData.code}
            onChange={(e) =>
              setFormData({
                ...formData,
                code: e.target.value.toUpperCase()
              })
            }
            className="focus-visible:ring-emerald-500/40"
          />
        </div>
      </div>

      <div className="grid gap-2">
        <Label htmlFor="address">Address</Label>
        <Input
          id="address"
          placeholder="Paris Van Java, Bandung"
          value={formData.address}
          onChange={(e) =>
            setFormData({ ...formData, address: e.target.value })
          }
          className="focus-visible:ring-emerald-500/40"
        />
      </div>

      <div className="flex items-center justify-between rounded-md border bg-muted/40 p-3">
        <Label className="text-sm">Active Outlet</Label>
        <Switch
          checked={formData.is_active}
          onCheckedChange={(checked) =>
            setFormData({ ...formData, is_active: checked })
          }
          className="data-[state=checked]:bg-emerald-500"
        />
      </div>
    </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={isSaving}>
                Cancel
              </Button>
              <Button
                onClick={handleSave}
                disabled={isSaving}
                className="bg-emerald-600 hover:bg-emerald-500 text-white border border-emerald-500/30"
              >
                {isSaving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {editingOutlet ? 'Update' : 'Add'} Outlet
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
