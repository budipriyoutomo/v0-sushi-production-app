import useSWR from 'swr'
import {
  productionService,
  type ProductionPlanRow,
  type ConveyorItem,
  type WasteRecord,
} from '@/lib/api'

const PRODUCTION_KEY = '/production'

export function useProductionPlan(outletId: string | null, date: string | null) {
  const { data, error, isLoading, mutate } = useSWR<ProductionPlanRow[]>(
    outletId && date ? `${PRODUCTION_KEY}/plan/${outletId}/${date}` : null,
    async () => {
      if (!outletId || !date) return []
      const plan = await productionService.getPlan(outletId, date)
      return plan
    }
  )

  const savePlan = async (plan: ProductionPlanRow[]): Promise<void> => {
    if (!outletId || !date) return
    await productionService.savePlan(outletId, date, plan)
    await mutate()
  }

  return {
    plan: data || [],
    isLoading,
    error,
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
