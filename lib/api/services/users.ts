import { BaseService } from '../base-service'
import type { User, UserRole } from '@/lib/types'

export interface CreateUserDTO {
  name: string
  email: string
  password: string
  role: UserRole
  pin?: string
  departemen?: string
  outlet?: string[]
  module_app?: string[]
}

export interface UpdateUserDTO {
  name?: string
  email?: string
  password?: string
  role?: UserRole
  pin?: string
  departemen?: string
  outlet?: string[]
  module_app?: string[]
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

  // CATATAN: backend hanya punya GET / POST / PUT /{id} / DELETE /{id} di
  // prefix `/users`. Pernah ada `toggleStatus()`, `updatePin()` dan
  // `verifyPin()` di sini yang memanggil `/users/{id}/toggle-status`,
  // `/users/{id}/pin` dan `/users/verify-pin` — tidak satu pun route itu
  // pernah ada, jadi semuanya 404. `toggleStatus` bahkan mustahil: tabel
  // `users` tidak punya kolom `is_active`.
  //
  // PIN diubah lewat `update()` biasa (field `pin`), dan verifikasi PIN adalah
  // `POST /login-pin` yang dipegang `authService`.
}

export const usersService = new UsersService()
