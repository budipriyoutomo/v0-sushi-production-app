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
import { useOutlets } from '@/hooks/use-outlets'
import { getApiError } from '@/lib/api'
import {
  MODULE_APPS,
  MODULE_APP_LABELS,
  USER_ROLE_LABELS,
  type ModuleApp,
} from '@/lib/constants/access'
import type { User, UserRole } from '@/lib/types'
import { Plus, Trash2, Edit2, Shield, Lock, Loader2, KeyRound } from 'lucide-react'

/**
 * PIN minimal 6 digit — sama dengan aturan backend (`/login-pin` dan
 * `UserController` sama-sama meminta `min:6`). Form ini dulu menjanjikan
 * "4–6 digit", jadi PIN 4 digit bisa diketik lalu ditolak 422 tanpa penjelasan.
 */
const PIN_LENGTH = 6

/**
 * `outlet` dan `module_app` wajib diisi.
 *
 * Backend menerima keduanya null, tapi user tanpa modul tidak bisa membuka
 * halaman apa pun dan user tanpa outlet tidak melihat data apa pun. Form ini
 * dulu tidak mengirim keduanya sama sekali — setiap akun yang dibuat dari sini
 * lahir dalam keadaan itu.
 */
const EMPTY_KITCHEN_FORM = {
  name: '',
  email: '',
  password: '',
  pin: '',
  departemen: '',
  outlet: [] as string[],
  module_app: ['app', 'kitchen'] as string[],
}

const EMPTY_ADMIN_FORM = {
  name: '',
  email: '',
  password: '',
  role: 'manager' as UserRole,
  departemen: '',
  outlet: [] as string[],
  module_app: ['app'] as string[],
}

const ADMIN_ROLE_OPTIONS: UserRole[] = ['manager', 'admin', 'operation', 'production', 'service']

function toggleInList(list: string[], value: string): string[] {
  return list.includes(value) ? list.filter((v) => v !== value) : [...list, value]
}

/** Ringkasan array untuk sel tabel; menghindari baris yang melebar tak terkendali. */
function summarize(values: string[] | undefined, emptyLabel: string): string {
  if (!values || values.length === 0) return emptyLabel
  if (values.length <= 2) return values.join(', ')
  return `${values.slice(0, 2).join(', ')} +${values.length - 2}`
}

interface CheckboxGroupProps {
  legend: string
  options: Array<{ value: string; label: string }>
  selected: string[]
  onToggle: (value: string) => void
  emptyHint?: string
}

function CheckboxGroup({ legend, options, selected, onToggle, emptyHint }: CheckboxGroupProps) {
  return (
    <fieldset className="space-y-2">
      <legend className="text-sm font-medium">{legend}</legend>
      {options.length === 0 ? (
        <p className="text-xs text-muted-foreground">{emptyHint}</p>
      ) : (
        <div className="grid grid-cols-2 gap-1 rounded-md border border-input p-2 max-h-40 overflow-y-auto">
          {options.map((option) => (
            <label
              key={option.value}
              className="flex items-center gap-2 text-sm cursor-pointer py-0.5"
            >
              <input
                type="checkbox"
                className="h-4 w-4"
                checked={selected.includes(option.value)}
                onChange={() => onToggle(option.value)}
              />
              {option.label}
            </label>
          ))}
        </div>
      )}
    </fieldset>
  )
}

