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
import type { Outlet } from '@/lib/types'
import { outlets as initialOutlets } from '@/lib/mock-data'
import { Plus, Trash2, Edit2, MapPin } from 'lucide-react'

export function OutletManagement() {
  const { toast } = useToast()
  const [outlets, setOutlets] = useState<Outlet[]>(initialOutlets)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingOutlet, setEditingOutlet] = useState<Outlet | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    brand: '',
    location: '',
    code: '',
    isActive: true,
  })

  const handleAdd = () => {
    setEditingOutlet(null)
    setFormData({ name: '', brand: '', location: '', code: '', isActive: true })
    setDialogOpen(true)
  }

  const handleEdit = (outlet: Outlet) => {
    setEditingOutlet(outlet)
    setFormData({
      name: outlet.name,
      brand: outlet.brand,
      location: outlet.location,
      code: outlet.code,
      isActive: outlet.isActive,
    })
    setDialogOpen(true)
  }

  const handleSave = () => {
    if (!formData.name || !formData.brand || !formData.location || !formData.code) {
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

    if (editingOutlet) {
      setOutlets(
        outlets.map((outlet) =>
          outlet.id === editingOutlet.id
            ? { ...outlet, ...formData }
            : outlet
        )
      )
      toast({
        title: 'Success',
        description: 'Outlet updated successfully',
      })
    } else {
      const newOutlet: Outlet = {
        id: `outlet-${Date.now()}`,
        ...formData,
        createdAt: new Date(),
      }
      setOutlets([...outlets, newOutlet])
      toast({
        title: 'Success',
        description: 'Outlet added successfully',
      })
    }

    setDialogOpen(false)
  }

  const handleDelete = (outletId: string) => {
    if (window.confirm('Are you sure you want to delete this outlet?')) {
      setOutlets(outlets.filter((outlet) => outlet.id !== outletId))
      toast({
        title: 'Success',
        description: 'Outlet deleted successfully',
      })
    }
  }

  const handleToggleActive = (outletId: string) => {
    setOutlets(
      outlets.map((outlet) =>
        outlet.id === outletId
          ? { ...outlet, isActive: !outlet.isActive }
          : outlet
      )
    )
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold">Outlet Management</h1>
            <p className="text-muted-foreground mt-1">Manage all outlet locations and settings</p>
          </div>
          <Button onClick={handleAdd} size="lg">
            <Plus className="w-5 h-5 mr-2" />
            Add Outlet
          </Button>
        </div>

        {/* Outlets Table */}
        <Card>
          <CardHeader>
            <CardTitle>Active Outlets</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Code</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Brand</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="w-20">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {outlets.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                        No outlets found
                      </TableCell>
                    </TableRow>
                  ) : (
                    outlets.map((outlet) => (
                      <TableRow key={outlet.id}>
                        <TableCell className="font-semibold">{outlet.code}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <MapPin className="w-4 h-4 text-muted-foreground" />
                            {outlet.name}
                          </div>
                        </TableCell>
                        <TableCell>{outlet.brand}</TableCell>
                        <TableCell>{outlet.location}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Switch
                              checked={outlet.isActive}
                              onCheckedChange={() => handleToggleActive(outlet.id)}
                            />
                            <span className="text-sm text-muted-foreground">
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
                            >
                              <Edit2 className="w-4 h-4 text-blue-600" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(outlet.id)}
                            >
                              <Trash2 className="w-4 h-4 text-red-600" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
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
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Outlet Name</Label>
                <Input
                  id="name"
                  placeholder="e.g., Main Branch"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                />
              </div>
              <div>
                <Label htmlFor="brand">Brand</Label>
                <Input
                  id="brand"
                  placeholder="e.g., Sushi King"
                  value={formData.brand}
                  onChange={(e) =>
                    setFormData({ ...formData, brand: e.target.value })
                  }
                />
              </div>
              <div>
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  placeholder="e.g., Downtown"
                  value={formData.location}
                  onChange={(e) =>
                    setFormData({ ...formData, location: e.target.value })
                  }
                />
              </div>
              <div>
                <Label htmlFor="code">Code (max 5 chars)</Label>
                <Input
                  id="code"
                  placeholder="e.g., MB"
                  maxLength={5}
                  value={formData.code}
                  onChange={(e) =>
                    setFormData({ ...formData, code: e.target.value.toUpperCase() })
                  }
                />
              </div>
              <div className="flex items-center gap-3">
                <Switch
                  checked={formData.isActive}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, isActive: checked })
                  }
                />
                <Label>Active Status</Label>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSave}>
                {editingOutlet ? 'Update' : 'Add'} Outlet
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
