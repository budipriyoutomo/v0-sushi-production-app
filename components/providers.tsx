"use client"

import type { ReactNode } from "react"
import { AuthProvider } from "@/hooks/use-auth" 
import { Toaster } from "@/components/ui/toaster"

interface ProvidersProps {
  children: ReactNode
}

export function Providers({ children }: ProvidersProps) {
  return (
    <AuthProvider> 
        {children}
        <Toaster /> 
    </AuthProvider>
  )
}
