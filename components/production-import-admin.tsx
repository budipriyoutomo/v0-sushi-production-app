"use client"

import { useRef, useState } from "react"
import {
  AlertTriangle,
  CheckCircle2,
  Download,
  FileSpreadsheet,
  Loader2,
  Upload,
  X,
} from "lucide-react"
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
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
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
import { useProductionImport } from "@/hooks/use-production-import"
import { useToast } from "@/hooks/use-toast"
import { getApiError } from "@/lib/api"

/**
 * Import produksi backdate.
 *
 * Layarnya sengaja dua langkah: unggah → preview → konfirmasi. Impor menulis
 * satu baris per piring dan tidak punya tombol undo, jadi operator harus
 * melihat apa yang akan masuk sebelum ia masuk.
 */
export function ProductionImportAdmin() {
  const { toast } = useToast()
  const { selectedOutletId, outlets } = useOutlet()
  const {
    preview,
    isPreviewing,
    isImporting,
    isDownloadingTemplate,
    runPreview,
    runImport,
    downloadTemplate,
    reset,
  } = useProductionImport(selectedOutletId)

  const fileInputRef = useRef<HTMLInputElement>(null)
  const [file, setFile] = useState<File | null>(null)
  const [allowDuplicate, setAllowDuplicate] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)

  const outletName = outlets.find((outlet) => outlet.id === selectedOutletId)?.name

  const clearFile = () => {
    setFile(null)
    setAllowDuplicate(false)
    reset()
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  const handleFileChange = (selected: File | null) => {
    setFile(selected)
    setAllowDuplicate(false)
    reset()
  }

  /**
   * Template ikut outlet yang sedang dipilih: isinya menu aktif brand outlet
   * itu. Tanpa outlet tidak ada yang bisa diunduh — bukan template kosong,
   * karena template kosong tetap terlihat seperti template yang benar.
   */
  const handleDownloadTemplate = async () => {
    if (isDownloadingTemplate) return

    if (!selectedOutletId) {
      toast({ title: "Error", description: "Pilih outlet dulu", variant: "destructive" })
      return
    }

    try {
      await downloadTemplate()
    } catch (error) {
      const apiError = getApiError(error)
      toast({
        title: "Unduh template gagal",
        description: apiError.message,
        variant: "destructive",
      })
    }
  }

  const handlePreview = async () => {
    if (!file || isPreviewing) return

    // Outlet kosong berarti daftar outlet belum terbukti memuat pilihan ini —
    // menembak tetap akan menulis piring ke outlet yang salah, bukan gagal.
    if (!selectedOutletId) {
      toast({ title: "Error", description: "Pilih outlet dulu", variant: "destructive" })
      return
    }

    try {
      const result = await runPreview(file)

      if (result.summary.errorRows > 0) {
        toast({
          title: "Ada baris bermasalah",
          description: `${result.summary.errorRows} dari ${result.summary.totalRows} baris perlu diperbaiki`,
          variant: "destructive",
        })
      }
    } catch (error) {
      const apiError = getApiError(error)
      toast({ title: "Preview gagal", description: apiError.message, variant: "destructive" })
    }
  }

  const handleImport = async () => {
    if (!file || isImporting) return

    try {
      const result = await runImport(file, allowDuplicate)

      toast({
        title: "Import selesai",
        description: `${result.imported} piring masuk (${result.wasteRecords} waste record)`,
      })

      setConfirmOpen(false)
      clearFile()
    } catch (error) {
      const apiError = getApiError(error)
      setConfirmOpen(false)
      toast({ title: "Import gagal", description: apiError.message, variant: "destructive" })
    }
  }

  const summary = preview?.summary
  const hasErrors = (summary?.errorRows ?? 0) > 0
  const hasDuplicates = (summary?.duplicatePlates ?? 0) > 0
  const canImport =
    !!summary && summary.validRows > 0 && !hasErrors && (!hasDuplicates || allowDuplicate)

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold">Import Produksi Backdate</h1>
            <p className="text-muted-foreground mt-1">
              Masukkan produksi hari yang sudah lewat dari berkas CSV
            </p>
          </div>
          <OutletSelector />
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Berkas Template</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-sm text-muted-foreground space-y-1">
              <p>
                Mulai dari <strong>Unduh Template</strong>: berkasnya sudah berisi seluruh menu
                aktif outlet ini, plus sheet <em>Panduan Pengisian</em> dan{" "}
                <em>Daftar Menu Aktif</em>. Isi sheet <em>Import Produksi</em>, lalu unggah
                kembali (.xlsx atau .csv).
              </p>
              <p>
                Kolom wajib: <code>date</code>, <code>menu_code</code>, <code>quantity</code>,{" "}
                <code>final_status</code>. Kolom opsional: <code>time</code> (HH:MM, default
                12:00) dan <code>notes</code>. Baris menu yang tidak diisi dilewati.
              </p>
              <p>
                Hanya tanggal <strong>sebelum hari ini</strong>. Setiap baris harus berstatus{" "}
                <code>sold</code> atau <code>waste</code> — piring backdate tidak bisa
                difinalisasi belakangan.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <input
                ref={fileInputRef}
                id="backdate-file"
                type="file"
                aria-label="Berkas template"
                accept=".xlsx,.csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/csv,text/plain"
                className="hidden"
                onChange={(e) => handleFileChange(e.target.files?.[0] ?? null)}
              />
              <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
                <FileSpreadsheet className="w-4 h-4 mr-2" />
                Pilih Berkas
              </Button>
              <Button
                variant="outline"
                onClick={handleDownloadTemplate}
                disabled={!selectedOutletId || isDownloadingTemplate}
              >
                {isDownloadingTemplate ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Download className="w-4 h-4 mr-2" />
                )}
                Unduh Template
              </Button>

              {file && (
                <div className="flex items-center gap-2 text-sm">
                  <span className="font-medium">{file.name}</span>
                  <Button variant="ghost" size="sm" onClick={clearFile} aria-label="Hapus berkas">
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              )}

              <Button
                className="ml-auto"
                onClick={handlePreview}
                disabled={!file || isPreviewing || !selectedOutletId}
              >
                {isPreviewing && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Preview
              </Button>
            </div>

            {!selectedOutletId && (
              <p className="text-sm text-destructive">
                Pilih outlet dulu — produksi selalu menempel ke satu outlet.
              </p>
            )}
          </CardContent>
        </Card>

        {summary && (
          <Card>
            <CardHeader>
              <CardTitle>Ringkasan</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <Stat label="Baris valid" value={`${summary.validRows} / ${summary.totalRows}`} />
                <Stat label="Total piring" value={summary.totalPlates} />
                <Stat label="Sold" value={summary.soldPlates} />
                <Stat label="Waste" value={summary.wastePlates} />
              </div>

              <p className="text-sm text-muted-foreground">
                Tanggal: {summary.dates.length > 0 ? summary.dates.join(", ") : "—"}
                {outletName ? ` · Outlet: ${outletName}` : ""}
              </p>

              {hasErrors && (
                <div className="flex items-start gap-2 rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm">
                  <AlertTriangle className="w-4 h-4 mt-0.5 text-destructive shrink-0" />
                  <p>
                    {summary.errorRows} baris bermasalah. Impor dijalankan utuh atau tidak sama
                    sekali, jadi perbaiki berkasnya lalu preview ulang.
                  </p>
                </div>
              )}

              {hasDuplicates && (
                <div className="space-y-3 rounded-lg border border-amber-500/40 bg-amber-500/10 p-3 text-sm">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 mt-0.5 text-amber-600 shrink-0" />
                    <p>
                      Outlet ini sudah punya {summary.duplicatePlates} piring pada menu dan tanggal
                      yang sama. Biasanya ini berkas yang sudah pernah diimpor.
                    </p>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <Label htmlFor="allow-duplicate">Tambahkan di atas yang sudah ada</Label>
                    <Switch
                      id="allow-duplicate"
                      checked={allowDuplicate}
                      onCheckedChange={setAllowDuplicate}
                    />
                  </div>
                </div>
              )}

              <div className="flex justify-end">
                <Button onClick={() => setConfirmOpen(true)} disabled={!canImport || isImporting}>
                  <Upload className="w-4 h-4 mr-2" />
                  Import {summary.totalPlates} Piring
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {preview && (
          <Card>
            <CardHeader>
              <CardTitle>Detail Baris</CardTitle>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Baris</TableHead>
                    <TableHead>Tanggal</TableHead>
                    <TableHead>Menu</TableHead>
                    <TableHead>Warna</TableHead>
                    <TableHead className="text-right">Qty</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Catatan</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {preview.rows.map((row) => {
                    const bad = row.errors.length > 0

                    return (
                      <TableRow key={row.line} className={bad ? "bg-destructive/5" : undefined}>
                        <TableCell className="font-mono text-xs">{row.line}</TableCell>
                        <TableCell>{row.date ?? "—"}</TableCell>
                        <TableCell>
                          <div className="font-medium">{row.menuName ?? row.menuCode}</div>
                          {row.menuName && (
                            <div className="text-xs text-muted-foreground">{row.menuCode}</div>
                          )}
                          {bad && (
                            <ul className="mt-1 space-y-0.5">
                              {row.errors.map((error) => (
                                <li key={error} className="text-xs text-destructive">
                                  {error}
                                </li>
                              ))}
                            </ul>
                          )}
                          {!bad && row.existingPlates > 0 && (
                            <div className="mt-1 text-xs text-amber-600">
                              Sudah ada {row.existingPlates} piring di tanggal ini
                            </div>
                          )}
                        </TableCell>
                        <TableCell>{row.plateColorName ?? "—"}</TableCell>
                        <TableCell className="text-right">{row.quantity || "—"}</TableCell>
                        <TableCell>
                          {bad ? (
                            <span className="inline-flex items-center gap-1 text-xs text-destructive">
                              <AlertTriangle className="w-3.5 h-3.5" />
                              Error
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-xs">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                              {row.finalStatus}
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {row.notes ?? ""}
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>

              {preview.rows.length === 0 && (
                <p className="text-muted-foreground text-center py-8">
                  Berkas tidak berisi baris data
                </p>
              )}
            </CardContent>
          </Card>
        )}

        <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Konfirmasi Import</DialogTitle>
              <DialogDescription>
                {summary?.totalPlates} piring akan dicatat di{" "}
                {outletName ? `outlet ${outletName}` : "outlet terpilih"} pada tanggal{" "}
                {summary?.dates.join(", ")}. Laporan hari itu ikut berubah, dan impor tidak bisa
                dibatalkan dari layar ini.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setConfirmOpen(false)} disabled={isImporting}>
                Batal
              </Button>
              <Button onClick={handleImport} disabled={isImporting}>
                {isImporting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Import Sekarang
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-lg border p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-xl font-bold">{value}</p>
    </div>
  )
}
