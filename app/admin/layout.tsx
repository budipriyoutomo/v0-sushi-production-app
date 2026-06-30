'use client'

import React from "react"
import { SidebarNav } from '@/components/sidebar-nav'
import { AuthGuard } from '@/components/auth-guard'
import { OutletProvider } from '@/lib/outlet-context'

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <AuthGuard allowedModules={['admin']}>
      <OutletProvider>
        <div className="flex h-screen">
          <SidebarNav role="admin" />
          <main className="flex-1 overflow-auto bg-background">
            {children}
          </main>
        </div>
      </OutletProvider>
    </AuthGuard>
  )
}
