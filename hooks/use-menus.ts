import useSWR from 'swr'
import { menusService, type CreateMenuDTO, type UpdateMenuDTO } from '@/lib/api'
import type { SushiMenu } from '@/lib/types'

const MENUS_KEY = '/master/menu'

export function useMenus() {
  const { data, error, isLoading, mutate } = useSWR<SushiMenu[]>(MENUS_KEY, async () => {
    const response = await menusService.getAll()
    return response.data
  })

  const createMenu = async (menuData: CreateMenuDTO): Promise<SushiMenu> => {
    const response = await menusService.create(menuData)
    await mutate()
    return response.data
  }

  const updateMenu = async (id: string, menuData: UpdateMenuDTO): Promise<SushiMenu> => {
    const response = await menusService.update(id, menuData)
    await mutate()
    return response.data
  }

  const deleteMenu = async (id: string): Promise<void> => {
    await menusService.delete(id)
    await mutate()
  }

  const uploadMenuImage = async (id: string, imageFile: File): Promise<string> => {
    const imagePath = await menusService.uploadImage(id, imageFile)
    await mutate()
    return imagePath
  }

  return {
    menus: data || [],
    isLoading,
    error,
    createMenu,
    updateMenu,
    deleteMenu,
    uploadMenuImage,
    refresh: mutate,
  }
}
