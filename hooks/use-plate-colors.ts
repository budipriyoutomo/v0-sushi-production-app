import useSWR from 'swr'
import { plateColorsService, type CreatePlateColorDTO, type UpdatePlateColorDTO } from '@/lib/api'
import type { PlateColorConfig } from '@/lib/types'

const PLATE_COLORS_KEY = '/plate-colors'

export function usePlateColors() {
  const { data, error, isLoading, mutate } = useSWR<PlateColorConfig[]>(PLATE_COLORS_KEY, async () => {
    const response = await plateColorsService.getAll()
    return response.data
  })

  const createPlateColor = async (colorData: CreatePlateColorDTO): Promise<PlateColorConfig> => {
    const response = await plateColorsService.create(colorData)
    await mutate()
    return response.data
  }

  const updatePlateColor = async (id: string, colorData: UpdatePlateColorDTO): Promise<PlateColorConfig> => {
    const response = await plateColorsService.update(id, colorData)
    await mutate()
    return response.data
  }

  const deletePlateColor = async (id: string): Promise<void> => {
    await plateColorsService.delete(id)
    await mutate()
  }

  const updatePrice = async (id: string, price: number): Promise<PlateColorConfig> => {
    const color = await plateColorsService.updatePrice(id, price)
    await mutate()
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
  const { data, error, isLoading, mutate } = useSWR<PlateColorConfig[]>(
    `${PLATE_COLORS_KEY}/sorted`,
    async () => {
      const colors = await plateColorsService.getSortedByPrice()
      return colors
    }
  )

  return {
    plateColors: data || [],
    isLoading,
    error,
    refresh: mutate,
  }
}
