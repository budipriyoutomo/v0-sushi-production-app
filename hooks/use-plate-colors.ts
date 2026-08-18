import useSWR from 'swr'
import {
  plateColorsService,
  productionService,
  type CreatePlateColorDTO,
  type UpdatePlateColorDTO,
} from '@/lib/api'
import type { PlateColorConfig } from '@/lib/types'
import { outletScopedKey } from './use-outlet-scoped-key'

const PLATE_COLORS_KEY = '/master/platecolor'

/**
 * Sama seperti useMenus: `outletId` menentukan brand yang terlihat dan ikut jadi
 * bagian cache key. Di sini taruhannya lebih tinggi — warna piring adalah unit
 * harga, jadi cache yang basi berarti harga yang salah di layar.
 *
 * Tanpa `outletId` (layar admin) semua brand ditampilkan.
 */

export function usePlateColors(outletId?: string | null) {
  const key = outletScopedKey(PLATE_COLORS_KEY, outletId)

  const { data, error, isLoading, mutate } = useSWR<PlateColorConfig[]>(key, async () => {
    if (outletId) {
      return plateColorsService.getForOutlet(outletId)
    }

    const response = await plateColorsService.getAll({ per_page: 'all' })
    return response.data
  })

  // productionService menyimpan peta platename -> id per outlet untuk savePlan().
  // Buang setiap kali master berubah, kalau tidak planning rusak sampai halaman
  // di-reload.
  const revalidate = async () => {
    productionService.invalidatePlateColors()
    await mutate()
  }

  const createPlateColor = async (colorData: CreatePlateColorDTO): Promise<PlateColorConfig> => {
    const response = await plateColorsService.create(colorData)
    await revalidate()
    return response.data
  }

  const updatePlateColor = async (id: string, colorData: UpdatePlateColorDTO): Promise<PlateColorConfig> => {
    const response = await plateColorsService.update(id, colorData)
    await revalidate()
    return response.data
  }

  const deletePlateColor = async (id: string): Promise<void> => {
    await plateColorsService.delete(id)
    await revalidate()
  }

  // `updatePrice` dibuang bersama method service yang dibungkusnya — route
  // `PATCH /master/platecolor/{id}/price` tidak pernah ada. Harga diubah lewat
  // `updatePlateColor(id, { price })`.

  return {
    plateColors: data || [],
    isLoading,
    error,
    createPlateColor,
    updatePlateColor,
    deletePlateColor,
    refresh: mutate,
  }
}

// Hook to get plate colors sorted by price (cheapest first)
export function usePlateColorsSortedByPrice(outletId?: string | null) {
  const params = { sortBy: 'price', sortOrder: 'asc' }
  // Aturan yang sama dengan usePlateColors, hanya key-nya ikut membawa params.
  // `outletId ?? 'all'` yang lama menyamakan "" dengan mode admin — dan di sini
  // taruhannya harga, jadi salah brand berarti salah harga di layar.
  const scoped = outletScopedKey(PLATE_COLORS_KEY, outletId)
  const key = scoped === null ? null : ([...(Array.isArray(scoped) ? scoped : [scoped]), params] as const)

  const { data, error, isLoading, mutate } = useSWR(key, async () => {
    if (outletId) {
      return plateColorsService.getForOutlet(outletId, params)
    }

    const colors = await plateColorsService.getAll(params)
    return colors.data
  })

  return {
    plateColors: data || [],
    isLoading,
    error,
    refresh: mutate,
  }
}
