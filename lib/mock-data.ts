import type { PlateColorConfig, SushiMenu, ProductionStats } from "./types"

export const plateColors: PlateColorConfig[] = [
  { id: "1", name: "white", price: 2.5, targetFoodCost: 25, active: true },
  { id: "2", name: "blue", price: 3.5, targetFoodCost: 28, active: true },
  { id: "3", name: "pink", price: 4.0, targetFoodCost: 30, active: true },
  { id: "4", name: "black", price: 5.5, targetFoodCost: 35, active: true },
  { id: "5", name: "red", price: 5.0, targetFoodCost: 33, active: true },
  { id: "6", name: "gold", price: 7.5, targetFoodCost: 40, active: true },
  { id: "7", name: "choco motive", price: 6.5, targetFoodCost: 38, active: true },
  { id: "8", name: "yellow", price: 3.0, targetFoodCost: 27, active: true },
  { id: "9", name: "silver", price: 6.0, targetFoodCost: 36, active: true },
]

export const sushiMenus: SushiMenu[] = [
  { id: "1", name: "California Roll", plateColor: "white", shelfLifeMinutes: 120, costEstimate: 0.95, image: "/sushi/california-roll.jpg" },
  { id: "2", name: "Cucumber Roll", plateColor: "white", shelfLifeMinutes: 120, costEstimate: 0.75, image: "/sushi/cucumber-roll.jpg" },
  { id: "3", name: "Salmon Nigiri", plateColor: "blue", shelfLifeMinutes: 90, costEstimate: 1.44, image: "/sushi/salmon-nigiri.jpg" },
  { id: "4", name: "Tuna Nigiri", plateColor: "blue", shelfLifeMinutes: 90, costEstimate: 1.52, image: "/sushi/tuna-nigiri.jpg" },
  { id: "5", name: "Spicy Tuna Roll", plateColor: "pink", shelfLifeMinutes: 90, costEstimate: 1.73, image: "/sushi/spicy-tuna-roll.jpg" },
  { id: "6", name: "Dragon Roll", plateColor: "pink", shelfLifeMinutes: 90, costEstimate: 1.83, image: "/sushi/dragon-roll.jpg" },
  { id: "7", name: "Rainbow Roll", plateColor: "gold", shelfLifeMinutes: 75, costEstimate: 2.85, image: "/sushi/rainbow-roll.jpg" },
  { id: "8", name: "Specialty Platter", plateColor: "gold", shelfLifeMinutes: 75, costEstimate: 3.05, image: "/sushi/specialty-platter.jpg" },
  { id: "9", name: "Black Platter", plateColor: "black", shelfLifeMinutes: 75, costEstimate: 2.65, image: "/sushi/black-platter.jpg" },
  { id: "10", name: "Red Platter", plateColor: "red", shelfLifeMinutes: 85, costEstimate: 2.45, image: "/sushi/red-platter.jpg" },
  { id: "11", name: "Choco Motive", plateColor: "choco motive", shelfLifeMinutes: 95, costEstimate: 2.35, image: "/sushi/choco-motive.jpg" },
  { id: "12", name: "Yellow Combo", plateColor: "yellow", shelfLifeMinutes: 110, costEstimate: 1.15, image: "/sushi/yellow-combo.jpg" },
  { id: "13", name: "Silver Platter", plateColor: "silver", shelfLifeMinutes: 80, costEstimate: 2.55, image: "/sushi/silver-platter.jpg" },
]

export const mockProductionStats: ProductionStats[] = [
  { plateColor: "white", targetToday: 180, produced: 172, sold: 158, expiringSoon: 3 },
  { plateColor: "blue", targetToday: 120, produced: 118, sold: 105, expiringSoon: 6 },
  { plateColor: "pink", targetToday: 140, produced: 135, sold: 122, expiringSoon: 5 },
  { plateColor: "black", targetToday: 80, produced: 78, sold: 72, expiringSoon: 2 },
  { plateColor: "red", targetToday: 110, produced: 105, sold: 97, expiringSoon: 4 },
  { plateColor: "gold", targetToday: 60, produced: 58, sold: 52, expiringSoon: 2 },
  { plateColor: "choco motive", targetToday: 90, produced: 88, sold: 80, expiringSoon: 3 },
  { plateColor: "yellow", targetToday: 160, produced: 155, sold: 142, expiringSoon: 4 },
  { plateColor: "silver", targetToday: 75, produced: 72, sold: 65, expiringSoon: 2 },
]
