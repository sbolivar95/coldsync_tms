/**
 * Permission Matrix
 * 
 * Declarative matrix of permissions organized by role.
 * This serves as documentation and reference for all role-based permissions.
 * 
 * Note: This matrix is for documentation purposes. The actual permission checks
 * are implemented in permissions.ts using the functions that query this structure.
 */

import type { ExtendedUserRole, PermissionResource, AppRoute } from './types'

/**
 * Permission flags for resources
 */
export interface ResourcePermissions {
  view: boolean
  create: boolean
  edit: boolean
  delete: boolean
}

/**
 * Permission flags for routes
 */
export interface RoutePermissions {
  access: boolean
}

/**
 * Complete permission set for a role
 */
export interface RolePermissions {
  resources: Record<PermissionResource, ResourcePermissions>
  routes: Record<AppRoute, RoutePermissions>
  tabs: {
    organizaciones: boolean
    usuarios: boolean
    productos: boolean
    'perfil-termico': boolean
  }
  userManagement: {
    canView: (targetRole: ExtendedUserRole) => boolean
    canManage: (targetRole: ExtendedUserRole) => boolean
    canModifyRole: (targetRole: ExtendedUserRole) => boolean
    canAssignRoles: ExtendedUserRole[]
  }
}

/**
 * Permission matrix organized by role
 * 
 * This matrix defines all permissions for each role in the system.
 * Platform roles (DEV, PLATFORM_ADMIN) have full access to everything.
 * Organization roles have hierarchical restrictions.
 */
