'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
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
import { Plus, Trash2, Edit2, Shield, Lock } from 'lucide-react'

interface KitchenUser {
  id: string
  name: string
  pin: string
  outlet: string
  status: 'active' | 'inactive'
  createdAt: Date
}

interface AdminUser {
  id: string
  name: string
  email: string
  role: 'admin' | 'manager'
  outlet: string
  status: 'active' | 'inactive'
  createdAt: Date
}

export function UserManagement() {
  const { toast } = useToast()

  // Kitchen Users
  const [kitchenUsers, setKitchenUsers] = useState<KitchenUser[]>([
    { id: '1', name: 'Chef John', pin: '1234', outlet: 'Main Branch', status: 'active', createdAt: new Date('2024-01-15') },
    { id: '2', name: 'Chef Maria', pin: '5678', outlet: 'Mall Branch', status: 'active', createdAt: new Date('2024-02-01') },
    { id: '3', name: 'Chef Alex', pin: '9012', outlet: 'Airport Branch', status: 'active', createdAt: new Date('2024-02-20') },
  ])

  // Admin Users
  const [adminUsers, setAdminUsers] = useState<AdminUser[]>([
    { id: 'a1', name: 'Admin User', email: 'admin@sushi.com', role: 'admin', outlet: 'All', status: 'active', createdAt: new Date('2024-01-01') },
    { id: 'a2', name: 'Manager 1', email: 'manager1@sushi.com', role: 'manager', outlet: 'Main Branch', status: 'active', createdAt: new Date('2024-01-10') },
    { id: 'a3', name: 'Manager 2', email: 'manager2@sushi.com', role: 'manager', outlet: 'Mall Branch', status: 'active', createdAt: new Date('2024-02-05') },
  ])

  // Kitchen User Form
  const [kitchenDialogOpen, setKitchenDialogOpen] = useState(false)
  const [editingKitchenUser, setEditingKitchenUser] = useState<KitchenUser | null>(null)
  const [kitchenFormData, setKitchenFormData] = useState({ name: '', pin: '', outlet: 'Main Branch' })

  // Admin User Form
  const [adminDialogOpen, setAdminDialogOpen] = useState(false)
  const [editingAdminUser, setEditingAdminUser] = useState<AdminUser | null>(null)
  const [adminFormData, setAdminFormData] = useState({ name: '', email: '', role: 'manager' as const, outlet: 'Main Branch' })

  // Kitchen User Handlers
  const handleAddKitchenUser = () => {
    setEditingKitchenUser(null)
    setKitchenFormData({ name: '', pin: '', outlet: 'Main Branch' })
    setKitchenDialogOpen(true)
  }

  const handleEditKitchenUser = (user: KitchenUser) => {
    setEditingKitchenUser(user)
    setKitchenFormData({ name: user.name, pin: user.pin, outlet: user.outlet })
    setKitchenDialogOpen(true)
  }

  const handleSaveKitchenUser = () => {
    if (!kitchenFormData.name || !kitchenFormData.pin) {
      toast({ title: 'Error', description: 'Please fill in all fields', variant: 'destructive' })
      return
    }

    if (kitchenFormData.pin.length !== 4 || !/^\d+$/.test(kitchenFormData.pin)) {
      toast({ title: 'Error', description: 'PIN must be 4 digits', variant: 'destructive' })
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
          id: Date.now().toString(),
          ...kitchenFormData,
          status: 'active',
          createdAt: new Date(),
        },
      ])
      toast({ title: 'Success', description: 'Kitchen user added' })
    }
    setKitchenDialogOpen(false)
  }

  const handleDeleteKitchenUser = (id: string) => {
    setKitchenUsers(kitchenUsers.filter((u) => u.id !== id))
    toast({ title: 'Deleted', description: 'Kitchen user removed' })
  }

  // Admin User Handlers
  const handleAddAdminUser = () => {
    setEditingAdminUser(null)
    setAdminFormData({ name: '', email: '', role: 'manager', outlet: 'Main Branch' })
    setAdminDialogOpen(true)
  }

  const handleEditAdminUser = (user: AdminUser) => {
    setEditingAdminUser(user)
    setAdminFormData({ name: user.name, email: user.email, role: user.role, outlet: user.outlet })
    setAdminDialogOpen(true)
  }

  const handleSaveAdminUser = () => {
    if (!adminFormData.name || !adminFormData.email) {
      toast({ title: 'Error', description: 'Please fill in all fields', variant: 'destructive' })
      return
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(adminFormData.email)) {
      toast({ title: 'Error', description: 'Invalid email format', variant: 'destructive' })
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
          id: 'a' + Date.now().toString(),
          ...adminFormData,
          status: 'active',
          createdAt: new Date(),
        },
      ])
      toast({ title: 'Success', description: 'Admin user added' })
    }
    setAdminDialogOpen(false)
  }

  const handleDeleteAdminUser = (id: string) => {
    setAdminUsers(adminUsers.filter((u) => u.id !== id))
    toast({ title: 'Deleted', description: 'Admin user removed' })
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl md:text-4xl font-bold">User Management</h1>
          <p className="text-muted-foreground mt-1">Manage kitchen staff and admin users</p>
        </div>

        {/* Kitchen Users Section */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Lock className="w-5 h-5" />
                Kitchen Staff (PIN-based)
              </CardTitle>
              <CardDescription>Manage kitchen user accounts with PIN access</CardDescription>
            </div>
            <Button onClick={handleAddKitchenUser} size="sm">
              <Plus className="w-4 h-4 mr-2" />
              Add User
            </Button>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>PIN</TableHead>
                    <TableHead>Outlet</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {kitchenUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">{user.name}</TableCell>
                      <TableCell className="font-mono">••••</TableCell>
                      <TableCell>{user.outlet}</TableCell>
                      <TableCell>
                        <span className="inline-flex items-center rounded-full px-3 py-1 text-xs font-medium bg-green-100 text-green-800">
                          {user.status}
                        </span>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {user.createdAt.toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditKitchenUser(user)}
                          >
                            <Edit2 className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteKitchenUser(user.id)}
                          >
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Admin Users Section */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5" />
                Admin Users
              </CardTitle>
              <CardDescription>Manage administrator and manager accounts</CardDescription>
            </div>
            <Button onClick={handleAddAdminUser} size="sm">
              <Plus className="w-4 h-4 mr-2" />
              Add User
            </Button>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Outlet</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {adminUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">{user.name}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>
                        <span className="inline-flex items-center rounded-full px-3 py-1 text-xs font-medium bg-blue-100 text-blue-800">
                          {user.role}
                        </span>
                      </TableCell>
                      <TableCell>{user.outlet}</TableCell>
                      <TableCell>
                        <span className="inline-flex items-center rounded-full px-3 py-1 text-xs font-medium bg-green-100 text-green-800">
                          {user.status}
                        </span>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {user.createdAt.toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditAdminUser(user)}
                          >
                            <Edit2 className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteAdminUser(user.id)}
                          >
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Kitchen User Dialog */}
        <Dialog open={kitchenDialogOpen} onOpenChange={setKitchenDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingKitchenUser ? 'Edit Kitchen User' : 'Add Kitchen User'}
              </DialogTitle>
              <DialogDescription>
                {editingKitchenUser
                  ? 'Update the kitchen staff account details'
                  : 'Create a new kitchen staff account'}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="kitchen-name">Name</Label>
                <Input
                  id="kitchen-name"
                  value={kitchenFormData.name}
                  onChange={(e) =>
                    setKitchenFormData({ ...kitchenFormData, name: e.target.value })
                  }
                  placeholder="Chef name"
                />
              </div>
              <div>
                <Label htmlFor="kitchen-pin">PIN (4 digits)</Label>
                <Input
                  id="kitchen-pin"
                  type="password"
                  value={kitchenFormData.pin}
                  onChange={(e) =>
                    setKitchenFormData({ ...kitchenFormData, pin: e.target.value })
                  }
                  placeholder="1234"
                  maxLength={4}
                />
              </div>
              <div>
                <Label htmlFor="kitchen-outlet">Outlet</Label>
                <Input
                  id="kitchen-outlet"
                  value={kitchenFormData.outlet}
                  onChange={(e) =>
                    setKitchenFormData({ ...kitchenFormData, outlet: e.target.value })
                  }
                  placeholder="Outlet name"
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setKitchenDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button onClick={handleSaveKitchenUser}>Save</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Admin User Dialog */}
        <Dialog open={adminDialogOpen} onOpenChange={setAdminDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingAdminUser ? 'Edit Admin User' : 'Add Admin User'}
              </DialogTitle>
              <DialogDescription>
                {editingAdminUser
                  ? 'Update the admin user account details'
                  : 'Create a new admin user account'}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="admin-name">Name</Label>
                <Input
                  id="admin-name"
                  value={adminFormData.name}
                  onChange={(e) =>
                    setAdminFormData({ ...adminFormData, name: e.target.value })
                  }
                  placeholder="User name"
                />
              </div>
              <div>
                <Label htmlFor="admin-email">Email</Label>
                <Input
                  id="admin-email"
                  type="email"
                  value={adminFormData.email}
                  onChange={(e) =>
                    setAdminFormData({ ...adminFormData, email: e.target.value })
                  }
                  placeholder="user@example.com"
                />
              </div>
              <div>
                <Label htmlFor="admin-role">Role</Label>
                <select
                  id="admin-role"
                  value={adminFormData.role}
                  onChange={(e) =>
                    setAdminFormData({
                      ...adminFormData,
                      role: e.target.value as 'admin' | 'manager',
                    })
                  }
                  className="w-full px-3 py-2 border rounded-md bg-background"
                >
                  <option value="manager">Manager</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div>
                <Label htmlFor="admin-outlet">Outlet</Label>
                <Input
                  id="admin-outlet"
                  value={adminFormData.outlet}
                  onChange={(e) =>
                    setAdminFormData({ ...adminFormData, outlet: e.target.value })
                  }
                  placeholder="Outlet name"
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setAdminDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button onClick={handleSaveAdminUser}>Save</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
