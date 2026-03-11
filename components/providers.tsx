"use client"

import type { ReactNode } from "react"
import { AuthProvider } from "@/hooks/use-auth"
import { OutletProvider } from "@/lib/outlet-context"
import { Toaster } from "@/components/ui/toaster"

interface ProvidersProps {
  children: ReactNode
}

export function Providers({ children }: ProvidersProps) {
  return (
    <AuthProvider>
      <OutletProvider>
        {children}
        <Toaster />
      </OutletProvider>
    </AuthProvider>
  )
}
