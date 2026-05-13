'use client'

import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { LogOut } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuth } from '@/hooks/use-auth'
import { useMemo } from 'react'

// Role-based route permissions
// admin: bypass all (access everything)
// kitchen: /kitchen/dashboard, /kitchen/produce, /kitchen/conveyor
// service: /kitchen/dashboard, /kitchen/conveyor, /kitchen/expired
const ROLE_ROUTES: Record<string, string[]> = {
  admin: ['/kitchen/dashboard', '/kitchen/produce', '/kitchen/conveyor', '/kitchen/expired'],
  kitchen: ['/kitchen/dashboard', '/kitchen/produce', '/kitchen/conveyor'],
  service: ['/kitchen/dashboard', '/kitchen/conveyor', '/kitchen/expired'],
}

export function KitchenHeaderToolbar() {
  const router = useRouter()
  const pathname = usePathname()
  const { user, logout } = useAuth()

  const handleLogout = async () => {
    await logout()
    router.push('/login/kitchen')
  }

  const isActive = (path: string) => pathname === path

  // Get allowed routes based on user role
  const allowedRoutes = useMemo(() => {
    if (!user) return []
    const role = user.role?.toLowerCase() || ''
    // Admin bypasses all restrictions
    if (role === 'admin') return ROLE_ROUTES.admin
    return ROLE_ROUTES[role] || []
  }, [user])

  const canAccess = (path: string) => allowedRoutes.includes(path)

  return (
<div className="bg-card border-b border-border sticky top-0 z-50 px-3 py-2">
  <div className="max-w-7xl mx-auto">
    <div className="flex items-center justify-between gap-3">
          {/* Navigation Buttons Group */}
          <div className="flex gap-1 bg-secondary/50 rounded-lg p-1">
            {canAccess('/kitchen/dashboard') && (
              <Link
                href="/kitchen/dashboard"
                className={cn(
                  'px-4 py-2 rounded-md text-sm font-medium transition-colors',
                  isActive('/kitchen/dashboard')
                    ? 'bg-primary text-primary-foreground'
                    : 'text-secondary-foreground hover:bg-primary/20'
                )}
              >
                Dashboard
              </Link>
            )}
            {canAccess('/kitchen/produce') && (
              <Link
                href="/kitchen/produce"
                className={cn(
                  'px-4 py-2 rounded-md text-sm font-medium transition-colors',
                  isActive('/kitchen/produce')
                    ? 'bg-primary text-primary-foreground'
                    : 'text-secondary-foreground hover:bg-primary/20'
                )}
              >
                Production
              </Link>
            )}
            {canAccess('/kitchen/conveyor') && (
              <Link
                href="/kitchen/conveyor"
                className={cn(
                  'px-4 py-2 rounded-md text-sm font-medium transition-colors',
                  isActive('/kitchen/conveyor')
                    ? 'bg-primary text-primary-foreground'
                    : 'text-secondary-foreground hover:bg-primary/20'
                )}
              >
                Conveyor
              </Link>
            )}
            {canAccess('/kitchen/expired') && (
              <Link
                href="/kitchen/expired"
                className={cn(
                  'px-4 py-2 rounded-md text-sm font-medium transition-colors',
                  isActive('/kitchen/expired')
                    ? 'bg-destructive text-destructive-foreground'
                    : 'text-secondary-foreground hover:bg-primary/20'
                )}
              >
                Expired
              </Link>
            )}
          </div>

          {/* User Info & Logout Button */}
          <div className="flex items-center gap-3">
            {user && (
              <span className="text-sm text-muted-foreground hidden sm:inline">
                {user.name} ({user.role})
              </span>
            )}
            <Button
              onClick={handleLogout}
              variant="destructive"
              size="sm"
              className="gap-2"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
