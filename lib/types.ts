export type PlateColor = "white" | "blue" | "pink" | "black" | "red" | "gold" | "choco motive" | "yellow" | "silver"

export type UserRole = 'admin' | 'manager' | 'kitchen' | 'service' | 'operation' | 'production'

export interface User {
  id: string
  name: string
  email?: string
  role: UserRole | string
  username?: string
  departemen?: string
  outlet?: string[] // Array of outlet codes the user has access to
  module_app?: string[] // Array of modules the user has access to
  isActive?: boolean
  hasPin?: boolean
  createdAt?: string | Date
}

export interface Outlet {
  id: string
  code: string
  name: string
  brand: string
  address: string
  isActive: boolean
  createdAt: Date
}

export interface KitchenUser {
  id: string
  name: string
  pin: string
  outletIds: string[]
  status: 'active' | 'inactive'
  createdAt: Date
}

export interface AdminUser {
  id: string
  name: string
  email: string
  role: 'admin' | 'manager'
  outletIds: string[]
  status: 'active' | 'inactive'
  createdAt: Date
}

export interface PlateColorConfig {
  id: string
  platename: string
  price: number
  description: string
  targetFoodCost: number
  isActive: boolean
}

export interface SushiMenu {
  id: string
  code: string
  menuname: string
  description: string
  image: string
  price: number
  shelfLife: number
  plateColorId: string
  plateColorName: string
  isActive: boolean
}

export interface ProductionItem {
  id: string
  outletId: string
  sushiId: string
  sushiName: string
  plateColor: PlateColor
  productionTime: Date
  shelfLifeMinutes: number
  status: "active" | "sold" | "waste"
}

export interface WasteEntry {
  id: string
  outletId: string
  time: Date
  sushiName: string
  plateColor: PlateColor
  quantity: number
  reason: string
}

export interface ProductionStats {
  outletId: string
  plateColor: PlateColor
  targetToday: number
  produced: number
  sold: number
  expiringSoon: number
}
