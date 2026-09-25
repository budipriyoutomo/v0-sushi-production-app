import { BaseService } from '../base-service'
import { text } from '../transform'
import {
  transformTimeMarker,
  type TimeMarker,
  type TimeMarkerApiResponse,
} from './time-markers'

/**
 * Satu slot produksi milik satu brand.
 *
 * `label` ("10:00-10:30") dibuat backend, bukan di sini. Bentuk itulah yang
 * tersimpan di `production_plans.time_slot`, dan dua tempat yang menyusunnya
 * berarti dua ejaan yang akhirnya tidak pernah cocok.
 */
export interface TimeSlot {
  id: string
  brandId: string
  /** "HH:MM:SS" — jam dinding, bukan titik waktu. */
  startTime: string
  endTime: string
  /** "HH:MM-HH:MM", dibuat backend. */
  label: string
  marker: TimeMarker | null
  sortOrder: number
  isActive: boolean
}

export interface CreateTimeSlotDTO {
  brand_id: string
  start_time: string
  end_time: string
  time_marker_id?: string | null
  sort_order?: number
  is_active?: boolean
}

export type UpdateTimeSlotDTO = Partial<CreateTimeSlotDTO>

/**
 * Ringkasan siklus penanda.
 *
 * `repeatMinutes` adalah jarak terpendek antara dua slot berpenanda sama.
 * `null` berarti tidak ada penanda yang dipakai dua kali — tidak ada batas yang
 * bisa dilanggar.
 */
export interface TimeSettingsSummary {
  repeatMinutes: number | null
  longestShelfLife: number
  ok: boolean
  message: string | null
}

interface TimeSlotApiResponse {
  id: string
  brand_id: string
  start_time: string | number
  end_time: string | number
  label: string | number
  marker?: TimeMarkerApiResponse | null
  sort_order: number
  is_active: boolean
}

function transformTimeSlot(data: TimeSlotApiResponse): TimeSlot {
  return {
    id: data.id,
    brandId: data.brand_id,
    startTime: text(data.start_time),
    endTime: text(data.end_time),
    label: text(data.label),
    marker: data.marker ? transformTimeMarker(data.marker) : null,
    sortOrder: data.sort_order ?? 0,
    isActive: data.is_active,
  }
}

class TimeSlotsService extends BaseService<TimeSlot, CreateTimeSlotDTO, UpdateTimeSlotDTO> {
  constructor() {
    super('/master/time-slot')
  }

  async getAll(params?: Record<string, unknown>): Promise<{ data: TimeSlot[] }> {
    const response = await super.getAll(params)
    const data = (response.data as unknown as TimeSlotApiResponse[]).map(transformTimeSlot)
    return { ...response, data }
  }

  async create(payload: CreateTimeSlotDTO): Promise<{ data: TimeSlot }> {
    const response = await super.create(payload)
    return { ...response, data: transformTimeSlot(response.data as unknown as TimeSlotApiResponse) }
  }

  async update(id: string, payload: UpdateTimeSlotDTO): Promise<{ data: TimeSlot }> {
    const response = await super.update(id, payload)
    return { ...response, data: transformTimeSlot(response.data as unknown as TimeSlotApiResponse) }
  }

  /** Slot milik brand outlet ini, sudah terurut jam oleh backend. */
  async getForOutlet(outletId: string): Promise<TimeSlot[]> {
    const response = await this.getAll({ per_page: 'all', outlet_id: outletId })
    return response.data
  }

  /** Slot milik satu brand — halaman setelan admin tidak punya outlet. */
  async getForBrand(brandId: string): Promise<TimeSlot[]> {
    const response = await this.getAll({ per_page: 'all', brand_id: brandId })
    return response.data
  }

  /**
   * Apakah penanda berulang lebih cepat daripada umur piring terpanjang.
   *
   * Endpoint terpisah karena jawabannya bukan daftar, dan layar setelan
   * memakainya untuk memperingatkan — bukan untuk melarang.
   */
  async getSummary(outletId: string): Promise<TimeSettingsSummary> {
    return this.fetchSummary({ outlet_id: outletId })
  }

  /** Sudut pandang halaman setelan admin: brand, tanpa outlet. */
  async getSummaryForBrand(brandId: string): Promise<TimeSettingsSummary> {
    return this.fetchSummary({ brand_id: brandId })
  }

  private async fetchSummary(params: Record<string, string>): Promise<TimeSettingsSummary> {
    const response = await this.request<TimeSettingsSummary>(
      'get',
      '/master/time-settings/summary',
      undefined,
      { params }
    )

    return response.data
  }
}

export const timeSlotsService = new TimeSlotsService()
