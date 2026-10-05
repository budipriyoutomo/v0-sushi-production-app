import { CheckCircle, Clock } from 'lucide-react'
import type { ClosingReportPublishStatus as PublishStatus } from '@/lib/api'

/**
 * Status kirim closing report ke BI (RabbitMQ), dari `publishStatus` server.
 *
 * `failed` sengaja tampil sama dengan `pending`: laporannya sudah tersimpan,
 * server mencoba ulang sendiri, dan operator tidak bisa berbuat apa-apa atas
 * broker yang mati. Kata "gagal" di sini hanya akan dibaca sebagai submit gagal.
 */
export function ClosingReportPublishStatus({ status }: { status?: PublishStatus | null }) {
  if (!status) return null

  if (status === 'published') {
    return (
      <div className="flex items-center gap-2 text-sm text-green-700">
        <CheckCircle className="w-4 h-4 shrink-0" aria-hidden />
        <span>Terkirim ke BI</span>
      </div>
    )
  }

  return (
    <div className="flex items-start gap-2 text-sm text-amber-700">
      <Clock className="w-4 h-4 shrink-0 mt-0.5" aria-hidden />
      <div>
        <p>Menunggu dikirim ke BI</p>
        <p className="text-xs text-amber-600">Laporan sudah tersimpan. Pengiriman akan dicoba ulang otomatis.</p>
      </div>
    </div>
  )
}
