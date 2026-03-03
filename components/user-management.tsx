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
import { useToast } from '@/hooks/use-toast'
import { outlets } from '@/lib/mock-data'
import type { KitchenUser, AdminUser } from '@/lib/types'
import { Plus, Trash2, Edit2, Shield, Lock } from 'lucide-react'

export function UserManagement() {
  const { toast } = useToast()

  // Kitchen Users
  const [kitchenUsers, setKitchenUsers] = useState<KitchenUser[]>([
    { id: '1', name: 'Chef John', pin: '123456', outletIds: ['outlet-1'], status: 'active', createdAt: new Date('2024-01-15') },
    { id: '2', name: 'Chef Maria', pin: '567890', outletIds: ['outlet-2', 'outlet-3'], status: 'active', createdAt: new Date('2024-02-01') },
    { id: '3', name: 'Chef Alex', pin: '901234', outletIds: ['outlet-1', 'outlet-2'], status: 'active', createdAt: new Date('2024-02-20') },
  ])

  // Admin Users
  const [adminUsers, setAdminUsers] = useState<AdminUser[]>([
    { id: 'a1', name: 'Admin User', email: 'admin@sushi.com', role: 'admin', outletIds: ['outlet-1', 'outlet-2', 'outlet-3'], status: 'active', createdAt: new Date('2024-01-01') },
    { id: 'a2', name: 'Manager 1', email: 'manager1@sushi.com', role: 'manager', outletIds: ['outlet-1'], status: 'active', createdAt: new Date('2024-01-10') },
    { id: 'a3', name: 'Manager 2', email: 'manager2@sushi.com', role: 'manager', outletIds: ['outlet-2', 'outlet-3'], status: 'active', createdAt: new Date('2024-02-05') },
  ])

  // Kitchen User Form
  const [kitchenDialogOpen, setKitchenDialogOpen] = useState(false)
  const [editingKitchenUser, setEditingKitchenUser] = useState<KitchenUser | null>(null)
  const [kitchenFormData, setKitchenFormData] = useState({ name: '', pin: '', outletIds: ['outlet-1'] })

  // Admin User Form
  const [adminDialogOpen, setAdminDialogOpen] = useState(false)
  const [editingAdminUser, setEditingAdminUser] = useState<AdminUser | null>(null)
  const [adminFormData, setAdminFormData] = useState({ name: '', email: '', role: 'manager' as const, outletIds: ['outlet-1'] })

  // Kitchen User Handlers
  const handleAddKitchenUser = () => {
    setEditingKitchenUser(null)
    setKitchenFormData({ name: '', pin: '', outletIds: ['outlet-1'] })
    setKitchenDialogOpen(true)
  }

  const handleEditKitchenUser = (user: KitchenUser) => {
    setEditingKitchenUser(user)
    setKitchenFormData({ name: user.name, pin: user.pin, outletIds: user.outletIds })
    setKitchenDialogOpen(true)
  }

  const handleSaveKitchenUser = () => {
    if (!kitchenFormData.name || !kitchenFormData.pin) {
      toast({ title: 'Error', description: 'Please fill in all fields', variant: 'destructive' })
      return
    }

    if (kitchenFormData.pin.length !== 6 || !/^\d+$/.test(kitchenFormData.pin)) {
      toast({ title: 'Error', description: 'PIN must be 6 digits', variant: 'destructive' })
      return
    }

    if (kitchenFormData.outletIds.length === 0) {
      toast({ title: 'Error', description: 'Please select at least one outlet', variant: 'destructive' })
      return
    }

    if (editingKitchenUser) {
      setKitchenUsers(
        kitchenUsers.map((u) =>
          u.id === editingKitchenUser.id ? { ...u, ...kitchenFormData } : u
        )
      )
      toast({ title: 'Success', description: 'Kitchen user updated' })
    } else {
      setKitchenUsers([
        ...kitchenUsers,
        {
          id: `k-${Date.now()}`,
          ...kitchenFormData,
          status: 'active',
          createdAt: new Date(),
        },
      ])
      toast({ title: 'Success', description: 'Kitchen user added' })
    }
    setKitchenDialogOpen(false)
  }

  const handleDeleteKitchenUser = (userId: string) => {
    if (window.confirm('Are you sure?')) {
      setKitchenUsers(kitchenUsers.filter((u) => u.id !== userId))
      toast({ title: 'Success', description: 'Kitchen user deleted' })
    }
  }

  // Admin User Handlers
  const handleAddAdminUser = () => {
    setEditingAdminUser(null)
    setAdminFormData({ name: '', email: '', role: 'manager', outletIds: ['outlet-1'] })
    setAdminDialogOpen(true)
  }

  const handleEditAdminUser = (user: AdminUser) => {
    setEditingAdminUser(user)
    setAdminFormData({ name: user.name, email: user.email, role: user.role, outletIds: user.outletIds })
    setAdminDialogOpen(true)
  }

  const handleSaveAdminUser = () => {
    if (!adminFormData.name || !adminFormData.email) {
      toast({ title: 'Error', description: 'Please fill in all fields', variant: 'destructive' })
      return
    }

    if (!adminFormData.email.includes('@')) {
      toast({ title: 'Error', description: 'Please enter a valid email', variant: 'destructive' })
      return
    }

    if (adminFormData.outletIds.length === 0) {
      toast({ title: 'Error', description: 'Please select at least one outlet', variant: 'destructive' })
      return
    }

    if (editingAdminUser) {
      setAdminUsers(
        adminUsers.map((u) =>
          u.id === editingAdminUser.id ? { ...u, ...adminFormData } : u
        )
      )
      toast({ title: 'Success', description: 'Admin user updated' })
    } else {
      setAdminUsers([
        ...adminUsers,
        {
          id: `a-${Date.now()}`,
          ...adminFormData,
          status: 'active',
          createdAt: new Date(),
        },
      ])
      toast({ title: 'Success', description: 'Admin user added' })
    }
    setAdminDialogOpen(false)
  }

  const handleDeleteAdminUser = (userId: string) => {
    if (window.confirm('Are you sure?')) {
      setAdminUsers(adminUsers.filter((u) => u.id !== userId))
      toast({ title: 'Success', description: 'Admin user deleted' })
    }
  }

  const getOutletNames = (outletIds: string[]) => {
    return outletIds
      .map((id) => outlets.find((o) => o.id === id)?.name)
      .filter(Boolean)
      .join(', ')
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold">User Management</h1>
          <p className="text-muted-foreground mt-1">Manage kitchen staff and admin users</p>
        </div>

        {/* Kitchen Users Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Lock className="w-5 h-5 text-blue-600" />
              <h2 className="text-2xl font-bold">Kitchen Staff (PIN Login)</h2>
            </div>
            <Button onClick={handleAddKitchenUser}>
              <Plus className="w-4 h-4 mr-2" />
              Add Staff
            </Button>
          </div>

          <Card>
            <CardContent className="pt-6">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>PIN</TableHead>
                      <TableHead>Outlets</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead className="w-20">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {kitchenUsers.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                          No kitchen staff added yet
                        </TableCell>
                      </TableRow>
                    ) : (
                      kitchenUsers.map((user) => (
                        <TableRow key={user.id}>
                          <TableCell className="font-medium">{user.name}</TableCell>
                          <TableCell className="font-mono text-sm bg-muted px-2 py-1 rounded w-fit">•••• ({user.pin.length})</TableCell>
                          <TableCell className="text-sm">{getOutletNames(user.outletIds)}</TableCell>
                          <TableCell>
                            <span className={`text-xs px-2 py-1 rounded-full ${user.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                              {user.status}
                            </span>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">{user.createdAt.toLocaleDateString()}</TableCell>
                          <TableCell>
                            <div className="flex gap-1">
                              <Button variant="ghost" size="sm" onClick={() => handleEditKitchenUser(user)}>
                                <Edit2 className="w-4 h-4 text-blue-600" />
                              </Button>
                              <Button variant="ghost" size="sm" onClick={() => handleDeleteKitchenUser(user.id)}>
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
        </div>

        {/* Admin Users Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-purple-600" />
              <h2 className="text-2xl font-bold">Admin Users</h2>
            </div>
            <Button onClick={handleAddAdminUser}>
              <Plus className="w-4 h-4 mr-2" />
              Add Admin
            </Button>
          </div>

          <Card>
            <CardContent className="pt-6">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Outlets</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead className="w-20">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {adminUsers.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                          No admin users added yet
                        </TableCell>
                      </TableRow>
                    ) : (
                      adminUsers.map((user) => (
                        <TableRow key={user.id}>
                          <TableCell className="font-medium">{user.name}</TableCell>
                          <TableCell className="text-sm">{user.email}</TableCell>
                          <TableCell>
                            <span className={`text-xs px-2 py-1 rounded-full ${user.role === 'admin' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'}`}>
                              {user.role}
                            </span>
                          </TableCell>
                          <TableCell className="text-sm">{getOutletNames(user.outletIds)}</TableCell>
                          <TableCell>
                            <span className={`text-xs px-2 py-1 rounded-full ${user.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                              {user.status}
                            </span>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">{user.createdAt.toLocaleDateString()}</TableCell>
                          <TableCell>
                            <div className="flex gap-1">
                              <Button variant="ghost" size="sm" onClick={() => handleEditAdminUser(user)}>
                                <Edit2 className="w-4 h-4 text-blue-600" />
                              </Button>
                              <Button variant="ghost" size="sm" onClick={() => handleDeleteAdminUser(user.id)}>
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
        </div>

        {/* Kitchen User Dialog */}
        <Dialog open={kitchenDialogOpen} onOpenChange={setKitchenDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>{editingKitchenUser ? 'Edit Kitchen Staff' : 'Add Kitchen Staff'}</DialogTitle>
              <DialogDescription>
                {editingKitchenUser ? 'Update staff details' : 'Create new kitchen staff account'}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="k-name">Name</Label>
                <Input
                  id="k-name"
                  placeholder="Chef name"
                  value={kitchenFormData.name}
                  onChange={(e) => setKitchenFormData({ ...kitchenFormData, name: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="k-pin">PIN (4 digits)</Label>
                <Input
                  id="k-pin"
                  placeholder="1234"
                  maxLength={4}
                  value={kitchenFormData.pin}
                  onChange={(e) => setKitchenFormData({ ...kitchenFormData, pin: e.target.value.replace(/\D/g, '') })}
                />
              </div>
              <div>
                <Label>Access Outlets</Label>
                <div className="space-y-2 mt-2">
                  {outlets.map((outlet) => (
                    <div key={outlet.id} className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id={`k-outlet-${outlet.id}`}
                        checked={kitchenFormData.outletIds.includes(outlet.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setKitchenFormData({
                              ...kitchenFormData,
                              outletIds: [...kitchenFormData.outletIds, outlet.id],
                            })
                          } else {
                            setKitchenFormData({
                              ...kitchenFormData,
                              outletIds: kitchenFormData.outletIds.filter((id) => id !== outlet.id),
                            })
                          }
                        }}
                        className="w-4 h-4"
                      />
                      <label htmlFor={`k-outlet-${outlet.id}`} className="text-sm cursor-pointer">
                        {outlet.name}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setKitchenDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSaveKitchenUser}>
                {editingKitchenUser ? 'Update' : 'Add'} Staff
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Admin User Dialog */}
        <Dialog open={adminDialogOpen} onOpenChange={setAdminDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>{editingAdminUser ? 'Edit Admin User' : 'Add Admin User'}</DialogTitle>
              <DialogDescription>
                {editingAdminUser ? 'Update admin details' : 'Create new admin or manager account'}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="a-name">Name</Label>
                <Input
                  id="a-name"
                  placeholder="Full name"
                  value={adminFormData.name}
                  onChange={(e) => setAdminFormData({ ...adminFormData, name: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="a-email">Email</Label>
                <Input
                  id="a-email"
                  type="email"
                  placeholder="admin@sushi.com"
                  value={adminFormData.email}
                  onChange={(e) => setAdminFormData({ ...adminFormData, email: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="a-role">Role</Label>
                <select
                  id="a-role"
                  value={adminFormData.role}
                  onChange={(e) => setAdminFormData({ ...adminFormData, role: e.target.value as 'admin' | 'manager' })}
                  className="w-full px-3 py-2 border border-input rounded-md bg-background"
                >
                  <option value="manager">Manager</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div>
                <Label>Access Outlets</Label>
                <div className="space-y-2 mt-2">
                  {outlets.map((outlet) => (
                    <div key={outlet.id} className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id={`a-outlet-${outlet.id}`}
                        checked={adminFormData.outletIds.includes(outlet.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setAdminFormData({
                              ...adminFormData,
                              outletIds: [...adminFormData.outletIds, outlet.id],
                            })
                          } else {
                            setAdminFormData({
                              ...adminFormData,
                              outletIds: adminFormData.outletIds.filter((id) => id !== outlet.id),
                            })
                          }
                        }}
                        className="w-4 h-4"
                      />
                      <label htmlFor={`a-outlet-${outlet.id}`} className="text-sm cursor-pointer">
                        {outlet.name}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setAdminDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSaveAdminUser}>
                {editingAdminUser ? 'Update' : 'Add'} User
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
