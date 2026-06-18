import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from 'axios'
import { config, getAuthToken, removeAuthToken } from '@/lib/config'
import { isTransientApiError } from '@/services/api-errors'
import { logOperationalError } from '@/services/error-logger'

function isMutatingRequest(method?: string) {
  return ['post', 'put', 'patch'].includes(String(method || '').toLowerCase())
}

// Create axios instance with base configuration
const apiClient: AxiosInstance = axios.create({
  baseURL: config.api.baseUrl,
  timeout: config.api.timeout,
  headers: {
    Accept: 'application/json',
  },
})

// Request interceptor - add auth token to all requests
apiClient.interceptors.request.use(
  async (requestConfig: InternalAxiosRequestConfig) => {
    const token = getAuthToken()
    if (token && requestConfig.headers) {
      requestConfig.headers.Authorization = `Bearer ${token}`
    }

    if (isMutatingRequest(requestConfig.method) && requestConfig.headers && !requestConfig.headers['X-Client-Request-Id']) {
      const { createRequestId } = await import('@/services/offline-queue')
      requestConfig.headers['X-Client-Request-Id'] = createRequestId()
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
  async (error: AxiosError) => {
    const requestConfig = error.config

    if (
      requestConfig &&
      isMutatingRequest(requestConfig.method) &&
      !requestConfig.skipOfflineQueue &&
      isTransientApiError(error)
    ) {
      const { enqueueOfflineRequest } = await import('@/services/offline-queue')
      const queuedRequest = await enqueueOfflineRequest(requestConfig)

      if (queuedRequest) {
        logOperationalError({
          level: 'warning',
          message: 'Queued failed mutation for retry',
          error,
          context: { url: requestConfig.url, method: requestConfig.method },
        })
      }
    }

    if (error.response?.status === 401) {
      // Token expired or invalid. Do not hard redirect here; route guards will
      // handle session state after auth restoration confirms the token is bad.
      removeAuthToken()
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
