'use client'

import Link from 'next/link'
import { useMemo } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { LogOut } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useAuth } from '@/hooks/use-auth'
import { log } from 'console'

type Role = 'admin' | 'kitchen' | 'service'

type MenuItem = {
  label: string
  path: string
  danger?: boolean
  roles: Role[]
}

const MENU_ITEMS: MenuItem[] = [
  {
    label: 'Dashboard',
    path: '/kitchen/dashboard',
    roles: ['admin', 'kitchen', 'service'],
  },
  {
    label: 'Production',
    path: '/kitchen/produce',
    roles: ['admin', 'kitchen'],
  },
  {
    label: 'Conveyor',
    path: '/kitchen/conveyor',
    roles: ['admin', 'kitchen', 'service'],
  },
  {
    label: 'Expired',
    path: '/kitchen/expired',
    roles: ['admin', 'service'],
    danger: true,
  },
]

export function KitchenHeaderToolbar() {
  const router = useRouter()
  const pathname = usePathname()

  const { user, logout, isLoading, isAuthenticated } = useAuth() 
  const role = (user?.role || '').toLowerCase() as Role

  const allowedMenus = useMemo(() => {
  if (!user) return []

  if (role === 'admin') {
  return MENU_ITEMS
  }

  return MENU_ITEMS.filter((menu) =>
  menu.roles.includes(role)
  )
  }, [role, user])


  const handleLogout = async () => {
    try {
      await logout()
    } finally {
      router.replace('/login/kitchen')
    }
  }

  const isActive = (path: string) => {
    return pathname === path
  }
 

  return (
    <div className="sticky top-0 z-50 border-b border-border bg-card px-3 py-2 backdrop-blur supports-[backdrop-filter]:bg-card/90">
      <div className="mx-auto max-w-7xl">
        <div className="flex items-center justify-between gap-3">
          {/* Navigation */}
          <div className="flex flex-wrap gap-1 rounded-lg bg-secondary/50 p-1">
            {allowedMenus.map((menu) => {
              const active = isActive(menu.path)

              return (
                <Link
                  key={menu.path}
                  href={menu.path}
                  className={cn(
                    'rounded-md px-4 py-2 text-sm font-medium transition-all duration-200',
                    active
                      ? menu.danger
                        ? 'bg-destructive text-destructive-foreground'
                        : 'bg-primary text-primary-foreground'
                      : 'text-secondary-foreground hover:bg-primary/15 hover:text-foreground'
                  )}
                >
                  {menu.label}
                </Link>
              )
            })}
          </div>

          {/* User & Logout */}
          <div className="flex items-center gap-3">
            {user && (
              <div className="hidden text-right sm:block">
                <p className="text-sm font-medium leading-none">
                  {user.name}
                </p>

                <p className="mt-1 text-xs capitalize text-muted-foreground">
                  {user.role}
                </p>
              </div>
            )}

            <Button
              size="sm"
              variant="destructive"
              onClick={handleLogout}
              className="gap-2"
            >
              <LogOut className="h-4 w-4" />
              Logout
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
