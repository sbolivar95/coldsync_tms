import type { UserRole } from '../../types/database.types'

/**
 * Extended UserRole type that includes platform roles
 * Note: PLATFORM_ADMIN is a platform role, not an organization role
 */
export type ExtendedUserRole = UserRole | 'PLATFORM_ADMIN'

/**
 * Role label mapping (Spanish labels to enum values)
 */
export type RoleLabel = 'Propietario' | 'Administrador' | 'Personal' | 'Conductor' | 'Transportista' | 'Desarrollador'

/**
 * Permission action types
 */
export type PermissionAction = 'view' | 'create' | 'edit' | 'delete' | 'manage'

/**
 * Resource types that can have permissions
 */
export type PermissionResource =
  | 'users'
  | 'products'
  | 'thermalProfiles'
  | 'organizations'
  | 'lanes'
  | 'dispatch'
  | 'reports'

/**
 * Application route/section identifiers
 */
export type AppRoute =
  | 'dashboard'
  | 'dispatch'
  | 'control-tower'
  | 'financials'
  | 'carriers'
  | 'locations'
  | 'lanes'
  | 'orders'
  | 'alerts'
  | 'settings'
  | 'profile'

/**
 * Permission check result
 */
export interface PermissionResult {
  allowed: boolean
  reason?: string
}

/**
 * User role hierarchy level
 * Higher number = higher privilege
 */
export type RoleHierarchy = {
  readonly [key in ExtendedUserRole]: number
}
