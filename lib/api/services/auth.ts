import apiClient from '../client'
import { setAuthToken, removeAuthToken } from '@/lib/config'
import type { User } from '@/lib/types'

export interface LoginCredentials {
  email: string
  password: string
}

export interface LoginResponse {
  user: User
  token: string
}

export interface PinLoginCredentials {
  pin: string
}

/**
 * Bentuk user seperti yang dikirim backend.
 *
 * `id` ditulis `string | number` dengan jujur: `users.id` satu-satunya
 * auto-increment di skema backend, dan sebelum `UserResource` melakukan cast ia
 * terkirim sebagai angka. Backend sudah diperbaiki, tapi tipe ini tetap longgar
 * karena service worker PWA menyimpan respons `GET /api/*` selama 5 menit —
 * bentuk lama masih bisa terbaca sesaat setelah deploy, dan tablet dapur yang
 * belum memuat bundel baru bisa jauh lebih lama dari itu.
 */
interface ApiUser {
  id: string | number
  name: string
  role: string
  departemen: string
  outlet: string[]
  module_app: string[]
}

/**
 * Satu-satunya tempat respons user diubah jadi tipe domain.
 *
 * Dulu `login()` dan `pinLogin()` masing-masing menormalkan `id` dengan
 * `String()`, sementara `getCurrentUser()` mengembalikan respons apa adanya.
 * Akibatnya `user.id` berbentuk string setelah login tapi number setelah
 * restore — dan karena `refreshUser()` jalan tiap `AuthProvider` mount, ia
 * berubah bentuk di tengah sesi, bukan cuma antar-reload.
 */
function transformUser(apiUser: ApiUser): User {
  return {
    id: String(apiUser.id),
    name: apiUser.name,
    role: apiUser.role,
    departemen: apiUser.departemen,
    outlet: apiUser.outlet,
    module_app: apiUser.module_app,
  }
}

class AuthService {
  private endpoint = '/auth'

  // Admin login with email/password
  async login(credentials: LoginCredentials): Promise<LoginResponse> {
    return this.authenticate('/login', credentials)
  }

  // Kitchen login with PIN
  async pinLogin(credentials: PinLoginCredentials): Promise<LoginResponse> {
    return this.authenticate('/login-pin', credentials)
  }

  /**
   * Kedua pintu masuk mengembalikan amplop yang sama persis, jadi bentuknya
   * dijaga di satu tempat — versi sebelumnya menyalinnya dua kali, dan salinan
   * yang mana pun bisa menyimpang tanpa ketahuan.
   */
  private async authenticate(
    path: '/login' | '/login-pin',
    credentials: LoginCredentials | PinLoginCredentials
  ): Promise<LoginResponse> {
    const response = await apiClient.post<{
      status: boolean
      message: string
      data: {
        user: ApiUser
        token: string
        expires_in: number
      }
    }>(path, credentials)

    const { token, user: apiUser } = response.data.data
    setAuthToken(token)

    return { user: transformUser(apiUser), token }
  }

  // Logout
  async logout(): Promise<void> {
    try {
      await apiClient.post(`/logout`)
    } finally {
      removeAuthToken()
    }
  }

  // Get current user
  async getCurrentUser(): Promise<User> {
    const response = await apiClient.get<{ data: ApiUser }>(`${this.endpoint}/me`)
    return transformUser(response.data.data)
  }

  // Refresh token (backend is pure JWT — re-issues a fresh access token)
  async refreshToken(): Promise<string> {
    const response = await apiClient.post<{ data: { token: string } }>(`${this.endpoint}/refresh`)
    const { token } = response.data.data
    setAuthToken(token)
    return token
  }
}

export const authService = new AuthService()
