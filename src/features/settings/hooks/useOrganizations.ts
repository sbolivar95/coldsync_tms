import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import type { Organization as DatabaseOrganization } from '../../../services/database/organizations.service'
import { organizationsService } from '../../../services/database/organizations.service'
import { useAppStore } from '../../../stores/useAppStore'

/**
 * Organization type for UI (extends database type)
 */
export interface Organization extends DatabaseOrganization {
  // No additional fields needed for organizations
}

/**
 * Custom hook for managing organizations state and operations
 * Note: Only platform users can access Settings, so we always load all organizations
 * Uses Zustand store for shared state between components
 */
export function useOrganizations() {
  const user = useAppStore((state) => state.user)
  const organization = useAppStore((state) => state.organization)
  const organizationMember = useAppStore((state) => state.organizationMember)
  const isPlatformUser = useAppStore((state) => state.isPlatformUser)
  // Use Zustand store for organizations (shared state)
  const organizations = useAppStore((state) => state.organizations)
  const isLoading = useAppStore((state) => state.organizationsLoading)
  const organizationsLoadedUserId = useAppStore((state) => state.organizationsLoadedUserId)
  const setOrganizations = useAppStore((state) => state.setOrganizations)
  const setOrganizationsLoading = useAppStore((state) => state.setOrganizationsLoading)
  const setOrganizationsLoadedUserId = useAppStore((state) => state.setOrganizationsLoadedUserId)

  const [selectedOrganization, setSelectedOrganization] = useState<Organization | undefined>(undefined)


  // Load organizations from service
  const loadOrganizations = async (force = false) => {
    if (!user?.id) {
      setOrganizations([])
      setOrganizationsLoadedUserId(null)
      return
    }

    // Skip if already loaded for this user and not forcing reload
    if (!force && organizationsLoadedUserId === user.id && organizations.length > 0) {
      return
    }

    try {
      setOrganizationsLoading(true)

      // Platform Admins: load all organizations
      if (isPlatformUser) {
        const orgs = await organizationsService.getAll()
        const mappedOrgs = orgs.map(org => ({
          ...org,
        }))
        setOrganizations(mappedOrgs)
      }
      // OWNER: load only their own organization
      else if (organizationMember?.role === 'OWNER' && organization?.id) {
        const org = await organizationsService.getById(organization.id)
        if (org) {
          setOrganizations([org])
        } else {
          setOrganizations([])
        }
      }
      // Other roles: no organizations (shouldn't see this tab)
      else {
        setOrganizations([])
      }

      setOrganizationsLoadedUserId(user.id)
    } catch (error) {
      console.error('Error loading organizations:', error)
      toast.error('Error al cargar las organizaciones')
      setOrganizations([])
      setOrganizationsLoadedUserId(null)
    } finally {
      setOrganizationsLoading(false)
    }
  }

  // Load organizations only when user changes (not on every mount)
  useEffect(() => {
    // Only load if user changed or hasn't been loaded yet
    if (user?.id && (organizationsLoadedUserId !== user.id || organizations.length === 0)) {
      loadOrganizations()
    }
  }, [user?.id, organizationsLoadedUserId, organizations.length])

  // Listen for organization changes event (from OrganizationSelector or other components)
  useEffect(() => {
    const handleOrganizationsChanged = () => {
      loadOrganizations(true) // Force reload when event is dispatched
    }

    window.addEventListener('organizationsChanged', handleOrganizationsChanged)

    return () => {
      window.removeEventListener('organizationsChanged', handleOrganizationsChanged)
    }
  }, [])

  // Handlers
  const handleOrganizationDelete = async (organization: Organization) => {
    if (!organization.id) {
      toast.error('Error: organización no válida')
      return
    }

    try {
      await organizationsService.delete(organization.id)
      toast.success(`Organización ${organization.comercial_name} eliminada correctamente`)
      loadOrganizations(true) // Force reload
      // Dispatch event to notify OrganizationSelector to refresh
      window.dispatchEvent(new CustomEvent('organizationsChanged'))
    } catch (error) {
      console.error('Error eliminando organización:', error)
      toast.error('Error al eliminar la organización')
    }
  }

  const handleOrganizationBulkDelete = async (organizationIds: string[]) => {
    try {
      await Promise.all(
        organizationIds.map(id => organizationsService.delete(id))
      )
      toast.success(`${organizationIds.length} organización(es) eliminada(s) correctamente`)
      loadOrganizations(true) // Force reload
      // Dispatch event to notify OrganizationSelector to refresh
      window.dispatchEvent(new CustomEvent('organizationsChanged'))
    } catch (error) {
      console.error('Error eliminando organizaciones:', error)
      toast.error('Error al eliminar las organizaciones')
    }
  }

  const handleOrganizationSave = async (organizationData: Partial<Organization>) => {
    try {
      if (!organizationData.id) {
        // Create new organization
        const createData = {
          comercial_name: organizationData.comercial_name!,
          legal_name: organizationData.legal_name!,
          city: organizationData.city || null,
          base_country_id: organizationData.base_country_id!,
          tax_id: organizationData.tax_id!,
          fiscal_address: organizationData.fiscal_address!,
          billing_email: organizationData.billing_email!,
          contact_name: organizationData.contact_name!,
          contact_phone: organizationData.contact_phone!,
          contact_email: organizationData.contact_email!,
          currency: organizationData.currency ?? undefined,
          time_zone: organizationData.time_zone ?? undefined,
          plan_type: organizationData.plan_type ?? undefined,
        };

        await organizationsService.create(createData);
        toast.success(`Organización ${organizationData.comercial_name} creada correctamente`);
        setSelectedOrganization(undefined);
        loadOrganizations(true); // Force reload
        // Dispatch event to notify OrganizationSelector to refresh
        window.dispatchEvent(new CustomEvent('organizationsChanged'));
      } else {
        // Update existing organization
        const updates = {
          comercial_name: organizationData.comercial_name!,
          legal_name: organizationData.legal_name!,
          city: organizationData.city || null,
          base_country_id: organizationData.base_country_id!,
          status: organizationData.status as 'ACTIVE' | 'INACTIVE' | undefined,
          tax_id: organizationData.tax_id!,
          fiscal_address: organizationData.fiscal_address!,
          billing_email: organizationData.billing_email!,
          contact_name: organizationData.contact_name!,
          contact_phone: organizationData.contact_phone!,
          contact_email: organizationData.contact_email!,
          currency: organizationData.currency ?? undefined,
          time_zone: organizationData.time_zone ?? undefined,
          plan_type: organizationData.plan_type ?? undefined,
        };

        await organizationsService.update(
          organizationData.id,
          updates,
          organizationMember?.role,
          isPlatformUser
        );
        toast.success(`Organización ${organizationData.comercial_name} actualizada correctamente`);
        setSelectedOrganization(undefined);
        loadOrganizations(true); // Force reload
        // Dispatch event to notify OrganizationSelector to refresh
        window.dispatchEvent(new CustomEvent('organizationsChanged'));
      }
    } catch (error: unknown) {
      console.error('Error guardando organización:', error);
      const errorMessage = error instanceof Error
        ? error.message
        : 'Error al guardar la organización';
      toast.error(errorMessage);
      throw error; // Re-throw to allow caller to handle
    }
  };

  return {
    // Data
    organizations,
    isLoading,

    // State
    selectedOrganization,

    // Actions
    handleOrganizationDelete,
    handleOrganizationBulkDelete,
    handleOrganizationSave,
    loadOrganizations, // Export loadOrganizations for external use
  }
}
