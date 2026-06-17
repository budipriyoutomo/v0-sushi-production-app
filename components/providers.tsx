"use client"

import type { ReactNode } from "react"
import { SWRConfig } from "swr"
import { AuthProvider } from "@/hooks/use-auth"
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/toaster"
import { ConnectivityMonitor } from "@/components/connectivity-monitor"
import { OfflineBanner } from "@/components/offline-banner"
import { isTransientApiError } from "@/services/api-errors"

interface ProvidersProps {
  children: ReactNode
}

export function Providers({ children }: ProvidersProps) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="light"
      enableSystem
      disableTransitionOnChange
    >
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
    </ThemeProvider>
  )
}
