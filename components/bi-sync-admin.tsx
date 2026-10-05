"use client"

import { useState } from "react"
import { AlertTriangle, CheckCircle2, Clock, Loader2, Send } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { OutletSelector } from "@/components/outlet-selector"
import { useOutlet } from "@/lib/outlet-context"
import { useClosingReportOutbox } from "@/hooks/use-closing-report-outbox"
import { useToast } from "@/hooks/use-toast"
import {
  getApiError,
  type ClosingReportOutboxRow,
  type ClosingReportOutboxStatusFilter,
} from "@/lib/api"

const STATUS_FILTERS: { value: ClosingReportOutboxStatusFilter; label: string }[] = [
  { value: "unpublished", label: "Belum terkirim" },
  { value: "published", label: "Terkirim" },
  { value: "all", label: "Semua" },
]

function formatDateTime(value: string | null): string {
  if (!value) return "—"
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString("id-ID")
}

function StatusCell({ row }: { row: ClosingReportOutboxRow }) {
  if (row.status === "published") {
    return (
      <span className="inline-flex items-center gap-1 text-green-700">
        <CheckCircle2 className="w-4 h-4" aria-hidden />
        Terkirim
      </span>
    )
  }

  return (
    <div className="space-y-1">
      <span className="inline-flex items-center gap-1 text-amber-700">
        <Clock className="w-4 h-4" aria-hidden />
        {row.status === "pending" ? "Menunggu" : "Gagal"}
      </span>
      {row.exhausted && (
        <span className="flex items-center gap-1 text-xs font-semibold text-red-700">
          <AlertTriangle className="w-3 h-3" aria-hidden />
          Berhenti dicoba otomatis
        </span>
      )}
    </div>
  )
}

/**
 * Layar admin "Kirim Ulang BI".
 *
 * Retry otomatis menangani broker yang mati sebentar. Layar ini untuk sisanya:
 * laporan yang berhenti dicoba, atau yang perlu dikirim sekarang. Laporan yang
 * sudah terkirim tidak punya tombol — mengirim ulang data yang sudah sampai
 * adalah permintaan BI, bukan tombol.
 */
export function BiSyncAdmin() {
  const { toast } = useToast()
  const { selectedOutletId, outlets } = useOutlet()
  const [status, setStatus] = useState<ClosingReportOutboxStatusFilter>("unpublished")
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")

  const { rows, total, isLoading, error, resend, resendingId } = useClosingReportOutbox(selectedOutletId, {
    status,
    startDate,
    endDate,
  })

  const outletName = outlets.find((outlet) => outlet.id === selectedOutletId)?.name

  const handleResend = async (row: ClosingReportOutboxRow) => {
    try {
      const result = await resend(row.id)

      if (result.status === "published") {
        toast({ title: "Terkirim ke BI", description: `Laporan ${row.date} ${row.outletName ?? ""}`.trim() })
        return
      }

      const next = result.exhausted
        ? "Batas percobaan otomatis sudah habis — kirim ulang lagi setelah penyebabnya beres."
        : "Akan dicoba ulang otomatis."
      toast({
        title: "Belum terkirim",
        description: `${result.lastError ?? "Broker tidak mengonfirmasi"}. ${next}`,
        variant: "destructive",
      })
    } catch (e) {
      toast({ title: "Error", description: getApiError(e).message, variant: "destructive" })
    }
  }

  return (
    <div className="p-6 md:p-8 space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Kirim Ulang BI</h1>
          <p className="text-muted-foreground mt-1">
            Closing report yang belum sampai ke BI. Pengiriman dicoba ulang otomatis; tombol di sini untuk yang tidak bisa menunggu.
          </p>
        </div>
        <OutletSelector />
      </div>

      {!selectedOutletId ? (
        <Card>
          <CardContent className="pt-6 text-muted-foreground">
            Pilih outlet terlebih dahulu.
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader className="space-y-4">
            <CardTitle className="text-lg">{outletName ?? "Outlet"}</CardTitle>
            <div className="flex flex-wrap items-end gap-4">
              <div className="flex gap-1" role="group" aria-label="Filter status">
                {STATUS_FILTERS.map((filter) => (
                  <Button
                    key={filter.value}
                    size="sm"
                    variant={status === filter.value ? "default" : "outline"}
                    aria-pressed={status === filter.value}
                    onClick={() => setStatus(filter.value)}
                  >
                    {filter.label}
                  </Button>
                ))}
              </div>
              <div>
                <Label htmlFor="bi-sync-start">Dari</Label>
                <Input
                  id="bi-sync-start"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="bi-sync-end">Sampai</Label>
                <Input
                  id="bi-sync-end"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="mt-1"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {error ? (
              <p className="text-sm text-red-700">{getApiError(error).message}</p>
            ) : isLoading ? (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Loader2 className="w-4 h-4 animate-spin" aria-hidden />
                Memuat…
              </div>
            ) : rows.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                {status === "unpublished" ? "Semua closing report sudah terkirim ke BI." : "Tidak ada data."}
              </p>
            ) : (
              <>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tanggal laporan</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Percobaan</TableHead>
                      <TableHead>Error terakhir</TableHead>
                      <TableHead>Coba lagi / terkirim</TableHead>
                      <TableHead className="text-right">Aksi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rows.map((row) => {
                      const sending = resendingId === row.id

                      return (
                        <TableRow key={row.id}>
                          <TableCell className="font-medium">{row.date}</TableCell>
                          <TableCell>
                            <StatusCell row={row} />
                          </TableCell>
                          <TableCell>{`${row.attempts} / ${row.maxAttempts}`}</TableCell>
                          <TableCell className="max-w-xs truncate" title={row.lastError ?? undefined}>
                            {row.lastError ?? "—"}
                          </TableCell>
                          <TableCell>
                            {formatDateTime(row.status === "published" ? row.publishedAt : row.nextAttemptAt)}
                          </TableCell>
                          <TableCell className="text-right">
                            {row.status !== "published" && (
                              <Button
                                size="sm"
                                variant="outline"
                                className="gap-1"
                                disabled={resendingId !== null}
                                onClick={() => handleResend(row)}
                              >
                                {sending ? (
                                  <Loader2 className="w-4 h-4 animate-spin" aria-hidden />
                                ) : (
                                  <Send className="w-4 h-4" aria-hidden />
                                )}
                                {sending ? "Mengirim…" : "Kirim ulang"}
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
                {total > rows.length && (
                  <p className="mt-3 text-xs text-muted-foreground">
                    Menampilkan {rows.length} dari {total}. Persempit rentang tanggal untuk melihat sisanya.
                  </p>
                )}
              </>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
