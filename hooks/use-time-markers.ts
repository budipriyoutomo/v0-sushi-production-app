import useSWR from 'swr'
import {
  timeMarkersService,
  type CreateTimeMarkerDTO,
  type TimeMarker,
  type UpdateTimeMarkerDTO,
} from '@/lib/api'
import { outletScopedKey } from './use-outlet-scoped-key'
import { emptyArray } from '@/lib/empty'

const TIME_MARKERS_KEY = '/master/time-marker'

/**
 * Penanda waktu milik brand outlet ini.
 *
 * `outletId` ikut ke cache key dengan alasan yang sama seperti `useTimeSlots`.
 * Tanpa `outletId` (layar admin) semua brand ditampilkan.
 */
export function useTimeMarkers(outletId?: string | null) {
  const key = outletScopedKey(TIME_MARKERS_KEY, outletId)

  const { data, error, isLoading, mutate } = useSWR<TimeMarker[]>(key, async () => {
    if (outletId) {
      return timeMarkersService.getForOutlet(outletId)
    }

    const response = await timeMarkersService.getAll({ per_page: 'all' })
    return response.data
  })

  const createTimeMarker = async (payload: CreateTimeMarkerDTO): Promise<TimeMarker> => {
    const response = await timeMarkersService.create(payload)
    await mutate()
    return response.data
  }

  const updateTimeMarker = async (id: string, payload: UpdateTimeMarkerDTO): Promise<TimeMarker> => {
    const response = await timeMarkersService.update(id, payload)
    await mutate()
    return response.data
  }

  const deleteTimeMarker = async (id: string): Promise<void> => {
    await timeMarkersService.delete(id)
    await mutate()
  }

  return {
    timeMarkers: data ?? emptyArray(),
    isLoading,
    error,
    createTimeMarker,
    updateTimeMarker,
    deleteTimeMarker,
    refresh: mutate,
  }
}

/**
 * Penanda milik satu brand — sudut pandang halaman setelan admin.
 *
 * Key bernilai `null` selama brand belum dipilih, jadi SWR tidak fetch. Lihat
 * alasannya di `useTimeSlotsByBrand`.
 */
export function useTimeMarkersByBrand(brandId?: string | null) {
  const key = brandId ? ([TIME_MARKERS_KEY, 'brand', brandId] as const) : null

  const { data, error, isLoading, mutate } = useSWR<TimeMarker[]>(key, () =>
    timeMarkersService.getForBrand(brandId as string)
  )

  const createTimeMarker = async (payload: CreateTimeMarkerDTO): Promise<TimeMarker> => {
    const response = await timeMarkersService.create(payload)
    await mutate()
    return response.data
  }

  const updateTimeMarker = async (id: string, payload: UpdateTimeMarkerDTO): Promise<TimeMarker> => {
    const response = await timeMarkersService.update(id, payload)
    await mutate()
    return response.data
  }

  const deleteTimeMarker = async (id: string): Promise<void> => {
    await timeMarkersService.delete(id)
    await mutate()
  }

  return {
    timeMarkers: data ?? emptyArray(),
    isLoading,
    error,
    createTimeMarker,
    updateTimeMarker,
    deleteTimeMarker,
    refresh: mutate,
  }
}
