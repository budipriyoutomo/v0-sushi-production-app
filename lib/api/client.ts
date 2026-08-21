import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from 'axios'
import { config, getAuthToken, removeAuthToken } from '@/lib/config'
import { isTransientApiError } from '@/services/api-errors'
import { logOperationalError } from '@/services/error-logger'

function isMutatingRequest(method?: string) {
  return ['post', 'put', 'patch'].includes(String(method || '').toLowerCase())
}

/**
 * Endpoint yang 401-nya berarti kredensial salah, bukan token basi.
 * Menyegarkan token di sini tidak masuk akal, dan untuk `/auth/refresh` sendiri
 * justru akan memanggil dirinya sendiri tanpa henti.
 */
function isAuthEndpoint(url?: string) {
  if (!url) return false
  return ['/login', '/login-pin', '/logout', '/auth/refresh'].some((path) => url.includes(path))
}

/**
 * Refresh yang sedang berjalan, dipakai bersama.
 *
 * Satu layar dapur menjalankan beberapa hook SWR sekaligus dan mem-poll tiap 30
 * detik, jadi ketika token mati bukan satu request yang kena 401 tapi semuanya
 * sekaligus. Tanpa berbagi satu percobaan, tiap request akan menukar token
 * masing-masing — dan karena penukaran mem-blacklist token sebelumnya, yang
 * kedua dan seterusnya justru membatalkan hasil yang pertama.
 */
let inFlightRefresh: Promise<string | null> | null = null

function refreshTokenOnce(): Promise<string | null> {
  if (!inFlightRefresh) {
    inFlightRefresh = (async () => {
      try {
        const { authService } = await import('./services/auth')
        return await authService.refreshToken()
      } catch {
        return null
      } finally {
        inFlightRefresh = null
      }
    })()
  }

  return inFlightRefresh
}

/**
 * Sesi benar-benar habis. Token dibuang **dan** store dibersihkan — membuang
 * token saja meninggalkan `status: "authenticated"` di store, jadi `AuthGuard`
 * terus meloloskan halaman yang setiap requestnya 401. Layarnya terlihat hidup,
 * datanya tidak pernah datang, dan tidak ada yang memberi tahu operator.
 */
async function endSession() {
  removeAuthToken()

  const { useAuthStore } = await import('@/stores/auth-store')
  useAuthStore.getState().clearSession()
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

    if (error.response?.status === 401 && requestConfig && !isAuthEndpoint(requestConfig.url)) {
      // Sudah sekali dicoba ulang dengan token segar dan tetap 401. Menukar
      // token lagi tidak akan mengubah apa pun.
      if (requestConfig.authRetried) {
        await endSession()

        return Promise.reject(error)
      }

      requestConfig.authRetried = true

      // Request yang berangkat sebelum penukaran terjadi akan tiba membawa
      // token lama yang sudah di-blacklist. Tokennya sudah diganti di
      // penyimpanan, jadi request ini cukup diulang — menukar lagi malah
      // mematikan token yang baru saja dipakai request lain.
      const storedToken = getAuthToken()
      const usedToken = String(requestConfig.headers?.Authorization ?? '').replace(/^Bearer /, '')

      // Tidak ada token sama sekali — tidak ada yang bisa ditukar. Menembak
      // `/auth/refresh` tanpa token hanya menghasilkan 401 kedua.
      if (!storedToken) {
        await endSession()

        return Promise.reject(error)
      }

      if (storedToken !== usedToken) {
        return apiClient(requestConfig)
      }

      const freshToken = await refreshTokenOnce()

      if (!freshToken) {
        await endSession()

        return Promise.reject(error)
      }

      // Lewat instance, bukan adapter langsung: request interceptor memasang
      // token barunya, dan `X-Client-Request-Id` yang sudah menempel ikut
      // terbawa apa adanya — server memperlakukan retry ini sebagai aksi yang
      // sama, bukan piring kedua.
      return apiClient(requestConfig)
    }

    // 401 dari endpoint auth sendiri: kredensialnya yang salah, bukan sesinya
    // yang basi. Biarkan pemanggil yang menampilkan pesannya.
    if (error.response?.status === 401 && requestConfig && isAuthEndpoint(requestConfig.url)) {
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
