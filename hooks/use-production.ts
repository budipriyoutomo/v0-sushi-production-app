import useSWR from 'swr'
import {
  productionService,
  type ProductionPlanRow,
  type WasteRecord,
  type ProductionStats,
  type ProductionItemGroup,
  type BulkExpiredResult,
} from '@/lib/api'

const PRODUCTION_KEY = '/production'

export function useProductionStats(outletId: string | null) {
  const { data, error, isLoading, mutate } = useSWR<ProductionStats[]>(
    outletId ? `${PRODUCTION_KEY}/stats/${outletId}` : null,
    async () => {
      if (!outletId) return []
      const stats = await productionService.getStats(outletId)
      return stats
    },
    {
      refreshInterval: 30000, // Refresh every 30 seconds
    }
  )

  return {
    stats: data || [],
    isLoading,
    error,
    refresh: mutate,
  }
}
export function useProductionPlan(outletId: string | null, date: string | null) {
  const key = outletId && date 
    ? [PRODUCTION_KEY, outletId, date] 
    : null

  const { data, error, isLoading, mutate } = useSWR<ProductionPlanRow[]>(
    key,
    async ([_, outletId, date]) => {
      return await productionService.getPlan(outletId, date)
    },
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
    }
  )

  const savePlan = async (plan: ProductionPlanRow[]): Promise<void> => {
    if (!outletId || !date) return

    try {
      await mutate(async () => {
        await productionService.savePlan(outletId, date, plan)
        return plan
      }, {
        optimisticData: plan,
        rollbackOnError: true,
        revalidate: true,
      })
    } catch (error) {
      console.error(error)
      throw error
    }
  }

  return {
    plan: data,
    isLoading,
    error,
    isEmpty: data?.length === 0,
    savePlan,
    refresh: mutate,
  }
}

/**
 * Conveyor sebagai batch produksi.
 *
 * Satu piring adalah satu baris di backend, jadi bentuk per-piring berarti
 * seribu objek tiap 30 detik per tablet. Bentuk itu sudah dibuang; ini
 * satu-satunya cara membaca belt.
 */
export function useConveyorGroups(outletId: string | null) {
  const { data, error, isLoading, mutate } = useSWR<ProductionItemGroup[]>(
    outletId ? `${PRODUCTION_KEY}/conveyor-grouped/${outletId}` : null,
    async () => {
      if (!outletId) return []
      return await productionService.getConveyorGroups(outletId)
    },
    {
      refreshInterval: 30000,
    }
  )

  const produceItem = async (menuId: string, quantity: number): Promise<void> => {
    if (!outletId) return
    await productionService.produceItem({ menuId, quantity, outletId })
    await mutate()
  }

  const closeDay = async (): Promise<number> => {
    if (!outletId) return 0
    const closed = await productionService.closeDay(outletId)
    await mutate()
    return closed
  }

  /**
   * Buang sebagian piring dari satu batch.
   *
   * Dua panggilan berurutan karena backend memang memisahkannya: `/waste`
   * menulis alasannya ke `waste_records`, `mark-waste` menutup piringnya.
   * Keduanya sudah menerima array id, jadi satu batch tetap dua request —
   * bukan dua request per piring.
   */
  const wasteItems = async (itemIds: string[], reason: string): Promise<void> => {
    if (itemIds.length === 0) return
    await productionService.recordWaste({ itemIds, reason })
    await productionService.markWaste(itemIds)
    await mutate()
  }

  return {
    groups: data || [],
    isLoading,
    error,
    produceItem,
    closeDay,
    wasteItems,
    refresh: mutate,
  }
}

/**
 * Expired items sebagai batch produksi.
 *
 * Daftar inilah yang paling menumpuk: conveyor hanya menahan piring dalam shelf
 * life, sedangkan expired terus bertambah sepanjang hari sampai operator
 * menutupnya.
 */
export function useExpiredGroups(outletId: string | null) {
  const { data, error, isLoading, mutate } = useSWR<ProductionItemGroup[]>(
    outletId ? `${PRODUCTION_KEY}/expired-grouped/${outletId}` : null,
    async () => {
      if (!outletId) return []
      return await productionService.getExpiredGroups(outletId)
    },
    {
      refreshInterval: 30000,
      revalidateOnFocus: false,
    }
  )

  const updateItems = async (
    itemIds: string[],
    status: 'sold' | 'waste',
    notes?: string
  ): Promise<BulkExpiredResult> => {
    const result = await productionService.updateExpiredBulk(itemIds, status, notes)
    await mutate()
    return result
  }

  return {
    groups: data || [],
    isLoading,
    error,
    updateItems,
    refresh: mutate,
  }
}

export function useWasteRecords(outletId: string | null, startDate: string | null, endDate: string | null) {
  const { data, error, isLoading, mutate } = useSWR<WasteRecord[]>(
    outletId && startDate && endDate ? `${PRODUCTION_KEY}/waste/${outletId}/${startDate}/${endDate}` : null,
    async () => {
      if (!outletId || !startDate || !endDate) return []
      const records = await productionService.getWasteRecords(outletId, startDate, endDate)
      return records
    }
  )

  const recordWaste = async (itemIds: string[], reason: string): Promise<WasteRecord | null> => {
    if (!outletId) return null
    const record = await productionService.recordWaste({ itemIds, reason })
    await mutate()
    return record
  }

  return {
    records: data || [],
    isLoading,
    error,
    recordWaste,
    refresh: mutate,
  }
}

