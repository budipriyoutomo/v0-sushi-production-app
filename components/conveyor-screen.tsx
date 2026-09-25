"use client"

import { useMemo, useState } from "react"
import Image from "next/image"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { PlateColorBadge } from "@/components/plate-color-badge"
import { OutletSelector } from "@/components/outlet-selector"
import { ExpirationCountdown } from "@/components/expiration-countdown"
import { PlateQuantityStepper } from "@/components/plate-quantity-stepper"
import { useOutlet } from "@/lib/outlet-context"
import { useConveyorGroups } from "@/hooks/use-production"
import { useTimeSlots } from "@/hooks/use-time-slots"
import { contrastTextColor, markerAt } from "@/lib/time-slot"
import { usePlateColorsSortedByPrice } from "@/hooks/use-plate-colors"
import { useMenus } from "@/hooks/use-menus"
import { useActiveWasteReasons } from "@/hooks/use-waste-reasons"
import { useToast } from "@/hooks/use-toast"
import { getApiError, type ProductionItemGroup } from "@/lib/api"
import { XCircle, Loader2, PackageCheck } from "lucide-react"
import { lowercase } from "@/lib/utils"

// Ukuran gambar per breakpoint, mengikuti kolom grid di bawah. Tanpa ini
// `<Image fill>` menganggap kartunya selebar layar dan Next mengirim berkas
// beberapa kali lebih besar dari yang muat di kotak selebar seperenam layar.
const CARD_IMAGE_SIZES =
  "(min-width: 1280px) 16vw, (min-width: 1024px) 20vw, (min-width: 768px) 25vw, (min-width: 640px) 33vw, 50vw"

// Penanda waktu datang dari master brand (`/master/time-slot`), bukan dari
// hitungan lokal. Versi sebelumnya menyalin lima warna dan rumus "jam dibagi 30
// menit sejak 10:00" ke berkas ini DAN ke layar planning — dua perhitungan yang
// harus selalu sepakat tanpa apa pun yang menjaganya. Sekarang keduanya membaca
// baris slot yang sama.

/** Satu batch dengan tanggalnya sudah diurai, dihitung sekali per perubahan data. */
interface ConveyorBatch extends ProductionItemGroup {
  producedAtDate: Date
  expiresAtDate: Date
  shelfLifeMinutes: number
}

interface WasteDialogState {
  open: boolean
  group: ConveyorBatch | null
  quantity: number
  reason: string
  isSubmitting: boolean
}

const CLOSED_WASTE_DIALOG: WasteDialogState = {
  open: false,
  group: null,
  quantity: 1,
  reason: "",
  isSubmitting: false,
}