export function UserManagement() {
  const { toast } = useToast()
  const { users, isLoading, createUser, updateUser, deleteUser } = useUsers()
  const { outlets } = useOutlets()

  const kitchenUsers = users.filter((u) => u.role === 'kitchen')
  const adminUsers = users.filter((u) => u.role !== 'kitchen')

  const outletOptions = outlets.map((o) => ({ value: o.code, label: `${o.name} (${o.code})` }))
  const moduleOptions = MODULE_APPS.map((m) => ({ value: m, label: MODULE_APP_LABELS[m] }))

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

  /**
   * Pemeriksaan yang sama untuk kedua form. Mengembalikan pesan error pertama,
   * atau null kalau lolos.
   */
  const validateForm = (
    form: { name: string; email: string; password: string; outlet: string[]; module_app: string[]; pin?: string },
    isEditing: boolean
  ): string | null => {
    if (!form.name || !form.email) return 'Please fill in name and email'
    if (!form.email.includes('@')) return 'Please enter a valid email'
    if (!isEditing && !form.password) return 'Password is required for new users'
    if (form.outlet.length === 0) return 'Pick at least one outlet'
    if (form.module_app.length === 0) return 'Pick at least one module'
    if (form.pin && form.pin.length < PIN_LENGTH) return `PIN must be ${PIN_LENGTH} digits`
    return null
  }

  // Kitchen User Handlers
  const handleAddKitchenUser = () => {
    setEditingKitchenUser(null)
    setKitchenFormData(EMPTY_KITCHEN_FORM)
    setKitchenDialogOpen(true)
  }

  const handleEditKitchenUser = (user: User) => {
    setEditingKitchenUser(user)
    setKitchenFormData({
      name: user.name,
      email: user.email || '',
      password: '',
      pin: '',
      departemen: user.departemen || '',
      outlet: user.outlet ?? [],
      module_app: user.module_app ?? [],
    })
    setKitchenDialogOpen(true)
  }

  const handleSaveKitchenUser = async () => {
    // Guard against double-clicks while a save is already in flight.
    if (kitchenSaving) return

    const error = validateForm(kitchenFormData, Boolean(editingKitchenUser))
    if (error) {
      toast({ title: 'Error', description: error, variant: 'destructive' })
      return
    }

    setKitchenSaving(true)
    try {
      const shared = {
        name: kitchenFormData.name,
        email: kitchenFormData.email,
        outlet: kitchenFormData.outlet,
        module_app: kitchenFormData.module_app,
        ...(kitchenFormData.departemen && { departemen: kitchenFormData.departemen }),
        ...(kitchenFormData.password && { password: kitchenFormData.password }),
        ...(kitchenFormData.pin && { pin: kitchenFormData.pin }),
      }

      if (editingKitchenUser) {
        await updateUser(editingKitchenUser.id, shared)
        toast({ title: 'Success', description: 'Kitchen user updated' })
      } else {
        await createUser({ ...shared, password: kitchenFormData.password, role: 'kitchen' })
        toast({ title: 'Success', description: 'Kitchen user added' })
      }
      setKitchenDialogOpen(false)
    } catch (error) {
      toast({ title: 'Error', description: getApiError(error).message, variant: 'destructive' })
    } finally {
      setKitchenSaving(false)
    }
  }

  const handleDeleteKitchenUser = async (userId: string) => {
    if (!window.confirm('Are you sure you want to delete this user?')) return
    try {
      await deleteUser(userId)
      toast({ title: 'Success', description: 'Kitchen user deleted' })
    } catch (error) {
      toast({ title: 'Error', description: getApiError(error).message, variant: 'destructive' })
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
      email: user.email || '',
      password: '',
      role: (user.role as UserRole) || 'manager',
      departemen: user.departemen || '',
      outlet: user.outlet ?? [],
      module_app: user.module_app ?? [],
    })
    setAdminDialogOpen(true)
  }

  const handleSaveAdminUser = async () => {
    // Guard against double-clicks while a save is already in flight.
    if (adminSaving) return

    const error = validateForm(adminFormData, Boolean(editingAdminUser))
    if (error) {
      toast({ title: 'Error', description: error, variant: 'destructive' })
      return
    }

    setAdminSaving(true)
    try {
      const shared = {
        name: adminFormData.name,
        email: adminFormData.email,
        role: adminFormData.role,
        outlet: adminFormData.outlet,
        module_app: adminFormData.module_app,
        ...(adminFormData.departemen && { departemen: adminFormData.departemen }),
        ...(adminFormData.password && { password: adminFormData.password }),
      }

      if (editingAdminUser) {
        await updateUser(editingAdminUser.id, shared)
        toast({ title: 'Success', description: 'Admin user updated' })
      } else {
        await createUser({ ...shared, password: adminFormData.password })
        toast({ title: 'Success', description: 'Admin user added' })
      }
      setAdminDialogOpen(false)
    } catch (error) {
      toast({ title: 'Error', description: getApiError(error).message, variant: 'destructive' })
    } finally {
      setAdminSaving(false)
    }
  }

  const handleDeleteAdminUser = async (userId: string) => {
    if (!window.confirm('Are you sure you want to delete this user?')) return
    try {
      await deleteUser(userId)
      toast({ title: 'Success', description: 'Admin user deleted' })
    } catch (error) {
      toast({ title: 'Error', description: getApiError(error).message, variant: 'destructive' })
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
                      <TableHead>Email</TableHead>
                      <TableHead>PIN</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Outlet</TableHead>
                      <TableHead>Modules</TableHead>
                      <TableHead className="w-20">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {kitchenUsers.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                          No kitchen staff found
                        </TableCell>
                      </TableRow>
                    ) : (
                      kitchenUsers.map((user) => (
                        <TableRow key={user.id}>
                          <TableCell className="font-medium">{user.name}</TableCell>
                          <TableCell className="text-sm text-muted-foreground">{user.email || '-'}</TableCell>
                          <TableCell>
                            {user.hasPin ? (
                              <span className="inline-flex items-center gap-1 text-xs text-emerald-700">
                                <KeyRound className="w-3 h-3" /> Set
                              </span>
                            ) : (
                              <span className="text-xs text-muted-foreground">—</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <span className="text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-800">
                              {user.role}
                            </span>
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground">
                            {summarize(user.outlet, 'No outlet')}
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground">
                            {summarize(user.module_app, 'No module')}
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
                      <TableHead>Role</TableHead>
                      <TableHead>Outlet</TableHead>
                      <TableHead>Modules</TableHead>
                      <TableHead className="w-20">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {adminUsers.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                          No admin users found
                        </TableCell>
                      </TableRow>
                    ) : (
                      adminUsers.map((user) => (
                        <TableRow key={user.id}>
                          <TableCell className="font-medium">{user.name}</TableCell>
                          <TableCell className="text-sm">{user.email || '-'}</TableCell>
                          <TableCell>
                            <span className={`text-xs px-2 py-1 rounded-full ${user.role === 'admin' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'}`}>
                              {user.role}
                            </span>
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground">
                            {summarize(user.outlet, 'No outlet')}
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground">
                            {summarize(user.module_app, 'No module')}
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
          <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
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
                <Label htmlFor="k-email">Email</Label>
                <Input
                  id="k-email"
                  type="email"
                  placeholder="chef@example.com"
                  value={kitchenFormData.email}
                  onChange={(e) => setKitchenFormData({ ...kitchenFormData, email: e.target.value })}
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
                  inputMode="numeric"
                  placeholder={`${PIN_LENGTH} digit PIN`}
                  maxLength={PIN_LENGTH}
                  value={kitchenFormData.pin}
                  onChange={(e) =>
                    setKitchenFormData({ ...kitchenFormData, pin: e.target.value.replace(/\D/g, '') })
                  }
                />
              </div>
              <div>
                <Label htmlFor="k-departemen">Departemen</Label>
                <Input
                  id="k-departemen"
                  placeholder="Kitchen"
                  value={kitchenFormData.departemen}
                  onChange={(e) => setKitchenFormData({ ...kitchenFormData, departemen: e.target.value })}
                />
              </div>
              <CheckboxGroup
                legend="Outlet"
                options={outletOptions}
                selected={kitchenFormData.outlet}
                onToggle={(value) =>
                  setKitchenFormData({ ...kitchenFormData, outlet: toggleInList(kitchenFormData.outlet, value) })
                }
                emptyHint="No outlet in master data yet — add one first."
              />
              <CheckboxGroup
                legend="Modules"
                options={moduleOptions}
                selected={kitchenFormData.module_app}
                onToggle={(value) =>
                  setKitchenFormData({
                    ...kitchenFormData,
                    module_app: toggleInList(kitchenFormData.module_app, value as ModuleApp),
                  })
                }
              />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setKitchenDialogOpen(false)} disabled={kitchenSaving}>
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
          <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
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
                  {ADMIN_ROLE_OPTIONS.map((role) => (
                    <option key={role} value={role}>
                      {USER_ROLE_LABELS[role]}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <Label htmlFor="a-departemen">Departemen</Label>
                <Input
                  id="a-departemen"
                  placeholder="Operation"
                  value={adminFormData.departemen}
                  onChange={(e) => setAdminFormData({ ...adminFormData, departemen: e.target.value })}
                />
              </div>
              <CheckboxGroup
                legend="Outlet"
                options={outletOptions}
                selected={adminFormData.outlet}
                onToggle={(value) =>
                  setAdminFormData({ ...adminFormData, outlet: toggleInList(adminFormData.outlet, value) })
                }
                emptyHint="No outlet in master data yet — add one first."
              />
              <CheckboxGroup
                legend="Modules"
                options={moduleOptions}
                selected={adminFormData.module_app}
                onToggle={(value) =>
                  setAdminFormData({
                    ...adminFormData,
                    module_app: toggleInList(adminFormData.module_app, value as ModuleApp),
                  })
                }
              />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setAdminDialogOpen(false)} disabled={adminSaving}>
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
