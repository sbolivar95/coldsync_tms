import { useEffect, useCallback, useMemo } from 'react'
import { useAppStore } from '../../../stores/useAppStore'
import { fleetSetsService } from '../../../services/database/fleetSets.service'
import { toast } from 'sonner'
import type { FleetSetWithOrders, FleetSetUnit } from '../types'

/**
 * Hook to fetch active fleet sets with their assigned dispatch orders
 * and map them to the UI format. Uses Zustand store with intelligent caching.
 * 
 * OPTIMIZATION: Uses dispatch orders from store instead of fetching again
 */
export function useFleetSetsWithOrders(orgId: string | null | undefined) {
  const fleetSets = useAppStore((state) => state.fleetSets)
  const isLoading = useAppStore((state) => state.fleetSetsLoading)
  const fleetSetsLoadedOrgId = useAppStore((state) => state.fleetSetsLoadedOrgId)
  const setFleetSets = useAppStore((state) => state.setFleetSets)
  const setFleetSetsLoading = useAppStore((state) => state.setFleetSetsLoading)
  const setFleetSetsLoadedOrgId = useAppStore((state) => state.setFleetSetsLoadedOrgId)

  const loadFleetSets = useCallback(
    async (force = false) => {
      if (!orgId) {
        setFleetSets([])
        setFleetSetsLoadedOrgId(null)
        return
      }

      // CACHEO: Solo recargar si orgId cambió o se fuerza
      if (!force && fleetSetsLoadedOrgId === orgId && fleetSets.length > 0) {
        return // Ya cargado para este orgId, no recargar
      }

      try {
        setFleetSetsLoading(true)

        // Get fresh dispatch orders from store at execution time
        // IMPORTANT: Filter only orders from current org to avoid 406 errors
        const currentDispatchOrders = useAppStore.getState().dispatchOrders.filter(
          (order) => order.org_id === orgId
        )

        // OPTIMIZATION: Better error handling for network issues
        let activeFleetSets: any[] = []
        try {
          activeFleetSets = await fleetSetsService.getActive(orgId)
        } catch (error) {
          // Log error but don't block - allow UI to render with dispatch orders only
          if (import.meta.env.DEV) {
            // eslint-disable-next-line no-console
            console.error('Error loading active fleet sets (non-blocking):', error)
          }
          // Check if it's a CORS/network error
          if (error instanceof TypeError && error.message.includes('fetch')) {
            toast.error('Error de red al cargar unidades. Verifica tu conexión o configuración de Supabase.')
          } else {
            toast.error('Error al cargar unidades de flota activas')
          }
          // Continue with empty fleet sets - UI will show dispatch orders at least
          setFleetSets([])
          setFleetSetsLoadedOrgId(orgId)
          return
        }

        const activeIds = new Set(activeFleetSets.map((fs) => fs.id))
        const fleetSetsWithOrders: FleetSetWithOrders[] = activeFleetSets.map((fs) => {
          const assignedOrders = currentDispatchOrders.filter(
            (order) => order.fleet_set_id === fs.id
          )
          return {
            ...fs,
            assignedOrders,
          } as FleetSetWithOrders
        })

        const assignedFleetSetIds = [
          ...new Set(
            currentDispatchOrders
              .filter((o) => o.fleet_set_id != null)
              .map((o) => o.fleet_set_id as string)
          ),
        ]
        const missingIds = assignedFleetSetIds.filter((id) => !activeIds.has(id))

        // OPTIMIZATION: Load missing fleet sets in parallel
        if (missingIds.length > 0) {
          const missingFleetSetsPromises = missingIds.map(async (id) => {
            try {
              const fs = await fleetSetsService.getById(id, orgId)
              if (fs) {
                const assignedOrders = currentDispatchOrders.filter(
                  (order) => order.fleet_set_id === fs.id
                )
                return {
                  ...fs,
                  assignedOrders,
                } as FleetSetWithOrders
              }
              return null
            } catch (error) {
              if (import.meta.env.DEV) {
                // eslint-disable-next-line no-console
                console.error(`Error loading fleet set ${id}:`, error)
              }
              return null
            }
          })

          const missingFleetSets = await Promise.all(missingFleetSetsPromises)
          missingFleetSets.forEach(fs => {
            if (fs) fleetSetsWithOrders.push(fs)
          })
        }

        setFleetSets(fleetSetsWithOrders)
        setFleetSetsLoadedOrgId(orgId)
      } catch (error) {
        if (import.meta.env.DEV) {
          // eslint-disable-next-line no-console
          console.error('Error loading fleet sets:', error)
        }
        toast.error('Error al cargar unidades de flota')
        setFleetSets([])
        setFleetSetsLoadedOrgId(null)
      } finally {
        setFleetSetsLoading(false)
      }
    },
    [
      orgId,
      fleetSetsLoadedOrgId,
      fleetSets.length,
      setFleetSets,
      setFleetSetsLoading,
      setFleetSetsLoadedOrgId,
    ]
  )

  // Auto-load on mount or when orgId changes
  useEffect(() => {
    if (orgId && fleetSetsLoadedOrgId !== orgId) {
      loadFleetSets()
    } else if (!orgId) {
      setFleetSets([])
      setFleetSetsLoadedOrgId(null)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orgId, fleetSetsLoadedOrgId])

  const units = useMemo((): FleetSetUnit[] => {
    return fleetSets.map((fleetSet) => {
      const carrier = fleetSet.carriers?.commercial_name || 'Sin transportista'
      const driver = fleetSet.drivers?.name || 'Sin conductor'
      const vehicle = fleetSet.vehicles
      const trailer = fleetSet.trailers

      const unitCode = vehicle?.unit_code || vehicle?.vehicle_code || 'N/A'
      const hasTrailer = !!trailer?.id
      const trailerCode = hasTrailer ? (trailer?.code || trailer?.plate || 'S.R.') : 'S.R.'
      const isHybridTrailer = (trailer?.supports_multi_zone || vehicle?.supports_multi_zone) || false

      const assignedOrders = fleetSet.assignedOrders || []
      let highestSubstatus: string | null = null
      let hasIssue = false

      if (assignedOrders.length > 0) {
        const observanceOrder = assignedOrders.find((o) => o.substatus === 'OBSERVED')
        if (observanceOrder) {
          highestSubstatus = 'OBSERVED'
          hasIssue = true
        } else {
          const dispatchedOrder = assignedOrders.find(
            (o) => o.substatus === 'DISPATCHED' || o.substatus === 'AT_DESTINATION'
          )
          if (dispatchedOrder) {
            highestSubstatus = dispatchedOrder.substatus || null
          } else {
            const scheduledOrder = assignedOrders.find((o) => o.substatus === 'PROGRAMMED')
            if (scheduledOrder) {
              highestSubstatus = 'PROGRAMMED'
            } else {
              const assignedOrder = assignedOrders.find(
                (o) => o.substatus === 'ASSIGNED' || o.substatus === 'PENDING'
              )
              if (assignedOrder) {
                highestSubstatus = assignedOrder.substatus || null
              }
            }
          }
        }
      }

      let status: 'En Ruta' | 'Detenido' | 'En Planta' = 'En Planta'
      let hasActiveTrip = false

      if (highestSubstatus === 'OBSERVED') {
        status = 'Detenido'
        hasActiveTrip = true
      } else if (
        highestSubstatus === 'PROGRAMMED' ||
        highestSubstatus === 'DISPATCHED' ||
        highestSubstatus === 'AT_DESTINATION'
      ) {
        status = 'En Ruta'
        hasActiveTrip = true
      } else if (highestSubstatus === 'ASSIGNED' || highestSubstatus === 'PENDING') {
        status = 'En Planta'
        hasActiveTrip = false
      }

      // Fallback logic for reefer specs: Trailer first, then Vehicle
      const tempMin = trailer?.trailer_reefer_specs?.temp_min_c ?? vehicle?.vehicle_reefer_specs?.temp_min_c
      const tempMax = trailer?.trailer_reefer_specs?.temp_max_c ?? vehicle?.vehicle_reefer_specs?.temp_max_c
      const compartments = trailer?.compartments ?? vehicle?.compartments

      return {
        id: vehicle?.id || fleetSet.id,
        unit: unitCode,
        trailer: trailerCode,
        driver,
        status,
        hasActiveTrip,
        carrier,
        isHybridTrailer,
        hasIssue,
        fleetSetId: fleetSet.id,
        tempMin,
        tempMax,
        compartments,
        hasTrailer,
        carrierType: fleetSet.carriers?.carrier_type,
        carrierId: fleetSet.carriers?.id,
        vehicleType: vehicle?.vehicle_type,
        maxLoadKg: ((trailer?.transport_capacity_weight_tn ?? vehicle?.transport_capacity_weight_tn) || 0) * 1000,
        vehicleOperationalStatus: vehicle?.operational_status,
        trailerOperationalStatus: trailer?.operational_status,
      }
    })
  }, [fleetSets])

  const groupedUnits = useMemo(() => {
    const groups: Record<string, FleetSetUnit[]> = {}
    units.forEach((unit) => {
      if (!groups[unit.carrier]) {
        groups[unit.carrier] = []
      }
      groups[unit.carrier].push(unit)
    })
    return groups
  }, [units])

  const getCarrierQuota = useCallback(
    (carrier: string) => {
      const carrierUnits = groupedUnits[carrier] || []
      const activeUnits = carrierUnits.filter((u) => u.hasActiveTrip).length
      return `${activeUnits}/${carrierUnits.length}`
    },
    [groupedUnits]
  )

  useEffect(() => {
    if (orgId) {
      loadFleetSets()
    } else {
      setFleetSets([])
      setFleetSetsLoadedOrgId(null)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orgId, loadFleetSets])

  return {
    units,
    groupedUnits,
    getCarrierQuota,
    isLoading,
    loadFleetSets,
    fleetSets,
  }
}
