'use client'

import { useCallback, useState } from 'react'
import useSWR from 'swr'
import {
  closingReportOutboxService,
  type ClosingReportOutboxList,
  type ClosingReportOutboxRow,
  type ClosingReportOutboxStatusFilter,
} from '@/lib/api'
import { outletScopedKey } from './use-outlet-scoped-key'
import { emptyArray } from '@/lib/empty'

const OUTBOX_KEY = '/closing-reports/outbox'

export interface ClosingReportOutboxFilters {
  status: ClosingReportOutboxStatusFilter
  startDate?: string
  endDate?: string
}

/**
 * Daftar pesan closing report ke BI untuk satu outlet, plus kirim ulang.
 *
 * Outlet kosong → tidak fetch (`outletScopedKey`). Filter ikut jadi bagian key,
 * jadi berganti filter tidak menampilkan isi filter sebelumnya dari cache.
 */
export function useClosingReportOutbox(outletId: string | null | undefined, filters: ClosingReportOutboxFilters) {
  const { status, startDate, endDate } = filters
  const scoped = outletScopedKey(OUTBOX_KEY, outletId ?? null)
  const key = scoped ? [...scoped, status, startDate ?? '', endDate ?? ''] : null

  const { data, error, isLoading, mutate } = useSWR<ClosingReportOutboxList>(key, () =>
    closingReportOutboxService.list({
      outletId: outletId as string,
      status,
      // Tanggal kosong bukan filter.
      ...(startDate ? { startDate } : {}),
      ...(endDate ? { endDate } : {}),
    })
  )

  const [resendingId, setResendingId] = useState<string | null>(null)

  const resend = useCallback(
    async (id: string): Promise<ClosingReportOutboxRow> => {
      setResendingId(id)
      try {
        return await closingReportOutboxService.resend(id)
      } finally {
        setResendingId(null)
        // Disegarkan apa pun hasilnya: baris yang terkirim keluar dari filter
        // "belum terkirim", baris yang gagal membawa jumlah percobaan baru.
        await mutate()
      }
    },
    [mutate]
  )

  return {
    rows: data?.rows ?? emptyArray<ClosingReportOutboxRow>(),
    total: data?.total ?? 0,
    isLoading,
    error,
    resend,
    resendingId,
  }
}
