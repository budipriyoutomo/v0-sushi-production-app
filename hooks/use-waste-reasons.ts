import useSWR, { mutate } from 'swr'
import { wasteReasonsService, type WasteReason, type CreateWasteReasonDTO, type UpdateWasteReasonDTO } from '@/lib/api/services/waste-reasons'

const WASTE_REASONS_KEY = '/master/waste-reason'

export function useWasteReasons() {
  const { data, error, isLoading, mutate } = useSWR<WasteReason[]>(
    WASTE_REASONS_KEY,
    async () => {
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
    wasteReasons: data || [],
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
    wasteReasons: data || [],
    isLoading,
    error,
    refresh:mutate,
  }
}