export const PERMISSION_MATRIX: Record<ExtendedUserRole, RolePermissions> = {
  // Platform Roles - Full Access
  DEV: {
    resources: {
      users: { view: true, create: true, edit: true, delete: true },
      products: { view: true, create: true, edit: true, delete: true },
      thermalProfiles: { view: true, create: true, edit: true, delete: true },
      organizations: { view: true, create: true, edit: true, delete: true },
      lanes: { view: true, create: true, edit: true, delete: true },
      dispatch: { view: true, create: true, edit: true, delete: true },
      reports: { view: true, create: true, edit: true, delete: true },
    },
    routes: {
      dashboard: { access: true },
      dispatch: { access: true },
      'control-tower': { access: true },
      financials: { access: true },
      carriers: { access: true },
      locations: { access: true },
      lanes: { access: true },
      orders: { access: true },
      alerts: { access: true },
      settings: { access: true },
      profile: { access: true },
    },
    tabs: {
      organizaciones: true,
      usuarios: true,
      productos: true,
      'perfil-termico': true,
    },
    userManagement: {
      canView: () => true, // Can view all users
      canManage: () => true, // Can manage all users
      canModifyRole: () => true, // Can modify any role
      canAssignRoles: ['OWNER', 'ADMIN', 'STAFF', 'DRIVER'], // Can assign any role
    },
  },

  PLATFORM_ADMIN: {
    resources: {
      users: { view: true, create: true, edit: true, delete: true },
      products: { view: true, create: true, edit: true, delete: true },
      thermalProfiles: { view: true, create: true, edit: true, delete: true },
      organizations: { view: true, create: true, edit: true, delete: true },
      lanes: { view: true, create: true, edit: true, delete: true },
      dispatch: { view: true, create: true, edit: true, delete: true },
      reports: { view: true, create: true, edit: true, delete: true },
    },
    routes: {
      dashboard: { access: true },
      dispatch: { access: true },
      'control-tower': { access: true },
      financials: { access: true },
      carriers: { access: true },
      locations: { access: true },
      lanes: { access: true },
      orders: { access: true },
      alerts: { access: true },
      settings: { access: true },
      profile: { access: true },
    },
    tabs: {
      organizaciones: true,
      usuarios: true,
      productos: true,
      'perfil-termico': true,
    },
    userManagement: {
      canView: () => true, // Can view all users
      canManage: () => true, // Can manage all users
      canModifyRole: () => true, // Can modify any role
      canAssignRoles: ['OWNER', 'ADMIN', 'STAFF', 'DRIVER'], // Can assign any role
    },
  },

  // Organization Roles - Hierarchical Access
  OWNER: {
    resources: {
      users: { view: true, create: true, edit: true, delete: true },
      products: { view: true, create: true, edit: true, delete: true },
      thermalProfiles: { view: true, create: true, edit: true, delete: true },
      organizations: { view: true, create: false, edit: true, delete: false }, // Can view/edit own org, but not create/delete
      lanes: { view: true, create: true, edit: true, delete: true },
      dispatch: { view: true, create: true, edit: true, delete: true },
      reports: { view: true, create: true, edit: true, delete: true },
    },
    routes: {
      dashboard: { access: true },
      dispatch: { access: true },
      'control-tower': { access: true },
      financials: { access: true },
      carriers: { access: true },
      locations: { access: true },
      lanes: { access: true },
      orders: { access: true },
      alerts: { access: true },
      settings: { access: true },
      profile: { access: true },
    },
    tabs: {
      organizaciones: true, // Can view own organization
      usuarios: true,
      productos: true,
      'perfil-termico': true,
    },
    userManagement: {
      canView: () => true, // Can view all users in organization
      canManage: () => true, // Can manage all users in organization (except self)
      canModifyRole: () => true, // Can modify any role in organization
      canAssignRoles: ['OWNER', 'ADMIN', 'STAFF', 'DRIVER'], // Can assign any role
    },
  },

  ADMIN: {
    resources: {
      users: { view: true, create: true, edit: true, delete: true }, // With hierarchy restrictions
      products: { view: true, create: true, edit: true, delete: true },
      thermalProfiles: { view: true, create: true, edit: true, delete: true },
      organizations: { view: false, create: false, edit: false, delete: false },
      lanes: { view: true, create: true, edit: true, delete: true },
      dispatch: { view: true, create: true, edit: true, delete: true },
      reports: { view: true, create: true, edit: true, delete: true },
    },
    routes: {
      dashboard: { access: true },
      dispatch: { access: true },
      'control-tower': { access: true },
      financials: { access: true },
      carriers: { access: true },
      locations: { access: true },
      lanes: { access: true },
      orders: { access: true },
      alerts: { access: true },
      settings: { access: true },
      profile: { access: true },
    },
    tabs: {
      organizaciones: false, // Cannot access organizations tab
      usuarios: true,
      productos: true,
      'perfil-termico': true,
    },
    userManagement: {
      canView: (targetRole) => {
        // Can only view STAFF and DRIVER
        return ['STAFF', 'DRIVER'].includes(targetRole)
      },
      canManage: (targetRole) => {
        // Can only manage STAFF and DRIVER
        return ['STAFF', 'DRIVER'].includes(targetRole)
      },
      canModifyRole: (targetRole) => {
        // Can only modify STAFF and DRIVER roles
        return ['STAFF', 'DRIVER'].includes(targetRole)
      },
      canAssignRoles: ['STAFF', 'DRIVER'], // Can only assign lower roles
    },
  },

  STAFF: {
    resources: {
      users: { view: true, create: true, edit: true, delete: true }, // With hierarchy restrictions (only DRIVER)
      products: { view: false, create: false, edit: false, delete: false },
      thermalProfiles: { view: false, create: false, edit: false, delete: false },
      organizations: { view: false, create: false, edit: false, delete: false },
      lanes: { view: true, create: true, edit: true, delete: true },
      dispatch: { view: true, create: true, edit: true, delete: true },
      reports: { view: true, create: true, edit: true, delete: true },
    },
    routes: {
      dashboard: { access: true },
      dispatch: { access: true },
      'control-tower': { access: true },
      financials: { access: false }, // No access to financials
      carriers: { access: true },
      locations: { access: true },
      lanes: { access: true },
      orders: { access: false }, // No access to loadboard
      alerts: { access: true },
      settings: { access: false }, // No access to settings route (even though can access usuarios tab)
      profile: { access: true },
    },
    tabs: {
      organizaciones: false,
      usuarios: true,
      productos: false, // No access to products tab
      'perfil-termico': false, // No access to thermal profiles tab
    },
    userManagement: {
      canView: (targetRole) => {
        // Can only view DRIVER
        return targetRole === 'DRIVER'
      },
      canManage: (targetRole) => {
        // Can only manage DRIVER
        return targetRole === 'DRIVER'
      },
      canModifyRole: (targetRole) => {
        // Can only modify DRIVER role
        return targetRole === 'DRIVER'
      },
      canAssignRoles: ['DRIVER'], // Can only assign DRIVER role
    },
  },

  DRIVER: {
    resources: {
      users: { view: false, create: false, edit: false, delete: false },
      products: { view: false, create: false, edit: false, delete: false },
      thermalProfiles: { view: false, create: false, edit: false, delete: false },
      organizations: { view: false, create: false, edit: false, delete: false },
      lanes: { view: true, create: false, edit: false, delete: false }, // Read-only access
      dispatch: { view: true, create: false, edit: false, delete: false }, // Read-only access
      reports: { view: true, create: false, edit: false, delete: false }, // Read-only access
    },
    routes: {
      dashboard: { access: true },
      dispatch: { access: true },
      'control-tower': { access: true },
      financials: { access: false },
      carriers: { access: true },
      locations: { access: true },
      lanes: { access: true },
      orders: { access: true },
      alerts: { access: true },
      settings: { access: false }, // No access to settings
      profile: { access: true },
    },
    tabs: {
      organizaciones: false,
      usuarios: false,
      productos: false,
      'perfil-termico': false,
    },
    userManagement: {
      canView: () => false, // Cannot view other users
      canManage: () => false, // Cannot manage users
      canModifyRole: () => false, // Cannot modify roles
      canAssignRoles: [], // Cannot assign roles
    },
  },

  CARRIER: {
    resources: {
      users: { view: false, create: false, edit: false, delete: false },
      products: { view: false, create: false, edit: false, delete: false },
      thermalProfiles: { view: false, create: false, edit: false, delete: false },
      organizations: { view: false, create: false, edit: false, delete: false },
      lanes: { view: true, create: false, edit: false, delete: false }, // Read-only access
      dispatch: { view: true, create: false, edit: false, delete: false }, // Read-only access
      reports: { view: true, create: false, edit: false, delete: false }, // Read-only access
    },
    routes: {
      dashboard: { access: true },
      dispatch: { access: true },
      'control-tower': { access: false }, // No access to control tower
      financials: { access: false },
      carriers: { access: false }, // Cannot view other carriers
      locations: { access: true },
      lanes: { access: true },
      orders: { access: true }, // Can view loadboard
      alerts: { access: true },
      settings: { access: false }, // No access to settings
      profile: { access: true },
    },
    tabs: {
      organizaciones: false,
      usuarios: false,
      productos: false,
      'perfil-termico': false,
    },
    userManagement: {
      canView: () => false, // Cannot view other users
      canManage: () => false, // Cannot manage users
      canModifyRole: () => false, // Cannot modify roles
      canAssignRoles: [], // Cannot assign roles
    },
  },
} as const

