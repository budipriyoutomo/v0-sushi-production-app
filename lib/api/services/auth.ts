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
  refreshToken?: string
}

export interface PinLoginCredentials {
  pin: string 
}

class AuthService {
  private endpoint = ''

  // Admin login with email/password
  async login(credentials: LoginCredentials): Promise<LoginResponse> {
    const response = await apiClient.post<{ data: LoginResponse }>(`${this.endpoint}/login`, credentials)
    const { token, user } = response.data.data
    setAuthToken(token)
    return response.data.data
  }

  // Kitchen login with PIN
  async pinLogin(credentials: PinLoginCredentials): Promise<LoginResponse> {
    const response = await apiClient.post<{ data: LoginResponse }>(`${this.endpoint}/login-pin`, credentials)
    const { token } = response.data.data
    setAuthToken(token)
    return response.data.data
  }

  // Logout
  async logout(): Promise<void> {
    try {
      await apiClient.post(`${this.endpoint}/logout`)
    } finally {
      removeAuthToken()
    }
  }

  // Get current user
  async getCurrentUser(): Promise<User> {
    const response = await apiClient.get<{ data: User }>(`${this.endpoint}/me`)
    return response.data.data
  }

  // Refresh token
  async refreshToken(): Promise<string> {
    const response = await apiClient.post<{ data: { token: string } }>(`${this.endpoint}/refresh`)
    const { token } = response.data.data
    setAuthToken(token)
    return token
  }
}

export const authService = new AuthService()
