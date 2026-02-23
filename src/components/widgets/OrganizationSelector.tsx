import { useState, useEffect } from 'react'
import { useAppStore } from '../../stores/useAppStore'
import { organizationsService } from '../../services/database/organizations.service'
import { authService } from '../../services/database/auth.service'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/Select'
import { toast } from 'sonner'
import { useShallow } from 'zustand/react/shallow'

export function OrganizationSelector() {
  const { user, organization, setAuthSession, isPlatformUser } = useAppStore(
    useShallow((state) => ({
      user: state.user,
      organization: state.organization,
      setAuthSession: state.setAuthSession,
      isPlatformUser: state.isPlatformUser,
    }))
  )

  // Use Zustand store for organizations (shared state)
  const organizations = useAppStore((state) => state.organizations)
  const isLoadingOrgs = useAppStore((state) => state.organizationsLoading)
  const organizationsLoadedUserId = useAppStore((state) => state.organizationsLoadedUserId)
  const setOrganizations = useAppStore((state) => state.setOrganizations)
  const setOrganizationsLoading = useAppStore((state) => state.setOrganizationsLoading)
  const setOrganizationsLoadedUserId = useAppStore((state) => state.setOrganizationsLoadedUserId)

  const [isLoading, setIsLoading] = useState(false)

  // Load organizations function - uses Zustand store
  const loadOrganizations = async () => {
    if (!user?.id) return

    // Skip if already loaded for this user
    if (organizationsLoadedUserId === user.id && organizations.length > 0) {
      return
    }

    setOrganizationsLoading(true)
    try {
      const orgs = await organizationsService.getAll()
      setOrganizations(orgs)
      setOrganizationsLoadedUserId(user.id)
    } catch (error) {
      console.error('Error loading organizations:', error)
      toast.error('Error al cargar las organizaciones')
    } finally {
      setOrganizationsLoading(false)
    }
  }

  // Load organizations if platform user
  useEffect(() => {
    if (isPlatformUser && user?.id) {
      loadOrganizations()
    }
  }, [isPlatformUser, user?.id])

  // Listen for organization changes to refresh the list
  useEffect(() => {
    if (!isPlatformUser) return

    const handleOrganizationsChanged = () => {
      loadOrganizations()
    }

    window.addEventListener('organizationsChanged', handleOrganizationsChanged)
    
    return () => {
      window.removeEventListener('organizationsChanged', handleOrganizationsChanged)
    }
  }, [isPlatformUser])

  const handleOrganizationChange = async (orgId: string) => {
    if (!user?.id || !isPlatformUser) return

    setIsLoading(true)
    try {
      const session = await authService.switchOrganizationForPlatformUser(orgId)
      setAuthSession(session)
      toast.success('Organización cambiada correctamente')
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : 'Error al cambiar de organización'
      toast.error(errorMessage)
      console.error('Error switching organization:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // Don't render if not platform user
  if (!isPlatformUser) {
    return null
  }

  return (
    <Select
      value={organization?.id || ''}
      onValueChange={handleOrganizationChange}
      disabled={isLoading || isLoadingOrgs}
    >
      <SelectTrigger
        className='w-[250px] h-9 text-sm'
        size='sm'
      >
        <SelectValue placeholder='Seleccionar organización' />
      </SelectTrigger>
      <SelectContent>
        {organizations.map((org) => (
          <SelectItem
            key={org.id}
            value={org.id}
          >
            {org.comercial_name || org.legal_name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
