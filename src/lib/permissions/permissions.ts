import type { ExtendedUserRole, PermissionResource, AppRoute } from './types'
import { mapStringToUserRole, canManageRole, isPlatformRole, isOrganizationRole } from './roles'

/**
 * Helper: Check if user has organization access (organization role or platform role)
 * This is a common pattern for routes accessible to all organization members
 */
function hasOrganizationAccess(
  userRole: ExtendedUserRole | string | undefined
): boolean {
  if (!userRole) return false
  const mappedRole = mapStringToUserRole(userRole)
  return isOrganizationRole(mappedRole) || isPlatformRole(mappedRole)
}

/**
 * Helper: Check if user has owner or admin access
 */
function hasOwnerOrAdminAccess(
  userRole: ExtendedUserRole | string | undefined
): boolean {
  if (!userRole) return false
  const mappedRole = mapStringToUserRole(userRole)
  return mappedRole === 'OWNER' || mappedRole === 'ADMIN' || isPlatformRole(mappedRole)
}

/**
 * Check if user can view a specific resource
 * 
 * @param userRole - Current user's role
 * @param resource - Resource to check access for
 * @param isPlatformUser - Whether user is a platform user (DEV/PLATFORM_ADMIN)
 * @returns True if user can view the resource
 */
export function canViewResource(
  userRole: ExtendedUserRole | string | undefined,
  resource: PermissionResource,
  isPlatformUser: boolean
): boolean {
  // Platform users (DEV/PLATFORM_ADMIN) can view all resources, regardless of organizationMember role
  // This check must come before the userRole check because platform users
  // might not have an organizationMember role set
  if (isPlatformUser) {
    return true
  }

  if (!userRole) return false

  const mappedRole = mapStringToUserRole(userRole)

  // Resource-specific rules
  switch (resource) {
    case 'users':
      // All organization roles can view users (with hierarchy restrictions)
      return hasOrganizationAccess(userRole)

    case 'products':
    case 'thermalProfiles':
      // OWNER and ADMIN can view, STAFF and DRIVER cannot
      return hasOwnerOrAdminAccess(userRole)

    case 'organizations':
      // Only OWNER and platform users can view organizations
      return mappedRole === 'OWNER' || isPlatformRole(mappedRole)

    case 'dispatch':
    case 'reports':
      // All organization roles can view (with potential future restrictions)
      return hasOrganizationAccess(userRole)

    default:
      return false
  }
}

/**
 * Check if user can view a specific user based on role hierarchy
 * 
 * @param currentUserRole - Current user's role
 * @param targetUserRole - Target user's role
 * @param isPlatformUser - Whether current user is a platform user
 * @returns True if current user can view target user
 */
export function canViewUser(
  currentUserRole: ExtendedUserRole | string | undefined,
  targetUserRole: string,
  isPlatformUser: boolean
): boolean {
  // Platform users (DEV/PLATFORM_ADMIN) can see all users, regardless of organizationMember role
  // This check must come before the currentUserRole check because platform users
  // might not have an organizationMember role set
  if (isPlatformUser) {
    return true
  }

  if (!currentUserRole) return true // Default: show all if no role

  const mappedCurrentRole = mapStringToUserRole(currentUserRole)
  const mappedTargetRole = mapStringToUserRole(targetUserRole)

  // OWNER can see all users within their organization
  if (mappedCurrentRole === 'OWNER') {
    return true
  }

  // ADMIN can see only lower roles (STAFF, DRIVER)
  if (mappedCurrentRole === 'ADMIN') {
    return canManageRole(mappedCurrentRole, mappedTargetRole)
  }

  // STAFF can see only lower roles (DRIVER)
  if (mappedCurrentRole === 'STAFF') {
    return canManageRole(mappedCurrentRole, mappedTargetRole)
  }

  // DRIVER cannot see other users
  if (mappedCurrentRole === 'DRIVER') {
    return false
  }

  // Default: don't show (for unknown roles)
  return false
}

