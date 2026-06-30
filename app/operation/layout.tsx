'use client'

import React from "react"
import { SidebarNav } from '@/components/sidebar-nav'
import { AuthGuard } from '@/components/auth-guard'
import { OutletProvider } from '@/lib/outlet-context'

export default function OperationLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <AuthGuard allowedModules={['operation']}>
      <OutletProvider>
        <div className="flex h-screen">
          <SidebarNav role="operation" />
          <main className="flex-1 overflow-auto bg-background">
            {children}
          </main>
        </div>
      </OutletProvider>
    </AuthGuard>
  )
}
