/**
 * Permissions Module
 * 
 * Centralized permission management for ColdSync TMS
 * Provides role-based access control (RBAC) functions and utilities
 * 
 * This module serves as the single source of truth for:
 * - Role hierarchy definitions
 * - Permission checks (view, manage, modify)
 * - Role mapping (Spanish labels to enum values)
 * - Resource access control
 */

// Types
export type {
  ExtendedUserRole,
  RoleLabel,
  PermissionAction,
  PermissionResource,
  PermissionResult,
  RoleHierarchy,
  AppRoute,
} from './types'

// Role utilities
export {
  ROLE_HIERARCHY,
  getRoleLevel,
  mapStringToUserRole,
  isPlatformRole,
  isOrganizationRole,
  compareRoles,
  canManageRole,
} from './roles'

// Permission checks
export {
  canViewResource,
  canViewUser,
  canManageUser,
  canModifyRole,
  getAvailableRolesForAssignment,
  canAccessTab,
  canAccessRoute,
} from './permissions'

// Permission matrix (for documentation and reference)
export {
  PERMISSION_MATRIX,
  getRolePermissions,
  hasResourcePermission,
  hasRouteAccess,
  type RolePermissions,
  type ResourcePermissions,
  type RoutePermissions,
} from './matrix'
