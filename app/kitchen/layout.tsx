'use client'

import { AuthGuard } from '@/components/auth-guard'
import { KitchenHeaderToolbar } from '@/components/kitchen-header-toolbar'
import { useAuth } from '@/hooks/use-auth'
import { OutletProvider } from '@/lib/outlet-context' 
 

export default function KitchenLayout({
  children,
}: {
  children: React.ReactNode
}) { 
    return ( 
        <OutletProvider>
          <div className="flex flex-col min-h-screen bg-background">
            <KitchenHeaderToolbar />
            <main className="flex-1 max-w-7xl w-full mx-auto px-4 md:px-8 py-8">
              {children}
            </main>
          </div>
        </OutletProvider> 
    ) 
}
