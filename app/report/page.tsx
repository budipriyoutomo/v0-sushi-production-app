"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

/**
 * Modul tidak punya layar sendiri — ia hanya pintu ke layar pertamanya.
 *
 * Halaman ini ada karena `AuthGuard` dan tautan manual bisa mendarat di
 * `/report`; sebelumnya rute itu 404. Penjaga modulnya ada di layout, jadi
 * yang tidak berhak tidak akan sampai ke sini.
 */
export default function ReportIndexPage() {
  const router = useRouter()

  useEffect(() => {
    router.replace("/report/production-item-list")
  }, [router])

  return null
}
