'use client'

import { useCallback, useState } from 'react'
import { useSWRConfig } from 'swr'
import {
  productionImportService,
  type BackdateImportPreview,
  type BackdateImportResult,
} from '@/lib/api'

/**
 * Import produksi backdate.
 *
 * Bukan SWR: tidak ada sumber daya yang di-cache di sini, hanya dua aksi. Yang
 * tetap dipegang hook ini adalah hasil preview terakhir, supaya komponen tidak
 * menyimpan state hasil panggilan API sendiri.
 *
 * Setelah impor berhasil, seluruh cache `/production` dan `/reports`
 * dibatalkan — angka produksi, waste, dan ringkasan harian tanggal itu baru
 * saja berubah, dan layar yang terbuka di tab lain tidak punya cara lain untuk
 * tahu. `revalidateOnFocus` mati di aplikasi ini (lihat providers.tsx), jadi
 * tanpa langkah ini datanya basi sampai halaman di-reload.
 */
export function useProductionImport(outletId: string) {
  const { mutate } = useSWRConfig()

  const [preview, setPreview] = useState<BackdateImportPreview | null>(null)
  const [isPreviewing, setIsPreviewing] = useState(false)
  const [isImporting, setIsImporting] = useState(false)
  const [isDownloadingTemplate, setIsDownloadingTemplate] = useState(false)

  const reset = useCallback(() => setPreview(null), [])

  /**
   * Unduh template lalu serahkan berkasnya ke browser.
   *
   * Blob-nya dibuang lagi setelah tautan diklik: satu objek URL per unduhan
   * yang tidak pernah dilepas menahan seluruh isi berkas di memori tab selama
   * halaman terbuka, dan layar ini memang dipakai berulang kali per hari.
   */
  const downloadTemplate = useCallback(async (): Promise<void> => {
    setIsDownloadingTemplate(true)

    try {
      const { blob, filename } = await productionImportService.downloadTemplate(outletId)
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')

      link.href = url
      link.download = filename
      link.click()

      URL.revokeObjectURL(url)
    } finally {
      setIsDownloadingTemplate(false)
    }
  }, [outletId])

  const runPreview = useCallback(
    async (file: File): Promise<BackdateImportPreview> => {
      setIsPreviewing(true)
      try {
        const result = await productionImportService.preview(file, outletId)
        setPreview(result)
        return result
      } finally {
        setIsPreviewing(false)
      }
    },
    [outletId]
  )

  const runImport = useCallback(
    async (file: File, allowDuplicate: boolean): Promise<BackdateImportResult> => {
      setIsImporting(true)
      try {
        const result = await productionImportService.commit(file, outletId, allowDuplicate)

        // Key produksi kebanyakan string, satu berbentuk array
        // (`[PRODUCTION_KEY, outletId, date]`) — `String()` menyamakan keduanya.
        await mutate((key) => {
          const flat = String(key)
          return flat.includes('/production') || flat.includes('/reports')
        })

        setPreview(null)
        return result
      } finally {
        setIsImporting(false)
      }
    },
    [mutate, outletId]
  )

  return {
    preview,
    isPreviewing,
    isImporting,
    isDownloadingTemplate,
    runPreview,
    runImport,
    downloadTemplate,
    reset,
  }
}
