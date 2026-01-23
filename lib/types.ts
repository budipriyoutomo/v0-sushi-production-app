export type PlateColor = "white" | "blue" | "pink" | "black" | "red" | "gold" | "choco motive" | "yellow" | "silver"

export interface PlateColorConfig {
  id: string
  name: PlateColor
  price: number
  targetFoodCost: number
  active: boolean
}

export interface SushiMenu {
  id: string
  name: string
  plateColor: PlateColor
  shelfLifeMinutes: number
  costEstimate: number
}

export interface ProductionItem {
  id: string
  sushiId: string
  sushiName: string
  plateColor: PlateColor
  productionTime: Date
  shelfLifeMinutes: number
  status: "active" | "sold" | "waste"
}

export interface WasteEntry {
  id: string
  time: Date
  sushiName: string
  plateColor: PlateColor
  quantity: number
  reason: string
}

export interface ProductionStats {
  plateColor: PlateColor
  targetToday: number
  produced: number
  sold: number
  expiringSoon: number
}
