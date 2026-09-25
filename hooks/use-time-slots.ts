import useSWR from 'swr'
import {
  timeSlotsService,
  type CreateTimeSlotDTO,
  type TimeSettingsSummary,
  type TimeSlot,
  type UpdateTimeSlotDTO,
} from '@/lib/api'
import { outletScopedKey } from './use-outlet-scoped-key'
import { emptyArray } from '@/lib/empty'

const TIME_SLOTS_KEY = '/master/time-slot'
const TIME_SETTINGS_SUMMARY_KEY = '/master/time-settings/summary'

/**
 * Slot produksi milik brand outlet ini.
 *
 * `outletId` ikut jadi bagian cache key, aturan yang sama dengan `useMenus` dan
 * `usePlateColors`: key statis berarti berpindah outlet menampilkan slot brand
 * sebelumnya dari cache. Di sini akibatnya bukan sekadar daftar yang salah —
 * penanda di conveyor dihitung dari slot ini, jadi piring akan memakai warna
 * milik brand lain.
 *
 * Tanpa `outletId` (layar admin) semua brand ditampilkan.
 */
export function useTimeSlots(outletId?: string | null) {
  const key = outletScopedKey(TIME_SLOTS_KEY, outletId)

  const { data, error, isLoading, mutate } = useSWR<TimeSlot[]>(key, async () => {
    if (outletId) {
      return timeSlotsService.getForOutlet(outletId)
    }

    const response = await timeSlotsService.getAll({ per_page: 'all' })
    return response.data
  })

  const createTimeSlot = async (payload: CreateTimeSlotDTO): Promise<TimeSlot> => {
    const response = await timeSlotsService.create(payload)
    await mutate()
    return response.data
  }

  const updateTimeSlot = async (id: string, payload: UpdateTimeSlotDTO): Promise<TimeSlot> => {
    const response = await timeSlotsService.update(id, payload)
    await mutate()
    return response.data
  }

  const deleteTimeSlot = async (id: string): Promise<void> => {
    await timeSlotsService.delete(id)
    await mutate()
  }

  return {
    timeSlots: data ?? emptyArray(),
    isLoading,
    error,
    createTimeSlot,
    updateTimeSlot,
    deleteTimeSlot,
    refresh: mutate,
  }
}

/**
 * Slot milik satu brand — sudut pandang halaman setelan admin.
 *
 * Key-nya membawa `brandId` dan bernilai `null` selama brand belum dipilih,
 * jadi SWR tidak fetch sama sekali. Sama seperti `outletScopedKey()`: tanpa
 * penyaring, yang datang adalah slot SEMUA brand — dan di halaman yang tugasnya
 * mengedit, itu berarti admin bisa mengubah baris milik brand yang tidak sedang
 * dibukanya.
 */
export function useTimeSlotsByBrand(brandId?: string | null) {
  const key = brandId ? ([TIME_SLOTS_KEY, 'brand', brandId] as const) : null

  const { data, error, isLoading, mutate } = useSWR<TimeSlot[]>(key, () =>
    timeSlotsService.getForBrand(brandId as string)
  )

  const createTimeSlot = async (payload: CreateTimeSlotDTO): Promise<TimeSlot> => {
    const response = await timeSlotsService.create(payload)
    await mutate()
    return response.data
  }

  const updateTimeSlot = async (id: string, payload: UpdateTimeSlotDTO): Promise<TimeSlot> => {
    const response = await timeSlotsService.update(id, payload)
    await mutate()
    return response.data
  }

  const deleteTimeSlot = async (id: string): Promise<void> => {
    await timeSlotsService.delete(id)
    await mutate()
  }

  return {
    timeSlots: data ?? emptyArray(),
    isLoading,
    error,
    createTimeSlot,
    updateTimeSlot,
    deleteTimeSlot,
    refresh: mutate,
  }
}

/** Peringatan siklus penanda untuk satu brand. */
export function useTimeSettingsSummaryByBrand(brandId?: string | null) {
  const key = brandId ? ([TIME_SETTINGS_SUMMARY_KEY, 'brand', brandId] as const) : null

  const { data, error, isLoading, mutate } = useSWR<TimeSettingsSummary>(key, () =>
    timeSlotsService.getSummaryForBrand(brandId as string)
  )

  return {
    summary: data ?? null,
    isLoading,
    error,
    refresh: mutate,
  }
}

/**
 * Peringatan siklus penanda untuk satu outlet.
 *
 * Dipisahkan dari daftar slot karena jawabannya bukan daftar, dan layar setelan
 * perlu menyegarkannya setiap kali slot atau penanda berubah.
 */
export function useTimeSettingsSummary(outletId?: string | null) {
  const key = outletScopedKey(TIME_SETTINGS_SUMMARY_KEY, outletId ?? null)

  const { data, error, isLoading, mutate } = useSWR<TimeSettingsSummary>(key, () =>
    timeSlotsService.getSummary(outletId as string)
  )

  return {
    summary: data ?? null,
    isLoading,
    error,
    refresh: mutate,
  }
}
