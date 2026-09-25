import { cn } from "@/lib/utils"
import { contrastTextColor } from "@/lib/time-slot"

export type PlateColor = "white" | "blue" | "pink" | "black" | "red" | "gold" | "choco motive" | "yellow" | "silver"

interface PlateColorBadgeProps {
  color: PlateColor | string
  /**
   * Warna dari master (`plate_colors.color_hex`). Kalau ada, inilah yang dipakai
   * — nama warna bukan kunci yang sah, karena dua brand boleh sama-sama punya
   * "Merah" dan tidak ada yang menjamin keduanya ingin rona yang sama.
   */
  colorHex?: string | null
  className?: string
}

/**
 * Palet cadangan, dari masa sebelum warna jadi data.
 *
 * Dipertahankan untuk dua keadaan: baris master yang `color_hex`-nya masih
 * kosong, dan pemanggil yang hanya memegang nama warna. Isinya sengaja tidak
 * ditambah lagi — warna baru diatur lewat master, bukan di sini.
 */
const colorStyles: Record<string, string> = {
  white: "bg-gray-100 text-gray-900 border border-gray-300",
  blue: "bg-blue-500 text-white",
  pink: "bg-pink-500 text-white",
  black: "bg-zinc-900 text-white",
  red: "bg-red-500 text-white",
  gold: "bg-yellow-500 text-gray-900",
  "choco motive": "bg-amber-900 text-white",
  choco: "bg-amber-900 text-white",
  yellow: "bg-yellow-400 text-gray-900",
  silver: "bg-gray-400 text-white",
}

const defaultStyle = "bg-muted text-muted-foreground border border-border"

function isHex(value: string | null | undefined): value is string {
  return typeof value === "string" && /^#[0-9a-fA-F]{6}$/.test(value.trim())
}

export function PlateColorBadge({ color, colorHex, className }: PlateColorBadgeProps) {
  const normalizedColor = (color || "").toLowerCase().trim()
  const displayName = color ? (color.charAt(0).toUpperCase() + color.slice(1)) : "Unknown"

  const base = "inline-flex items-center rounded-full px-2.5 py-0.5 font-semibold text-xs"

  // Warna dari master menang. Teksnya dihitung dari kecerahan latar, bukan
  // dipilih terpisah — dua nilai untuk hal yang sama akan menyimpang, dan yang
  // muncul adalah badge kuning bertulisan putih.
  if (isHex(colorHex)) {
    return (
      <span
        className={cn(base, className)}
        style={{ backgroundColor: colorHex, color: contrastTextColor(colorHex) }}
      >
        {displayName}
      </span>
    )
  }

  return (
    <span className={cn(base, colorStyles[normalizedColor] || defaultStyle, className)}>
      {displayName}
    </span>
  )
}
