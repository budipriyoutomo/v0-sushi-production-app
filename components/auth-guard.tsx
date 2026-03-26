"use client"

import { useEffect } from "react"
import { useRouter, usePathname } from "next/navigation"
import { useAuth } from "@/hooks/use-auth"

interface AuthGuardProps {
  children: React.ReactNode
  allowedRoles?: string[]
}

export function AuthGuard({ children, allowedRoles }: AuthGuardProps) {
  const { user, isLoading, isAuthenticated } = useAuth()
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    if (isLoading) return

    // ❌ belum login
    if (!isAuthenticated) {
      router.replace("/login")
      return
    }

    // ❌ role tidak sesuai
    if (allowedRoles && user && !allowedRoles.includes(user.role)) {
      router.replace("/login") // bisa ganti ke /403 nanti
      return
    }
  }, [isLoading, isAuthenticated, user, allowedRoles, pathname, router])

  // ⏳ loading state
  if (isLoading) return null

  // ⛔ belum login
  if (!isAuthenticated) return null

  // ⛔ role tidak sesuai
  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    return null
  }

  return <>{children}</>
}
