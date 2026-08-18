"use client"

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { Brand } from "@/lib/types"

/**
 * Dipakai di tiga form master (brand milik outlet, menu, dan warna piring),
 * jadi aturan tampilnya hidup di satu tempat.
 *
 * Nilai kosong bukan pilihan yang bisa dipilih user: Radix Select melarang
 * SelectItem bernilai "". Baris tanpa brand tetap bisa dibuka untuk diedit —
 * placeholder-nya yang memberi tahu bahwa brand belum ditetapkan.
 */
export function BrandSelect({
  brands,
  value,
  onChange,
  disabled,
}: {
  brands: Brand[]
  value: string
  onChange: (brandId: string) => void
  disabled?: boolean
}) {
  return (
    <Select value={value || undefined} onValueChange={onChange} disabled={disabled}>
      <SelectTrigger>
        <SelectValue placeholder="Belum ditetapkan — pilih brand" />
      </SelectTrigger>
      <SelectContent>
        {brands.map((brand) => (
          <SelectItem key={brand.id} value={brand.id}>
            {brand.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
