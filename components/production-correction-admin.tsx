"use client"

import { useMemo, useState } from "react"
import { AlertTriangle, ArrowLeftRight, Info, Loader2, Lock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { OutletSelector } from "@/components/outlet-selector"
import { PlateColorBadge } from "@/components/plate-color-badge"
import { useOutlet } from "@/lib/outlet-context"
import { useProductionCorrection } from "@/hooks/use-production-correction"
import { useWasteReasons } from "@/hooks/use-waste-reasons"
import { useToast } from "@/hooks/use-toast"
import { getApiError, type CorrectionLine, type CorrectionPayload } from "@/lib/api"

/** Sama dengan `ProductionStatusCorrectionService::MAX_DAYS_BACK`. Server tetap yang memutuskan. */
const MAX_DAYS_BACK = 31
const MIN_REASON_LENGTH = 10

/** Tanggal lokal `YYYY-MM-DD` — `toISOString()` memakai UTC dan bisa mundur sehari. */
function localDate(offsetDays = 0): string {
  const date = new Date()
  date.setDate(date.getDate() + offsetDays)
  const pad = (n: number) => String(n).padStart(2, "0")
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

function formatDateTime(value: string | null): string {
  if (!value) return "—"
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString("id-ID")
}

const STATUS_LABEL = { sold: "Sold", waste: "Waste" } as const

/** Jumlah per menu yang diisi admin: berapa sold dijadikan waste, berapa waste dijadikan sold. */
type Draft = Record<string, { toWaste: number; toSold: number }>

function toQuantity(value: string, max: number): number {
  const parsed = Number.parseInt(value, 10)
  if (Number.isNaN(parsed) || parsed < 0) return 0
  return Math.min(parsed, max)
}

/**
 * Layar admin "Koreksi Status Produksi".
 *
 * Tiga langkah, sama semangatnya dengan Import Backdate: pilih tanggal → isi
 * jumlah per menu → preview sebelum/sesudah → konfirmasi. Tidak ada undo satu
 * klik, jadi admin harus melihat dampaknya dulu. Tanggal yang Sales Input-nya
 * sudah ada terkunci.
 */
export function ProductionCorrectionAdmin() {
  const { toast } = useToast()
  const { selectedOutletId, outlets } = useOutlet()
  const { wasteReasons } = useWasteReasons()

  const [date, setDate] = useState(() => localDate(-1))
  const [draft, setDraft] = useState<Draft>({})
  const [reason, setReason] = useState("")
  const [wasteReasonId, setWasteReasonId] = useState("")
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [cancelOpen, setCancelOpen] = useState(false)
  const [cancelReason, setCancelReason] = useState("")

  const {
    summary,
    summaryError,
    isLoadingSummary,
    history,
    historyTotal,
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
  } = useProductionCorrection(selectedOutletId, date)

  const outletName = outlets.find((outlet) => outlet.id === selectedOutletId)?.name
  const locked = summary?.lock.locked ?? false
  const activeWasteReasons = wasteReasons.filter((r) => r.is_active)

  const lines = useMemo<CorrectionLine[]>(() => {
    const result: CorrectionLine[] = []
    for (const [menuId, entry] of Object.entries(draft)) {
      if (entry.toWaste > 0) result.push({ menuId, from: "sold", to: "waste", quantity: entry.toWaste })
      if (entry.toSold > 0) result.push({ menuId, from: "waste", to: "sold", quantity: entry.toSold })
    }
    return result
  }, [draft])

  const needsWasteReason = lines.some((line) => line.to === "waste")
  const reasonTooShort = reason.trim().length < MIN_REASON_LENGTH
  const canPreview =
    !!selectedOutletId &&
    !locked &&
    lines.length > 0 &&
    !reasonTooShort &&
    (!needsWasteReason || !!wasteReasonId)

  const resetForm = () => {
    setDraft({})
    setReason("")
    setWasteReasonId("")
    resetPreview()
  }

  const handleDateChange = (value: string) => {
    setDate(value)
    resetForm()
  }

  const updateDraft = (menuId: string, field: "toWaste" | "toSold", value: number) => {
    resetPreview()
    setDraft((current) => ({
      ...current,
      [menuId]: { ...(current[menuId] ?? { toWaste: 0, toSold: 0 }), [field]: value },
    }))
  }

  const payload = (): CorrectionPayload => ({
    outletId: selectedOutletId as string,
    date,
    reason: reason.trim(),
    wasteReasonId: needsWasteReason ? wasteReasonId : null,
    items: lines,
  })

  const handlePreview = async () => {
    if (!canPreview || isPreviewing) return

    try {
      await runPreview(payload())
      setConfirmOpen(true)
    } catch (error) {
      toast({ title: "Preview gagal", description: getApiError(error).message, variant: "destructive" })
    }
  }

  const cancellableSalesId =
    summary?.lock.locked && summary.lock.salesStatus === "draft" ? summary.lock.salesId : null

  const handleCancelSales = async () => {
    if (!cancellableSalesId || isCancellingSales) return

    try {
      await cancelSalesDraft(cancellableSalesId, cancelReason.trim())
      toast({
        title: "Draft Sales Input dibatalkan",
        description: "Tanggal ini sekarang bisa dikoreksi. Operator perlu Get Data POS ulang setelahnya.",
      })
      setCancelOpen(false)
      setCancelReason("")
    } catch (error) {
      toast({ title: "Pembatalan gagal", description: getApiError(error).message, variant: "destructive" })
    }
  }

  const handleApply = async () => {
    if (isApplying) return

    try {
      const result = await apply(payload())
      toast({
        title: "Koreksi tersimpan",
        description: `${result.totalToWaste} piring jadi waste, ${result.totalToSold} piring jadi sold`,
      })
      setConfirmOpen(false)
      resetForm()
    } catch (error) {
      setConfirmOpen(false)
      toast({ title: "Koreksi gagal", description: getApiError(error).message, variant: "destructive" })
    }
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold">Koreksi Status Produksi</h1>
            <p className="text-muted-foreground mt-1">
              Ubah piring yang sudah final dari sold ke waste, atau sebaliknya
            </p>
          </div>
          <OutletSelector />
        </div>

        {!selectedOutletId ? (
          <Card>
            <CardContent className="pt-6 text-muted-foreground">Pilih outlet terlebih dahulu.</CardContent>
          </Card>
        ) : (
          <>
            <Card>
              <CardHeader className="space-y-4">
                <CardTitle className="text-lg">{outletName ?? "Outlet"}</CardTitle>
                <div className="flex flex-wrap items-end gap-4">
                  <div>
                    <Label htmlFor="correction-date">Tanggal produksi</Label>
                    <Input
                      id="correction-date"
                      type="date"
                      value={date}
                      min={localDate(-MAX_DAYS_BACK)}
                      max={localDate(0)}
                      onChange={(e) => handleDateChange(e.target.value)}
                      className="mt-1"
                    />
                  </div>
                  <p className="text-sm text-muted-foreground pb-2">
                    Maksimal {MAX_DAYS_BACK} hari ke belakang. Tanggal yang Sales Input-nya sudah dibuat — draft
                    sekalipun — terkunci.
                  </p>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {summary?.lock.locked && (
                  <div role="alert" className="flex items-start gap-2 rounded-md border border-red-300 bg-red-50 p-3 text-sm text-red-800 dark:bg-red-950 dark:text-red-200">
                    <Lock className="w-4 h-4 mt-0.5 shrink-0" aria-hidden />
                    <div className="flex-1 space-y-2">
                      <p>{summary.lock.reason}</p>
                      {cancellableSalesId && (
                        <Button size="sm" variant="destructive" onClick={() => setCancelOpen(true)}>
                          Batalkan draft Sales Input
                        </Button>
                      )}
                    </div>
                  </div>
                )}

                {summary && summary.cancelledSalesDrafts.length > 0 && (
                  <div className="rounded-md border p-3 text-sm">
                    <p className="font-medium">Draft Sales Input yang pernah dibatalkan</p>
                    <ul className="mt-1 space-y-1 text-muted-foreground">
                      {summary.cancelledSalesDrafts.map((log) => (
                        <li key={log.id}>
                          {formatDateTime(log.cancelledAt)} oleh {log.cancelledByName ?? log.cancelledBy ?? "—"}:{" "}
                          {log.reason}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {summary && !summary.lock.locked && summary.lock.warnings.length > 0 && (
                  <div className="flex items-start gap-2 rounded-md border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900 dark:bg-amber-950 dark:text-amber-200">
                    <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" aria-hidden />
                    <ul className="space-y-1">
                      {summary.lock.warnings.map((warning) => (
                        <li key={warning}>{warning}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {summary && summary.unresolved > 0 && (
                  <div className="flex items-start gap-2 rounded-md border p-3 text-sm text-muted-foreground">
                    <Info className="w-4 h-4 mt-0.5 shrink-0" aria-hidden />
                    <span>
                      {summary.unresolved} piring tanggal ini belum final dan tidak bisa dikoreksi di sini — tutup
                      lewat conveyor atau tunggu auto-waste.
                    </span>
                  </div>
                )}

                {summaryError ? (
                  <p className="text-sm text-red-700">{getApiError(summaryError).message}</p>
                ) : isLoadingSummary ? (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Loader2 className="w-4 h-4 animate-spin" aria-hidden />
                    Memuat…
                  </div>
                ) : !summary || summary.menus.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Tidak ada piring final di tanggal ini.</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Menu</TableHead>
                        <TableHead>Warna</TableHead>
                        <TableHead className="text-right">Sold</TableHead>
                        <TableHead className="text-right">Waste</TableHead>
                        <TableHead className="w-36">Sold → Waste</TableHead>
                        <TableHead className="w-36">Waste → Sold</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {summary.menus.map((menu) => {
                        const entry = draft[menu.menuId] ?? { toWaste: 0, toSold: 0 }

                        return (
                          <TableRow key={menu.menuId}>
                            <TableCell>
                              <div className="font-medium">{menu.menuName}</div>
                              {menu.menuCode && (
                                <div className="text-xs text-muted-foreground">{menu.menuCode}</div>
                              )}
                            </TableCell>
                            <TableCell>
                              {menu.plateColorName && (
                                <PlateColorBadge color={menu.plateColorName} colorHex={menu.plateColorHex} />
                              )}
                            </TableCell>
                            <TableCell className="text-right">{menu.sold}</TableCell>
                            <TableCell className="text-right">{menu.waste}</TableCell>
                            <TableCell>
                              <Input
                                type="number"
                                inputMode="numeric"
                                min={0}
                                max={menu.sold}
                                aria-label={`${menu.menuName} sold ke waste`}
                                value={entry.toWaste || ""}
                                placeholder="0"
                                disabled={locked || menu.sold === 0}
                                onChange={(e) => updateDraft(menu.menuId, "toWaste", toQuantity(e.target.value, menu.sold))}
                              />
                            </TableCell>
                            <TableCell>
                              <Input
                                type="number"
                                inputMode="numeric"
                                min={0}
                                max={menu.waste}
                                aria-label={`${menu.menuName} waste ke sold`}
                                value={entry.toSold || ""}
                                placeholder="0"
                                disabled={locked || menu.waste === 0}
                                onChange={(e) => updateDraft(menu.menuId, "toSold", toQuantity(e.target.value, menu.waste))}
                              />
                            </TableCell>
                          </TableRow>
                        )
                      })}
                    </TableBody>
                  </Table>
                )}

                {summary && summary.menus.length > 0 && !locked && (
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <Label htmlFor="correction-waste-reason">
                        Alasan waste {needsWasteReason && <span className="text-red-600">*</span>}
                      </Label>
                      <select
                        id="correction-waste-reason"
                        value={wasteReasonId}
                        disabled={!needsWasteReason}
                        onChange={(e) => setWasteReasonId(e.target.value)}
                        className="mt-1 w-full px-3 py-2 border border-input rounded-md bg-background disabled:opacity-50"
                      >
                        <option value="">Pilih alasan waste</option>
                        {activeWasteReasons.map((r) => (
                          <option key={r.id} value={r.id}>
                            {r.reason_name}
                          </option>
                        ))}
                      </select>
                      <p className="mt-1 text-xs text-muted-foreground">Wajib kalau ada piring yang dijadikan waste.</p>
                    </div>
                    <div>
                      <Label htmlFor="correction-reason">
                        Alasan koreksi <span className="text-red-600">*</span>
                      </Label>
                      <Textarea
                        id="correction-reason"
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        placeholder="Contoh: Close Day menandai semua sold, padahal 5 salmon dibuang jam 21:00"
                        className="mt-1"
                        maxLength={500}
                      />
                      <p className="mt-1 text-xs text-muted-foreground">
                        Minimal {MIN_REASON_LENGTH} karakter. Tercatat di riwayat koreksi.
                      </p>
                    </div>
                  </div>
                )}

                {summary && summary.menus.length > 0 && !locked && (
                  <div className="flex flex-wrap items-center justify-end gap-3">
                    {lines.length > 0 && (
                      <Button variant="outline" onClick={resetForm}>
                        Reset
                      </Button>
                    )}
                    <Button onClick={handlePreview} disabled={!canPreview || isPreviewing} className="gap-2">
                      {isPreviewing ? (
                        <Loader2 className="w-4 h-4 animate-spin" aria-hidden />
                      ) : (
                        <ArrowLeftRight className="w-4 h-4" aria-hidden />
                      )}
                      Preview Koreksi
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Riwayat Koreksi</CardTitle>
              </CardHeader>
              <CardContent>
                {historyError ? (
                  <p className="text-sm text-red-700">{getApiError(historyError).message}</p>
                ) : isLoadingHistory ? (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Loader2 className="w-4 h-4 animate-spin" aria-hidden />
                    Memuat…
                  </div>
                ) : history.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Belum ada koreksi di outlet ini.</p>
                ) : (
                  <>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Tanggal produksi</TableHead>
                          <TableHead>Perubahan</TableHead>
                          <TableHead>Alasan</TableHead>
                          <TableHead>Oleh</TableHead>
                          <TableHead>Waktu</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {history.map((row) => (
                          <TableRow key={row.id}>
                            <TableCell className="font-medium">{row.productionDate}</TableCell>
                            <TableCell>
                              <ul className="space-y-0.5 text-sm">
                                {row.lines.map((line) => (
                                  <li key={`${line.menuId}-${line.from}`}>
                                    {line.menuName ?? "—"}: {line.quantity} {STATUS_LABEL[line.from]} →{" "}
                                    {STATUS_LABEL[line.to]}
                                  </li>
                                ))}
                              </ul>
                            </TableCell>
                            <TableCell className="max-w-xs">
                              <div className="text-sm">{row.reason}</div>
                              {row.wasteReasonName && (
                                <div className="text-xs text-muted-foreground">Waste: {row.wasteReasonName}</div>
                              )}
                            </TableCell>
                            <TableCell>{row.createdByName ?? row.createdBy ?? "—"}</TableCell>
                            <TableCell>{formatDateTime(row.createdAt)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                    {historyTotal > history.length && (
                      <p className="mt-3 text-xs text-muted-foreground">
                        Menampilkan {history.length} dari {historyTotal} koreksi terbaru.
                      </p>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          </>
        )}

        <Dialog open={cancelOpen} onOpenChange={setCancelOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Batalkan draft Sales Input?</DialogTitle>
              <DialogDescription>
                Draft Sales Input tanggal {date} akan dibatalkan supaya tanggal ini bisa dikoreksi. Adjustment dan
                compensation yang sudah diisi operator ikut hilang — setelah koreksi, operator memang harus Get Data
                POS ulang, yang mengosongkan keduanya. Sales Input yang sudah disubmit tidak bisa dibatalkan.
              </DialogDescription>
            </DialogHeader>
            <div>
              <Label htmlFor="cancel-sales-reason">
                Alasan pembatalan <span className="text-red-600">*</span>
              </Label>
              <Textarea
                id="cancel-sales-reason"
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="Contoh: 5 piring salmon salah ditandai sold, perlu dikoreksi dulu"
                className="mt-1"
                maxLength={500}
              />
              <p className="mt-1 text-xs text-muted-foreground">
                Minimal {MIN_REASON_LENGTH} karakter. Tersimpan bersama draft yang dibatalkan.
              </p>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setCancelOpen(false)} disabled={isCancellingSales}>
                Kembali
              </Button>
              <Button
                variant="destructive"
                onClick={handleCancelSales}
                disabled={isCancellingSales || cancelReason.trim().length < MIN_REASON_LENGTH}
                className="gap-2"
              >
                {isCancellingSales && <Loader2 className="w-4 h-4 animate-spin" aria-hidden />}
                Batalkan Draft
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={confirmOpen && !!preview} onOpenChange={setConfirmOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Konfirmasi Koreksi</DialogTitle>
              <DialogDescription>
                {preview && (
                  <>
                    Tanggal produksi {preview.date}: {preview.totals.toWaste} piring jadi waste,{" "}
                    {preview.totals.toSold} piring jadi sold. Tidak ada undo — koreksi tercatat di riwayat.
                  </>
                )}
              </DialogDescription>
            </DialogHeader>

            {preview && (
              <div className="space-y-4">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Warna piring</TableHead>
                      <TableHead className="text-right">Sold</TableHead>
                      <TableHead className="text-right">Waste</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {preview.plateColors.map((color) => (
                      <TableRow key={color.plateColorId}>
                        <TableCell>{color.plateColorName ?? "—"}</TableCell>
                        <TableCell className="text-right">
                          {color.soldBefore} → <strong>{color.soldAfter}</strong>
                        </TableCell>
                        <TableCell className="text-right">
                          {color.wasteBefore} → <strong>{color.wasteAfter}</strong>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                {preview.lock.warnings.length > 0 && (
                  <div className="flex items-start gap-2 rounded-md border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900 dark:bg-amber-950 dark:text-amber-200">
                    <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" aria-hidden />
                    <ul className="space-y-1">
                      {preview.lock.warnings.map((warning) => (
                        <li key={warning}>{warning}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            <DialogFooter>
              <Button variant="outline" onClick={() => setConfirmOpen(false)} disabled={isApplying}>
                Batal
              </Button>
              <Button onClick={handleApply} disabled={isApplying} className="gap-2">
                {isApplying && <Loader2 className="w-4 h-4 animate-spin" aria-hidden />}
                Simpan Koreksi
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
