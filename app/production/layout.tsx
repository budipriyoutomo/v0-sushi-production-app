'use client'

import React from "react"
import { SidebarNav } from '@/components/sidebar-nav'
import { AuthGuard } from '@/components/auth-guard'
import { OutletProvider } from '@/lib/outlet-context'

export default function ProductionLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <AuthGuard allowedModules={['production']}>
      <OutletProvider>
        <div className="flex h-screen">
          <SidebarNav role="production" />
          <main className="flex-1 overflow-auto bg-background p-4 md:p-8">
            <div className="max-w-7xl mx-auto">
              {children}
            </div>
          </main>
        </div>
      </OutletProvider>
    </AuthGuard>
  )
}
