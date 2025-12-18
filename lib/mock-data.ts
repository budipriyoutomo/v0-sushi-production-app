import type { PlateColorConfig, SushiMenu, ProductionStats } from "./types"

export const plateColors: PlateColorConfig[] = [
  { id: "1", name: "green", price: 3.5, targetFoodCost: 30, active: true },
  { id: "2", name: "blue", price: 4.5, targetFoodCost: 32, active: true },
  { id: "3", name: "red", price: 5.5, targetFoodCost: 35, active: true },
  { id: "4", name: "black", price: 7.5, targetFoodCost: 38, active: true },
]

export const sushiMenus: SushiMenu[] = [
  { id: "1", name: "California Roll", plateColor: "green", shelfLifeMinutes: 120, costEstimate: 1.05 },
  { id: "2", name: "Cucumber Roll", plateColor: "green", shelfLifeMinutes: 120, costEstimate: 0.85 },
  { id: "3", name: "Salmon Nigiri", plateColor: "blue", shelfLifeMinutes: 90, costEstimate: 1.44 },
  { id: "4", name: "Tuna Nigiri", plateColor: "blue", shelfLifeMinutes: 90, costEstimate: 1.52 },
  { id: "5", name: "Spicy Tuna Roll", plateColor: "red", shelfLifeMinutes: 90, costEstimate: 1.93 },
  { id: "6", name: "Dragon Roll", plateColor: "red", shelfLifeMinutes: 90, costEstimate: 2.03 },
  { id: "7", name: "Rainbow Roll", plateColor: "black", shelfLifeMinutes: 75, costEstimate: 2.85 },
  { id: "8", name: "Specialty Platter", plateColor: "black", shelfLifeMinutes: 75, costEstimate: 3.05 },
]

export const mockProductionStats: ProductionStats[] = [
  { plateColor: "green", targetToday: 150, produced: 142, sold: 128, expiringSoon: 4 },
  { plateColor: "blue", targetToday: 120, produced: 118, sold: 105, expiringSoon: 6 },
  { plateColor: "red", targetToday: 100, produced: 95, sold: 87, expiringSoon: 3 },
  { plateColor: "black", targetToday: 60, produced: 58, sold: 52, expiringSoon: 2 },
]
