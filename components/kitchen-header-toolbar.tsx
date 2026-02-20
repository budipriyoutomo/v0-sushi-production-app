'use client'

import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { LogOut } from 'lucide-react'
import { cn } from '@/lib/utils'

export function KitchenHeaderToolbar() {
  const router = useRouter()
  const pathname = usePathname()

  const handleLogout = () => {
    router.push('/login/kitchen')
  }

  const isActive = (path: string) => pathname === path

  return (
    <div className="bg-card border-b border-border sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 md:px-8">
        <div className="flex items-center justify-between gap-4 py-4">
          {/* Navigation Buttons Group */}
          <div className="flex gap-1 bg-secondary/50 rounded-lg p-1">
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
            <Link
              href="/kitchen/produce"
              className={cn(
                'px-4 py-2 rounded-md text-sm font-medium transition-colors',
                isActive('/kitchen/produce')
                  ? 'bg-primary text-primary-foreground'
                  : 'text-secondary-foreground hover:bg-primary/20'
              )}
            >
              Produce
            </Link>
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
            <Link
              href="/kitchen/expired"
              className={cn(
                'px-4 py-2 rounded-md text-sm font-medium transition-colors',
                isActive('/kitchen/expired')
                  ? 'bg-destructive text-destructive-foreground'
                  : 'text-secondary-foreground hover:bg-destructive/20'
              )}
            >
              Expired
            </Link>
          </div>

          {/* Logout Button */}
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
  )
}
