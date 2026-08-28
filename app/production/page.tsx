"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

/**
 * Modul tidak punya layar sendiri — ia hanya pintu ke layar pertamanya.
 *
 * Halaman ini ada karena `AuthGuard` dan tautan manual bisa mendarat di
 * `/production`; sebelumnya rute itu 404. Penjaga modulnya ada di layout, jadi
 * yang tidak berhak tidak akan sampai ke sini.
 */
export default function ProductionIndexPage() {
  const router = useRouter()

  useEffect(() => {
    router.replace("/production/planning")
  }, [router])

  return null
}
