import useSWR from 'swr'
import {
  productionService,
  type ProductionPlanRow,
  type ConveyorItem,
  type WasteRecord,
  type ProductionStats,
  type ExpiredItem,
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

export function useConveyorItems(outletId: string | null) {
  const { data, error, isLoading, mutate } = useSWR<ConveyorItem[]>(
    outletId ? `${PRODUCTION_KEY}/conveyor/${outletId}` : null,
    async () => {
      if (!outletId) return []
      const items = await productionService.getConveyorItems(outletId)
      return items
    },
    {
      refreshInterval: 30000, // Refresh every 30 seconds
    }
  )

  const produceItem = async (menuId: string, quantity: number): Promise<void> => {
    if (!outletId) return
    await productionService.produceItem({ menuId, quantity, outletId })
    await mutate()
  }

  const removeExpiredItems = async (itemIds: string[]): Promise<void> => {
    await productionService.removeExpired(itemIds)
    await mutate()
  }

  return {
    items: data || [],
    isLoading,
    error,
    produceItem,
    removeExpiredItems,
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

  const recordWaste = async (menuId: string, quantity: number, reason: string): Promise<WasteRecord | null> => {
    if (!outletId) return null
    const record = await productionService.recordWaste({ menuId, quantity, reason, outletId })
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

export function useExpiredItems(outletId: string | null) {
  const { data, error, isLoading, mutate } = useSWR<ExpiredItem[]>(
    outletId ? `${PRODUCTION_KEY}/expired/${outletId}` : null,
    async () => {
      if (!outletId) return []
      const items = await productionService.getExpiredItems(outletId)
      return items
    },
    {
      refreshInterval: 30000, // Refresh every 30 seconds
      revalidateOnFocus: false,
    }
  )

  const updateExpiredItem = async (
    itemId: string,
    status: 'sold' | 'waste',
    notes: string
  ): Promise<ExpiredItem | null> => {
    try {
      const item = await productionService.updateExpiredItem(itemId, { status, notes })
      await mutate()
      return item
    } catch (err) {
      throw err
    }
  }

  const removeExpiredItem = async (itemId: string): Promise<void> => {
    await productionService.removeExpiredItem(itemId)
    await mutate()
  }

  return {
    expiredItems: data || [],
    isLoading,
    error,
    updateExpiredItem,
    removeExpiredItem,
    refresh: mutate,
  }
}
