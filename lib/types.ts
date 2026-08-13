// NOTE: there is no domain-level PlateColor union here on purpose. A plate
// color is dynamic master data identified by UUID (see PlateColorConfig).
// The fixed list of colour names is purely a badge palette and lives with the
// component that owns it: `PlateColor` in components/plate-color-badge.tsx.

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
  // Optional: menus.image_url is nullable, and every consumer already guards on it.
  image?: string
  price: number
  shelfLife: number
  plateColorId: string
  plateColorName: string
  isActive: boolean
}

// ProductionItem / ProductionStats / WasteEntry deliberately do NOT live here.
// They are response shapes owned by the service that fetches them:
//   lib/api/services/production.ts  — ProductionItem, ProductionStats
//   lib/api/services/waste.ts       — WasteEntry
// Duplicating them here is what let the two definitions drift apart before.
