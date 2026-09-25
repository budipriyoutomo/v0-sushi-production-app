"use client"

import { useMemo, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { BrandSelect } from "@/components/brand-select"
import { useToast } from "@/hooks/use-toast"
import { useBrands } from "@/hooks/use-brands"
import { useTimeMarkersByBrand } from "@/hooks/use-time-markers"
import { useTimeSlotsByBrand, useTimeSettingsSummaryByBrand } from "@/hooks/use-time-slots"
import { contrastTextColor, sortSlotsByTime } from "@/lib/time-slot"
import {
  getApiError,
  type CreateTimeMarkerDTO,
  type CreateTimeSlotDTO,
  type TimeMarker,
  type TimeSlot,
} from "@/lib/api"
import { AlertTriangle, Loader2, Plus, Trash2, Wand2, Clock } from "lucide-react"

/**
 * Setelan waktu per brand: daftar time slot dan daftar penanda.
 *
 * Satu halaman dengan dua tab, bukan dua halaman: keduanya selalu dilihat
 * bersamaan, dan peringatan siklus di atas membutuhkan angka dari dua-duanya
 * sekaligus.
 *
 * Tab-nya dua tombol biasa, bukan komponen Tabs — repo ini belum punya
 * `ui/tabs.tsx`, dan menambah dependensi Radix untuk dua tombol tidak sepadan.
 */

const NO_MARKER = "__none__"

function isHex(value: string): boolean {
  return /^#[0-9a-fA-F]{6}$/.test(value.trim())
}

/** "10:00:00" -> "10:00", untuk ditaruh di <input type="time">. */
function toInputTime(value: string): string {
  return value.slice(0, 5)
}

/**
 * PUT di API ini berarti "ganti barisnya", bukan "ubah field ini saja".
 *
 * `TimeSlotRequest::rulesForUpdate()` mewajibkan `brand_id`, `start_time`, dan
 * `end_time` — dan memang harus begitu: pemeriksaan tumpang tindih jam tidak
 * bisa dilakukan tanpa mengetahui jam barunya. Mengirim potongan payload
 * dijawab 422.
 *
 * Jebakannya halus: `fillSoleBrand()` di backend mengisi `brand_id` sendiri
 * selama basis data cuma punya SATU brand, jadi payload yang kurang lengkap
 * tetap lolos di instalasi satu brand dan baru gagal setelah brand kedua
 * dibuat. Karena itu seluruh baris selalu dikirim, tidak pernah potongannya.
 */
function slotPayload(slot: TimeSlot, patch: Partial<CreateTimeSlotDTO> = {}): CreateTimeSlotDTO {
  return {
    brand_id: slot.brandId,
    start_time: toInputTime(slot.startTime),
    end_time: toInputTime(slot.endTime),
    time_marker_id: slot.marker?.id ?? null,
    sort_order: slot.sortOrder,
    is_active: slot.isActive,
    ...patch,
  }
}

function markerPayload(
  marker: TimeMarker,
  patch: Partial<CreateTimeMarkerDTO> = {}
): CreateTimeMarkerDTO {
  return {
    brand_id: marker.brandId,
    label: marker.label,
    color_hex: marker.colorHex,
    sort_order: marker.sortOrder,
    is_active: marker.isActive,
    ...patch,
  }
}

export function BrandSettingsAdmin() {
  const { toast } = useToast()
  const { brands, isLoading: isLoadingBrands } = useBrands()

  const [brandId, setBrandId] = useState("")
  const [tab, setTab] = useState<"slots" | "markers">("slots")

  const {
    timeSlots,
    isLoading: isLoadingSlots,
    createTimeSlot,
    updateTimeSlot,
    deleteTimeSlot,
    refresh: refreshSlots,
  } = useTimeSlotsByBrand(brandId)

  const {
    timeMarkers,
    isLoading: isLoadingMarkers,
    createTimeMarker,
    updateTimeMarker,
    deleteTimeMarker,
    refresh: refreshMarkers,
  } = useTimeMarkersByBrand(brandId)

  const { summary, refresh: refreshSummary } = useTimeSettingsSummaryByBrand(brandId)

  const sortedSlots = useMemo(() => sortSlotsByTime(timeSlots), [timeSlots])
  const sortedMarkers = useMemo(
    () => [...timeMarkers].sort((a, b) => a.sortOrder - b.sortOrder),
    [timeMarkers]
  )

  const [isBusy, setIsBusy] = useState(false)

  /** Setiap perubahan bisa menggeser peringatan siklus, jadi ia ikut disegarkan. */
  const runAndRefresh = async (action: () => Promise<unknown>, successMessage: string) => {
    if (isBusy) return
    setIsBusy(true)

    try {
      await action()
      await Promise.all([refreshSlots(), refreshMarkers(), refreshSummary()])
      toast({ title: successMessage })
    } catch (error) {
      toast({
        title: "Gagal",
        description: getApiError(error).message,
        variant: "destructive",
      })
    } finally {
      setIsBusy(false)
    }
  }

  // ==========================
  // FORM TAMBAH
  // ==========================
  const [newSlot, setNewSlot] = useState({ start: "10:00", end: "10:30", markerId: NO_MARKER })
  const [newMarker, setNewMarker] = useState({ label: "", colorHex: "#3B82F6" })

  const addSlot = () =>
    runAndRefresh(
      () =>
        createTimeSlot({
          brand_id: brandId,
          start_time: newSlot.start,
          end_time: newSlot.end,
          time_marker_id: newSlot.markerId === NO_MARKER ? null : newSlot.markerId,
          sort_order: sortedSlots.length,
        }),
      "Time slot ditambahkan"
    )

  const addMarker = () => {
    if (!isHex(newMarker.colorHex)) {
      toast({
        title: "Warna tidak sah",
        description: "Pakai bentuk #RRGGBB, misalnya #3B82F6.",
        variant: "destructive",
      })
      return
    }

    return runAndRefresh(
      () =>
        createTimeMarker({
          brand_id: brandId,
          label: newMarker.label,
          color_hex: newMarker.colorHex.toUpperCase(),
          sort_order: sortedMarkers.length,
        }),
      "Penanda ditambahkan"
    ).then(() => setNewMarker({ label: "", colorHex: "#3B82F6" }))
  }

  /**
   * Isi penanda berputar mengikuti urutan jam.
   *
   * Titik awal, bukan aturan: hasilnya boleh diubah baris per baris. Itulah
   * bedanya dengan versi lama, yang menghitung warna dari sisa bagi nomor slot
   * dan tidak bisa diintervensi sama sekali — sehingga siklus 150 menit
   * bertabrakan dengan piring berumur 180 menit tanpa ada jalan keluar.
   */
  const autoAssignMarkers = () =>
    runAndRefresh(async () => {
      if (sortedMarkers.length === 0) {
        throw new Error("Belum ada penanda untuk dipasang.")
      }

      for (const [index, slot] of sortedSlots.entries()) {
        const marker = sortedMarkers[index % sortedMarkers.length]

        if (slot.marker?.id === marker.id) continue

        await updateTimeSlot(slot.id, slotPayload(slot, { time_marker_id: marker.id }))
      }
    }, "Penanda diisi berputar")

  // ==========================
  // DIALOG UBAH JAM
  // ==========================
  const [editing, setEditing] = useState<TimeSlot | null>(null)
  const [editTimes, setEditTimes] = useState({ start: "", end: "" })

  const openEdit = (slot: TimeSlot) => {
    setEditing(slot)
    setEditTimes({ start: toInputTime(slot.startTime), end: toInputTime(slot.endTime) })
  }

  const saveTimes = () => {
    if (!editing) return

    return runAndRefresh(
      () =>
        updateTimeSlot(
          editing.id,
          slotPayload(editing, { start_time: editTimes.start, end_time: editTimes.end })
        ),
      "Jam slot diperbarui"
    ).then(() => setEditing(null))
  }

  // ==========================
  // RENDER
  // ==========================
  if (isLoadingBrands) {
    return (
      <div className="p-6 flex items-center gap-2 text-muted-foreground">
        <Loader2 className="w-4 h-4 animate-spin" /> Memuat brand...
      </div>
    )
  }

  return (
    <div className="p-4 md:p-6 space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Setelan Waktu Brand
          </CardTitle>
          <CardDescription>
            Time slot produksi dan penanda waktu yang menempel ke piring. Berlaku untuk semua outlet
            milik brand ini.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="max-w-sm space-y-2">
            <Label>Brand</Label>
            <BrandSelect brands={brands} value={brandId} onChange={setBrandId} />
          </div>

          {summary && !summary.ok && (
            <div className="flex gap-3 rounded-md border border-amber-300 bg-amber-50 p-3 text-amber-900">
              <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
              <div className="text-sm">{summary.message}</div>
            </div>
          )}
        </CardContent>
      </Card>

      {!brandId ? (
        <Card>
          <CardContent className="py-10 text-center text-muted-foreground">
            Pilih brand dulu untuk melihat setelannya.
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="flex gap-2">
            <Button variant={tab === "slots" ? "default" : "outline"} onClick={() => setTab("slots")}>
              Time Slot ({sortedSlots.length})
            </Button>
            <Button
              variant={tab === "markers" ? "default" : "outline"}
              onClick={() => setTab("markers")}
            >
              Penanda ({sortedMarkers.length})
            </Button>
          </div>

          {tab === "slots" ? (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Time Slot</CardTitle>
                <CardDescription>
                  Jam mulai dan selesai bebas. Slot boleh bersinggungan, tapi tidak boleh tumpang
                  tindih.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-wrap items-end gap-2">
                  <div className="space-y-1">
                    <Label className="text-xs">Mulai</Label>
                    <Input
                      type="time"
                      className="w-32"
                      value={newSlot.start}
                      onChange={(e) => setNewSlot({ ...newSlot, start: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Selesai</Label>
                    <Input
                      type="time"
                      className="w-32"
                      value={newSlot.end}
                      onChange={(e) => setNewSlot({ ...newSlot, end: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Penanda</Label>
                    <Select
                      value={newSlot.markerId}
                      onValueChange={(value) => setNewSlot({ ...newSlot, markerId: value })}
                    >
                      <SelectTrigger className="w-44">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={NO_MARKER}>Tanpa penanda</SelectItem>
                        {sortedMarkers.map((marker) => (
                          <SelectItem key={marker.id} value={marker.id}>
                            {marker.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <Button onClick={addSlot} disabled={isBusy}>
                    <Plus className="w-4 h-4 mr-1" /> Tambah
                  </Button>

                  <Button variant="outline" onClick={autoAssignMarkers} disabled={isBusy}>
                    <Wand2 className="w-4 h-4 mr-1" /> Isi otomatis berputar
                  </Button>
                </div>

                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Slot</TableHead>
                      <TableHead>Penanda</TableHead>
                      <TableHead className="w-24">Aktif</TableHead>
                      <TableHead className="w-32">Aksi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoadingSlots ? (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center text-muted-foreground">
                          Memuat...
                        </TableCell>
                      </TableRow>
                    ) : sortedSlots.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center text-muted-foreground">
                          Brand ini belum punya time slot.
                        </TableCell>
                      </TableRow>
                    ) : (
                      sortedSlots.map((slot) => (
                        <TableRow key={slot.id}>
                          <TableCell className="font-medium">{slot.label}</TableCell>
                          <TableCell>
                            <Select
                              value={slot.marker?.id ?? NO_MARKER}
                              onValueChange={(value) =>
                                runAndRefresh(
                                  () =>
                                    updateTimeSlot(
                                      slot.id,
                                      slotPayload(slot, {
                                        time_marker_id: value === NO_MARKER ? null : value,
                                      })
                                    ),
                                  "Penanda slot diperbarui"
                                )
                              }
                            >
                              <SelectTrigger className="w-48">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value={NO_MARKER}>Tanpa penanda</SelectItem>
                                {sortedMarkers.map((marker) => (
                                  <SelectItem key={marker.id} value={marker.id}>
                                    {marker.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </TableCell>
                          <TableCell>
                            <Switch
                              checked={slot.isActive}
                              onCheckedChange={(checked) =>
                                runAndRefresh(
                                  () => updateTimeSlot(slot.id, slotPayload(slot, { is_active: checked })),
                                  checked ? "Slot diaktifkan" : "Slot dinonaktifkan"
                                )
                              }
                            />
                          </TableCell>
                          <TableCell className="flex gap-1">
                            <Button size="sm" variant="outline" onClick={() => openEdit(slot)}>
                              Jam
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={isBusy}
                              onClick={() =>
                                runAndRefresh(() => deleteTimeSlot(slot.id), "Slot dihapus")
                              }
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Penanda Waktu</CardTitle>
                <CardDescription>
                  Warna yang menempel ke piring. Warna teks dihitung otomatis supaya tetap terbaca.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-wrap items-end gap-2">
                  <div className="space-y-1">
                    <Label className="text-xs">Label</Label>
                    <Input
                      className="w-44"
                      placeholder="Biru"
                      value={newMarker.label}
                      onChange={(e) => setNewMarker({ ...newMarker, label: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Warna</Label>
                    <div className="flex gap-2">
                      <Input
                        type="color"
                        className="w-16 p-1"
                        value={newMarker.colorHex}
                        onChange={(e) => setNewMarker({ ...newMarker, colorHex: e.target.value })}
                      />
                      <Input
                        className="w-32"
                        value={newMarker.colorHex}
                        onChange={(e) => setNewMarker({ ...newMarker, colorHex: e.target.value })}
                      />
                    </div>
                  </div>

                  <Button onClick={addMarker} disabled={isBusy || !newMarker.label}>
                    <Plus className="w-4 h-4 mr-1" /> Tambah
                  </Button>
                </div>

                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-28">Pratinjau</TableHead>
                      <TableHead>Label</TableHead>
                      <TableHead className="w-44">Warna</TableHead>
                      <TableHead className="w-24">Aktif</TableHead>
                      <TableHead className="w-20">Aksi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoadingMarkers ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center text-muted-foreground">
                          Memuat...
                        </TableCell>
                      </TableRow>
                    ) : sortedMarkers.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center text-muted-foreground">
                          Brand ini belum punya penanda.
                        </TableCell>
                      </TableRow>
                    ) : (
                      sortedMarkers.map((marker: TimeMarker) => (
                        <TableRow key={marker.id}>
                          <TableCell>
                            <span
                              className="inline-flex items-center justify-center w-9 h-9 rounded-full text-xs font-bold"
                              style={{
                                backgroundColor: marker.colorHex,
                                color: contrastTextColor(marker.colorHex),
                              }}
                            >
                              {marker.label.slice(0, 2)}
                            </span>
                          </TableCell>
                          <TableCell className="font-medium">{marker.label}</TableCell>
                          <TableCell>
                            <Input
                              type="color"
                              className="w-16 p-1"
                              defaultValue={marker.colorHex}
                              onBlur={(e) => {
                                const value = e.target.value.toUpperCase()
                                if (value === marker.colorHex.toUpperCase()) return

                                void runAndRefresh(
                                  () => updateTimeMarker(marker.id, markerPayload(marker, { color_hex: value })),
                                  "Warna penanda diperbarui"
                                )
                              }}
                            />
                          </TableCell>
                          <TableCell>
                            <Switch
                              checked={marker.isActive}
                              onCheckedChange={(checked) =>
                                runAndRefresh(
                                  () =>
                                    updateTimeMarker(marker.id, markerPayload(marker, { is_active: checked })),
                                  checked ? "Penanda diaktifkan" : "Penanda dinonaktifkan"
                                )
                              }
                            />
                          </TableCell>
                          <TableCell>
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={isBusy}
                              onClick={() =>
                                runAndRefresh(() => deleteTimeMarker(marker.id), "Penanda dihapus")
                              }
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </>
      )}

      <Dialog open={editing !== null} onOpenChange={(open) => !open && setEditing(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ubah jam slot</DialogTitle>
            <DialogDescription>
              Plan yang sudah tersimpan tidak ikut berubah — ia menyimpan labelnya sendiri, dan
              laporan hari lalu tidak boleh berubah karena setelan hari ini.
            </DialogDescription>
          </DialogHeader>

          <div className="flex gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Mulai</Label>
              <Input
                type="time"
                value={editTimes.start}
                onChange={(e) => setEditTimes({ ...editTimes, start: e.target.value })}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Selesai</Label>
              <Input
                type="time"
                value={editTimes.end}
                onChange={(e) => setEditTimes({ ...editTimes, end: e.target.value })}
              />
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setEditing(null)}>
              Batal
            </Button>
            <Button onClick={saveTimes} disabled={isBusy}>
              Simpan
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
