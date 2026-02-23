import { useState, useEffect, useRef, useCallback } from 'react'
import { toast } from 'sonner'
import { locationTypesService } from '../../../services/database/locations.service'
import type { SmartOption } from '../../../components/widgets/SmartSelect'
import { type LocationType, type StopType } from '../components/locationType.types'

/**
 * Hook for loading and managing location types data
 * Follows project pattern for data loading with caching
 */
export function useLocationTypes(organizationId?: string) {
  const [locationTypes, setLocationTypes] = useState<SmartOption[]>([])
  const [locationTypesData, setLocationTypesData] = useState<LocationType[]>([])
  const [loading, setLoading] = useState(false)
  const loadedOrgIdRef = useRef<string | null>(null)

  const loadLocationTypes = useCallback(async (force = false) => {
    if (!organizationId) {
      setLocationTypes([])
      setLocationTypesData([])
      loadedOrgIdRef.current = null
      return
    }

    if (!force && loadedOrgIdRef.current === organizationId) return

    try {
      setLoading(true)
      const typesData = await locationTypesService.getAll(organizationId)

      const mappedData: LocationType[] = typesData.map(type => ({
        id: type.id,
        name: type.name,
        org_id: type.org_id,
        description: type.description || undefined,
        allowed_stop_types: (type.allowed_stop_types || []) as StopType[],
        created_at: type.created_at || undefined,
      }))

      setLocationTypesData(mappedData)

      // Options for SmartSelect
      setLocationTypes(
        mappedData.map((type) => ({
          value: type.id.toString(),
          label: type.name,
        }))
      )
      loadedOrgIdRef.current = organizationId
    } catch (error) {
      console.error('Error loading location types:', error)
      toast.error('Error al cargar los tipos de ubicación')
    } finally {
      setLoading(false)
    }
  }, [organizationId])

  const createLocationType = async (data: Omit<LocationType, 'id' | 'created_at' | 'org_id'>) => {
    if (!organizationId) return

    try {
      setLoading(true)
      await locationTypesService.create({
        org_id: organizationId,
        name: data.name,
        description: data.description || null,
        allowed_stop_types: data.allowed_stop_types,
      })
      toast.success('Tipo de ubicación creado correctamente')
      await loadLocationTypes(true)
    } catch (error) {
      console.error('Error creating location type:', error)
      toast.error('Error al crear el tipo de ubicación')
      throw error
    } finally {
      setLoading(false)
    }
  }

  const updateLocationType = async (id: number, data: Partial<Omit<LocationType, 'id' | 'created_at' | 'org_id'>>) => {
    if (!organizationId) return

    try {
      setLoading(true)
      await locationTypesService.update(id, organizationId, {
        name: data.name,
        description: data.description || null,
        allowed_stop_types: data.allowed_stop_types,
      })
      toast.success('Tipo de ubicación actualizado correctamente')
      await loadLocationTypes(true)
    } catch (error) {
      console.error('Error updating location type:', error)
      toast.error('Error al actualizar el tipo de ubicación')
      throw error
    } finally {
      setLoading(false)
    }
  }

  const deleteLocationType = async (id: number) => {
    if (!organizationId) return

    try {
      setLoading(true)

      // Check if type is in use before deleting
      const inUse = await locationTypesService.isInUse(id, organizationId)
      if (inUse) {
        toast.error('No se puede eliminar un tipo de ubicación que está siendo utilizado')
        return
      }

      await locationTypesService.delete(id, organizationId)
      toast.success('Tipo de ubicación eliminado correctamente')
      await loadLocationTypes(true)
    } catch (error) {
      console.error('Error deleting location type:', error)
      toast.error('Error al eliminar el tipo de ubicación')
      throw error
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (organizationId && loadedOrgIdRef.current !== organizationId) {
      loadLocationTypes()
    } else if (!organizationId) {
      setLocationTypes([])
      setLocationTypesData([])
      loadedOrgIdRef.current = null
    }
  }, [organizationId, loadLocationTypes])

  return {
    locationTypes,
    locationTypesData,
    loading,
    loadLocationTypes,
    createLocationType,
    updateLocationType,
    deleteLocationType
  }
}