/**
 * Get permissions for a specific role
 * 
 * @param role - User role
 * @returns Permission set for the role, or null if role doesn't exist
 */
export function getRolePermissions(
  role: ExtendedUserRole | string | undefined
): RolePermissions | null {
  if (!role) return null

  // Handle string roles (map to enum)
  const roleMap: Record<string, ExtendedUserRole> = {
    'OWNER': 'OWNER',
    'ADMIN': 'ADMIN',
    'STAFF': 'STAFF',
    'DRIVER': 'DRIVER',
    'CARRIER': 'CARRIER',
    'DEV': 'DEV',
    'PLATFORM_ADMIN': 'PLATFORM_ADMIN',
    // Spanish labels
    'Propietario': 'OWNER',
    'Administrador': 'ADMIN',
    'Personal': 'STAFF',
    'Conductor': 'DRIVER',
    'Transportista': 'CARRIER',
    'Desarrollador': 'DEV',
  }

  const mappedRole = roleMap[role] || role as ExtendedUserRole

  if (mappedRole in PERMISSION_MATRIX) {
    return PERMISSION_MATRIX[mappedRole as ExtendedUserRole]
  }

  return null
}

/**
 * Check if a role has a specific resource permission
 * 
 * @param role - User role
 * @param resource - Resource to check
 * @param permission - Permission type (view, create, edit, delete)
 * @returns True if role has the permission
 */
export function hasResourcePermission(
  role: ExtendedUserRole | string | undefined,
  resource: PermissionResource,
  permission: keyof ResourcePermissions
): boolean {
  const rolePermissions = getRolePermissions(role)
  if (!rolePermissions) return false

  return rolePermissions.resources[resource]?.[permission] ?? false
}

/**
 * Check if a role has access to a specific route
 * 
 * @param role - User role
 * @param route - Route to check
 * @returns True if role has access to the route
 */
export function hasRouteAccess(
  role: ExtendedUserRole | string | undefined,
  route: AppRoute
): boolean {
  const rolePermissions = getRolePermissions(role)
  if (!rolePermissions) return false

  return rolePermissions.routes[route]?.access ?? false
}
