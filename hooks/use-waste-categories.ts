import useSWR, { mutate as globalMutate } from 'swr'
import {
  wasteCategoriesService,
  type CreateWasteCategoryDTO,
  type UpdateWasteCategoryDTO,
  type WasteCategory,
} from '@/lib/api/services/waste-categories'
import { WASTE_REASONS_KEY } from '@/hooks/use-waste-reasons'
import { emptyArray } from '@/lib/empty'

const WASTE_CATEGORIES_KEY = '/master/waste-category'

/**
 * Master kategori waste. Global (tidak per outlet/brand), jadi key-nya statis.
 *
 * Mengubah kategori ikut menyegarkan cache reason: nama kategori ditampilkan
 * di baris reason, dan cache itu dipegang hook lain.
 */
export function useWasteCategories() {
  const { data, error, isLoading, mutate } = useSWR<WasteCategory[]>(
    WASTE_CATEGORIES_KEY,
    () => wasteCategoriesService.list()
  )

  const refreshReasons = () =>
    globalMutate((key) => typeof key === 'string' && key.startsWith(WASTE_REASONS_KEY))

  const createWasteCategory = async (dto: CreateWasteCategoryDTO): Promise<WasteCategory> => {
    const response = await wasteCategoriesService.create(dto)
    await mutate()
    return response.data
  }

  const updateWasteCategory = async (id: string, dto: UpdateWasteCategoryDTO): Promise<WasteCategory> => {
    const response = await wasteCategoriesService.update(id, dto)
    await Promise.all([mutate(), refreshReasons()])
    return response.data
  }

  const deleteWasteCategory = async (id: string): Promise<void> => {
    await wasteCategoriesService.delete(id)
    await mutate()
  }

  return {
    wasteCategories: data ?? emptyArray<WasteCategory>(),
    isLoading,
    error,
    createWasteCategory,
    updateWasteCategory,
    deleteWasteCategory,
    refresh: mutate,
  }
}
