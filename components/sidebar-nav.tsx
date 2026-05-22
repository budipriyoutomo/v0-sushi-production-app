'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { ChevronDown } from 'lucide-react'
import { useAuth } from '@/hooks/use-auth'

interface NavItem {
  label: string
  href: string
  icon?: string
}

interface NavSection {
  section: string
  module: string // Module key for access control
  items: NavItem[]
}

interface SidebarNavProps {
  role: 'admin' | 'production' | 'operation' | 'report'
}

export function SidebarNav({ role }: SidebarNavProps) {
  const pathname = usePathname()
  const { user, logout } = useAuth()

  const adminItems: NavItem[] = [
    { label: 'Outlets', href: '/admin/outlets' },
    { label: 'Users', href: '/admin/users' },
    { label: 'Plate Colors', href: '/admin/plate-colors' },
    { label: 'Waste Reasons', href: '/admin/reason-waste' },
    { label: 'Menus', href: '/admin/menus' },
  ]

  const productionItems: NavItem[] = [
    { label: 'Production Planning', href: '/production/planning' },
    { label: 'Waste Management', href: '/production/waste' },
  ]

  const operationItems: NavItem[] = [
    { label: 'Sales Input (POS)', href: '/operation/sales-input' },
    { label: 'Closing Report', href: '/operation/closing-report' },
  ]

  const reportItems: NavItem[] = [
    { label: 'Production Item List', href: '/report/production-item-list' },
    { label: 'Daily Summary', href: '/report/daily-summary' },
    { label: 'Closing Reports', href: '/report/closing-reports' },
    { label: 'Waste Analysis', href: '/report/waste-analysis' },
  ]

  // All available sections with their module keys
  const allSections: NavSection[] = [
    { section: 'Management', module: 'admin', items: adminItems },
    { section: 'Production', module: 'production', items: productionItems },
    { section: 'Operation', module: 'operation', items: operationItems },
    { section: 'Report', module: 'report', items: reportItems },
  ]

  // Filter sections based on user's module_app access
  const userModules = user?.module_app || []
  const filteredSections = allSections.filter(section => 
    userModules.includes(section.module)
  )

  // Determine title based on role or first available module
  const getTitle = () => {
    if (role === 'admin' && userModules.includes('admin')) return 'Admin'
    if (role === 'production' && userModules.includes('production')) return 'Production'
    if (role === 'operation' && userModules.includes('operation')) return 'Operation'
    if (role === 'report' && userModules.includes('report')) return 'Reports'
    // Default to first available module
    if (userModules.includes('admin')) return 'Admin'
    if (userModules.includes('production')) return 'Production'
    if (userModules.includes('operation')) return 'Operation'
    if (userModules.includes('report')) return 'Reports'
    return 'Dashboard'
  }

  const getSubtitle = () => {
    const title = getTitle()
    switch (title) {
      case 'Admin': return 'Management'
      case 'Production': return 'Planning'
      case 'Operation': return 'Operations'
      case 'Reports': return 'Analytics'
      default: return 'Overview'
    }
  }

  const handleLogout = async () => {
    await logout()
    window.location.href = '/login'
  }

  return (
    <aside className="w-64 h-screen bg-foreground text-background border-r border-border flex flex-col">
      {/* Header */}
      <div className="p-6 border-b border-border">
        <h1 className="text-xl font-bold">{getTitle()}</h1>
        <p className="text-sm text-background/70 mt-1">{getSubtitle()}</p>
      </div>

      {/* Navigation Items */}
      <nav className="flex-1 p-4 space-y-4 overflow-y-auto">
        {filteredSections.map((section, idx) => (
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
          onClick={handleLogout}
        >
          Logout
          <ChevronDown className="w-4 h-4" />
        </Button>
      </div>
    </aside>
  )
}
