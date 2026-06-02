"use client"

import { useEffect } from "react"
import { useRouter, usePathname } from "next/navigation"
import { useAuth } from "@/hooks/use-auth"

interface AuthGuardProps {
  children: React.ReactNode
  allowedRoles?: string[]
  allowedModules?: string[]
}

// Helper function to get module from pathname
function getModuleFromPath(pathname: string): string | null {
  const segments = pathname.split('/').filter(Boolean)
  if (segments.length === 0) return null
  return segments[0] // e.g., 'admin', 'production', 'kitchen', etc.
}

export function AuthGuard({ children, allowedRoles, allowedModules }: AuthGuardProps) {
  const { user, isLoading, isAuthenticated } = useAuth()
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    if (isLoading) return

    // Not logged in
    if (!isAuthenticated) {
      router.replace("/login")
      return
    }

    // Role check (if allowedRoles is specified)
    if (allowedRoles && user && !allowedRoles.includes(user.role)) {
      router.replace("/login")
      return
    }

    // Module check based on user's module_app
    const currentModule = getModuleFromPath(pathname)
    if (currentModule && user?.module_app) {
      // Check if user has access to this module
      const hasModuleAccess = user.module_app.includes(currentModule)
      
      // Also check allowedModules prop if specified
      const allowedByProp = !allowedModules || allowedModules.some(m => user.module_app?.includes(m))
      
      if (!hasModuleAccess || !allowedByProp) {
        // Redirect to first available module or login
        const firstModule = user.module_app.find(m => m !== 'app')
        if (firstModule) {
          router.replace(`/${firstModule}`)
        } else {
          router.replace("/login")
        }
        return
      }
    }
  }, [isLoading, isAuthenticated, user, allowedRoles, allowedModules, pathname, router])

  // Loading state
  if (isLoading) return null

  // Not logged in
  if (!isAuthenticated) return null

  // Role check
  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    return null
  }

  // Module check
  const currentModule = getModuleFromPath(pathname)
  if (currentModule && user?.module_app) {
    const hasModuleAccess = user.module_app.includes(currentModule)
    const allowedByProp = !allowedModules || allowedModules.some(m => user.module_app?.includes(m))
    
    if (!hasModuleAccess || !allowedByProp) {
      return null
    }
  }

  return <>{children}</>
}
