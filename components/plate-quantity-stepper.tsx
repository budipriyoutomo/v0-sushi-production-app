"use client"

import { Button } from "@/components/ui/button"
import { Minus, Plus } from "lucide-react"

interface PlateQuantityStepperProps {
  value: number
  max: number
  onChange: (value: number) => void
  disabled?: boolean
  label?: string
}

/**
 * Pemilih jumlah piring dari satu batch.
 *
 * Tombol besar, bukan input angka: layar ini dipakai di tablet dapur tanpa
 * keyboard, dan memunculkan papan ketik virtual di atas dialog menutup tombol
 * konfirmasinya. Batas atas selalu jumlah piring di batch — meminta lebih
 * banyak dari yang ada hanya akan ditolak server, jadi lebih baik tidak bisa
 * diketik sejak awal.
 */
export function PlateQuantityStepper({
  value,
  max,
  onChange,
  disabled = false,
  label = "Jumlah",
}: PlateQuantityStepperProps) {
  const clamp = (next: number) => Math.min(max, Math.max(1, next))

  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-sm font-medium">{label}</span>

      <div className="flex items-center gap-3">
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="h-12 w-12"
          aria-label="Kurangi jumlah"
          disabled={disabled || value <= 1}
          onClick={() => onChange(clamp(value - 1))}
        >
          <Minus className="h-5 w-5" />
        </Button>

        <output
          aria-live="polite"
          className="min-w-[4.5rem] text-center text-2xl font-bold tabular-nums"
        >
          {value}
          <span className="text-muted-foreground text-base font-normal"> / {max}</span>
        </output>

        <Button
          type="button"
          variant="outline"
          size="icon"
          className="h-12 w-12"
          aria-label="Tambah jumlah"
          disabled={disabled || value >= max}
          onClick={() => onChange(clamp(value + 1))}
        >
          <Plus className="h-5 w-5" />
        </Button>
      </div>
    </div>
  )
}
