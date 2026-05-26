'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { 
  LogOut, 
  Store, 
  Users, 
  Layers, 
  FileQuestion, 
  UtensilsCrossed, 
  CalendarDays, 
  Trash2, 
  Calculator, 
  FileSpreadsheet, 
  ClipboardList, 
  BarChart3, 
  TrendingUp,
  User as UserIcon
} from 'lucide-react'
import { useAuth } from '@/hooks/use-auth'

interface NavItem {
  label: string
  href: string
  icon: React.ComponentType<{ className?: string }>
}

interface NavSection {
  section: string
  module: string
  items: NavItem[]
}

interface SidebarNavProps {
  role: 'admin' | 'production' | 'operation' | 'report'
}

export function SidebarNav({ role }: SidebarNavProps) {
  const pathname = usePathname()
  const { user, logout } = useAuth()

  // Mapping Menu dengan Ikon Lucide yang Relevan
  const adminItems: NavItem[] = [
    { label: 'Outlets', href: '/admin/outlets', icon: Store },
    { label: 'Users', href: '/admin/users', icon: Users },
    { label: 'Plate Colors', href: '/admin/plate-colors', icon: Layers },
    { label: 'Waste Reasons', href: '/admin/reason-waste', icon: FileQuestion },
    { label: 'Menus', href: '/admin/menus', icon: UtensilsCrossed },
  ]

  const productionItems: NavItem[] = [
    { label: 'Production Planning', href: '/production/planning', icon: CalendarDays },
    { label: 'Waste Management', href: '/production/waste', icon: Trash2 },
  ]

  const operationItems: NavItem[] = [
    { label: 'Sales Input (POS)', href: '/operation/sales-input', icon: Calculator },
    { label: 'Closing Report', href: '/operation/closing-report', icon: FileSpreadsheet },
  ]

  const reportItems: NavItem[] = [
    { label: 'Production Item List', href: '/report/production-item-list', icon: ClipboardList },
    { label: 'Daily Summary', href: '/report/daily-summary', icon: BarChart3 },
    { label: 'Closing Reports', href: '/report/closing-reports', icon: FileSpreadsheet },
    { label: 'Waste Analysis', href: '/report/waste-analysis', icon: TrendingUp },
  ]

  const allSections: NavSection[] = [
    { section: 'Management', module: 'admin', items: adminItems },
    { section: 'Production', module: 'production', items: productionItems },
    { section: 'Operation', module: 'operation', items: operationItems },
    { section: 'Report', module: 'report', items: reportItems },
  ]

  const userModules = user?.module_app || []
  const filteredSections = allSections.filter(section => 
    userModules.includes(section.module)
  )

  const getTitle = () => {
    if (role === 'admin' && userModules.includes('admin')) return 'Admin Dashboard'
    if (role === 'production' && userModules.includes('production')) return 'Kitchen Prod'
    if (role === 'operation' && userModules.includes('operation')) return 'Operation Dept'
    if (role === 'report' && userModules.includes('report')) return 'Report Analytics'
    
    // Fallback terstruktur
    const firstModule = userModules[0]
    if (firstModule === 'admin') return 'Admin Dashboard'
    if (firstModule === 'production') return 'Kitchen Prod'
    if (firstModule === 'operation') return 'Operation Dept'
    if (firstModule === 'report') return 'Report Analytics'
    return 'Maharasa System'
  }

  const handleLogout = async () => {
    await logout()
    window.location.href = '/login'
  }

  return (
    <aside className="w-64 h-dvh max-h-dvh bg-stone-950 text-stone-200 border-r border-stone-800 flex flex-col antialiased selection:bg-emerald-500/30 overflow-hidden">
      
      {/* Header Aplikasi */}
      <div className="p-6 border-b border-stone-800/60 flex flex-col gap-0.5 shrink-0">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          <h1 className="text-sm font-semibold uppercase tracking-wider text-stone-400">
            Colorplate v1.0
          </h1>
        </div>
        <p className="text-lg font-bold tracking-tight text-white mt-1">
          {getTitle()}
        </p>
      </div>

      {/* Konten Navigasi */}
      {/* 🛠️ PERBAIKAN UTAMA: Menyembunyikan batang scroll visual secara total di semua engine browser */}
      <nav className="flex-1 min-h-0 p-4 space-y-6 overflow-y-auto [&::-webkit-scrollbar]:none [-ms-overflow-style:none] [scrollbar-width:none]">
        {filteredSections.map((section, idx) => (
          <div key={idx} className="space-y-1.5">
            <h3 className="text-[10px] font-bold text-stone-500 uppercase tracking-widest px-3 mb-2">
              {section.section}
            </h3>
            
            <div className="space-y-0.5">
              {section.items.map((item) => {
                const isActive = pathname === item.href
                const Icon = item.icon
                
                return (
                  <Link key={item.href} href={item.href} className="block">
                    <Button
                      variant="ghost"
                      className={`w-full justify-start text-sm font-medium h-9 px-3 gap-3 rounded-lg transition-all duration-200 group relative ${
                        isActive
                          ? 'bg-stone-900 text-white font-semibold border border-stone-800 shadow-sm'
                          : 'text-stone-400 hover:text-stone-200 hover:bg-stone-900/40'
                      }`}
                    >
                      {isActive && (
                        <div className="absolute left-0 w-1 h-4 bg-emerald-500 rounded-r" />
                      )}
                      
                      <Icon className={`w-4 h-4 shrink-0 transition-transform duration-200 group-hover:scale-105 ${
                        isActive ? 'text-emerald-400' : 'text-stone-500 group-hover:text-stone-400'
                      }`} />
                      
                      <span className="truncate">{item.label}</span>
                    </Button>
                  </Link>
                )
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Footer Profile & Logout */}
      <div className="p-4 border-t border-stone-800/60 bg-stone-950/40 space-y-3 shrink-0">
        {/* User Card */}
        {user && (
          <div className="flex items-center gap-3 px-2 py-1.5 rounded-lg border border-stone-900 bg-stone-900/20">
            <div className="h-8 w-8 rounded-full bg-stone-800 flex items-center justify-center border border-stone-700">
              <UserIcon className="w-4 h-4 text-stone-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-stone-200 truncate">
                {user.name || 'Staff Maharasa'}
              </p>
              <p className="text-[10px] text-stone-500 capitalize truncate">
                {role}
              </p>
            </div>
          </div>
        )}

        {/* Logout Button */}
        <Button
          variant="ghost"
          className="w-full justify-between h-9 px-3 text-xs font-medium text-stone-400 hover:text-emerald-400 hover:bg-emerald-500/10 rounded-lg border border-transparent hover:border-emerald-500/20 transition-all duration-200"
          onClick={handleLogout}
        >
          <span className="flex items-center gap-2">
            <LogOut className="w-3.5 h-3.5" />
            Sign Out
          </span>
        </Button>
      </div>
    </aside>
  )
}