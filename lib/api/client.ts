import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from 'axios'
import { config, getAuthToken, removeAuthToken } from '@/lib/config'

// Create axios instance with base configuration
const apiClient: AxiosInstance = axios.create({
  baseURL: config.api.baseUrl,
  timeout: config.api.timeout,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor - add auth token to all requests
apiClient.interceptors.request.use(
  (requestConfig: InternalAxiosRequestConfig) => {
    const token = getAuthToken()
    if (token && requestConfig.headers) {
      requestConfig.headers.Authorization = `Bearer ${token}`
    }
    return requestConfig
  },
  (error: AxiosError) => {
    return Promise.reject(error)
  }
)

// Response interceptor - handle errors globally
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      // Token expired or invalid - clear auth and redirect to login
      removeAuthToken()
      if (typeof window !== 'undefined') {
        window.location.href = '/login'
      }
    }
    return Promise.reject(error)
  }
)

export default apiClient

// API Error type for consistent error handling
export interface ApiError {
  message: string
  status: number
  errors?: Record<string, string[]>
}

// Helper to extract error message from axios error
export function getApiError(error: unknown): ApiError {
  if (axios.isAxiosError(error)) {
    return {
      message: error.response?.data?.message || error.message || 'An error occurred',
      status: error.response?.status || 500,
      errors: error.response?.data?.errors,
    }
  }
  return {
    message: error instanceof Error ? error.message : 'An unknown error occurred',
    status: 500,
  }
}
