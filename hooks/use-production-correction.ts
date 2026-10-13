'use client'

import { useCallback, useState } from 'react'
import useSWR, { useSWRConfig } from 'swr'
import {
  productionCorrectionService,
  salesService,
  type CorrectionHistory,
  type CorrectionPayload,
  type CorrectionPreview,
  type CorrectionRecord,
  type CorrectionSummary,
} from '@/lib/api'
import { outletScopedKey } from './use-outlet-scoped-key'
import { emptyArray } from '@/lib/empty'

const SUMMARY_KEY = '/production/corrections/summary'
const HISTORY_KEY = '/production/corrections'

/**
 * Koreksi Status Produksi untuk satu outlet + hari produksi.
 *
 * Outlet kosong → tidak fetch (`outletScopedKey`); tanggal kosong juga. Hasil
 * preview terakhir dipegang di sini supaya komponen tidak menyimpan state
 * hasil panggilan API sendiri.
 *
 * Setelah koreksi tersimpan, cache `/production`, `/reports`, `/sales`, dan
 * `/closing-reports` dibatalkan — angka produksi tanggal itu baru saja berubah
 * dan Sales Input-nya jadi basi. `revalidateOnFocus` mati di aplikasi ini,
 * jadi tanpa langkah ini layar lain tetap menampilkan angka lama.
 */
export function useProductionCorrection(outletId: string | null | undefined, date: string) {
  const { mutate: mutateGlobal } = useSWRConfig()

  const scopedSummary = outletScopedKey(SUMMARY_KEY, outletId ?? null)
  const summaryKey = scopedSummary && date ? [...scopedSummary, date] : null

  const {
    data: summary,
    error: summaryError,
    isLoading: isLoadingSummary,
    mutate: mutateSummary,
  } = useSWR<CorrectionSummary>(summaryKey, () =>
    productionCorrectionService.summary(outletId as string, date)
  )

  const historyKey = outletScopedKey(HISTORY_KEY, outletId ?? null)

  const {
    data: history,
    error: historyError,
    isLoading: isLoadingHistory,
  } = useSWR<CorrectionHistory>(historyKey, () =>
    productionCorrectionService.history({ outletId: outletId as string })
  )

  const [preview, setPreview] = useState<CorrectionPreview | null>(null)
  const [isPreviewing, setIsPreviewing] = useState(false)
  const [isApplying, setIsApplying] = useState(false)

  const [isCancellingSales, setIsCancellingSales] = useState(false)

  const resetPreview = useCallback(() => setPreview(null), [])

  /**
   * Batalkan draft Sales Input yang mengunci tanggal ini. Setelahnya ringkasan
   * diambil ulang (kunci terbuka, log pembatalan bertambah) dan cache `/sales`
   * dibatalkan supaya daftar draft di layar Sales Input tidak menampilkannya lagi.
   */
  const cancelSalesDraft = useCallback(
    async (salesId: string, reason: string): Promise<void> => {
      setIsCancellingSales(true)
      try {
        await salesService.cancelDraft(salesId, reason)
        await mutateSummary()
        await mutateGlobal((key) => String(key).includes('/sales'))
      } finally {
        setIsCancellingSales(false)
      }
    },
    [mutateSummary, mutateGlobal]
  )

  const runPreview = useCallback(async (payload: CorrectionPayload): Promise<CorrectionPreview> => {
    setIsPreviewing(true)
    try {
      const result = await productionCorrectionService.preview(payload)
      setPreview(result)
      return result
    } finally {
      setIsPreviewing(false)
    }
  }, [])

  const apply = useCallback(
    async (payload: CorrectionPayload): Promise<CorrectionRecord> => {
      setIsApplying(true)
      try {
        const result = await productionCorrectionService.apply(payload)

        setPreview(null)

        // Key di sini berbentuk string atau array — `String()` menyamakan keduanya.
        await mutateGlobal((key) => {
          const flat = String(key)
          return (
            flat.includes('/production') ||
            flat.includes('/reports') ||
            flat.includes('/sales') ||
            flat.includes('/closing-reports')
          )
        })

        return result
      } finally {
        setIsApplying(false)
      }
    },
    [mutateGlobal]
  )

  return {
    summary: summary ?? null,
    summaryError,
    isLoadingSummary,
    refreshSummary: mutateSummary,
    history: history?.rows ?? emptyArray<CorrectionRecord>(),
    historyTotal: history?.total ?? 0,
    historyError,
    isLoadingHistory,
    preview,
    isPreviewing,
    isApplying,
    runPreview,
    apply,
    resetPreview,
    isCancellingSales,
    cancelSalesDraft,
  }
}
