import apiClient from './client'
import type { AxiosRequestConfig } from 'axios'

// Generic API response wrapper
export interface ApiResponse<T> {
  data: T
  message?: string
  meta?: {
    total?: number
    page?: number
    perPage?: number
    lastPage?: number
  }
}

// Base service class with common CRUD operations
export class BaseService<T, CreateDTO = Partial<T>, UpdateDTO = Partial<T>> {
  protected endpoint: string

  constructor(endpoint: string) {
    this.endpoint = endpoint
  }

  // GET all items
  async getAll(params?: Record<string, unknown>): Promise<ApiResponse<T[]>> {
    const response = await apiClient.get<ApiResponse<T[]>>(this.endpoint, { params })
    return response.data
  }

  // GET single item by ID
  async getById(id: string | number): Promise<ApiResponse<T>> {
    const response = await apiClient.get<ApiResponse<T>>(`${this.endpoint}/${id}`)
    return response.data
  }

  // POST create new item
  async create(data: CreateDTO): Promise<ApiResponse<T>> {
    const response = await apiClient.post<ApiResponse<T>>(this.endpoint, data)
    return response.data
  }

  // PUT/PATCH update existing item
  async update(id: string | number, data: UpdateDTO): Promise<ApiResponse<T>> {
    const response = await apiClient.put<ApiResponse<T>>(`${this.endpoint}/${id}`, data)
    return response.data
  }

  // DELETE item
  async delete(id: string | number): Promise<ApiResponse<void>> {
    const response = await apiClient.delete<ApiResponse<void>>(`${this.endpoint}/${id}`)
    return response.data
  }

  // Custom request method for non-standard endpoints
  protected async request<R>(
    method: 'get' | 'post' | 'put' | 'patch' | 'delete',
    path: string,
    data?: unknown,
    config?: AxiosRequestConfig
  ): Promise<ApiResponse<R>> {
    const url = path.startsWith('/') ? path : `${this.endpoint}/${path}`
    const response = await apiClient.request<ApiResponse<R>>({
      method,
      url,
      data,
      ...config,
    })
    return response.data
  }
}
