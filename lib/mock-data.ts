import type { PlateColorConfig, SushiMenu, ProductionStats, Outlet, KitchenUser, AdminUser } from "./types"

// Outlets
export const outlets: Outlet[] = [
  { id: "outlet-1", name: "Main Branch", location: "Downtown", code: "MB", isActive: true, createdAt: new Date("2024-01-01") },
  { id: "outlet-2", name: "Mall Branch", location: "Shopping Mall", code: "SB", isActive: true, createdAt: new Date("2024-02-15") },
  { id: "outlet-3", name: "Airport Branch", location: "Airport Terminal", code: "AB", isActive: true, createdAt: new Date("2024-03-10") },
]

// Kitchen Users (can access multiple outlets)
export const kitchenUsers: KitchenUser[] = [
  { id: '1', name: 'Chef John', pin: '1234', outletIds: ['outlet-1'], status: 'active', createdAt: new Date('2024-01-15') },
  { id: '2', name: 'Chef Maria', pin: '5678', outletIds: ['outlet-2', 'outlet-3'], status: 'active', createdAt: new Date('2024-02-01') },
  { id: '3', name: 'Chef Alex', pin: '9012', outletIds: ['outlet-1', 'outlet-2'], status: 'active', createdAt: new Date('2024-02-20') },
]

// Admin Users (can access multiple outlets)
export const adminUsers: AdminUser[] = [
  { id: 'a1', name: 'Admin User', email: 'admin@sushi.com', role: 'admin', outletIds: ['outlet-1', 'outlet-2', 'outlet-3'], status: 'active', createdAt: new Date('2024-01-01') },
  { id: 'a2', name: 'Manager 1', email: 'manager1@sushi.com', role: 'manager', outletIds: ['outlet-1'], status: 'active', createdAt: new Date('2024-01-10') },
  { id: 'a3', name: 'Manager 2', email: 'manager2@sushi.com', role: 'manager', outletIds: ['outlet-2', 'outlet-3'], status: 'active', createdAt: new Date('2024-02-05') },
]

// Plate Colors
export const plateColors: PlateColorConfig[] = [
  { id: "1", outletId: "outlet-1", name: "white", price: 2.5, targetFoodCost: 25, active: true },
  { id: "2", outletId: "outlet-1", name: "blue", price: 3.5, targetFoodCost: 28, active: true },
  { id: "3", outletId: "outlet-1", name: "pink", price: 4.0, targetFoodCost: 30, active: true },
  { id: "4", outletId: "outlet-1", name: "black", price: 5.5, targetFoodCost: 35, active: true },
  { id: "5", outletId: "outlet-1", name: "red", price: 5.0, targetFoodCost: 33, active: true },
  { id: "6", outletId: "outlet-1", name: "gold", price: 7.5, targetFoodCost: 40, active: true },
  { id: "7", outletId: "outlet-1", name: "choco motive", price: 6.5, targetFoodCost: 38, active: true },
  { id: "8", outletId: "outlet-1", name: "yellow", price: 3.0, targetFoodCost: 27, active: true },
  { id: "9", outletId: "outlet-1", name: "silver", price: 6.0, targetFoodCost: 36, active: true }, 
]

