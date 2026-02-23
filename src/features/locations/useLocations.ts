import { useEffect } from 'react'
import { toast } from 'sonner'
import type { Location } from '../../types/database.types'
import { locationsService } from '../../services/database/locations.service'
import { useAppStore } from '../../stores/useAppStore'

// Extended Location type with relations
export type LocationWithRelations = Location & {
  countries?: { id: number; name: string; iso_code: string } | null
  location_types?: {
    id: number
    name: string
    description?: string | null
    allowed_stop_types?: string[] | null
  } | null
}

/**
 * Custom hook for managing locations state and operations
 * Uses Zustand store for shared state between components (same pattern as useUsers)
 */
export function useLocations(orgId: string) {
  // Use Zustand store for locations (shared state)
  const locations = useAppStore((state) => state.locations) as LocationWithRelations[]
  const isLoading = useAppStore((state) => state.locationsLoading)
  const locationsLoadedOrgId = useAppStore((state) => state.locationsLoadedOrgId)
  const setLocations = useAppStore((state) => state.setLocations)
  const setLocationsLoading = useAppStore((state) => state.setLocationsLoading)
  const setLocationsLoadedOrgId = useAppStore((state) => state.setLocationsLoadedOrgId)

  // Load locations data
  const loadLocations = async (force = false) => {
    if (!orgId) {
      setLocations([])
      setLocationsLoadedOrgId(null)
      return
    }

    // Skip if already loaded for this orgId and not forcing reload
    if (!force && locationsLoadedOrgId === orgId && locations.length > 0) {
      return
    }

    try {
      setLocationsLoading(true)
      const data = (await locationsService.getAll(orgId)) as LocationWithRelations[]
      setLocations(data)
      setLocationsLoadedOrgId(orgId)
    } catch (error) {
      console.error('Error loading locations:', error)
      toast.error('Error al cargar las ubicaciones')
      setLocations([])
      // IMPORTANT: Set loaded ID to avoid infinite loop on error
      setLocationsLoadedOrgId(orgId)
    } finally {
      setLocationsLoading(false)
    }
  }

  // Load locations only when orgId changes (not on every mount)
  useEffect(() => {
    // Only load if orgId changed or hasn't been loaded yet
    // CRITICAL: Removed locations.length === 0 check to prevent infinite loop if list is empty
    if (orgId && (locationsLoadedOrgId !== orgId)) {
      loadLocations()
    } else if (!orgId) {
      setLocations([])
      setLocationsLoadedOrgId(null)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orgId, locationsLoadedOrgId])

  // Handlers
  const handleLocationDelete = async (location: LocationWithRelations) => {
    if (!orgId) {
      toast.error('No hay organización seleccionada')
      return
    }

    try {
      await locationsService.softDelete(location.id, orgId)
      toast.success('Ubicación eliminada correctamente')
      loadLocations(true) // Force reload after delete
    } catch (error) {
      console.error('Error deleting location:', error)
      toast.error('Error al eliminar la ubicación')
    }
  }

  const handleLocationBulkDelete = async (locationIds: string[]) => {
    if (!orgId) {
      toast.error('No hay organización seleccionada')
      return
    }

    try {
      await Promise.all(
        locationIds.map((id) => locationsService.softDelete(parseInt(id, 10), orgId))
      )
      toast.success(`${locationIds.length} ubicación(es) eliminada(s) correctamente`)
      loadLocations(true) // Force reload after delete
    } catch (error) {
      console.error('Error deleting locations:', error)
      toast.error('Error al eliminar las ubicaciones')
    }
  }

  return {
    // State
    locations,
    isLoading,

    // Actions
    handleLocationDelete,
    handleLocationBulkDelete,
    loadLocations,
  }
}