"use client"

import type { ReactNode } from "react"
import { SWRConfig } from "swr"
import { AuthProvider } from "@/hooks/use-auth" 
import { Toaster } from "@/components/ui/toaster"
import { ConnectivityMonitor } from "@/components/connectivity-monitor"
import { OfflineBanner } from "@/components/offline-banner"
import { isTransientApiError } from "@/services/api-errors"

interface ProvidersProps {
  children: ReactNode
}

export function Providers({ children }: ProvidersProps) {
  return (
    <SWRConfig
      value={{
        revalidateOnFocus: false,
        revalidateOnReconnect: true,
        shouldRetryOnError: isTransientApiError,
        errorRetryCount: 2,
        errorRetryInterval: 5000,
      }}
    >
      <AuthProvider>
        <ConnectivityMonitor />
        <OfflineBanner />
        {children}
        <Toaster />
      </AuthProvider>
    </SWRConfig>
  )
}
