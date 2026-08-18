import { BaseService } from '../base-service'
import { text } from '../transform'
import type { Outlet } from '@/lib/types'

export interface CreateOutletDTO {
  code: string
  name: string
  /** Kolom teks warisan — backend masih memvalidasinya. Dikirim bersama brand_id. */
  brand: string
  brand_id?: string
  address: string
  is_active: boolean
}

export interface UpdateOutletDTO {
  code?: string
  name?: string
  brand?: string
  brand_id?: string
  address?: string
  is_active?: boolean
}

// API response format (snake_case)
/**
 * Kolom-kolom teks diketik `string | number`: backend `BaseResource` menebak
 * tipe dari isi nilai, jadi kode outlet seperti `"01"` bisa datang sebagai
 * number — dan sebagai `1`, tanpa nol di depannya. Lihat `$textFields`.
 */
interface OutletApiResponse {
  id: string
  code: string | number
  name: string | number
  brand: string | number
  brand_id: string | null
  address: string | number
  is_active: boolean
  created_at: string
}

// Transform API response to frontend format
function transformOutlet(data: OutletApiResponse): Outlet {
  return {
    id: data.id,
    code: text(data.code),
    name: text(data.name),
    brand: text(data.brand),
    brandId: data.brand_id ?? null,
    address: text(data.address),
    isActive: data.is_active,
    createdAt: new Date(data.created_at),
  }
}

class OutletsService extends BaseService<Outlet, CreateOutletDTO, UpdateOutletDTO> {
  constructor() {
    super('/master/outlet')
  }

  // Override getAll to transform response
  async getAll(params?: Record<string, unknown>): Promise<{ data: Outlet[] }> {
    const response = await super.getAll(params)
    const transformedData = (response.data as unknown as OutletApiResponse[]).map(transformOutlet)
    return { ...response, data: transformedData }
  }

  // Override getById to transform response
  async getById(id: string | number): Promise<{ data: Outlet }> {
    const response = await super.getById(id)
    const transformedData = transformOutlet(response.data as unknown as OutletApiResponse)
    return { ...response, data: transformedData }
  }

  // Override create to transform response
  async create(data: CreateOutletDTO): Promise<{ data: Outlet }> {
    const response = await super.create(data)
    const transformedData = transformOutlet(response.data as unknown as OutletApiResponse)
    return { ...response, data: transformedData }
  }

  // Override update to transform response
  async update(id: string | number, data: UpdateOutletDTO): Promise<{ data: Outlet }> {
    const response = await super.update(id, data)
    const transformedData = transformOutlet(response.data as unknown as OutletApiResponse)
    return { ...response, data: transformedData }
  }

  /**
   * Balik status aktif outlet.
   *
   * Dulu memanggil `PATCH /master/outlet/{id}/toggle-status` — route yang tidak
   * pernah ada, jadi switch di layar Outlet Management selalu 404 dan hanya
   * memunculkan toast error. `Route::crud` hanya membuat index/store/show/
   * update/destroy.
   *
   * Tidak perlu route baru: `PUT /master/outlet/{id}` sudah menerima
   * `is_active` (lihat `OutletRequest`). Status sekarang diminta dari pemanggil
   * karena server tidak punya endpoint yang bisa membalikkannya sendiri —
   * pemanggil yang tahu nilai yang sedang tampil.
   */
  async toggleStatus(id: string, isActive: boolean): Promise<Outlet> {
    const response = await this.update(id, { is_active: !isActive })
    return response.data
  }

  // Get active outlets only
  async getActive(): Promise<Outlet[]> {
    const response = await this.getAll({ is_active: true })
    return response.data
  }
}

export const outletsService = new OutletsService()
