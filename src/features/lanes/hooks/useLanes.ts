import { useEffect } from 'react'
import { useAppStore } from '../../../stores/useAppStore'
import { lanesService } from '../../../services/database/lanes.service'
import { toast } from 'sonner'
import type { Lane, LaneType, LaneStop, Location } from '../../../types/database.types'

export interface LaneWithRelations extends Lane {
  lane_types?: LaneType | null;
  lane_stops?: (LaneStop & { locations?: Location })[];
}

/**
 * Hook to manage lanes data with Zustand store and intelligent caching
 */
export function useLanes() {
  const lanes = useAppStore((state) => state.lanes) as LaneWithRelations[]
  const isLoading = useAppStore((state) => state.lanesLoading)
  const lanesLoadedOrgId = useAppStore((state) => state.lanesLoadedOrgId)
  const setLanes = useAppStore((state) => state.setLanes)
  const setLanesLoading = useAppStore((state) => state.setLanesLoading)
  const setLanesLoadedOrgId = useAppStore((state) => state.setLanesLoadedOrgId)

  const organization = useAppStore((state) => state.organization)
  const orgId = organization?.id

  const loadLanes = async (force = false) => {
    if (!orgId) {
      setLanes([])
      setLanesLoadedOrgId(null)
      return
    }

    if (!force && lanesLoadedOrgId === orgId && lanes.length > 0) {
      return
    }

    try {
      setLanesLoading(true)
      const result = await lanesService.getAllWithStops(orgId)
      setLanes(result as LaneWithRelations[])
      setLanesLoadedOrgId(orgId)
    } catch (error) {
      console.error('Error loading lanes:', error)
      toast.error('Error al cargar los carriles')
      setLanes([])
      setLanesLoadedOrgId(orgId)
    } finally {
      setLanesLoading(false)
    }
  }

  useEffect(() => {
    if (orgId && (lanesLoadedOrgId !== orgId)) {
      loadLanes()
    } else if (!orgId) {
      setLanes([])
      setLanesLoadedOrgId(null)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orgId, lanesLoadedOrgId])

  const handleLaneDelete = async (lane: Lane) => {
    if (!orgId) {
      toast.error('No hay organización seleccionada')
      return
    }

    try {
      await lanesService.softDelete(lane.id, orgId)
      toast.success('Carril desactivado correctamente')
      loadLanes(true)
    } catch (error) {
      console.error('Error deleting lane:', error)
      toast.error('Error al desactivar el carril')
    }
  }

  const handleLaneBulkDelete = async (laneIds: string[]) => {
    if (!orgId) {
      toast.error('No hay organización seleccionada')
      return
    }

    try {
      await Promise.all(
        laneIds.map((id) => lanesService.softDelete(id, orgId))
      )
      toast.success(`${laneIds.length} carril(es) desactivado(s) correctamente`)
      loadLanes(true)
    } catch (error) {
      console.error('Error deleting lanes:', error)
      toast.error('Error al desactivar los carriles')
    }
  }

  return { lanes, isLoading, loadLanes, handleLaneDelete, handleLaneBulkDelete }
}

/**
 * Hook to get active lanes only
 */
export function useActiveLanes() {
  const { lanes, isLoading, loadLanes, handleLaneDelete, handleLaneBulkDelete } = useLanes()
  const activeLanes = lanes.filter((lane) => lane.is_active)
  return { lanes: activeLanes, isLoading, loadLanes, handleLaneDelete, handleLaneBulkDelete }
}
