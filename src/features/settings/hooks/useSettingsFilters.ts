import { useMemo } from 'react'
import type { StatusFilterValue } from '../../../components/ui/StatusFilter'
import type { EntityStatusFilterValue } from '../../../components/ui/EntityStatusFilter'
import type { Organization } from './useOrganizations'
import type { User } from '../../../types/user.types'
import type { Product, ThermalProfile } from '../../../types/database.types'
import type { OrganizationMember } from '../../../types/database.types'
import type { RateCardWithCharges } from '../../../services/database/rateCards.service'
import { canViewUser } from '../../../lib/permissions'

interface UseSettingsFiltersProps {
  activeTab: string
  searchTerm: string
  statusFilter: StatusFilterValue
  entityStatusFilter: EntityStatusFilterValue
  organizations: Organization[]
  users: User[]
  products: Product[]
  thermalProfiles: ThermalProfile[]
  rateCards: RateCardWithCharges[]
  organizationMember?: OrganizationMember | null
  isPlatformUser?: boolean
}

/**
 * Custom hook for managing filtering logic in Settings page
 * Handles filtering for all entity types (organizations, users, products, thermal profiles)
 */
export function useSettingsFilters({
  searchTerm,
  statusFilter,
  entityStatusFilter,
  organizations,
  users,
  products,
  thermalProfiles,
  rateCards,
  organizationMember,
  isPlatformUser = false,
}: UseSettingsFiltersProps) {
  // Filter organizations based on search term and status
  const filteredOrganizations = useMemo(() => {
    return (organizations || []).filter((org) => {
      const matchesSearch =
        org.comercial_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (org.legal_name && org.legal_name.toLowerCase().includes(searchTerm.toLowerCase()))

      // Status filter for organizations
      const matchesStatus = entityStatusFilter === 'all' || org.status === entityStatusFilter

      return matchesSearch && matchesStatus
    })
  }, [organizations, searchTerm, entityStatusFilter])

  // Filter users based on search, status, and role hierarchy
  const filteredUsers = useMemo(() => {
    // Platform users (DEV/PLATFORM_ADMIN) can see all users
    if (isPlatformUser) {
      return (users || []).filter((user) => {
        const firstName = user.firstName || user.nombre || ''
        const lastName = user.lastName || user.apellido || ''
        const email = user.email || user.correo || ''
        const fullName = `${firstName} ${lastName}`.toLowerCase()

        const matchesSearch =
          fullName.includes(searchTerm.toLowerCase()) ||
          email.toLowerCase().includes(searchTerm.toLowerCase())

        // Status filter for users
        const userStatus = user.status || user.estado || 'Activo'
        const matchesStatus = entityStatusFilter === 'all' || userStatus === entityStatusFilter

        return matchesSearch && matchesStatus
      })
    }
    
    // For organization members, apply role hierarchy filter (no need to map, canViewUser handles it)
    
    return (users || []).filter((user) => {
      const firstName = user.firstName || user.nombre || ''
      const lastName = user.lastName || user.apellido || ''
      const email = user.email || user.correo || ''
      const fullName = `${firstName} ${lastName}`.toLowerCase()

      const matchesSearch =
        fullName.includes(searchTerm.toLowerCase()) ||
        email.toLowerCase().includes(searchTerm.toLowerCase())

      // Status filter for users
      const userStatus = user.status || user.estado || 'Activo'
      const matchesStatus = entityStatusFilter === 'all' || userStatus === entityStatusFilter

      // Role hierarchy filter: use centralized permission check
      const targetUserRole = user.role || user.rol || 'STAFF'
      const matchesHierarchy = canViewUser(
        organizationMember?.role,
        targetUserRole,
        isPlatformUser || false
      )

      return matchesSearch && matchesStatus && matchesHierarchy
    })
  }, [users, searchTerm, entityStatusFilter, organizationMember, isPlatformUser])

  // Filter products based on search and status
  const filteredProducts = useMemo(() => {
    return (products || []).filter((product) => {
      const matchesSearch =
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (product.description &&
          product.description.toLowerCase().includes(searchTerm.toLowerCase()))

      const matchesStatus =
        statusFilter === 'all' ||
        (statusFilter === 'active' && product.is_active) ||
        (statusFilter === 'inactive' && !product.is_active)

      return matchesSearch && matchesStatus
    })
  }, [products, searchTerm, statusFilter])

  // Filter thermal profiles based on search and status
  const filteredThermalProfiles = useMemo(() => {
    return (thermalProfiles || []).filter((profile) => {
      const matchesSearch =
        profile.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (profile.description &&
          profile.description.toLowerCase().includes(searchTerm.toLowerCase()))

      const matchesStatus =
        statusFilter === 'all' ||
        (statusFilter === 'active' && profile.is_active) ||
        (statusFilter === 'inactive' && !profile.is_active)

      return matchesSearch && matchesStatus
    })
  }, [thermalProfiles, searchTerm, statusFilter])

  // Filter rate cards based on search and status
  const filteredRateCards = useMemo(() => {
    return (rateCards || []).filter((rateCard) => {
      const name = rateCard.name || ''
      const matchesSearch = name.toLowerCase().includes(searchTerm.toLowerCase())

      const matchesStatus =
        statusFilter === 'all' ||
        (statusFilter === 'active' && rateCard.is_active) ||
        (statusFilter === 'inactive' && !rateCard.is_active)

      return matchesSearch && matchesStatus
    })
  }, [rateCards, searchTerm, statusFilter])

  return {
    filteredOrganizations,
    filteredUsers,
    filteredProducts,
    filteredThermalProfiles,
    filteredRateCards,
  }
}
