// API Client
export { default as apiClient, getApiError, type ApiError } from './client'

// Base Service
export { BaseService, type ApiResponse } from './base-service'

// Domain Services
export { outletsService, type CreateOutletDTO, type UpdateOutletDTO } from './services/outlets'
export { menusService, type CreateMenuDTO, type UpdateMenuDTO } from './services/menus'
export { plateColorsService, type CreatePlateColorDTO, type UpdatePlateColorDTO } from './services/plate-colors'
export { wasteReasonsService, type WasteReason, type CreateWasteReasonDTO, type UpdateWasteReasonDTO } from './services/waste-reasons'
export { usersService, type CreateUserDTO, type UpdateUserDTO } from './services/users'
export { authService, type LoginCredentials, type LoginResponse, type PinLoginCredentials } from './services/auth'
export {
  productionService,
  type ProductionPlanRow,
  type ProductionItem,
  type ConveyorItem,
  type WasteRecord,
  type ProductionStats,
  type ExpiredItem,
} from './services/production'
export {
  reportsService,
  type SalesData,
  type POSData,
  type ClosingReport,
  type DailySummary,
  type SalesAnalysis,
  type WasteAnalysis,
  type ProductionMenuDetailItem,
} from './services/reports'
export {
  salesService,
  type SalesDraft,
  type SalesDraftItem,
} from './services/sales'
export {
  wasteService,
  type WasteEntry as WasteApiEntry,
  type WasteSummary,
  type WasteListParams,
  type WasteSummaryParams,
} from './services/waste'
export {
  closingReportService,
  type ClosingReportEntry,
  type ClosingReportSummary,
  type ClosingReportParams,
  type ClosingReportListParams,
  type ClosingReportPayload,
  type SubmitClosingReportPayload,
} from './services/closing-report'
