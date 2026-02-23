import type { FleetSet, DispatchOrder } from '../../types/database.types'

/**
 * Extended FleetSet with assigned dispatch orders
 */
export interface FleetSetWithOrders extends FleetSet {
  carriers?: {
    id: number
    commercial_name: string
    carrier_type?: string
  } | null
  drivers?: {
    id: number
    name: string
    driver_id?: string
    status?: string
  } | null
  vehicles?: {
    id: string
    vehicle_code: string
    unit_code?: string
    plate?: string
    operational_status?: string
    supports_multi_zone?: boolean
    compartments?: number
    vehicle_type?: string
    transport_capacity_weight_tn?: number
    vehicle_reefer_specs?: {
      id: string
      temp_min_c: number
      temp_max_c: number
      brand?: string
      model?: string
    } | null
  } | null
  trailers?: {
    id: string
    code: string
    plate?: string
    operational_status?: string
    supports_multi_zone?: boolean
    compartments?: number
    transport_capacity_weight_tn?: number
    trailer_reefer_specs?: {
      id: string
      temp_min_c: number
      temp_max_c: number
      brand?: string
      model?: string
    } | null
  } | null
  assignedOrders?: DispatchOrder[]
}

/**
 * UI format for fleet set unit
 */
export interface FleetSetUnit {
  id: string
  unit: string
  trailer: string
  driver: string
  status: 'En Ruta' | 'Detenido' | 'En Planta'
  hasActiveTrip: boolean
  carrier: string
  isHybridTrailer?: boolean
  hasIssue?: boolean
  fleetSetId: string
  tempMin?: number
  tempMax?: number
  compartments?: number
  carrierType?: string
  carrierId?: number
  vehicleType?: string
  hasTrailer: boolean
  maxLoadKg?: number
  vehicleOperationalStatus?: string // ACTIVE, IN_SERVICE, INACTIVE, etc.
  trailerOperationalStatus?: string // ACTIVE, IN_SERVICE, INACTIVE, etc.
}

/** Drag-and-drop item when dropping a trip from Gantt (vehicle column) */
export interface DropItemTrip {
  type: 'TRIP'
  tripId: string
  trip?: AssignedTripGantt
  vehicleId?: string
  dayOffset?: number
  fleetSetId?: string
}

/** Drag-and-drop item when dropping an order from unassigned column */
export interface DropItemOrder {
  type: 'ORDER'
  orderId: string
  order?: { id: string;[k: string]: unknown }
}

export type DispatchDropItem = DropItemTrip | DropItemOrder

/** UI shape for an order in the unassigned list (from Dispatch unassignedOrders) */
export interface UnassignedOrderUI {
  id: string
  configuration?: string
  lane?: string
  weight?: number
  status?: string
  substatus?: string
  isHybrid?: boolean
  cost?: number | null
  scheduledDate?: string
  route?: string
  duration?: number
  rtaDuration?: number
  [k: string]: unknown
}

/** Trip shape used in the Gantt (assigned orders mapped to calendar) */
export interface AssignedTripGantt {
  vehicleId: string
  fleetSetId: string
  dayOffset: number
  orderId: string
  client: string
  lane: string
  configuration: string
  isHybrid: boolean
  color: string
  duration: number
  hasRTA: boolean
  rtaDuration: number
  status: string
  product: string
  profile: string
  weight: string
  compartments?: Array<{ id: string; product: string; profile: string; weight: string }>
  scheduledDate: string
  scheduledTime: string
  timeWindow: string
  assignmentError?: string[]
}
