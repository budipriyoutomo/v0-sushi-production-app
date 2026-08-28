"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation" 
import { useAuth } from "@/hooks/use-auth"
import { landingRouteFor } from "@/lib/constants/access"

export default function HomePage() {
  const router = useRouter()
  const { user, isAuthenticated, isLoading } = useAuth()

  useEffect(() => {
    if (isLoading) return

    // Dulu hardcode `/admin/plate-colors` untuk siapa pun yang terautentikasi,
    // jadi user production dilempar ke modul yang bukan miliknya, ditolak
    // AuthGuard, lalu dipantulkan lagi.
    router.replace(isAuthenticated ? landingRouteFor(user?.module_app) ?? "/login" : "/login")
  }, [isLoading, isAuthenticated, user, router])

  return null
}