// Sushi Menus (same for all outlets)
export const sushiMenus: SushiMenu[] = [
  { id: "1", outletId: "outlet-1", name: "California Roll", plateColor: "white", shelfLifeMinutes: 120, costEstimate: 0.95, image: "/sushi/california-roll.jpg" },
  { id: "2", outletId: "outlet-1", name: "Cucumber Roll", plateColor: "white", shelfLifeMinutes: 120, costEstimate: 0.75, image: "/sushi/cucumber-roll.jpg" },
  { id: "3", outletId: "outlet-1", name: "Salmon Nigiri", plateColor: "blue", shelfLifeMinutes: 90, costEstimate: 1.44, image: "/sushi/salmon-nigiri.jpg" },
  { id: "4", outletId: "outlet-1", name: "Tuna Nigiri", plateColor: "blue", shelfLifeMinutes: 90, costEstimate: 1.52, image: "/sushi/tuna-nigiri.jpg" },
  { id: "5", outletId: "outlet-1", name: "Spicy Tuna Roll", plateColor: "pink", shelfLifeMinutes: 90, costEstimate: 1.73, image: "/sushi/spicy-tuna-roll.jpg" },
  { id: "6", outletId: "outlet-1", name: "Dragon Roll", plateColor: "pink", shelfLifeMinutes: 90, costEstimate: 1.83, image: "/sushi/dragon-roll.jpg" },
  { id: "7", outletId: "outlet-1", name: "Rainbow Roll", plateColor: "gold", shelfLifeMinutes: 75, costEstimate: 2.85, image: "/sushi/rainbow-roll.jpg" },
  { id: "8", outletId: "outlet-1", name: "Specialty Platter", plateColor: "gold", shelfLifeMinutes: 75, costEstimate: 3.05, image: "/sushi/specialty-platter.jpg" },
  { id: "9", outletId: "outlet-1", name: "Black Platter", plateColor: "black", shelfLifeMinutes: 75, costEstimate: 2.65, image: "/sushi/black-platter.jpg" },
  { id: "10", outletId: "outlet-1", name: "Red Platter", plateColor: "red", shelfLifeMinutes: 85, costEstimate: 2.45, image: "/sushi/red-platter.jpg" },
  { id: "11", outletId: "outlet-1", name: "Choco Motive", plateColor: "choco motive", shelfLifeMinutes: 95, costEstimate: 2.35, image: "/sushi/choco-motive.jpg" },
  { id: "12", outletId: "outlet-1", name: "Yellow Combo", plateColor: "yellow", shelfLifeMinutes: 110, costEstimate: 1.15, image: "/sushi/yellow-combo.jpg" },
  { id: "13", outletId: "outlet-1", name: "Silver Platter", plateColor: "silver", shelfLifeMinutes: 80, costEstimate: 2.55, image: "/sushi/silver-platter.jpg" },
  // Outlet 2
  { id: "14", outletId: "outlet-2", name: "California Roll", plateColor: "white", shelfLifeMinutes: 120, costEstimate: 0.95, image: "/sushi/california-roll.jpg" },
  { id: "15", outletId: "outlet-2", name: "Cucumber Roll", plateColor: "white", shelfLifeMinutes: 120, costEstimate: 0.75, image: "/sushi/cucumber-roll.jpg" },
  { id: "16", outletId: "outlet-2", name: "Salmon Nigiri", plateColor: "blue", shelfLifeMinutes: 90, costEstimate: 1.44, image: "/sushi/salmon-nigiri.jpg" },
  { id: "17", outletId: "outlet-2", name: "Tuna Nigiri", plateColor: "blue", shelfLifeMinutes: 90, costEstimate: 1.52, image: "/sushi/tuna-nigiri.jpg" },
  { id: "18", outletId: "outlet-2", name: "Spicy Tuna Roll", plateColor: "pink", shelfLifeMinutes: 90, costEstimate: 1.73, image: "/sushi/spicy-tuna-roll.jpg" },
  { id: "19", outletId: "outlet-2", name: "Dragon Roll", plateColor: "pink", shelfLifeMinutes: 90, costEstimate: 1.83, image: "/sushi/dragon-roll.jpg" },
  { id: "20", outletId: "outlet-2", name: "Rainbow Roll", plateColor: "gold", shelfLifeMinutes: 75, costEstimate: 2.85, image: "/sushi/rainbow-roll.jpg" },
  { id: "21", outletId: "outlet-2", name: "Specialty Platter", plateColor: "gold", shelfLifeMinutes: 75, costEstimate: 3.05, image: "/sushi/specialty-platter.jpg" },
  { id: "22", outletId: "outlet-2", name: "Black Platter", plateColor: "black", shelfLifeMinutes: 75, costEstimate: 2.65, image: "/sushi/black-platter.jpg" },
  { id: "23", outletId: "outlet-2", name: "Red Platter", plateColor: "red", shelfLifeMinutes: 85, costEstimate: 2.45, image: "/sushi/red-platter.jpg" },
  { id: "24", outletId: "outlet-2", name: "Choco Motive", plateColor: "choco motive", shelfLifeMinutes: 95, costEstimate: 2.35, image: "/sushi/choco-motive.jpg" },
  { id: "25", outletId: "outlet-2", name: "Yellow Combo", plateColor: "yellow", shelfLifeMinutes: 110, costEstimate: 1.15, image: "/sushi/yellow-combo.jpg" },
  { id: "26", outletId: "outlet-2", name: "Silver Platter", plateColor: "silver", shelfLifeMinutes: 80, costEstimate: 2.55, image: "/sushi/silver-platter.jpg" },
  // Outlet 3
  { id: "27", outletId: "outlet-3", name: "California Roll", plateColor: "white", shelfLifeMinutes: 120, costEstimate: 0.95, image: "/sushi/california-roll.jpg" },
  { id: "28", outletId: "outlet-3", name: "Cucumber Roll", plateColor: "white", shelfLifeMinutes: 120, costEstimate: 0.75, image: "/sushi/cucumber-roll.jpg" },
  { id: "29", outletId: "outlet-3", name: "Salmon Nigiri", plateColor: "blue", shelfLifeMinutes: 90, costEstimate: 1.44, image: "/sushi/salmon-nigiri.jpg" },
  { id: "30", outletId: "outlet-3", name: "Tuna Nigiri", plateColor: "blue", shelfLifeMinutes: 90, costEstimate: 1.52, image: "/sushi/tuna-nigiri.jpg" },
  { id: "31", outletId: "outlet-3", name: "Spicy Tuna Roll", plateColor: "pink", shelfLifeMinutes: 90, costEstimate: 1.73, image: "/sushi/spicy-tuna-roll.jpg" },
  { id: "32", outletId: "outlet-3", name: "Dragon Roll", plateColor: "pink", shelfLifeMinutes: 90, costEstimate: 1.83, image: "/sushi/dragon-roll.jpg" },
  { id: "33", outletId: "outlet-3", name: "Rainbow Roll", plateColor: "gold", shelfLifeMinutes: 75, costEstimate: 2.85, image: "/sushi/rainbow-roll.jpg" },
  { id: "34", outletId: "outlet-3", name: "Specialty Platter", plateColor: "gold", shelfLifeMinutes: 75, costEstimate: 3.05, image: "/sushi/specialty-platter.jpg" },
  { id: "35", outletId: "outlet-3", name: "Black Platter", plateColor: "black", shelfLifeMinutes: 75, costEstimate: 2.65, image: "/sushi/black-platter.jpg" },
  { id: "36", outletId: "outlet-3", name: "Red Platter", plateColor: "red", shelfLifeMinutes: 85, costEstimate: 2.45, image: "/sushi/red-platter.jpg" },
  { id: "37", outletId: "outlet-3", name: "Choco Motive", plateColor: "choco motive", shelfLifeMinutes: 95, costEstimate: 2.35, image: "/sushi/choco-motive.jpg" },
  { id: "38", outletId: "outlet-3", name: "Yellow Combo", plateColor: "yellow", shelfLifeMinutes: 110, costEstimate: 1.15, image: "/sushi/yellow-combo.jpg" },
  { id: "39", outletId: "outlet-3", name: "Silver Platter", plateColor: "silver", shelfLifeMinutes: 80, costEstimate: 2.55, image: "/sushi/silver-platter.jpg" },
]

