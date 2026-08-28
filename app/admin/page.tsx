"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

/**
 * Modul tidak punya layar sendiri — ia hanya pintu ke layar pertamanya.
 *
 * Halaman ini ada karena `AuthGuard` dan tautan manual bisa mendarat di
 * `/admin`; sebelumnya rute itu 404. Penjaga modulnya ada di layout, jadi
 * yang tidak berhak tidak akan sampai ke sini.
 */
export default function AdminIndexPage() {
  const router = useRouter()

  useEffect(() => {
    router.replace("/admin/plate-colors")
  }, [router])

  return null
}
