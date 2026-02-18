import React from "react"
import { SidebarNav } from '@/components/sidebar-nav'

export default function OperationLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex h-screen">
      <SidebarNav role="operation" />
      <main className="flex-1 overflow-auto bg-background">
        {children}
      </main>
    </div>
  )
}
