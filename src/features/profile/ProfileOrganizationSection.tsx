import { Input } from '../../components/ui/Input'
import { Label } from '../../components/ui/Label'
import { useAppStore } from '../../stores/useAppStore'
import { useShallow } from 'zustand/react/shallow'
import { mapUserRoleToLabel } from '../../services/database/organizationMembers.service'
import type { UserRole } from '../../types/database.types'

/**
 * Helper function to get role label for display
 */
function getRoleLabel(role: UserRole | string | null | undefined): string {
  if (!role) return 'N/A'
  
  // If it's already a label (Spanish), return as is
  if (typeof role === 'string' && !['OWNER', 'ADMIN', 'STAFF', 'DRIVER', 'DEV'].includes(role)) {
    return role
  }
  
  // Map enum to label
  return mapUserRoleToLabel(role as UserRole)
}

/**
 * ProfileOrganizationSection - Displays organization information in read-only mode
 * Shows organization details for all users (regular and platform users)
 */
export function ProfileOrganizationSection() {
  const { organization, organizationMember, isPlatformUser } = useAppStore(
    useShallow((state) => ({
      organization: state.organization,
      organizationMember: state.organizationMember,
      isPlatformUser: state.isPlatformUser,
    }))
  )

  // Determine what to show
  const hasOrganization = organization !== null
  const hasRole = organizationMember !== null && organizationMember.role !== null

  // If no organization, show message
  if (!hasOrganization) {
    return (
      <div className='space-y-4'>
        <h4 className='text-sm font-semibold text-gray-900'>
          Información de Organización
        </h4>
        <div className='text-sm text-gray-500'>
          No estás asociado a ninguna organización
        </div>
        {isPlatformUser && (
          <div className='text-xs text-gray-400'>
            Usa el selector del header para seleccionar una organización
          </div>
        )}
      </div>
    )
  }

  // Build location string
  // Note: base_country may not be available in the store type, so we check for it safely
  const locationParts: string[] = []
  if (organization.city) {
    locationParts.push(organization.city)
  }
  // Type assertion needed because base_country is not in database.types.ts Organization
  // but may be present when loaded from the service
  const orgWithCountry = organization as typeof organization & { base_country?: string }
  if (orgWithCountry.base_country) {
    locationParts.push(orgWithCountry.base_country)
  }
  const location = locationParts.length > 0 ? locationParts.join(', ') : null

  return (
    <div className='space-y-4'>
      <h4 className='text-sm font-semibold text-gray-900'>
        Información de Organización
      </h4>
      <div className='grid grid-cols-2 gap-4'>
        {/* Nombre Comercial */}
        <div className='space-y-1.5'>
          <Label htmlFor='profile-org-comercial-name' className='text-xs text-gray-600'>Nombre Comercial</Label>
          <Input
            id='profile-org-comercial-name'
            value={organization.comercial_name || ''}
            disabled
            className='bg-gray-50 cursor-not-allowed'
          />
        </div>

        {/* Razón Social */}
        <div className='space-y-1.5'>
          <Label htmlFor='profile-org-legal-name' className='text-xs text-gray-600'>Razón Social</Label>
          <Input
            id='profile-org-legal-name'
            value={organization.legal_name || ''}
            disabled
            className='bg-gray-50 cursor-not-allowed'
          />
        </div>

        {/* Rol del Usuario (only for regular users, not platform users) */}
        {hasRole && (
          <div className='space-y-1.5'>
            <Label htmlFor='profile-org-role' className='text-xs text-gray-600'>Rol</Label>
            <Input
              id='profile-org-role'
              value={getRoleLabel(organizationMember.role)}
              disabled
              className='bg-gray-50 cursor-not-allowed'
            />
          </div>
        )}

        {/* Ubicación */}
        {location && (
          <div className='space-y-1.5'>
            <Label htmlFor='profile-org-location' className='text-xs text-gray-600'>Ubicación</Label>
            <Input
              id='profile-org-location'
              value={location}
              disabled
              className='bg-gray-50 cursor-not-allowed'
            />
          </div>
        )}
      </div>
    </div>
  )
}