export function ConveyorScreen() {
  const { toast } = useToast()
  const { selectedOutletId } = useOutlet()

  const { groups, isLoading, closeDay, wasteItems } = useConveyorGroups(selectedOutletId)
  const { timeSlots } = useTimeSlots(selectedOutletId)
  const { plateColors } = usePlateColorsSortedByPrice(selectedOutletId)
  const { menus } = useMenus(selectedOutletId)

  /** Warna badge dari master. Kosong = badge memakai palet cadangan lamanya. */
  const hexByColorName = useMemo(
    () => new Map(plateColors.map((pc) => [pc.platename.toLowerCase(), pc.colorHex])),
    [plateColors]
  )

  const { wasteReasons } = useActiveWasteReasons()

  const [selectedColorId, setSelectedColorId] = useState<string | null>(null)
  const [closeDayDialog, setCloseDayDialog] = useState<{ open: boolean; isSubmitting: boolean }>({
    open: false,
    isSubmitting: false,
  })
  const [wasteDialog, setWasteDialog] = useState<WasteDialogState>(CLOSED_WASTE_DIALOG)

  // Peta sekali, bukan `menus.find()` di dalam map: yang kedua berarti satu
  // pemindaian seluruh master per kartu, di tiap render.
  const menuById = useMemo(() => new Map(menus.map((menu) => [menu.id, menu])), [menus])

  // Dihitung sekali per perubahan data, bukan tiap render. Selain memotong
  // map/filter yang berulang, ini juga membuat objek `Date` di bawah stabil —
  // kartu turunannya tidak lagi melihat prop "baru" setiap induk render.
  const batches: ConveyorBatch[] = useMemo(
    () =>
      groups.map((group) => {
        const producedAtDate = new Date(group.producedAt)
        const expiresAtDate = new Date(group.expiresAt)

        return {
          ...group,
          producedAtDate,
          expiresAtDate,
          shelfLifeMinutes: Math.floor(
            (expiresAtDate.getTime() - producedAtDate.getTime()) / 60000
          ),
        }
      }),
    [groups]
  )

  // Backend sudah mengurutkan dari yang paling cepat expired, jadi di sini
  // hanya menyaring — mengurutkan ulang cuma menduplikasi aturan yang sama.
  const visibleBatches = useMemo(
    () =>
      selectedColorId
        ? batches.filter((batch) => batch.plateColor === selectedColorId)
        : batches,
    [batches, selectedColorId]
  )

  // Piring, bukan batch. Ini yang dilihat operator dan yang ditutup Tutup Hari.
  const activePlateCount = useMemo(
    () => batches.reduce((total, batch) => total + batch.quantity, 0),
    [batches]
  )

  const handleCloseDay = async () => {
    // Guard against double submits: menutup dua kali memang no-op di backend,
    // tapi jaringan dapur tidak stabil dan request kedua cuma bikin bingung.
    if (closeDayDialog.isSubmitting) return
    setCloseDayDialog((prev) => ({ ...prev, isSubmitting: true }))
    try {
      const closed = await closeDay()
      setCloseDayDialog({ open: false, isSubmitting: false })
      toast({
        title: "Hari ditutup",
        description: `${closed} plate sisa ditandai terjual`,
      })
    } catch (error) {
      const apiError = getApiError(error)
      setCloseDayDialog((prev) => ({ ...prev, isSubmitting: false }))
      toast({
        title: "Error",
        description: apiError.message,
        variant: "destructive",
      })
    }
  }

  const handleWasteClick = (group: ConveyorBatch) => {
    // Default satu piring, bukan seluruh batch. Membuang lebih banyak dari yang
    // dimaksud tidak bisa dibatalkan; membuang kurang tinggal diulang.
    setWasteDialog({ open: true, group, quantity: 1, reason: "", isSubmitting: false })
  }

  const handleWasteDialogClose = () => {
    if (!wasteDialog.isSubmitting) {
      setWasteDialog(CLOSED_WASTE_DIALOG)
    }
  }

  const handleConfirmWaste = async () => {
    const group = wasteDialog.group
    if (!group) return

    if (!wasteDialog.reason.trim()) {
      toast({
        title: "Error",
        description: "Please select a reason for waste",
        variant: "destructive",
      })
      return
    }

    if (wasteDialog.isSubmitting) return

    setWasteDialog((prev) => ({ ...prev, isSubmitting: true }))
    try {
      // Id yang dipilih di layar, bukan "sekian dari batch itu". Dua tablet yang
      // menekan bersamaan akan mengirim id yang sama, dan server menolak yang
      // kedua — mengirim jumlah saja membuat keduanya diambilkan piring berbeda.
      await wasteItems(group.itemIds.slice(0, wasteDialog.quantity), wasteDialog.reason)

      setWasteDialog(CLOSED_WASTE_DIALOG)
      toast({
        title: "Marked as Waste",
        description: `${wasteDialog.quantity} × ${group.menuName} — Reason: ${wasteDialog.reason}`,
        variant: "destructive",
      })
    } catch (error) {
      const apiError = getApiError(error)
      setWasteDialog((prev) => ({ ...prev, isSubmitting: false }))
      toast({
        title: "Error",
        description: apiError.message,
        variant: "destructive",
      })
    }
  }

  const wasteDialogMenu = wasteDialog.group ? menuById.get(wasteDialog.group.menuId) : undefined

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold">Conveyor Management</h1>
          <p className="text-muted-foreground mt-1">
            Monitor and manage active production:{" "}
            <span className="font-semibold text-foreground">{activePlateCount}</span> plate
          </p>
        </div>
        <div className="flex items-center gap-2">
          <OutletSelector />
          <Button
            className="bg-emerald-600 hover:bg-emerald-700 text-white"
            onClick={() => setCloseDayDialog({ open: true, isSubmitting: false })}
            disabled={!selectedOutletId || activePlateCount === 0}
          >
            <PackageCheck className="w-4 h-4 mr-2" />
            Tutup Hari
          </Button>
        </div>
      </div>

      { /* Filter by Plate Color */ }
      <div className="flex gap-2 flex-wrap">
        <Button
          variant={selectedColorId === null ? "default" : "outline"}
          onClick={() => setSelectedColorId(null)}
          className="px-4 py-2"
        >
          All Colors
        </Button>
        {plateColors.map((plate) => (
          <Button
            key={plate.id}
            variant={selectedColorId === plate.id ? "default" : "outline"}
            onClick={() => setSelectedColorId(plate.id)}
            className="px-4 py-2 capitalize"
          >
            {plate.platename}
          </Button>
        ))}
      </div>

      {/* Items Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      ) : visibleBatches.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <p className="text-muted-foreground text-lg">
              {batches.length === 0 ? "No active plates on conveyor" : "No plates with selected color"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
          {visibleBatches.map((batch) => {
            const menuItem = menuById.get(batch.menuId)
            const marker = markerAt(timeSlots, batch.producedAtDate)

            return (
              <Card key={batch.groupKey} className="relative h-56 overflow-hidden group">
                {/* FULL IMAGE */}
                {menuItem?.image && (
                  <Image
                    src={menuItem.image}
                    alt={batch.menuName}
                    fill
                    sizes={CARD_IMAGE_SIZES}
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                )}

                {/* DARK GRADIENT OVERLAY */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />

                {/* CONTENT */}
                <div className="absolute inset-0 p-3 flex flex-col justify-between text-white">

                  {/* TOP SECTION */}
                  <div className="flex justify-between items-start">
                    <PlateColorBadge color={lowercase(batch.plateColorName) || "white"} colorHex={hexByColorName.get(lowercase(batch.plateColorName) || "white") ?? null} />

                    <div className="flex items-center gap-1">
                      {/* Jumlah piring di batch ini. */}
                      <span
                        className="inline-flex items-center justify-center min-w-7 h-6 px-1.5 rounded-full bg-black/70 text-white text-xs font-bold ring-1 ring-white/40 shadow-md"
                        aria-label={`${batch.quantity} plate`}
                      >
                        ×{batch.quantity}
                      </span>

                      {/* Penanda waktu produksi */}
                      {marker ? (
                        <span
                          className="inline-flex items-center justify-center w-6 h-6 rounded-full text-[10px] font-bold ring-2 ring-white/40 shadow-md"
                          style={{
                            backgroundColor: marker.colorHex,
                            color: contrastTextColor(marker.colorHex),
                          }}
                          title={`${marker.label} — ${batch.producedAtDate.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}`}
                        >
                          {marker.label[0]}
                        </span>
                      ) : (
                        // Jamnya di luar semua slot. Versi lama memaksanya jadi
                        // warna slot pertama — penanda yang terlihat sah padahal
                        // tidak menunjuk apa pun.
                        <span
                          className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-black/50 text-white/80 text-[10px] ring-1 ring-white/30 shadow-md"
                          title={`Di luar semua time slot — ${batch.producedAtDate.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}`}
                        >
                          –
                        </span>
                      )}
                    </div>
                  </div>

                  {/* BOTTOM SECTION */}
                  <div className="space-y-2">

                    {/* Name */}
                    <h3 className="text-sm font-semibold leading-tight line-clamp-2">
                      {batch.menuName}
                    </h3>

                    {/* Countdown — satu per batch. Seluruh anggotanya punya
                        `expiresAt` yang sama persis, jadi tidak ada yang hilang. */}
                    <div className="text-xs">
                      <ExpirationCountdown
                        productionTime={batch.producedAtDate}
                        shelfLifeMinutes={batch.shelfLifeMinutes}
                      />
                    </div>

                    {/* ACTIONS */}
                    <div className="space-y-1">

                      {/* WASTE BUTTON — satu-satunya aksi per batch.
                          Plate yang tidak dibuang dianggap terjual saat Tutup Hari. */}
                      <Button
                        size="sm"
                        variant="destructive"
                        className="w-full h-8 text-xs disabled:opacity-50 disabled:cursor-not-allowed"
                        onClick={() => handleWasteClick(batch)}
                      >
                        <XCircle className="w-3 h-3 mr-1" />
                        Waste
                      </Button>

                    </div>
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
      )}

      {/* Close Day Confirmation */}
      <Dialog
        open={closeDayDialog.open}
        onOpenChange={(open) => {
          if (!closeDayDialog.isSubmitting) setCloseDayDialog((prev) => ({ ...prev, open }))
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Tutup Hari</DialogTitle>
            <DialogDescription>
              {activePlateCount} plate masih di belt dan belum ditandai waste. Menutup hari
              menandai semuanya sebagai terjual. Buang dulu plate yang tidak laku — aksi ini tidak
              bisa dibatalkan.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setCloseDayDialog({ open: false, isSubmitting: false })}
              disabled={closeDayDialog.isSubmitting}
            >
              Batal
            </Button>
            <Button
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
              onClick={handleCloseDay}
              disabled={closeDayDialog.isSubmitting}
            >
              {closeDayDialog.isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Tandai Terjual
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Waste Reason Dialog */}
      <Dialog open={wasteDialog.open} onOpenChange={handleWasteDialogClose}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Mark as Waste</DialogTitle>
          </DialogHeader>

          {wasteDialog.group && (
            <div className="space-y-4 py-2">
              {/* Item Details */}
              <div className="flex items-center gap-4 p-3 bg-muted rounded-lg">
                {wasteDialogMenu?.image && (
                  <div className="relative w-16 h-16 rounded-md overflow-hidden flex-shrink-0">
                    <Image
                      src={wasteDialogMenu.image}
                      alt={wasteDialog.group.menuName}
                      fill
                      sizes="64px"
                      className="object-cover"
                    />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-foreground truncate">
                    {wasteDialog.group.menuName}
                  </h4>
                  <div className="mt-1 flex items-center gap-2">
                    <PlateColorBadge color={lowercase(wasteDialog.group.plateColorName) || "white"} colorHex={hexByColorName.get(lowercase(wasteDialog.group.plateColorName) || "white") ?? null} />
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    Prod: {wasteDialog.group.producedAtDate.toLocaleDateString("id-ID")}{" "}
                    {wasteDialog.group.producedAtDate.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}
                    {" · "}
                    {wasteDialog.group.quantity} plate di batch ini
                  </p>
                </div>
              </div>

              {/* Berapa piring dari batch ini yang dibuang */}
              <PlateQuantityStepper
                value={wasteDialog.quantity}
                max={wasteDialog.group.quantity}
                disabled={wasteDialog.isSubmitting}
                label="Jumlah dibuang"
                onChange={(quantity) => setWasteDialog((prev) => ({ ...prev, quantity }))}
              />

              {/* Waste Reason */}
              <div>
                <Label htmlFor="waste-reason" className="mb-2 block">
                  Reason for Waste
                </Label>
                <Select
                  value={wasteDialog.reason}
                  onValueChange={(value) => setWasteDialog((prev) => ({ ...prev, reason: value }))}
                >
                  <SelectTrigger id="waste-reason">
                    <SelectValue placeholder="Select a reason..." />
                  </SelectTrigger>
                  <SelectContent>
                    {wasteReasons
                      .filter((reason) => reason && reason.reason_name)
                      .map((reason) => (
                        <SelectItem key={reason.id} value={reason.reason_name}>
                          {reason.reason_name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={handleWasteDialogClose}
              disabled={wasteDialog.isSubmitting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirmWaste}
              disabled={wasteDialog.isSubmitting || !wasteDialog.reason}
            >
              {wasteDialog.isSubmitting ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <XCircle className="w-4 h-4 mr-2" />
              )}
              Confirm Waste
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
