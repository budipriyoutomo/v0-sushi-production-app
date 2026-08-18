import useSWR from 'swr'
import { brandsService, type CreateBrandDTO, type UpdateBrandDTO } from '@/lib/api'
import type { Brand } from '@/lib/types'

const BRANDS_KEY = '/master/brand'

export function useBrands() {
  const { data, error, isLoading, mutate } = useSWR<Brand[]>(BRANDS_KEY, async () => {
    const response = await brandsService.getAll({ per_page: 'all' })
    return response.data
  })

  const createBrand = async (brandData: CreateBrandDTO): Promise<Brand> => {
    const response = await brandsService.create(brandData)
    await mutate()
    return response.data
  }

  const updateBrand = async (id: string, brandData: UpdateBrandDTO): Promise<Brand> => {
    const response = await brandsService.update(id, brandData)
    await mutate()
    return response.data
  }

  const deleteBrand = async (id: string): Promise<void> => {
    await brandsService.delete(id)
    await mutate()
  }

  return {
    brands: data || [],
    isLoading,
    error,
    createBrand,
    updateBrand,
    deleteBrand,
    refresh: mutate,
  }
}
