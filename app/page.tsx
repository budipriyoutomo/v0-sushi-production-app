"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation" 
import { useAuth } from "@/hooks/use-auth"

export default function HomePage() {
  const router = useRouter()
  const { isAuthenticated, isLoading } = useAuth()

  useEffect(() => {
    if (!isLoading) {
      if (isAuthenticated) {
        router.replace("/admin/plate-colors")
      } else {
        router.replace("/login")
      }
    }
  }, [isLoading, isAuthenticated, router])

  return null
}
