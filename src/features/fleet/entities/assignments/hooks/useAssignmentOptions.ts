import { useEffect, useState, useRef } from 'react'
import { driversService } from '../../../../../services/database'
import { vehiclesService } from '../../../../../services/database'
import { trailersService } from '../../../../../services/database'
import type { Vehicle } from '../../../../../types/database.types'
import { toast } from 'sonner'

interface UseAssignmentOptionsProps {
  orgId: string
  carrierId?: number | null
  open: boolean
  currentDriverId?: number | null
  currentTrailerId?: string | null
}

interface AssignmentOptions {
  drivers: Array<{ value: string; label: string }>
  vehicles: Array<{ value: string; label: string }>
  trailers: Array<{ value: string; label: string }>
  vehiclesData: Vehicle[]
}

/**
 * Hook to load and manage assignment options (drivers, vehicles, trailers)
 * Filters by carrierId if provided
 * 
 * Loads data silently without loading states to avoid component unmounting
 * Components remain mounted and data updates automatically
 */
export function useAssignmentOptions({
  orgId,
  carrierId,
  open,
  currentDriverId,
  currentTrailerId,
}: UseAssignmentOptionsProps): AssignmentOptions {
  const [drivers, setDrivers] = useState<Array<{ value: string; label: string }>>([])
  const [vehicles, setVehicles] = useState<Array<{ value: string; label: string }>>([])
  const [vehiclesData, setVehiclesData] = useState<Vehicle[]>([])
  const [trailers, setTrailers] = useState<Array<{ value: string; label: string }>>([])

  // Use ref to prevent duplicate fetches and track loaded state
  const loadedRef = useRef<string | null>(null)
  const loadingRef = useRef(false)

  useEffect(() => {
    if (!orgId || !open) {
      // Reset when dialog closes
      loadedRef.current = null
      return
    }

    // Create a unique key for this combination
    // We append current IDs to key to force reload if assignment changes? 
    // Actually, no. The options are the same. Inserting 'unassign' is a format step, not fetch step.
    // BUT we need to re-run the formatting if currentDriverId changes.
    // So we should separate fetching from formatting, OR re-run everything.
    // Given the simplicity, re-running is fine if we check cache.
    // But inserting 'unassign' depends on props, not fetch.

    const loadKey = `${orgId}-${carrierId || 'all'}`

    // Skip if already loaded (fetched)
    // However, we need to regenerate the state 'drivers' if currentDriverId changed to add/remove 'unassign' option.
    // The previous implementation cached based on loadKey preventing updates.

    // Better approach: Fetch raw data to refs/state, then Compute options with useMemo.
    // But to minimize refactor risk, I'll just re-run the formatting part.

    const loadOptions = async () => {
      // If already fetching, wait? Or just proceed.
      if (loadingRef.current) return

      try {
        loadingRef.current = true

        // Load drivers
        const driversData = await driversService.getAll(orgId)
        const filteredDrivers = carrierId
          ? driversData.filter(driver => driver.carrier_id === carrierId)
          : driversData

        const driverOptions = filteredDrivers.map((driver) => ({
          value: driver.id.toString(),
          label: driver.name,
        }))

        // Conditional Unassign Option
        if (currentDriverId) {
          driverOptions.unshift({ value: 'unassign', label: 'Desvincular Conductor' })
        }

        setDrivers(driverOptions)

        // Load vehicles
        const vehiclesData = await vehiclesService.getAll(orgId)
        const filteredVehicles = carrierId
          ? vehiclesData.filter(vehicle => vehicle.carrier_id === carrierId)
          : vehiclesData

        setVehiclesData(filteredVehicles)

        setVehicles(
          filteredVehicles.map((vehicle) => ({
            value: vehicle.id,
            label: vehicle.plate,
          }))
        )

        // Load trailers
        const trailersData = await trailersService.getAll(orgId)
        const filteredTrailers = carrierId
          ? trailersData.filter(trailer => trailer.carrier_id === carrierId)
          : trailersData

        const trailerOptions = filteredTrailers.map((trailer) => ({
          value: trailer.id,
          label: trailer.plate || 'Sin placa',
        }))

        // Conditional Unassign Option
        if (currentTrailerId) {
          trailerOptions.unshift({ value: 'unassign', label: 'Desvincular Remolque' })
        }

        setTrailers(trailerOptions)

        loadedRef.current = loadKey
      } catch (error) {
        console.error('Error loading options:', error)
        toast.error('Error al cargar opciones')
      } finally {
        loadingRef.current = false
      }
    }

    loadOptions()
  }, [orgId, open, carrierId, currentDriverId, currentTrailerId]) // Dependencies updated

  return {
    drivers,
    vehicles,
    trailers,
    vehiclesData,
  }
}