/**
 * Check if user can manage (edit/delete/suspend) a specific user
 * 
 * @param currentUserRole - Current user's role
 * @param targetUserRole - Target user's role
 * @param isPlatformUser - Whether current user is a platform user
 * @param isCurrentUser - Whether target user is the current user
 * @returns True if current user can manage target user
 */
export function canManageUser(
  currentUserRole: ExtendedUserRole | string | undefined,
  targetUserRole: string,
  isPlatformUser: boolean,
  isCurrentUser: boolean
): boolean {
  if (isCurrentUser) return false // Cannot manage self

  // Platform users (DEV/PLATFORM_ADMIN) can manage any role, regardless of organizationMember role
  // This check must come before the currentUserRole check because platform users
  // might not have an organizationMember role set
  if (isPlatformUser) {
    return true
  }

  if (!currentUserRole) return false

  const mappedCurrentRole = mapStringToUserRole(currentUserRole)
  const mappedTargetRole = mapStringToUserRole(targetUserRole)

  // OWNER can manage any role within their organization
  if (mappedCurrentRole === 'OWNER') {
    return true
  }

  // ADMIN can manage only lower roles (STAFF, DRIVER)
  if (mappedCurrentRole === 'ADMIN') {
    return canManageRole(mappedCurrentRole, mappedTargetRole)
  }

  // STAFF can manage only lower roles (DRIVER)
  if (mappedCurrentRole === 'STAFF') {
    return canManageRole(mappedCurrentRole, mappedTargetRole)
  }

  // DRIVER cannot manage users
  if (mappedCurrentRole === 'DRIVER') {
    return false
  }

  // Other roles cannot manage users
  return false
}

/**
 * Check if user can modify a target user's role
 * 
 * @param currentUserRole - Current user's role
 * @param targetUserRole - Target user's role to modify
 * @param isPlatformUser - Whether current user is a platform user
 * @returns True if current user can modify target user's role
 */
export function canModifyRole(
  currentUserRole: ExtendedUserRole | string | undefined,
  targetUserRole: ExtendedUserRole | string,
  isPlatformUser: boolean
): boolean {
  // Platform users (DEV/PLATFORM_ADMIN) can modify any role, regardless of organizationMember role
  // This check must come before the currentUserRole check because platform users
  // might not have an organizationMember role set
  if (isPlatformUser) {
    return true
  }

  if (!currentUserRole) return false

  const mappedCurrentRole = mapStringToUserRole(currentUserRole)
  const mappedTargetRole = mapStringToUserRole(targetUserRole)

  // OWNER can modify any role within their organization
  if (mappedCurrentRole === 'OWNER') {
    return true
  }

  // ADMIN can modify only lower roles (STAFF, DRIVER)
  if (mappedCurrentRole === 'ADMIN') {
    return canManageRole(mappedCurrentRole, mappedTargetRole)
  }

  // STAFF can modify only lower roles (DRIVER)
  if (mappedCurrentRole === 'STAFF') {
    return canManageRole(mappedCurrentRole, mappedTargetRole)
  }

  // DRIVER cannot modify roles
  if (mappedCurrentRole === 'DRIVER') {
    return false
  }

  // Other roles cannot modify roles
  return false
}

/**
 * Get available roles that a user can assign when creating/inviting users
 * 
 * @param currentUserRole - Current user's role
 * @param isPlatformUser - Whether current user is a platform user
 * @returns Array of role options that can be assigned
 */
