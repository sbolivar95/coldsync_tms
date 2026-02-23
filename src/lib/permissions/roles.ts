import type { ExtendedUserRole, RoleLabel, RoleHierarchy } from './types'

/**
 * Role hierarchy definition
 * Higher number = higher privilege
 * 
 * Platform roles (DEV, PLATFORM_ADMIN) have higher levels than organization roles
 * Organization roles: OWNER > ADMIN > STAFF > DRIVER
 * External roles: CARRIER (similar level to DRIVER)
 */
export const ROLE_HIERARCHY: RoleHierarchy = {
  DEV: 5,
  PLATFORM_ADMIN: 4,
  OWNER: 3,
  ADMIN: 2,
  STAFF: 1,
  DRIVER: 0,
  CARRIER: 0,
} as const

/**
 * Get role hierarchy level
 * @param role - User role (enum value or label)
 * @returns Hierarchy level (higher = more privilege)
 */
export function getRoleLevel(role: ExtendedUserRole | string): number {
  const mappedRole = mapStringToUserRole(role)
  // Type guard to ensure mappedRole is a valid key
  if (mappedRole in ROLE_HIERARCHY) {
    return ROLE_HIERARCHY[mappedRole as keyof typeof ROLE_HIERARCHY]
  }
  return 0
}

/**
 * Type guard to check if a string is a valid ExtendedUserRole enum value
 */
function isExtendedUserRole(value: string): value is ExtendedUserRole {
  return ['OWNER', 'ADMIN', 'STAFF', 'DRIVER', 'CARRIER', 'DEV', 'PLATFORM_ADMIN'].includes(value)
}

/**
 * Type guard to check if a string is a valid RoleLabel
 */
function isRoleLabel(value: string): value is RoleLabel {
  return ['Propietario', 'Administrador', 'Personal', 'Conductor', 'Transportista', 'Desarrollador'].includes(value)
}

/**
 * Map role string (label or enum) to ExtendedUserRole enum
 * Handles both Spanish labels and enum values for backward compatibility
 * 
 * @param role - Role string (can be enum value or Spanish label)
 * @returns ExtendedUserRole enum value
 */
export function mapStringToUserRole(role: string): ExtendedUserRole {
  // If already an enum value, return it directly (using type guard)
  if (isExtendedUserRole(role)) {
    return role
  }

  // Map Spanish labels to enum
  const roleMap: Record<RoleLabel, ExtendedUserRole> = {
    'Propietario': 'OWNER',
    'Administrador': 'ADMIN',
    'Personal': 'STAFF',
    'Conductor': 'DRIVER',
    'Transportista': 'CARRIER',
    'Desarrollador': 'DEV',
  }

  // Use type guard for safer access
  if (isRoleLabel(role)) {
    return roleMap[role]
  }

  // Default fallback
  return 'STAFF'
}

/**
 * Check if a role is a platform role (DEV or PLATFORM_ADMIN)
 * 
 * @param role - User role
 * @returns True if role is a platform role
 */
export function isPlatformRole(role: ExtendedUserRole | string): boolean {
  const mappedRole = mapStringToUserRole(role)
  return mappedRole === 'DEV' || mappedRole === 'PLATFORM_ADMIN'
}

/**
 * Check if a role is an organization role (OWNER, ADMIN, STAFF, DRIVER)
 * Note: CARRIER is not an organization role, it's an external role
 * 
 * @param role - User role
 * @returns True if role is an organization role
 */
export function isOrganizationRole(role: ExtendedUserRole | string): boolean {
  const mappedRole = mapStringToUserRole(role)
  return ['OWNER', 'ADMIN', 'STAFF', 'DRIVER'].includes(mappedRole)
}

/**
 * Compare two roles to determine hierarchy relationship
 * 
 * @param currentRole - Current user's role
 * @param targetRole - Target user's role
 * @returns Positive if current > target, negative if current < target, 0 if equal
 */
export function compareRoles(
  currentRole: ExtendedUserRole | string,
  targetRole: ExtendedUserRole | string
): number {
  const currentLevel = getRoleLevel(currentRole)
  const targetLevel = getRoleLevel(targetRole)
  return currentLevel - targetLevel
}

/**
 * Check if current role can manage target role based on hierarchy
 * A role can only manage roles with lower hierarchy level
 * 
 * @param currentRole - Current user's role
 * @param targetRole - Target user's role
 * @returns True if current role can manage target role
 */
export function canManageRole(
  currentRole: ExtendedUserRole | string,
  targetRole: ExtendedUserRole | string
): boolean {
  return compareRoles(currentRole, targetRole) > 0
}
