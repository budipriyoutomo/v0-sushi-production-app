import useSWR from 'swr'
import { usersService, type CreateUserDTO, type UpdateUserDTO } from '@/lib/api'
import type { User, UserRole } from '@/lib/types'

const USERS_KEY = '/users'

export function useUsers() {
  const { data, error, isLoading, mutate } = useSWR<User[]>(USERS_KEY, async () => {
    const response = await usersService.getAll()
    return response.data
  })

  const createUser = async (userData: CreateUserDTO): Promise<User> => {
    const response = await usersService.create(userData)
    await mutate()
    return response.data
  }

  const updateUser = async (id: string, userData: UpdateUserDTO): Promise<User> => {
    const response = await usersService.update(id, userData)
    await mutate()
    return response.data
  }

  const deleteUser = async (id: string): Promise<void> => {
    await usersService.delete(id)
    await mutate()
  }

  const toggleUserStatus = async (id: string): Promise<User> => {
    const user = await usersService.toggleStatus(id)
    await mutate()
    return user
  }

  const updateUserPin = async (id: string, pin: string): Promise<User> => {
    const user = await usersService.updatePin(id, pin)
    await mutate()
    return user
  }

  return {
    users: data || [],
    isLoading,
    error,
    createUser,
    updateUser,
    deleteUser,
    toggleUserStatus,
    updateUserPin,
    refresh: mutate,
  }
}

export function useUsersByRole(role: UserRole) {
  const { data, error, isLoading, mutate } = useSWR<User[]>(`${USERS_KEY}/role/${role}`, async () => {
    const users = await usersService.getByRole(role)
    return users
  })

  return {
    users: data || [],
    isLoading,
    error,
    refresh: mutate,
  }
}

export function useUsersByOutlet(outletId: string | null) {
  const { data, error, isLoading, mutate } = useSWR<User[]>(
    outletId ? `${USERS_KEY}/outlet/${outletId}` : null,
    async () => {
      if (!outletId) return []
      const users = await usersService.getByOutlet(outletId)
      return users
    }
  )

  return {
    users: data || [],
    isLoading,
    error,
    refresh: mutate,
  }
}
