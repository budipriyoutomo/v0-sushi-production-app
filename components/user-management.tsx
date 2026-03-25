'use client'

import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
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
import { useUsers } from '@/hooks/use-users'
import type { User, UserRole } from '@/lib/types'
import { Plus, Trash2, Edit2, Shield, Lock, Loader2 } from 'lucide-react'

const EMPTY_KITCHEN_FORM = { name: '', username: '', password: '', pin: '' }
const EMPTY_ADMIN_FORM = { name: '', email: '', username: '', password: '', role: 'manager' as UserRole }

export function UserManagement() {
  const { toast } = useToast()
  const { users, isLoading, createUser, updateUser, deleteUser, toggleUserStatus } = useUsers()

  const kitchenUsers = users.filter((u) => u.role === 'kitchen')
  const adminUsers = users.filter((u) => u.role !== 'kitchen')

  // Kitchen User Form
  const [kitchenDialogOpen, setKitchenDialogOpen] = useState(false)
  const [editingKitchenUser, setEditingKitchenUser] = useState<User | null>(null)
  const [kitchenFormData, setKitchenFormData] = useState(EMPTY_KITCHEN_FORM)
  const [kitchenSaving, setKitchenSaving] = useState(false)

  // Admin User Form
  const [adminDialogOpen, setAdminDialogOpen] = useState(false)
  const [editingAdminUser, setEditingAdminUser] = useState<User | null>(null)
  const [adminFormData, setAdminFormData] = useState(EMPTY_ADMIN_FORM)
  const [adminSaving, setAdminSaving] = useState(false)

  // Kitchen User Handlers
  const handleAddKitchenUser = () => {
    setEditingKitchenUser(null)
    setKitchenFormData(EMPTY_KITCHEN_FORM)
    setKitchenDialogOpen(true)
  }

  const handleEditKitchenUser = (user: User) => {
    setEditingKitchenUser(user)
    setKitchenFormData({ name: user.name, username: user.username || '', password: '', pin: '' })
    setKitchenDialogOpen(true)
  }

  const handleSaveKitchenUser = async () => {
    if (!kitchenFormData.name || !kitchenFormData.username) {
      toast({ title: 'Error', description: 'Please fill in name and username', variant: 'destructive' })
      return
    }
    if (!editingKitchenUser && !kitchenFormData.password) {
      toast({ title: 'Error', description: 'Password is required for new users', variant: 'destructive' })
      return
    }

    setKitchenSaving(true)
    try {
      if (editingKitchenUser) {
        await updateUser(editingKitchenUser.id, {
          name: kitchenFormData.name,
          username: kitchenFormData.username,
          ...(kitchenFormData.password && { password: kitchenFormData.password }),
          ...(kitchenFormData.pin && { pin: kitchenFormData.pin }),
        })
        toast({ title: 'Success', description: 'Kitchen user updated' })
      } else {
        await createUser({
          name: kitchenFormData.name,
          username: kitchenFormData.username,
          password: kitchenFormData.password,
          role: 'kitchen',
          ...(kitchenFormData.pin && { pin: kitchenFormData.pin }),
        })
        toast({ title: 'Success', description: 'Kitchen user added' })
      }
      setKitchenDialogOpen(false)
    } catch {
      toast({ title: 'Error', description: 'Failed to save user', variant: 'destructive' })
    } finally {
      setKitchenSaving(false)
    }
  }

  const handleDeleteKitchenUser = async (userId: string) => {
    if (!window.confirm('Are you sure you want to delete this user?')) return
    try {
      await deleteUser(userId)
      toast({ title: 'Success', description: 'Kitchen user deleted' })
    } catch {
      toast({ title: 'Error', description: 'Failed to delete user', variant: 'destructive' })
    }
  }

  // Admin User Handlers
  const handleAddAdminUser = () => {
    setEditingAdminUser(null)
    setAdminFormData(EMPTY_ADMIN_FORM)
    setAdminDialogOpen(true)
  }

  const handleEditAdminUser = (user: User) => {
    setEditingAdminUser(user)
    setAdminFormData({
      name: user.name,
      email: user.email,
      username: user.username || '',
      password: '',
      role: user.role as UserRole,
    })
    setAdminDialogOpen(true)
  }

  const handleSaveAdminUser = async () => {
    if (!adminFormData.name || !adminFormData.email) {
      toast({ title: 'Error', description: 'Please fill in name and email', variant: 'destructive' })
      return
    }
    if (!adminFormData.email.includes('@')) {
      toast({ title: 'Error', description: 'Please enter a valid email', variant: 'destructive' })
      return
    }
    if (!editingAdminUser && !adminFormData.password) {
      toast({ title: 'Error', description: 'Password is required for new users', variant: 'destructive' })
      return
    }

    setAdminSaving(true)
    try {
      if (editingAdminUser) {
        await updateUser(editingAdminUser.id, {
          name: adminFormData.name,
          email: adminFormData.email,
          username: adminFormData.username,
          role: adminFormData.role,
          ...(adminFormData.password && { password: adminFormData.password }),
        })
        toast({ title: 'Success', description: 'Admin user updated' })
      } else {
        await createUser({
          name: adminFormData.name,
          email: adminFormData.email,
          username: adminFormData.username,
          password: adminFormData.password,
          role: adminFormData.role,
        })
        toast({ title: 'Success', description: 'Admin user added' })
      }
      setAdminDialogOpen(false)
    } catch {
      toast({ title: 'Error', description: 'Failed to save user', variant: 'destructive' })
    } finally {
      setAdminSaving(false)
    }
  }

  const handleDeleteAdminUser = async (userId: string) => {
    if (!window.confirm('Are you sure you want to delete this user?')) return
    try {
      await deleteUser(userId)
      toast({ title: 'Success', description: 'Admin user deleted' })
    } catch {
      toast({ title: 'Error', description: 'Failed to delete user', variant: 'destructive' })
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    )
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
                      <TableHead>Username</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead className="w-20">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {kitchenUsers.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                          No kitchen staff found
                        </TableCell>
                      </TableRow>
                    ) : (
                      kitchenUsers.map((user) => (
                        <TableRow key={user.id}>
                          <TableCell className="font-medium">{user.name}</TableCell>
                          <TableCell className="text-sm text-muted-foreground">{user.username || '-'}</TableCell>
                          <TableCell>
                            <span className="text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-800">
                              {user.role}
                            </span>
                          </TableCell>
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
                      <TableHead>Username</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead className="w-20">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {adminUsers.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                          No admin users found
                        </TableCell>
                      </TableRow>
                    ) : (
                      adminUsers.map((user) => (
                        <TableRow key={user.id}>
                          <TableCell className="font-medium">{user.name}</TableCell>
                          <TableCell className="text-sm">{user.email}</TableCell>
                          <TableCell className="text-sm text-muted-foreground">{user.username || '-'}</TableCell>
                          <TableCell>
                            <span className={`text-xs px-2 py-1 rounded-full ${user.role === 'admin' || user.role === 'administrator' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'}`}>
                              {user.role}
                            </span>
                          </TableCell>
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
                <Label htmlFor="k-username">Username</Label>
                <Input
                  id="k-username"
                  placeholder="username"
                  value={kitchenFormData.username}
                  onChange={(e) => setKitchenFormData({ ...kitchenFormData, username: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="k-password">
                  Password {editingKitchenUser && <span className="text-muted-foreground text-xs">(leave blank to keep current)</span>}
                </Label>
                <Input
                  id="k-password"
                  type="password"
                  placeholder="••••••••"
                  value={kitchenFormData.password}
                  onChange={(e) => setKitchenFormData({ ...kitchenFormData, password: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="k-pin">
                  PIN {editingKitchenUser && <span className="text-muted-foreground text-xs">(leave blank to keep current)</span>}
                </Label>
                <Input
                  id="k-pin"
                  placeholder="4–6 digit PIN"
                  maxLength={6}
                  value={kitchenFormData.pin}
                  onChange={(e) => setKitchenFormData({ ...kitchenFormData, pin: e.target.value.replace(/\D/g, '') })}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setKitchenDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSaveKitchenUser} disabled={kitchenSaving}>
                {kitchenSaving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
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
                  placeholder="admin@example.com"
                  value={adminFormData.email}
                  onChange={(e) => setAdminFormData({ ...adminFormData, email: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="a-username">Username</Label>
                <Input
                  id="a-username"
                  placeholder="username"
                  value={adminFormData.username}
                  onChange={(e) => setAdminFormData({ ...adminFormData, username: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="a-password">
                  Password {editingAdminUser && <span className="text-muted-foreground text-xs">(leave blank to keep current)</span>}
                </Label>
                <Input
                  id="a-password"
                  type="password"
                  placeholder="••••••••"
                  value={adminFormData.password}
                  onChange={(e) => setAdminFormData({ ...adminFormData, password: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="a-role">Role</Label>
                <select
                  id="a-role"
                  value={adminFormData.role}
                  onChange={(e) => setAdminFormData({ ...adminFormData, role: e.target.value as UserRole })}
                  className="w-full px-3 py-2 border border-input rounded-md bg-background"
                >
                  <option value="manager">Manager</option>
                  <option value="admin">Admin</option>
                  <option value="operation">Operation</option>
                  <option value="production">Production</option>
                </select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setAdminDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSaveAdminUser} disabled={adminSaving}>
                {adminSaving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {editingAdminUser ? 'Update' : 'Add'} User
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
