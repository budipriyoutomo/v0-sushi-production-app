import useSWR from 'swr'
import { menusService, type CreateMenuDTO, type UpdateMenuDTO } from '@/lib/api'
import type { SushiMenu } from '@/lib/types'
import { outletScopedKey } from './use-outlet-scoped-key'

const MENUS_KEY = '/master/menu'

/**
 * `outletId` menentukan brand mana yang terlihat, dan ikut jadi bagian cache key.
 *
 * Key statis adalah bug: begitu menu jadi milik brand tertentu, berpindah outlet
 * akan menampilkan menu brand sebelumnya dari cache — dapur melihat piring yang
 * tidak dijual di tempatnya, dengan harga yang salah.
 *
 * Tanpa `outletId` (layar admin) tidak ada penyaringan: master menampilkan
 * semua brand. `outletId` kosong justru sebaliknya — lihat `outletScopedKey()`.
 */

export function useMenus(outletId?: string | null) {
  const key = outletScopedKey(MENUS_KEY, outletId)

  const { data, error, isLoading, mutate } = useSWR<SushiMenu[]>(key, async () => {
    const response = outletId
      ? { data: await menusService.getForOutlet(outletId) }
      // `per_page: 'all'` wajib: backend memaginasi 15 baris kalau tidak
      // diminta lain, sementara layar master menyaring, mengurutkan, dan
      // memaginasi di sisi klien. Tanpa ini pencarian hanya melihat 15 menu
      // pertama dan menu selebihnya seolah tidak ada — sama seperti
      // `usePlateColors` dan `useBrands` yang sudah memintanya.
      : await menusService.getAll({ per_page: 'all' })

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

  // `uploadMenuImage` dibuang bersama method service yang dibungkusnya — route
  // `PATCH /master/menu/{id}/image` tidak pernah ada. Gambar dikirim lewat
  // `updateMenu(id, { image })`.

  return {
    menus: data || [],
    isLoading,
    error,
    createMenu,
    updateMenu,
    deleteMenu,
    refresh: mutate,
  }
}
