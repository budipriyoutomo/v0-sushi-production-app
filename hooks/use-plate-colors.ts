import useSWR from 'swr'
import {
  plateColorsService,
  productionService,
  type CreatePlateColorDTO,
  type UpdatePlateColorDTO,
} from '@/lib/api'
import type { PlateColorConfig } from '@/lib/types'

const PLATE_COLORS_KEY = '/master/platecolor'

export function usePlateColors() {
  const { data, error, isLoading, mutate } = useSWR<PlateColorConfig[]>(PLATE_COLORS_KEY, async () => {
    const response = await plateColorsService.getAll()
    return response.data
  })

  // productionService keeps its own platename -> id map for savePlan(). Drop it
  // whenever the master changes, or planning breaks until a page reload.
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

  const updatePrice = async (id: string, price: number): Promise<PlateColorConfig> => {
    const color = await plateColorsService.updatePrice(id, price)
    await revalidate()
    return color
  }

  return {
    plateColors: data || [],
    isLoading,
    error,
    createPlateColor,
    updatePlateColor,
    deletePlateColor,
    updatePrice,
    refresh: mutate,
  }
}

// Hook to get plate colors sorted by price (cheapest first)
export function usePlateColorsSortedByPrice() {
  const key = [PLATE_COLORS_KEY, { sortBy: 'price', sortOrder: 'asc' }]

  const { data, error, isLoading, mutate } = useSWR(
    key,
    async ([_, params]: [string, Record<string, unknown>]) => {
      const colors = await plateColorsService.getAll(params)
      return colors.data
    }
  )

  return {
    plateColors: data || [],
    isLoading,
    error,
    refresh: mutate,
  }
}
