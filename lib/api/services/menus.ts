import { BaseService } from '../base-service'
import { text } from '../transform'
import type { SushiMenu } from '@/lib/types'

export interface CreateMenuDTO {
  code: string
  menuname: string
  description: string
  image?: File
  price: number
  shelf_life: number
  plate_color_id: string
  brand_id?: string
  is_active: boolean
}

export interface UpdateMenuDTO {
  code?: string
  menuname?: string
  description?: string
  image?: File
  price?: number
  shelf_life?: number
  plate_color_id?: string
  brand_id?: string
  is_active?: boolean
}

/**
 * API response format (snake_case).
 *
 * `code`, `menuname` dan `description` diketik `string | number` dengan sengaja.
 * Kolomnya `varchar` di database, tapi `BaseResource::formatValue()` di backend
 * menebak tipe dari isi nilai — nilai yang seluruhnya digit dikirim sebagai
 * number. Backend sudah dikecualikan lewat `$textFields`, tapi tipe di sini
 * tetap jujur soal apa yang bisa datang dari server lama atau respons yang
 * ter-cache service worker.
 */
interface MenuApiResponse {
  id: string
  code: string | number
  menuname: string | number
  description: string | number
  image?:  string
  price: number
  shelf_life: number
  plate_color_id: string
  plate_color?: {
    id: string
    platename: string | number
  }
  brand_id: string | null
  brand?: {
    id: string
    name: string
  } | null
  is_active: boolean
  created_at?: string
  image_url?: string
}

// Transform API response to frontend format
function transformMenu(data: MenuApiResponse): SushiMenu {
  return {
    id: data.id,
    code: text(data.code),
    menuname: text(data.menuname),
    description: text(data.description),
    image: data.image_url,
    price: data.price,
    shelfLife: data.shelf_life,
    plateColorId: data.plate_color_id,
    plateColorName: text(data.plate_color?.platename),
    brandId: data.brand_id ?? null,
    brandName: data.brand?.name,
    isActive: data.is_active,
  }
}

class MenusService extends BaseService<SushiMenu, CreateMenuDTO, UpdateMenuDTO> {
  constructor() {
    super('/master/menu')
  }

  // Override getAll to transform response
  async getAll(params?: Record<string, unknown>): Promise<{ data: SushiMenu[] }> {
    const response = await super.getAll(params)
    const transformedData = (response.data as unknown as MenuApiResponse[]).map(transformMenu)
    return { ...response, data: transformedData }
  }

  // Override getById to transform response
  async getById(id: string | number): Promise<{ data: SushiMenu }> {
    const response = await super.getById(id)
    const transformedData = transformMenu(response.data as unknown as MenuApiResponse)
    return { ...response, data: transformedData }
  }

  // Override create to transform response
  async create(data: CreateMenuDTO): Promise<{ data: SushiMenu }> {

    const formData = new FormData()

    formData.append('code', data.code)
    formData.append('menuname', data.menuname)
    formData.append('description', data.description)
    formData.append('price', String(data.price))
    formData.append('shelf_life', String(data.shelf_life))
    formData.append('plate_color_id', data.plate_color_id)
    if (data.brand_id) formData.append('brand_id', data.brand_id)
    formData.append('is_active', String(data.is_active ? 1 : 0))

    if (data.image) {
      formData.append('image', data.image)  
    }

    const response = await this.request('post', '', formData)

    const transformedData = transformMenu(response.data as unknown as MenuApiResponse)

    return { ...response, data: transformedData }
  }

  // Override update to transform response
  async update(id: string | number, data: UpdateMenuDTO): Promise<{ data: SushiMenu }> {

    const formData = new FormData()
    formData.append('_method', 'PUT')

    if (data.code !== undefined) formData.append('code', data.code)
    if (data.menuname !== undefined) formData.append('menuname', data.menuname)
    if (data.description !== undefined) formData.append('description', data.description)
    if (data.price !== undefined) formData.append('price', String(data.price))
    if (data.shelf_life !== undefined) formData.append('shelf_life', String(data.shelf_life))
    if (data.plate_color_id !== undefined) formData.append('plate_color_id', data.plate_color_id)
    if (data.brand_id !== undefined) formData.append('brand_id', data.brand_id)
    if (data.is_active !== undefined) formData.append('is_active', String(data.is_active ? 1 : 0))

    if (data.image) {
      formData.append('image', data.image)
    }

    const response = await this.request('post', `${id}`, formData)

    const transformedData = transformMenu(response.data as unknown as MenuApiResponse)

    return { ...response, data: transformedData }
  }

  // Get menus by plate color
  async getByPlateColorId(plateColorId: string): Promise<SushiMenu[]> {
    const response = await this.getAll({ plate_color_id: plateColorId })
    return response.data
  }

  /**
   * Menu milik brand outlet ini (plus yang belum punya brand).
   * `outlet_id` yang dikirim, bukan `brand_id` — pemetaan outlet → brand adalah
   * aturan bisnis dan hidup di backend.
   *
   * `per_page: 'all'` bukan optimasi, tapi syarat kebenaran: backend
   * (`BaseService::list()`) memaginasi 15 baris kalau tidak diminta lain, dan
   * layar dapur memakai daftar ini sebagai daftar produksi. Menu ke-16 dan
   * seterusnya tidak akan pernah bisa diproduksi — tanpa error, tanpa halaman
   * kedua. Pemanggil tetap bisa menimpanya lewat `params`.
   */
  async getForOutlet(outletId: string, params?: Record<string, unknown>): Promise<SushiMenu[]> {
    const response = await this.getAll({ per_page: 'all', ...params, outlet_id: outletId })
    return response.data
  }

  // CATATAN: `uploadImage()` dibuang. Ia memanggil
  // `PATCH /master/menu/{id}/image` — route yang tidak pernah ada. Gambar ikut
  // di `create()`/`update()` sebagai field `image` di FormData, dan hanya itu
  // jalur yang didukung backend.
}

export const menusService = new MenusService()
