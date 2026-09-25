"use client"

import { useState, useEffect, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { PlateColorBadge, type PlateColor } from "@/components/plate-color-badge"
import { OutletSelector } from "@/components/outlet-selector"
import { useToast } from "@/hooks/use-toast"
import { useOutlet } from "@/lib/outlet-context"
import { useProductionPlan } from "@/hooks/use-production"
import { usePlateColorsSortedByPrice } from "@/hooks/use-plate-colors"
import { useTimeSlots } from "@/hooks/use-time-slots"
import { contrastTextColor, sortSlotsByTime } from "@/lib/time-slot"
import Link from "next/link"
import { Save, RotateCcw, TrendingUp, Loader2, RefreshCw } from "lucide-react"
import { getApiError, type ProductionPlanRow, type TimeMarker, type TimeSlot } from "@/lib/api"

/**
 * Baris slot dan penandanya datang dari master brand.
 *
 * Sebelumnya keduanya dikunci mati di sini: 22 slot 10:00-21:00 yang sama untuk
 * semua brand, dan lima warna yang dipilih dari SISA BAGI nomor baris. Dua hal
 * yang membuatnya salah:
 *
 * - Nomor baris bukan jam. Begitu plan tersimpan dibuka lagi, urutan barisnya
 *   ditentukan basis data, jadi warna yang muncul bisa bukan warna slot itu.
 *   Layar conveyor sementara itu menghitung warna dari jam `produced_at` —
 *   dua perhitungan berbeda yang harus selalu sepakat, tanpa apa pun yang
 *   menjaganya.
 * - Siklus lima warna x 30 menit = 150 menit, sementara sebagian besar menu
 *   bertahan 180 menit. Dua batch berwarna sama ada di belt bersamaan.
 *
 * Sekarang warna baris diambil langsung dari baris slot yang sama dengan yang
 * dibaca conveyor, jadi tidak ada yang perlu disepakati.
 */

/** Baris plan tersimpan yang slotnya sudah tidak ada di master. */
function isUnknownSlot(slots: TimeSlot[], label: string): boolean {
  return !slots.some((slot) => slot.label === label)
}

export function ProductionPlanning() {
  const { toast } = useToast()
  const { selectedOutletId } = useOutlet()
  const [planDate, setPlanDate] = useState(new Date().toISOString().split('T')[0])
  const [localPlan, setLocalPlan] = useState<ProductionPlanRow[]>([])
  const [isSaving, setIsSaving] = useState(false)

  // Fetch plate colors from API
  const { plateColors, isLoading: isLoadingColors } = usePlateColorsSortedByPrice(selectedOutletId)

  // Fetch production plan from API
  const { plan: apiPlan, isLoading: isLoadingPlan, savePlan, refresh } = useProductionPlan(
    selectedOutletId,
    planDate
  )

  // Slot milik brand outlet ini, beserta penandanya.
  const { timeSlots, isLoading: isLoadingSlots } = useTimeSlots(selectedOutletId)

  const sortedSlots = useMemo(() => sortSlotsByTime(timeSlots), [timeSlots])

  /** Penanda yang benar-benar dipakai hari ini, untuk legenda di atas tabel. */
  const usedMarkers = useMemo(() => {
    const seen = new Map<string, TimeMarker>()

    sortedSlots.forEach((slot) => {
      if (slot.marker) seen.set(slot.marker.id, slot.marker)
    })

    return [...seen.values()].sort((a, b) => a.sortOrder - b.sortOrder)
  }, [sortedSlots])

  const markerByLabel = useMemo(() => {
    return new Map(sortedSlots.map((slot) => [slot.label, slot.marker]))
  }, [sortedSlots])

  /** Warna badge per nama warna, dari master. Kosong = badge pakai palet cadangan. */
  const hexByColorName = useMemo(() => {
    return new Map(plateColors.map((pc) => [pc.platename.toLowerCase(), pc.colorHex]))
  }, [plateColors])

  // Get color keys from API response
  const colorKeys = useMemo(() => {
    return plateColors
      .filter(pc => pc && pc.platename )
      .map(pc => pc.platename.toLowerCase() as PlateColor)
  }, [plateColors])
 

  // Baris kosong untuk setiap slot milik brand, urut jam.
  const generateDefaultPlan = useMemo(() => {
    return sortedSlots.map((slot) => {
      const row: ProductionPlanRow = { timeSlot: slot.label }
      colorKeys.forEach(color => {
        row[color] = 0
      })
      return row
    })
  }, [colorKeys, sortedSlots])

  /**
   * Gabungkan master slot dengan angka yang sudah tersimpan.
   *
   * Barisnya selalu mengikuti master, urut jam — bukan urutan yang kebetulan
   * dikembalikan basis data. Label tersimpan yang slotnya sudah tidak ada
   * ditaruh di belakang apa adanya: mengubah jam slot tidak boleh mengubah plan
   * yang sudah tersimpan, jadi baris seperti itu adalah keadaan yang sah.
   */
  useEffect(() => {
    if (colorKeys.length === 0) return

    const saved = new Map((apiPlan ?? []).map((row) => [row.timeSlot, row]))

    const rows: ProductionPlanRow[] = sortedSlots.map((slot) => {
      const stored = saved.get(slot.label)
      saved.delete(slot.label)

      const row: ProductionPlanRow = { timeSlot: slot.label }
      colorKeys.forEach((color) => {
        row[color] = Number(stored?.[color] ?? 0)
      })
      return row
    })

    const orphans = [...saved.values()].sort((a, b) => a.timeSlot.localeCompare(b.timeSlot))

    setLocalPlan([...rows, ...orphans])
  }, [apiPlan, colorKeys, sortedSlots])

  const handleChange = (index: number, color: PlateColor, value: string) => {
    const newPlan = [...localPlan]
    newPlan[index] = { ...newPlan[index], [color]: Number.parseInt(value) || 0 }
    setLocalPlan(newPlan)
  }

  const getRowTotal = (row: ProductionPlanRow) => {
    return colorKeys.reduce((sum, color) => sum + (Number(row[color]) || 0), 0)
  }

  const getColumnTotal = (color: PlateColor) => {
    return localPlan.reduce((sum, row) => sum + (Number(row[color]) || 0), 0)
  }

  const getGrandTotal = () => {
    return localPlan.reduce((sum, row) => sum + getRowTotal(row), 0)
  }

  const handleSave = async () => {
    if (!selectedOutletId) {
      toast({
        title: "Error",
        description: "Please select an outlet first",
        variant: "destructive",
      })
      return
    }

    setIsSaving(true)
    try {
      // Baris "slot tidak dikenal" tidak ikut dikirim: server menolak label di
      // luar master, jadi menyertakannya membuat seluruh plan gagal disimpan.
      // Konsekuensinya baris itu hilang setelah disimpan — dan itu memang yang
      // diminta operator ketika ia menyimpan ulang hari ini dengan slot yang
      // berlaku sekarang. Peringatannya ada di atas tabel, bukan diam-diam.
      const rows = localPlan.filter((row) => !isUnknownSlot(sortedSlots, row.timeSlot))

      await savePlan(rows)
      toast({
        title: "Production Plan Saved",
        description: `Daily target: ${getGrandTotal()} items across ${colorKeys.length} plate colors`,
      })
    } catch (error) {
      toast({
        title: "Error",
        description: getApiError(error).message || "Failed to save production plan. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleReset = () => {
    setLocalPlan(generateDefaultPlan)
    toast({
      title: "Plan Reset",
      description: "Production plan has been reset to default values",
    })
  }

  const handleRefresh = async () => {
    await refresh()
    toast({
      title: "Data Refreshed",
      description: "Production plan has been reloaded from server",
    })
  }

  // Calculate highest producing color
  const topColor = useMemo(() => {
    if (colorKeys.length === 0) return null
    return colorKeys.reduce((max, color) => {
      return getColumnTotal(color) > getColumnTotal(max) ? color : max
    }, colorKeys[0])
  }, [colorKeys, localPlan])

  const isLoading = isLoadingColors || isLoadingPlan || isLoadingSlots

  const orphanCount = useMemo(
    () => localPlan.filter((row) => isUnknownSlot(sortedSlots, row.timeSlot)).length,
    [localPlan, sortedSlots]
  )

  if (isLoading && localPlan.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-muted-foreground" />
          <p className="mt-2 text-muted-foreground">Loading production plan...</p>
        </div>
      </div>
    )
  }

  if (colorKeys.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold">Production Planning</h1>
            <p className="text-muted-foreground mt-1">Set 30-minute production targets by plate color</p>
          </div>
          <OutletSelector />
        </div>
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">
              No plate colors configured. Please add plate colors in the admin panel first.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  /**
   * Brand belum punya slot. Gagal terang-terangan — tabel kosong tanpa
   * penjelasan akan terbaca sebagai "plan hari ini memang kosong".
   */
  if (sortedSlots.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold">Production Planning</h1>
            <p className="text-muted-foreground mt-1">Set production targets by plate color</p>
          </div>
          <OutletSelector />
        </div>
        <Card>
          <CardContent className="pt-6 text-center space-y-3">
            <p className="text-muted-foreground">
              Brand outlet ini belum punya time slot, jadi belum ada baris yang bisa diisi.
            </p>
            <Link href="/admin/brand-settings" className="text-sm font-medium underline">
              Atur time slot di Setelan Brand
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header with Outlet Selector */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold">Production Planning</h1>
          <p className="text-muted-foreground mt-1">Set 30-minute production targets by plate color for today</p>
        </div>
        <OutletSelector />
      </div>

      {/* Summary Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Total Daily Target</p>
            <p className="text-3xl font-bold text-blue-700 mt-2">{getGrandTotal()}</p>
            <p className="text-xs text-blue-600 mt-1">items to produce</p>
          </CardContent>
        </Card> 

        <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Top Producer</p>
            <div className="mt-2">
              {topColor && (
                <PlateColorBadge color={topColor} colorHex={hexByColorName.get(topColor) ?? null} />
              )}
            </div>
            <p className="text-xs text-orange-600 mt-2">
              {topColor ? `${getColumnTotal(topColor)} pieces` : 'No data'}
            </p>
          </CardContent>
        </Card>
      </div>

      {orphanCount > 0 && (
        <div className="rounded-md border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
          {orphanCount} baris memakai time slot yang sudah tidak ada di setelan brand. Baris itu
          ditampilkan apa adanya dan tidak bisa diubah — kalau plan ini disimpan ulang, baris
          tersebut tidak ikut tersimpan.
        </div>
      )}

      {/* Production Schedule Table */}
      <Card className="shadow-lg">
        <CardHeader className="bg-gradient-to-r from-slate-50 to-slate-100 border-b">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                Daily Production Schedule
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">Input target quantities for each 30-minute time slot</p>
            </div>
            <div className="flex items-center gap-2">
              <Input
                type="date"
                value={planDate}
                onChange={(e) => setPlanDate(e.target.value)}
                className="w-40"
              />
              <Button variant="outline" size="icon" onClick={handleRefresh} disabled={isLoading}>
                <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th colSpan={colorKeys.length + 2} className="px-4 py-2">
                    <div className="flex flex-wrap items-center gap-3">
                      <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Penanda Waktu:</span>
                      {usedMarkers.length === 0 ? (
                        <span className="text-xs text-slate-500">
                          Belum ada penanda yang dipasang ke slot.
                        </span>
                      ) : (
                        usedMarkers.map((marker) => (
                          <span key={marker.id} className="flex items-center gap-1.5">
                            <span
                              className="inline-block w-3 h-3 rounded-full"
                              style={{ backgroundColor: marker.colorHex }}
                            />
                            <span className="text-xs text-slate-600">{marker.label}</span>
                          </span>
                        ))
                      )}
                    </div>
                  </th>
                </tr>
                <tr className="bg-slate-100 border-b-2 border-slate-300">
                  <th className="text-left p-4 font-semibold text-slate-700">Time Slot</th>
                  {colorKeys.map((color) => (
                    <th key={color} className="text-center p-4 min-w-28">
                      <PlateColorBadge color={color} colorHex={hexByColorName.get(color) ?? null} />
                    </th>
                  ))}
                  <th className="text-center p-4 font-semibold text-slate-700 min-w-20 bg-slate-50">Total</th>
                </tr>
              </thead>
              <tbody>
                {localPlan.map((row, index) => {
                  const marker = markerByLabel.get(row.timeSlot) ?? null
                  const unknown = isUnknownSlot(sortedSlots, row.timeSlot)

                  return (
                    <tr
                      key={row.timeSlot}
                      className={`border-b transition-colors hover:brightness-95 ${unknown ? "bg-slate-100/70" : ""}`}
                    >
                      <td className="p-3 bg-white/70 border-r border-slate-200">
                        <div className="flex items-center gap-2">
                          {marker ? (
                            <span
                              className="inline-flex items-center justify-center w-6 h-6 rounded-full text-[10px] font-bold ring-2 ring-black/10 shrink-0"
                              style={{
                                backgroundColor: marker.colorHex,
                                color: contrastTextColor(marker.colorHex),
                              }}
                              title={marker.label}
                            >
                              {marker.label[0]}
                            </span>
                          ) : (
                            <span
                              className="inline-flex items-center justify-center w-6 h-6 rounded-full border border-dashed border-slate-300 text-[10px] text-slate-400 shrink-0"
                              title={unknown ? "Slot tidak dikenal" : "Belum ada penanda"}
                            >
                              –
                            </span>
                          )}
                          <span className="font-semibold text-sm text-slate-700">
                            {row.timeSlot.split("-")[0]}
                          </span>
                          {unknown && (
                            <span className="text-[10px] uppercase tracking-wide text-slate-500">
                              tidak dikenal
                            </span>
                          )}
                        </div>
                      </td>
                      {colorKeys.map((color) => (
                        <td key={color} className="p-3 text-center">
                          <Input
                            type="number"
                            min={0}
                            disabled={unknown}
                            value={row[color] ?? ""}
                            onChange={(e) => handleChange(index, color, e.target.value === "" ? "0" : e.target.value)}
                            className="w-20 text-center mx-auto h-9 text-sm font-medium"
                          />
                        </td>
                      ))}
                      <td className="p-4 text-center font-bold text-slate-700 bg-white/60 text-sm border-l border-slate-200">
                        {getRowTotal(row)}
                      </td>
                    </tr>
                  )
                })}
                <tr className="bg-gradient-to-r from-slate-100 to-slate-50 border-t-2 border-slate-300 font-bold">
                  <td className="p-4 text-slate-800">Daily Total</td>
                  {colorKeys.map((color) => (
                    <td key={color} className="p-4 text-center text-slate-800 text-sm">
                      {getColumnTotal(color)}
                    </td>
                  ))}
                  <td className="p-4 text-center text-lg text-slate-900 bg-blue-100 rounded-md">
                    {getGrandTotal()}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex justify-end gap-3">
        <Button variant="outline" onClick={handleReset} className="gap-2" disabled={isSaving}>
          <RotateCcw className="w-4 h-4" />
          Reset Plan
        </Button>
        <Button onClick={handleSave} size="lg" className="gap-2 bg-blue-600 hover:bg-blue-700" disabled={isSaving}>
          {isSaving ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <Save className="w-5 h-5" />
          )}
          Save Production Plan
        </Button>
      </div>
    </div>
  )
}
