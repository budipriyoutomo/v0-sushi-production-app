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

/**
 * Modul yang dimiliki user, selalu sebagai array.
 *
 * `module_app` yang null/kosong berarti **tidak punya modul**, bukan punya
 * semuanya. Versi lama menjadikan `user?.module_app` sebagai syarat masuk blok
 * pengecekan, jadi user tanpa modul melewati pemeriksaan sama sekali dan bisa
 * membuka setiap halaman — persis kebalikan dari yang dimaksud. Semua user yang
 * dibuat lewat layar User Management dulu berada di keadaan itu.
 */
function modulesOf(moduleApp: string[] | undefined): string[] {
  return Array.isArray(moduleApp) ? moduleApp : []
}

function hasModuleAccess(
  moduleApp: string[] | undefined,
  currentModule: string,
  allowedModules?: string[]
): boolean {
  const modules = modulesOf(moduleApp)
  const modulesToCheck = allowedModules ?? [currentModule]

  return modulesToCheck.some((m) => modules.includes(m))
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

    // Module check based on user's module_app.
    // When allowedModules is specified it is authoritative (a page may be open
    // to several modules); otherwise fall back to the module from the path.
    const currentModule = getModuleFromPath(pathname)
    if (currentModule && !hasModuleAccess(user?.module_app, currentModule, allowedModules)) {
      // Redirect to first available module or login. `app` is skipped: it is a
      // base module with no page of its own.
      const firstModule = modulesOf(user?.module_app).find(m => m !== 'app')
      if (firstModule) {
        router.replace(`/${firstModule}`)
      } else {
        router.replace("/login")
      }
      return
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
  if (currentModule && !hasModuleAccess(user?.module_app, currentModule, allowedModules)) {
    return null
  }

  return <>{children}</>
}
