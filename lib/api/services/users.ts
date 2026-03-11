import { BaseService } from '../base-service'
import type { User, UserRole } from '@/lib/types'

export interface CreateUserDTO {
  name: string
  email: string
  password: string
  role: UserRole
  outletId?: string
  pin?: string
}

export interface UpdateUserDTO {
  name?: string
  email?: string
  password?: string
  role?: UserRole
  outletId?: string
  pin?: string
  isActive?: boolean
}

class UsersService extends BaseService<User, CreateUserDTO, UpdateUserDTO> {
  constructor() {
    super('/users')
  }

  // Get users by role
  async getByRole(role: UserRole): Promise<User[]> {
    const response = await this.getAll({ role })
    return response.data
  }

  // Get users by outlet
  async getByOutlet(outletId: string): Promise<User[]> {
    const response = await this.getAll({ outletId })
    return response.data
  }

  // Toggle user active status
  async toggleStatus(id: string): Promise<User> {
    const response = await this.request<User>('patch', `${id}/toggle-status`)
    return response.data
  }

  // Update user PIN
  async updatePin(id: string, pin: string): Promise<User> {
    const response = await this.request<User>('patch', `${id}/pin`, { pin })
    return response.data
  }

  // Verify PIN for kitchen login
  async verifyPin(pin: string, outletId: string): Promise<User> {
    const response = await this.request<User>('post', 'verify-pin', { pin, outletId })
    return response.data
  }
}

export const usersService = new UsersService()
