'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { ChevronDown } from 'lucide-react'

interface NavItem {
  label: string
  href: string
  icon?: string
}

interface NavSection {
  section: string
  items: NavItem[]
}

interface SidebarNavProps {
  role: 'admin' | 'production'
}

export function SidebarNav({ role }: SidebarNavProps) {
  const pathname = usePathname()

  const adminItems: NavItem[] = [
    { label: 'Plate Colors', href: '/admin/plate-colors' },
    { label: 'Menus', href: '/admin/menus' },
    { label: 'Reports', href: '/admin/reports' },
  ]

  const productionItems: NavItem[] = [
    { label: 'Production Planning', href: '/production/planning' },
    { label: 'Waste Management', href: '/production/waste' },
  ]

  const allItems = role === 'admin' 
    ? [
        { section: 'Management', items: adminItems },
        { section: 'Production', items: productionItems },
      ]
    : [
        { section: 'Production', items: productionItems },
      ]

  return (
    <aside className="w-64 h-screen bg-foreground text-background border-r border-border flex flex-col">
      {/* Header */}
      <div className="p-6 border-b border-border">
        <h1 className="text-xl font-bold">
          {role === 'admin' ? 'Admin' : 'Production'}
        </h1>
        <p className="text-sm text-background/70 mt-1">
          {role === 'admin' ? 'Management' : 'Planning'}
        </p>
      </div>

      {/* Navigation Items */}
      <nav className="flex-1 p-4 space-y-4 overflow-y-auto">
        {allItems.map((section, idx) => (
          <div key={idx}>
            <h3 className="text-xs font-semibold text-background/60 uppercase tracking-wider px-2 mb-2">
              {section.section}
            </h3>
            <div className="space-y-1">
              {section.items.map((item) => {
                const isActive = pathname === item.href
                return (
                  <Link key={item.href} href={item.href}>
                    <Button
                      variant="ghost"
                      className={`w-full justify-start text-base font-medium transition-colors ${
                        isActive
                          ? 'bg-background text-foreground hover:bg-background'
                          : 'text-background/90 hover:bg-background/10'
                      }`}
                    >
                      {item.label}
                    </Button>
                  </Link>
                )
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-border">
        <Button
          variant="ghost"
          className="w-full justify-between text-background/80 hover:bg-background/10"
          onClick={() => {
            // Logout functionality
            window.location.href = '/login'
          }}
        >
          Logout
          <ChevronDown className="w-4 h-4" />
        </Button>
      </div>
    </aside>
  )
}
