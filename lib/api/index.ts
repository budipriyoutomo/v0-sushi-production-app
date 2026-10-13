// API Client
export { default as apiClient, getApiError, type ApiError } from './client'

// Base Service
export { BaseService, type ApiResponse } from './base-service'

// Domain Services
export { brandsService, type CreateBrandDTO, type UpdateBrandDTO } from './services/brands'
export { outletsService, type CreateOutletDTO, type UpdateOutletDTO } from './services/outlets'
export { menusService, type CreateMenuDTO, type UpdateMenuDTO } from './services/menus'
export { plateColorsService, type CreatePlateColorDTO, type UpdatePlateColorDTO } from './services/plate-colors'
export { wasteReasonsService, type WasteReason, type CreateWasteReasonDTO, type UpdateWasteReasonDTO } from './services/waste-reasons'
export {
  timeMarkersService,
  type TimeMarker,
  type CreateTimeMarkerDTO,
  type UpdateTimeMarkerDTO,
} from './services/time-markers'
export {
  timeSlotsService,
  type TimeSlot,
  type TimeSettingsSummary,
  type CreateTimeSlotDTO,
  type UpdateTimeSlotDTO,
} from './services/time-slots'
export { usersService, type CreateUserDTO, type UpdateUserDTO } from './services/users'
export { authService, type LoginCredentials, type LoginResponse, type PinLoginCredentials } from './services/auth'
export {
  productionService,
  type ProductionPlanRow,
  type ProductionItem,
  type WasteRecord,
  type ProductionStats,
  type ProductionItemGroup,
  type BulkExpiredResult,
} from './services/production'
export {
  productionImportService,
  type BackdateFinalStatus,
  type BackdateTemplateFile,
  type BackdateImportRow,
  type BackdateImportSummary,
  type BackdateImportPreview,
  type BackdateImportResult,
} from './services/production-import'
export {
  productionCorrectionService,
  type CorrectionStatus,
  type CorrectionLock,
  type CorrectionMenuRow,
  type CancelledSalesDraftLog,
  type CorrectionSummary,
  type CorrectionLine,
  type CorrectionPayload,
  type CorrectionPreview,
  type CorrectionRecord,
  type CorrectionHistory,
  type CorrectionHistoryParams,
} from './services/production-correction'
export {
  reportsService,
  type SalesData,
  type POSData,
  type ClosingReport,
  type DailySummary,
  type WasteAnalysis,
  type ProductionMenuDetailItem,
} from './services/reports'
export {
  salesService,
  type SalesDraft,
  type SalesDraftItem,
  type CancelledSalesDraft,
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
  type ClosingReportPublishStatus,
  type ClosingReportParams,
  type ClosingReportListParams,
  type ClosingReportPayload,
  type SubmitClosingReportPayload,
} from './services/closing-report'
export {
  closingReportOutboxService,
  type ClosingReportOutboxRow,
  type ClosingReportOutboxParams,
  type ClosingReportOutboxList,
  type ClosingReportOutboxStatusFilter,
} from './services/closing-report-outbox'