export function getAvailableRolesForAssignment(
  currentUserRole: ExtendedUserRole | string | undefined,
  isPlatformUser: boolean
): ExtendedUserRole[] {
  const allRoles: ExtendedUserRole[] = ['OWNER', 'ADMIN', 'STAFF', 'DRIVER']

  // Platform users (DEV/PLATFORM_ADMIN) can assign any role - no restrictions
  if (isPlatformUser) {
    // If we have a role, verify it's a platform role
    if (currentUserRole) {
      const mappedRole = mapStringToUserRole(currentUserRole)
      if (isPlatformRole(mappedRole)) {
        return allRoles
      }
    } else {
      // Platform user without organizationMember role - still has full access
      return allRoles
    }
  }

  if (!currentUserRole) return allRoles // Default: show all if no role

  const mappedRole = mapStringToUserRole(currentUserRole)

  // OWNER can assign any role
  if (mappedRole === 'OWNER') {
    return allRoles
  }

  // ADMIN can assign only lower roles (STAFF, DRIVER)
  if (mappedRole === 'ADMIN') {
    return allRoles.filter(role => canManageRole(mappedRole, role))
  }

  // STAFF can assign only lower roles (DRIVER)
  if (mappedRole === 'STAFF') {
    return allRoles.filter(role => canManageRole(mappedRole, role))
  }

  // DRIVER cannot assign roles
  if (mappedRole === 'DRIVER') {
    return []
  }

  // Default: return all roles
  return allRoles
}

/**
 * Check if user can access a specific tab in Settings
 * 
 * @param userRole - Current user's role
 * @param tabId - Tab identifier
 * @param isPlatformUser - Whether user is a platform user
 * @returns True if user can access the tab
 */
export function canAccessTab(
  userRole: ExtendedUserRole | string | undefined,
  tabId: 'organizaciones' | 'usuarios' | 'productos' | 'perfil-termico',
  isPlatformUser: boolean
): boolean {
  // Platform users (DEV/PLATFORM_ADMIN) can access all tabs, regardless of organizationMember role
  // This check must come before the userRole check because platform users
  // might not have an organizationMember role set
  if (isPlatformUser) {
    return true
  }

  if (!userRole) return false

  const mappedRole = mapStringToUserRole(userRole)

  switch (tabId) {
    case 'organizaciones':
      // Only OWNER and platform users can access organizations tab
      return mappedRole === 'OWNER' || isPlatformRole(mappedRole)

    case 'usuarios':
      // All organization roles can access users tab
      return hasOrganizationAccess(userRole)

    case 'productos':
    case 'perfil-termico':
      // OWNER and ADMIN can access, STAFF and DRIVER cannot
      return hasOwnerOrAdminAccess(userRole)

    default:
      return false
  }
}

/**
 * Check if user can access a specific route/section in the application
 * 
 * @param userRole - Current user's role
 * @param route - Route identifier (e.g., 'dashboard', 'dispatch', 'carriers')
 * @param isPlatformUser - Whether user is a platform user
 * @returns True if user can access the route
 */
export function canAccessRoute(
  userRole: ExtendedUserRole | string | undefined,
  route: AppRoute,
  isPlatformUser: boolean
): boolean {
  // Platform users (DEV/PLATFORM_ADMIN) can access all routes, regardless of organizationMember role
  // This check must come before the userRole check because platform users
  // might not have an organizationMember role set
  if (isPlatformUser) {
    return true
  }

  if (!userRole) return false

  // Route-specific access rules
  switch (route) {
    case 'dashboard':
    case 'dispatch':
    case 'control-tower':
    case 'carriers':
    case 'locations':
    case 'lanes':
    case 'alerts':
    case 'profile':
      // All organization roles can access these routes
      return hasOrganizationAccess(userRole)

    case 'settings':
      // OWNER and ADMIN can access settings
      // STAFF and DRIVER cannot access settings route (even though STAFF can access usuarios tab)
      return hasOwnerOrAdminAccess(userRole)

    case 'orders':
      // OWNER and ADMIN can access orders
      // STAFF and DRIVER cannot access orders
      return hasOwnerOrAdminAccess(userRole)

    case 'financials':
      // OWNER and ADMIN can access financials/reconciliation
      // STAFF and DRIVER may have limited access in the future
      return hasOwnerOrAdminAccess(userRole)

    default:
      return false
  }
}
