import useSWR, { mutate } from 'swr'
import { wasteReasonsService, type WasteReason, type CreateWasteReasonDTO, type UpdateWasteReasonDTO } from '@/lib/api/services/waste-reasons'
import { emptyArray } from '@/lib/empty'

export const WASTE_REASONS_KEY = '/master/waste-reason'

/**
 * `withSystem` hanya untuk layar admin reason: ikut menampilkan reason sistem
 * (Auto-waste, Import backdate). Pemanggil lain — termasuk koreksi status —
 * tidak boleh menawarkannya, jadi default-nya tetap seperti dulu.
 */
export function useWasteReasons({ withSystem = false }: { withSystem?: boolean } = {}) {
  const { data, error, isLoading, mutate } = useSWR<WasteReason[]>(
    withSystem ? `${WASTE_REASONS_KEY}?with_system=1` : WASTE_REASONS_KEY,
    async () => {
      if (withSystem) {
        return wasteReasonsService.getAllWithSystem()
      }
      const response = await wasteReasonsService.getAll()
      return response.data
    }
  )

  const createWasteReason = async (data: CreateWasteReasonDTO): Promise<WasteReason> => {
    const response = await wasteReasonsService.create(data)
    await mutate()
    return response.data
  }

  const updateWasteReason = async (id: string, data: UpdateWasteReasonDTO): Promise<WasteReason> => {
    const response = await wasteReasonsService.update(id, data)
    await mutate()
    return response.data
  }

  const deleteWasteReason = async (id: string): Promise<void> => {
    await wasteReasonsService.delete(id)
    await mutate()
  }

  return {
    wasteReasons: data ?? emptyArray(),
    isLoading,
    error,
    createWasteReason,
    updateWasteReason,
    deleteWasteReason,
    refresh: mutate,
  }
}

export function useActiveWasteReasons() {
  const { data, error, isLoading } = useSWR<WasteReason[]>(
    `${WASTE_REASONS_KEY}/active`,
    async () => {
      return await wasteReasonsService.getActive()
    }
  )

  return {
    wasteReasons: data ?? emptyArray(),
    isLoading,
    error,
    refresh:mutate,
  }
}