// Production Stats per Outlet
export const mockProductionStats: ProductionStats[] = [
  // Outlet 1
  { outletId: "outlet-1", plateColor: "white", targetToday: 180, produced: 172, sold: 158, expiringSoon: 3 },
  { outletId: "outlet-1", plateColor: "blue", targetToday: 120, produced: 118, sold: 105, expiringSoon: 6 },
  { outletId: "outlet-1", plateColor: "pink", targetToday: 140, produced: 135, sold: 122, expiringSoon: 5 },
  { outletId: "outlet-1", plateColor: "black", targetToday: 80, produced: 78, sold: 72, expiringSoon: 2 },
  { outletId: "outlet-1", plateColor: "red", targetToday: 110, produced: 105, sold: 97, expiringSoon: 4 },
  { outletId: "outlet-1", plateColor: "gold", targetToday: 60, produced: 58, sold: 52, expiringSoon: 2 },
  { outletId: "outlet-1", plateColor: "choco motive", targetToday: 90, produced: 88, sold: 80, expiringSoon: 3 },
  { outletId: "outlet-1", plateColor: "yellow", targetToday: 160, produced: 155, sold: 142, expiringSoon: 4 },
  { outletId: "outlet-1", plateColor: "silver", targetToday: 75, produced: 72, sold: 65, expiringSoon: 2 },
  // Outlet 2
  { outletId: "outlet-2", plateColor: "white", targetToday: 150, produced: 145, sold: 135, expiringSoon: 2 },
  { outletId: "outlet-2", plateColor: "blue", targetToday: 100, produced: 98, sold: 88, expiringSoon: 4 },
  { outletId: "outlet-2", plateColor: "pink", targetToday: 120, produced: 115, sold: 105, expiringSoon: 3 },
  { outletId: "outlet-2", plateColor: "black", targetToday: 70, produced: 68, sold: 62, expiringSoon: 1 },
  { outletId: "outlet-2", plateColor: "red", targetToday: 90, produced: 87, sold: 80, expiringSoon: 2 },
  { outletId: "outlet-2", plateColor: "gold", targetToday: 50, produced: 48, sold: 43, expiringSoon: 1 },
  { outletId: "outlet-2", plateColor: "choco motive", targetToday: 75, produced: 73, sold: 67, expiringSoon: 2 },
  { outletId: "outlet-2", plateColor: "yellow", targetToday: 140, produced: 138, sold: 128, expiringSoon: 3 },
  { outletId: "outlet-2", plateColor: "silver", targetToday: 65, produced: 62, sold: 56, expiringSoon: 1 },
  // Outlet 3
  { outletId: "outlet-3", plateColor: "white", targetToday: 200, produced: 195, sold: 180, expiringSoon: 4 },
  { outletId: "outlet-3", plateColor: "blue", targetToday: 140, produced: 138, sold: 125, expiringSoon: 7 },
  { outletId: "outlet-3", plateColor: "pink", targetToday: 160, produced: 155, sold: 142, expiringSoon: 6 },
  { outletId: "outlet-3", plateColor: "black", targetToday: 90, produced: 88, sold: 82, expiringSoon: 3 },
  { outletId: "outlet-3", plateColor: "red", targetToday: 130, produced: 125, sold: 115, expiringSoon: 5 },
  { outletId: "outlet-3", plateColor: "gold", targetToday: 70, produced: 68, sold: 62, expiringSoon: 2 },
  { outletId: "outlet-3", plateColor: "choco motive", targetToday: 100, produced: 98, sold: 90, expiringSoon: 3 },
  { outletId: "outlet-3", plateColor: "yellow", targetToday: 180, produced: 175, sold: 162, expiringSoon: 5 },
  { outletId: "outlet-3", plateColor: "silver", targetToday: 85, produced: 82, sold: 75, expiringSoon: 2 },
]
