import type { DispatchOrderWithRelations } from '../hooks/useDispatchOrders'
import type { FleetSetUnit, AssignedTripGantt } from '../types'

export interface ValidationResult {
  isValid: boolean
  errors: string[]
}

export interface ValidationContext {
  targetDate?: Date // Target assignment date
  startDate?: Date // Gantt start date (for calculating day offset)
  existingTrips?: AssignedTripGantt[] // Existing trips for RTA calculation
}

export function canAssignOrderToFleet(
  order: DispatchOrderWithRelations,
  fleet: FleetSetUnit,
  context?: ValidationContext
): ValidationResult {
  const errors: string[] = []

  // HARD CONSTRAINT 1: Operational Status
  // Cannot assign to inactive or maintenance units
  const isVehicleInactive = fleet.vehicleOperationalStatus &&
    !['ACTIVE'].includes(fleet.vehicleOperationalStatus)
  const isTrailerInactive = fleet.hasTrailer && fleet.trailerOperationalStatus &&
    !['ACTIVE'].includes(fleet.trailerOperationalStatus)

  if (isVehicleInactive) {
    errors.push(`Vehículo no disponible: Estado operativo "${fleet.vehicleOperationalStatus}"`)
    return { isValid: false, errors } // Early return - no point checking other constraints
  }

  if (isTrailerInactive) {
    errors.push(`Remolque no disponible: Estado operativo "${fleet.trailerOperationalStatus}"`)
    return { isValid: false, errors } // Early return - no point checking other constraints
  }

  // HARD CONSTRAINT 2: Past Date Validation
  // Cannot assign orders to dates in the past
  if (context?.targetDate && context?.startDate) {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const targetDate = new Date(context.targetDate)
    targetDate.setHours(0, 0, 0, 0)

    if (targetDate < today) {
      errors.push(`No se puede asignar a fecha pasada: ${targetDate.toLocaleDateString('es-MX')}`)
    }
  }

  // HARD CONSTRAINT 3: RTA (Return to Availability)
  // Cannot assign if target date falls within RTA window
  if (context?.existingTrips && context?.existingTrips.length > 0 && context?.targetDate && context?.startDate) {
    // Calculate target day offset
    const targetDayOffset = Math.floor(
      (context.targetDate.getTime() - context.startDate.getTime()) / (1000 * 60 * 60 * 24)
    )

    // Check if any existing trip blocks this assignment
    const blockingTrip = context.existingTrips.find(trip => {
      const tripEndDay = trip.dayOffset + trip.duration + (trip.rtaDuration || 0)
      return targetDayOffset < tripEndDay
    })

    if (blockingTrip) {
      const rtaEndDay = blockingTrip.dayOffset + blockingTrip.duration + (blockingTrip.rtaDuration || 0)
      const rtaEndDate = new Date(context.startDate)
      rtaEndDate.setDate(context.startDate.getDate() + rtaEndDay)
      errors.push(
        `Unidad en RTA hasta ${rtaEndDate.toLocaleDateString('es-MX')} (Viaje: ${blockingTrip.lane})`
      )
    }
  }

  // HARD CONSTRAINT 4: Weight Capacity
  // Order weight cannot exceed fleet capacity
  const items = order.dispatch_order_items || []
  const uniqueProducts = new Set(items.map(i => i.product_id)).size

  const totalWeight = items.reduce((sum, item) => {
    if (item.unit === 'TN' || !item.unit) {
      return sum + (item.quantity || 0)
    }
    return sum
  }, 0)

  const fleetCapacity = (fleet.maxLoadKg || 0) / 1000 // Convert kg to TN

  if (fleet.maxLoadKg && totalWeight > fleetCapacity) {
    errors.push(`Excede capacidad de peso: Orden ${totalWeight}tn vs Flota ${fleetCapacity.toFixed(1)}tn`)
  }

  // HARD CONSTRAINT 5: Temperature Envelope
  // Fleet thermal range must ENCLOSE all product thermal ranges
  let requiredMin: number | null = null
  let requiredMax: number | null = null
  let intersectMin: number | null = null
  let intersectMax: number | null = null
  let hasProfile = false

  items.forEach(item => {
    const profile = item.thermal_profile
    if (profile) {
      hasProfile = true
      // Global bounds (Envelope)
      if (requiredMin === null || profile.temp_min_c < requiredMin) requiredMin = profile.temp_min_c
      if (requiredMax === null || profile.temp_max_c > requiredMax) requiredMax = profile.temp_max_c

      // Intersection
      if (intersectMin === null || profile.temp_min_c > intersectMin) intersectMin = profile.temp_min_c
      if (intersectMax === null || profile.temp_max_c < intersectMax) intersectMax = profile.temp_max_c
    }
  })

  // Check: Fleet capabilities coverage (Envelope)
  if (fleet.tempMin !== undefined && fleet.tempMax !== undefined && hasProfile) {
    // Fleet range must ENCLOSE every item's range
    // fleetMin <= requiredMin AND fleetMax >= requiredMax

    if (requiredMin !== null && Number(fleet.tempMin) > requiredMin) {
      errors.push(`Temperatura mínima insuficiente: Requiere ${requiredMin}°C, Flota soporta desde ${fleet.tempMin}°C`)
    }
    if (requiredMax !== null && Number(fleet.tempMax) < requiredMax) {
      errors.push(`Temperatura máxima insuficiente: Requiere ${requiredMax}°C, Flota soporta hasta ${fleet.tempMax}°C`)
    }
  }

  // HARD CONSTRAINT 6: Multi-Zone / Compartments
  // For multiple products, fleet must support multi-zone OR products must have compatible temperatures
  const supportsMultiZone = fleet.isHybridTrailer || (fleet.compartments || 1) > 1
  const fleetCompartments = fleet.compartments || 1
  const isIntersectionValid = intersectMin !== null && intersectMax !== null && intersectMin <= intersectMax

  if (uniqueProducts > 1) {
    // Check if fits in Multi Zone
    const fitsMultiZone = supportsMultiZone && fleetCompartments >= uniqueProducts

    // Check if fits in Single Zone (Intersection)
    const fitsSingleZone = isIntersectionValid

    if (!fitsMultiZone && !fitsSingleZone) {
      if (!supportsMultiZone) {
        errors.push(`Múltiples productos requieren flota multi-zona o temperaturas compatibles`)
      } else if (fleetCompartments < uniqueProducts) {
        errors.push(`Insuficientes compartimientos: Requiere ${uniqueProducts}, Flota tiene ${fleetCompartments}`)
      } else {
        errors.push(`Conflicto de temperaturas irresoluble y configuración multi-zona no válida`)
      }
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  }
}
