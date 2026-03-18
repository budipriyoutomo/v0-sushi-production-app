import useSWR from 'swr'
import { outletsService, type CreateOutletDTO, type UpdateOutletDTO } from '@/lib/api'
import type { Outlet } from '@/lib/types'

const OUTLETS_KEY = '/master/outlet'

export function useOutlets() {
  const { data, error, isLoading, mutate } = useSWR<Outlet[]>(
    OUTLETS_KEY,
    async () => {
      const response = await outletsService.getAll()
      return response.data
    },
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      dedupingInterval: 60000, // 60 seconds deduplication
    }
  )

  const createOutlet = async (outletData: CreateOutletDTO): Promise<Outlet> => {
    const response = await outletsService.create(outletData)
    await mutate()
    return response.data
  }

  const updateOutlet = async (id: string, outletData: UpdateOutletDTO): Promise<Outlet> => {
    const response = await outletsService.update(id, outletData)
    await mutate()
    return response.data
  }

  const deleteOutlet = async (id: string): Promise<void> => {
    await outletsService.delete(id)
    await mutate()
  }

  const toggleOutletStatus = async (id: string): Promise<Outlet> => {
    const outlet = await outletsService.toggleStatus(id)
    await mutate()
    return outlet
  }

  return {
    outlets: data || [],
    isLoading,
    error,
    createOutlet,
    updateOutlet,
    deleteOutlet,
    toggleOutletStatus,
    refresh: mutate,
  }
}

export function useActiveOutlets() {
  const { data, error, isLoading, mutate } = useSWR<Outlet[]>(
    `${OUTLETS_KEY}/active`,
    async () => {
      const outlets = await outletsService.getActive()
      return outlets
    },
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      revalidateIfStale: false,
      dedupingInterval: 60000, // 60 seconds deduplication
    }
  )

  return {
    outlets: data || [],
    isLoading,
    error,
    refresh: mutate,
  }
}
