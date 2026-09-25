import { BaseService } from '../base-service'
import { text } from '../transform'

/**
 * Penanda waktu — lingkaran warna yang menempel ke piring supaya staf tahu
 * piring itu dibuat di slot yang mana.
 *
 * Dulu daftarnya dikunci mati di tiga komponen sekaligus. Sekarang miliknya
 * brand, jadi dapur yang menu-nya berumur panjang bisa menambah warna keenam.
 */
export interface TimeMarker {
  id: string
  brandId: string
  label: string
  colorHex: string
  sortOrder: number
  isActive: boolean
}

export interface CreateTimeMarkerDTO {
  brand_id: string
  label: string
  color_hex: string
  sort_order?: number
  is_active?: boolean
}

export type UpdateTimeMarkerDTO = Partial<CreateTimeMarkerDTO>

/**
 * `label` bisa datang sebagai number: backend menebak tipe dari isi nilai, dan
 * sebagian dapur memberi nomor pada penandanya, bukan nama warna. Backend sudah
 * mendaftarkannya di `$textFields`, tapi service worker menyimpan respons versi
 * sebelumnya sampai lima menit setelah deploy.
 */
export interface TimeMarkerApiResponse {
  id: string
  brand_id: string
  label: string | number
  color_hex: string | number
  sort_order: number
  is_active: boolean
}

export function transformTimeMarker(data: TimeMarkerApiResponse): TimeMarker {
  return {
    id: data.id,
    brandId: data.brand_id,
    label: text(data.label),
    colorHex: text(data.color_hex),
    sortOrder: data.sort_order ?? 0,
    isActive: data.is_active,
  }
}

class TimeMarkersService extends BaseService<TimeMarker, CreateTimeMarkerDTO, UpdateTimeMarkerDTO> {
  constructor() {
    super('/master/time-marker')
  }

  async getAll(params?: Record<string, unknown>): Promise<{ data: TimeMarker[] }> {
    const response = await super.getAll(params)
    const data = (response.data as unknown as TimeMarkerApiResponse[]).map(transformTimeMarker)
    return { ...response, data }
  }

  async create(payload: CreateTimeMarkerDTO): Promise<{ data: TimeMarker }> {
    const response = await super.create(payload)
    return { ...response, data: transformTimeMarker(response.data as unknown as TimeMarkerApiResponse) }
  }

  async update(id: string, payload: UpdateTimeMarkerDTO): Promise<{ data: TimeMarker }> {
    const response = await super.update(id, payload)
    return { ...response, data: transformTimeMarker(response.data as unknown as TimeMarkerApiResponse) }
  }

  /**
   * Penanda milik brand outlet ini.
   *
   * Yang dikirim `outlet_id`, bukan `brand_id` — pemetaan outlet → brand adalah
   * aturan bisnis dan hidup di backend. `per_page: 'all'` karena default
   * backend 15 baris, dan daftar penanda memang dipakai utuh.
   */
  async getForOutlet(outletId: string): Promise<TimeMarker[]> {
    const response = await this.getAll({ per_page: 'all', outlet_id: outletId })
    return response.data
  }

  /**
   * Penanda milik satu brand, ditanya langsung.
   *
   * Dipakai halaman setelan admin, yang bekerja per brand dan tidak punya
   * outlet sama sekali. `brand_id` ada di `$searchable` backend, jadi ini
   * filter langsung — bukan endpoint baru.
   */
  async getForBrand(brandId: string): Promise<TimeMarker[]> {
    const response = await this.getAll({ per_page: 'all', brand_id: brandId })
    return response.data
  }
}

export const timeMarkersService = new TimeMarkersService()
