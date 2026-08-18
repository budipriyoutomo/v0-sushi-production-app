/**
 * Daftar role dan module_app yang sah.
 *
 * Static, bukan diambil dari API: nilainya ikut kode. `module_app` menentukan
 * halaman mana yang dibuka `AuthGuard` dan `SidebarNav`, jadi nilai yang tidak
 * punya halaman tidak berarti apa-apa.
 *
 * Harus sama persis dengan `backend/src/app/Support/AccessOptions.php`.
 */

export const USER_ROLES = [
  'admin',
  'manager',
  'kitchen',
  'service',
  'operation',
  'production',
] as const

/**
 * `app` adalah modul dasar tanpa halaman sendiri — dilewati saat mencari
 * modul tujuan redirect di `auth-guard.tsx`.
 */
export const MODULE_APPS = [
  'app',
  'production',
  'kitchen',
  'service',
  'report',
  'admin',
  'operation',
] as const

export type UserRoleOption = (typeof USER_ROLES)[number]
export type ModuleApp = (typeof MODULE_APPS)[number]

/** Label untuk dropdown / checkbox di layar admin. */
export const USER_ROLE_LABELS: Record<UserRoleOption, string> = {
  admin: 'Admin',
  manager: 'Manager',
  kitchen: 'Kitchen',
  service: 'Service',
  operation: 'Operation',
  production: 'Production',
}

export const MODULE_APP_LABELS: Record<ModuleApp, string> = {
  app: 'App (dasar)',
  production: 'Production',
  kitchen: 'Kitchen',
  service: 'Service',
  report: 'Report',
  admin: 'Admin',
  operation: 'Operation',
}

export function isModuleApp(value: string): value is ModuleApp {
  return (MODULE_APPS as readonly string[]).includes(value)
}
