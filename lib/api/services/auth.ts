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

class AuthService {
  private endpoint = '/auth'

  // Admin login with email/password
  async login(credentials: LoginCredentials): Promise<LoginResponse> {
    const response = await apiClient.post<{
      success: boolean
      message: string
      data: {
        user: {
          id: number
          name: string
          role: string
          departemen: string
          outlet: string[]
          module_app: string[]
        }
        token: string
        expires_in: number
      }
    }>(`/login`, credentials)
    
    const { token, user: apiUser } = response.data.data
    setAuthToken(token)
    
    // Transform API user to our User type
    const user: User = {
      id: String(apiUser.id),
      name: apiUser.name,
      role: apiUser.role,
      departemen: apiUser.departemen,
      outlet: apiUser.outlet,
      module_app: apiUser.module_app,
    }
    
    return { user, token }
  }

  // Kitchen login with PIN
  async pinLogin(credentials: PinLoginCredentials): Promise<LoginResponse> {
    const response = await apiClient.post<{
      success: boolean
      message: string
      data: {
        user: {
          id: number
          name: string
          role: string
          departemen: string
          outlet: string[]
          module_app: string[]
        }
        token: string
        expires_in: number
      }
    }>(`/login-pin`, credentials)
    
    const { token, user: apiUser } = response.data.data
    setAuthToken(token)
    
    // Transform API user to our User type
    const user: User = {
      id: String(apiUser.id),
      name: apiUser.name,
      role: apiUser.role,
      departemen: apiUser.departemen,
      outlet: apiUser.outlet,
      module_app: apiUser.module_app,
    }
    
    return { user, token }
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
    const response = await apiClient.get<{ data: User }>(`${this.endpoint}/me`)
    return response.data.data
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
