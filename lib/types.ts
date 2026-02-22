export type PlateColor = "white" | "blue" | "pink" | "black" | "red" | "gold" | "choco motive" | "yellow" | "silver"

export interface Outlet {
  id: string
  name: string
  location: string
  code: string
  isActive: boolean
  createdAt: Date
}

export interface PlateColorConfig {
  id: string
  outletId: string
  name: PlateColor
  price: number
  targetFoodCost: number
  active: boolean
}

export interface SushiMenu {
  id: string
  outletId: string
  name: string
  plateColor: PlateColor
  shelfLifeMinutes: number
  costEstimate: number
  image?: string
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
