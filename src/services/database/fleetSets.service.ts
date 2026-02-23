import { supabase } from '@/lib/supabase'
import type {
  FleetSet,
  FleetSetInsert,
  FleetSetUpdate,
  ReeferOwnerType,
} from '@/types/database.types'
import { reeferEquipmentsService } from './reeferEquipments.service'
import { vehiclesService } from './vehicles.service'

/**
 * Type guard to check if error has Supabase error structure
 */
function isSupabaseError(error: unknown): error is { code?: string; message?: string; details?: string } {
  return (
    typeof error === 'object' &&
    error !== null &&
    ('code' in error || 'message' in error || 'details' in error)
  )
}

/**
 * Helper function to handle PostgreSQL unique constraint violations (23505)
 * Converts database errors into user-friendly messages
 * 
 * @param error - The error object from Supabase
 * @returns A user-friendly error message
 */
function handleUniqueConstraintError(error: unknown): Error {
  // Type guard to safely access error properties
  if (!isSupabaseError(error)) {
    return error instanceof Error ? error : new Error(String(error))
  }

  // Check if it's a unique constraint violation
  if (error.code === '23505') {
    const message = error.message || ''
    const details = error.details || ''

    // Detect which resource caused the conflict based on constraint name or message
    if (message.includes('driver') || details.includes('driver_id') ||
      message.includes('idx_fleet_sets_driver_active_unique')) {
      return new Error(
        'El conductor ya tiene una asignación activa. Por favor, finalice la asignación anterior antes de crear una nueva.'
      )
    }

    if (message.includes('vehicle') || details.includes('vehicle_id') ||
      message.includes('idx_fleet_sets_vehicle_active_unique')) {
      return new Error(
        'El vehículo ya tiene una asignación activa. Por favor, finalice la asignación anterior antes de crear una nueva.'
      )
    }

    if (message.includes('trailer') || details.includes('trailer_id') ||
      message.includes('idx_fleet_sets_trailer_active_unique')) {
      return new Error(
        'El remolque ya tiene una asignación activa. Por favor, finalice la asignación anterior antes de crear una nueva.'
      )
    }

    // Generic message if we can't determine the resource
    return new Error(
      'Ya existe una asignación activa para uno de los recursos seleccionados. Por favor, verifique que todos los recursos estén disponibles.'
    )
  }

  // If it's not a 23505 error, return the original error
  return error instanceof Error ? error : new Error(String(error))
}

/**
 * Fleet Sets Service - CRUD operations for fleet_sets table
 * A fleet set combines carrier, driver, vehicle, and trailer into a single operational unit
 *
 * TEMPORAL AUDIT TRAIL:
 * - Each assignment has starts_at and ends_at timestamps
 * - Active assignments have ends_at = NULL
 * - When creating a new assignment with already-assigned assets,
 *   previous assignments are automatically ended (soft delete)
 * - This creates a complete history of fleet configurations
 */

export interface ReassignmentDetails {
  driver?: {
    hasConflict: boolean
    currentVehicleId?: string
    currentVehiclePlate?: string
    message: string
  }
  vehicle?: {
    hasConflict: boolean
    currentDriverId?: number | null
    currentDriverName?: string
    message: string
  }
  trailer?: {
    hasConflict: boolean
    isDropAndHook: boolean
    currentVehicleId?: string
    currentVehiclePlate?: string
    currentDriverId?: number | null
    currentDriverName?: string
    message: string
  }
}

export interface FleetSetValidationResult {
  valid: boolean
  warnings: string[]
  reassignments: ReassignmentDetails
}

export const fleetSetsService = {
  /**
   * Get all fleet sets for an organization (including ended ones)
   */
  async getAll(orgId: string): Promise<FleetSet[]> {
    const { data, error } = await supabase
      .from('fleet_sets')
      .select(
        `
        *,
        carriers (
          id,
          commercial_name,
          carrier_type
        ),
        drivers (
          id,
          name,
          driver_id,
          status
        ),
        vehicles (
          id,
          unit_code,
          plate,
          operational_status
        ),
        trailers (
          id,
          code,
          plate,
          operational_status,
          supports_multi_zone,
          compartments
        )
      `
      )
      .eq('org_id', orgId)
      .order('created_at', { ascending: false })

    if (error) throw error
    const sets = data || []
    
    // Fetch reefer specs for all trailers and vehicles in the sets
    const owners: { type: ReeferOwnerType; id: string }[] = []
    sets.forEach(s => {
      const trailer = s.trailers as any
      const vehicle = s.vehicles as any
      if (trailer?.id) owners.push({ type: 'TRAILER', id: trailer.id })
      if (vehicle?.id) owners.push({ type: 'VEHICLE', id: vehicle.id })
    })

    if (owners.length > 0) {
      const reefers = await reeferEquipmentsService.getByOwners(orgId, owners)

      sets.forEach(s => {
        // Attach trailer reefer specs
        if (s.trailers?.id) {
          const trailer = s.trailers as any
          const reefer = reefers.find(r => r.owner_id === trailer.id && r.owner_type === 'TRAILER')
          if (reefer) {
            trailer.trailer_reefer_specs = {
              id: reefer.id,
              temp_min_c: reefer.temp_min_c,
              temp_max_c: reefer.temp_max_c,
              brand: reefer.brand,
              model: reefer.model
            }
          }
        }

        // Attach vehicle reefer specs
        if (s.vehicles?.id) {
          const vehicle = s.vehicles as any
          const reefer = reefers.find(r => r.owner_id === vehicle.id && r.owner_type === 'VEHICLE')
          if (reefer) {
            vehicle.vehicle_reefer_specs = {
              id: reefer.id,
              temp_min_c: reefer.temp_min_c,
              temp_max_c: reefer.temp_max_c,
              brand: reefer.brand,
              model: reefer.model
            }
          }
        }
      })
    }
    
    return sets
  },

  /**
   * Get a single fleet set by ID
   * Uses the new reefer_equipments table instead of trailer_reefer_specs
   */
  async getById(id: string, orgId: string): Promise<FleetSet | null> {
    const { data, error } = await supabase
      .from('fleet_sets')
      .select(
        `
        *,
        carriers (
          id,
          commercial_name,
          carrier_type,
          contact_name,
          contact_phone
        ),
        drivers (
          id,
          name,
          driver_id,
          phone_number,
          status
        ),
        vehicles (
          id,
          unit_code,
          vehicle_type,
          plate,
          operational_status
        ),
        trailers (
          id,
          code,
          plate,
          operational_status,
          supports_multi_zone,
          compartments
        )
      `
      )
      .eq('id', id)
      .eq('org_id', orgId)
      .single()

    if (error) {
      if (error.code === 'PGRST116') return null
      throw error
    }

    // If there's a trailer, get its reefer equipment
    if (data && data.trailers && typeof data.trailers === 'object' && 'id' in data.trailers) {
      const trailer = data.trailers as { id: string;[key: string]: unknown }
      const reeferEquipment = await reeferEquipmentsService.getByOwner(
        orgId,
        'TRAILER',
        trailer.id
      )

      // Add reefer specs in the expected format for backward compatibility
      if (reeferEquipment) {
        trailer.trailer_reefer_specs = {
          id: reeferEquipment.id,
          trailer_id: reeferEquipment.owner_id,
          org_id: reeferEquipment.org_id,
          power_type: reeferEquipment.power_type,
          reefer_hours: reeferEquipment.reefer_hours,
          diesel_capacity_l: reeferEquipment.diesel_capacity_l,
          consumption_lph: reeferEquipment.consumption_lph,
          refrigeration_brand: reeferEquipment.brand,
          model: reeferEquipment.model,
          model_year: reeferEquipment.year,
          temp_min_c: reeferEquipment.temp_min_c,
          temp_max_c: reeferEquipment.temp_max_c,
          updated_at: reeferEquipment.updated_at,
        }
      } else {
        trailer.trailer_reefer_specs = null
      }
    }

    // If there's a vehicle, get its reefer equipment
    if (data && data.vehicles && typeof data.vehicles === 'object' && 'id' in data.vehicles) {
      const vehicle = data.vehicles as { id: string; [key: string]: unknown }
      const reeferEquipment = await reeferEquipmentsService.getByOwner(
        orgId,
        'VEHICLE',
        vehicle.id
      )

      if (reeferEquipment) {
        vehicle.vehicle_reefer_specs = {
          id: reeferEquipment.id,
          vehicle_id: reeferEquipment.owner_id,
          org_id: reeferEquipment.org_id,
          power_type: reeferEquipment.power_type,
          reefer_hours: reeferEquipment.reefer_hours,
          diesel_capacity_l: reeferEquipment.diesel_capacity_l,
          consumption_lph: reeferEquipment.consumption_lph,
          refrigeration_brand: reeferEquipment.brand,
          model: reeferEquipment.model,
          model_year: reeferEquipment.year,
          temp_min_c: reeferEquipment.temp_min_c,
          temp_max_c: reeferEquipment.temp_max_c,
          updated_at: reeferEquipment.updated_at,
        }
      } else {
        vehicle.vehicle_reefer_specs = null
      }
    }

    return data
  },

  /**
   * Get active (current) fleet sets only
   * Active = ends_at IS NULL
   */
  async getActive(orgId: string): Promise<FleetSet[]> {
    const { data, error } = await supabase
      .from('fleet_sets')
      .select(
        `
        *,
        carriers (
          id,
          commercial_name,
          carrier_type
        ),
        drivers (
          id,
          name,
          driver_id,
          status
        ),
        vehicles (
          id,
          unit_code,
          vehicle_type,
          plate,
          operational_status,
          transport_capacity_weight_tn,
          supports_multi_zone,
          compartments
        ),
        trailers (
          id,
          code,
          plate,
          operational_status,
          supports_multi_zone,
          compartments,
          transport_capacity_weight_tn
        )
      `
      )
      .eq('org_id', orgId)
      .is('ends_at', null)
      .order('created_at', { ascending: false })

    if (error) throw error
    const sets = data || []

    // Fetch reefer specs for all trailers and vehicles in the sets
    const owners: { type: ReeferOwnerType; id: string }[] = []
    sets.forEach(s => {
      const trailer = s.trailers as any
      const vehicle = s.vehicles as any
      if (trailer?.id) owners.push({ type: 'TRAILER', id: trailer.id })
      if (vehicle?.id) owners.push({ type: 'VEHICLE', id: vehicle.id })
    })

    if (owners.length > 0) {
      const reefers = await reeferEquipmentsService.getByOwners(orgId, owners)

      sets.forEach(s => {
        // Attach trailer reefer specs
        if (s.trailers?.id) {
          const trailer = s.trailers as any
          const reefer = reefers.find(r => r.owner_id === trailer.id && r.owner_type === 'TRAILER')
          if (reefer) {
            trailer.trailer_reefer_specs = {
              id: reefer.id,
              temp_min_c: reefer.temp_min_c,
              temp_max_c: reefer.temp_max_c,
              brand: reefer.brand,
              model: reefer.model
            }
          }
        }

        // Attach vehicle reefer specs
        if (s.vehicles?.id) {
          const vehicle = s.vehicles as any
          const reefer = reefers.find(r => r.owner_id === vehicle.id && r.owner_type === 'VEHICLE')
          if (reefer) {
            vehicle.vehicle_reefer_specs = {
              id: reefer.id,
              temp_min_c: reefer.temp_min_c,
              temp_max_c: reefer.temp_max_c,
              brand: reefer.brand,
              model: reefer.model
            }
          }
        }
      })
    }

    return sets
  },

  /**
   * Get fleet sets by carrier
   */
  async getByCarrier(orgId: string, carrierId: number): Promise<FleetSet[]> {
    const { data, error } = await supabase
      .from('fleet_sets')
      .select(
        `
        *,
        carriers (
          id,
          commercial_name
        ),
        drivers (
          id,
          name,
          status
        ),
          vehicles (
            id,
            unit_code,
            vehicle_type,
            plate
          ),
        trailers (
          id,
          code,
          plate,
          supports_multi_zone,
          compartments
        )
      `
      )
      .eq('org_id', orgId)
      .eq('carrier_id', carrierId)
      .order('created_at', { ascending: false })

    if (error) throw error
    const sets = data || []

    // Fetch reefer specs for all trailers and vehicles in the sets
    const owners: { type: ReeferOwnerType; id: string }[] = []
    sets.forEach(s => {
      const trailer = s.trailers as any
      const vehicle = s.vehicles as any
      if (trailer?.id) owners.push({ type: 'TRAILER', id: trailer.id })
      if (vehicle?.id) owners.push({ type: 'VEHICLE', id: vehicle.id })
    })

    if (owners.length > 0) {
      const reefers = await reeferEquipmentsService.getByOwners(orgId, owners)

      sets.forEach(s => {
        // Attach trailer reefer specs
        if (s.trailers?.id) {
          const trailer = s.trailers as any
          const reefer = reefers.find(r => r.owner_id === trailer.id && r.owner_type === 'TRAILER')
          if (reefer) {
            trailer.trailer_reefer_specs = {
              id: reefer.id,
              temp_min_c: reefer.temp_min_c,
              temp_max_c: reefer.temp_max_c,
              brand: reefer.brand,
              model: reefer.model
            }
          }
        }

        // Attach vehicle reefer specs
        if (s.vehicles?.id) {
          const vehicle = s.vehicles as any
          const reefer = reefers.find(r => r.owner_id === vehicle.id && r.owner_type === 'VEHICLE')
          if (reefer) {
            vehicle.vehicle_reefer_specs = {
              id: reefer.id,
              temp_min_c: reefer.temp_min_c,
              temp_max_c: reefer.temp_max_c,
              brand: reefer.brand,
              model: reefer.model
            }
          }
        }
      })
    }

    return sets
  },

  /**
   * Get historical fleet sets (ended ones)
   */
  async getHistory(orgId: string): Promise<FleetSet[]> {
    const { data, error } = await supabase
      .from('fleet_sets')
      .select(
        `
        *,
        carriers (
          id,
          commercial_name
        ),
        drivers (
          id,
          name
        ),
          vehicles (
            id,
            unit_code,
            vehicle_type,
            plate
          ),
        trailers (
          id,
          code,
          plate
        )
      `
      )
      .eq('org_id', orgId)
      .not('ends_at', 'is', null)
      .order('ends_at', { ascending: false })

    if (error) throw error
    return data || []
  },

  /**
   * Create a new fleet set
   * Automatically ends any existing assignments for the driver, vehicle, or trailer
   * Implements Drop & Hook logic: when a trailer is "stolen", the original vehicle
   * transitions to Bobtail state (RF-04.2)
   * 
   * Business rules:
   * - TRACTOR vehicles normally require trailer (RF-03.1)
   * - Bobtail is allowed for TRACTOR vehicles (RF-03.3) - e.g., yard moves, shop trips
   */
  async create(fleetSet: FleetSetInsert): Promise<FleetSet> {
    const now = new Date().toISOString()

    // Validate vehicle exists
    const vehicle = await vehiclesService.getById(fleetSet.vehicle_id, fleetSet.org_id)
    if (!vehicle) {
      throw new Error('Vehículo no encontrado')
    }

    // Business rule: TRACTOR vehicles require trailer (RF-03.1)
    // Exception: Bobtail is allowed (RF-03.3) - show warning but don't block
    // Exception 2: Spotting (No Driver) is allowed.

    // Only warn about Bobtail if there IS a driver (Bobtail = Driver + Tractor)
    if (vehicle.vehicle_type === 'TRACTOR' && !fleetSet.trailer_id && fleetSet.driver_id) {
      // Bobtail is allowed per RF-03.3, but we log it for visibility
      console.warn(
        `Bobtail assignment created for TRACTOR vehicle ${vehicle.unit_code}. ` +
        'This is allowed for yard moves and shop trips (RF-03.3).'
      )
    }

    // End any existing active assignments for these assets
    await this.endAssignmentsForAssets(
      fleetSet.org_id,
      fleetSet.driver_id,
      fleetSet.vehicle_id,
      fleetSet.trailer_id || null,
      now
    )

    // Create the new fleet set
    const { data, error } = await supabase
      .from('fleet_sets')
      .insert({
        ...fleetSet,
        driver_id: fleetSet.driver_id || null, // Allow null driver
        trailer_id: fleetSet.trailer_id || null, // Explicitly set to null for Bobtail
        starts_at: fleetSet.starts_at || now,
        ends_at: null,
        is_active: true,
      })
      .select()
      .single()

    if (error) {
      // Handle unique constraint violations with user-friendly messages
      if (error.code === '23505') {
        throw handleUniqueConstraintError(error)
      }
      throw error
    }
    return data
  },

  /**
   * End existing active assignments for given assets
   * This is called before creating a new assignment to maintain history
   * 
   * DROP & HOOK LOGIC (RF-04.2):
   * When a trailer is "stolen" from Vehicle A to Vehicle B:
   * - Vehicle A's fleet set transitions to Bobtail state (Driver + Vehicle, no Trailer)
   * - Vehicle B's fleet set is created with the trailer
   * - This ensures the driver of Vehicle A doesn't lose their vehicle assignment
   */
  async endAssignmentsForAssets(
    orgId: string,
    driverId: number | null | undefined,
    vehicleId: string,
    trailerId: string | null | undefined,
    endTime: string
  ): Promise<void> {
    // DROP & HOOK: Handle trailer "stealing" with Bobtail transition FIRST
    // This must happen before ending other assignments to preserve the original fleet set data
    if (trailerId) {
      // Find the current active assignment with this trailer
      const { data: trailerAssignment } = await supabase
        .from('fleet_sets')
        .select('*')
        .eq('org_id', orgId)
        .eq('trailer_id', trailerId)
        .is('ends_at', null)
        .maybeSingle()

      if (trailerAssignment) {
        const originalVehicleId = trailerAssignment.vehicle_id
        const originalDriverId = trailerAssignment.driver_id
        const originalCarrierId = trailerAssignment.carrier_id

        // If the trailer is being moved to a different vehicle, implement Drop & Hook
        // Also apply it if vehicle is the same but we are changing the structure (e.g. adding driver?)
        // Actually Drop & Hook is about moving trailer to different *Tractor*.
        if (originalVehicleId !== vehicleId) {
          // End the original assignment
          await supabase
            .from('fleet_sets')
            .update({
              ends_at: endTime,
              is_active: false,
              updated_at: endTime,
            })
            .eq('id', trailerAssignment.id)

          // Create Bobtail fleet set for the original vehicle (RF-04.2)
          // This ensures the driver doesn't lose their vehicle assignment
          // Only create if there WAS a driver to preserve. 
          // If original was Spotting (Driver=Null), vehicle becomes Unassigned (Empty).
          if (originalDriverId) {
            // Verify we are not also stealing the driver to the new vehicle
            if (originalDriverId !== driverId) {
              const { error: bobtailError } = await supabase
                .from('fleet_sets')
                .insert({
                  org_id: orgId,
                  carrier_id: originalCarrierId,
                  driver_id: originalDriverId,
                  vehicle_id: originalVehicleId,
                  trailer_id: null, // Bobtail: no trailer
                  starts_at: endTime,
                  ends_at: null,
                  is_active: true,
                })

              if (bobtailError) {
                console.error('Error creating Bobtail fleet set:', bobtailError)
              }
            }
          }
        }
      }
    }

    // End assignments with this driver (if being reassigned to different vehicle)
    if (driverId) {
      const { data: driverAssignments } = await supabase
        .from('fleet_sets')
        .select('*')
        .eq('org_id', orgId)
        .eq('driver_id', driverId)
        .is('ends_at', null)

      if (driverAssignments) {
        for (const assignment of driverAssignments) {
          // If driver is being reassigned to a different vehicle, end the assignment
          // Skip if this is the same assignment we just handled in Drop & Hook
          if (assignment.vehicle_id !== vehicleId) {
            await supabase
              .from('fleet_sets')
              .update({
                ends_at: endTime,
                is_active: false,
                updated_at: endTime,
              })
              .eq('id', assignment.id)
          }
        }
      }
    }

    // End assignments with this vehicle (if being reassigned to different driver/config)
    const { data: vehicleAssignments } = await supabase
      .from('fleet_sets')
      .select('*')
      .eq('org_id', orgId)
      .eq('vehicle_id', vehicleId)
      .is('ends_at', null)

    if (vehicleAssignments) {
      for (const assignment of vehicleAssignments) {
        // If vehicle is being reassigned, end the assignment
        // The new assignment (with potentially new driver/trailer) will replace it.
        // We only skip if the driver is the same? No, simpler to just end it.
        // wait, if "driverId" is NULL (Spotting), we want to end the old driver assignment.
        // if "driverId" is NEW, we end old driver assignment.
        // if "driverId" is SAME, we end it? 
        // The create() method always specifices "starts_at", so we are creating a NEW record.
        // So yes, we always end the old record for this vehicle.

        // Only redundant case is if we handled it in Drop & Hook?
        // Drop & Hook logic was for the ORIGINAL vehicle of the trailer.
        // Here we are talking about the DESTINATION vehicle.

        // Wait, what if we are stealing a driver from another vehicle?
        // That logic was handled in "driverAssignments" block.

        // If we are updating the current vehicle, we always end its current active set.
        await supabase
          .from('fleet_sets')
          .update({
            ends_at: endTime,
            is_active: false,
            updated_at: endTime,
          })
          .eq('id', assignment.id)
      }
    }
  },

  /**
   * Update a fleet set
   * INTELLIGENT UPDATE:
   * If critical components (driver, vehicle, trailer, carrier) change:
   * 1. Ends the current assignment
   * 2. Creates a NEW assignment with the new components
   * This preserves historical data.
   * 
   * If only metadata changes, it performs a standard update.
   */
  async update(
    id: string,
    orgId: string,
    updates: FleetSetUpdate
  ): Promise<FleetSet> {
    // 1. Get current assignment to compare
    const current = await this.getById(id, orgId)
    if (!current) throw new Error('Asignación no encontrada')

    // 2. Check for component changes
    const hasComponentChanges =
      (updates.driver_id !== undefined && updates.driver_id !== current.driver_id) ||
      (updates.vehicle_id !== undefined && updates.vehicle_id !== current.vehicle_id) ||
      (updates.trailer_id !== undefined && updates.trailer_id !== current.trailer_id) ||
      (updates.carrier_id !== undefined && updates.carrier_id !== current.carrier_id)

    if (hasComponentChanges) {
      const now = new Date().toISOString()

      // End current assignment
      await this.end(id, orgId, now)

      // Create new assignment with new components
      // Handle the case where driver_id might be becoming null
      const newDriverId = updates.driver_id !== undefined ? updates.driver_id : current.driver_id

      return await this.create({
        org_id: orgId,
        carrier_id: updates.carrier_id ?? current.carrier_id,
        driver_id: newDriverId,
        vehicle_id: updates.vehicle_id ?? current.vehicle_id,
        trailer_id: updates.trailer_id !== undefined ? updates.trailer_id : current.trailer_id,
        starts_at: updates.starts_at || now,
        ends_at: null,
        is_active: true
      })
    }

    // 3. Standard update for non-critical changes...
    // Only check bobtail warning if not changing structure
    if (updates.trailer_id !== undefined) {
      const vehicleId = updates.vehicle_id ?? current.vehicle_id
      const driverId = updates.driver_id ?? current.driver_id
      const vehicle = await vehiclesService.getById(vehicleId, orgId)

      if (vehicle && vehicle.vehicle_type === 'TRACTOR' && !updates.trailer_id && driverId) {
        console.warn('Bobtail assignment updated...')
      }
    }

    const { data, error } = await supabase
      .from('fleet_sets')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .eq('org_id', orgId)
      .select()
      .single()

    if (error) {
      if (error.code === '23505') {
        throw handleUniqueConstraintError(error)
      }
      throw error
    }
    return data
  },

  /**
   * End a fleet set (soft delete - sets ends_at timestamp)
   */
  async end(id: string, orgId: string, endDate?: string): Promise<FleetSet> {
    const now = endDate || new Date().toISOString()

    const { data, error } = await supabase
      .from('fleet_sets')
      .update({
        is_active: false,
        ends_at: now,
        updated_at: now,
      })
      .eq('id', id)
      .eq('org_id', orgId)
      .select()
      .single()

    if (error) throw error
    return data
  },

  /**
   * Reactivate a fleet set (remove ends_at)
   * Will end any conflicting active assignments first
   */
  async reactivate(id: string, orgId: string): Promise<FleetSet> {
    // First get the fleet set to know what assets it has
    const fleetSet = await this.getById(id, orgId)
    if (!fleetSet) {
      throw new Error('Fleet set not found')
    }

    const now = new Date().toISOString()

    // End any conflicting active assignments
    await this.endAssignmentsForAssets(
      orgId,
      fleetSet.driver_id,
      fleetSet.vehicle_id,
      fleetSet.trailer_id,
      now
    )

    // Reactivate this fleet set
    const { data, error } = await supabase
      .from('fleet_sets')
      .update({
        is_active: true,
        ends_at: null,
        updated_at: now,
      })
      .eq('id', id)
      .eq('org_id', orgId)
      .select()
      .single()

    if (error) {
      // Handle unique constraint violations with user-friendly messages
      if (error.code === '23505') {
        throw handleUniqueConstraintError(error)
      }
      throw error
    }
    return data
  },

  /**
   * Hard delete a fleet set (permanent - use with caution)
   * Only for cleaning up test data or fixing errors
   */
  async delete(id: string, orgId: string): Promise<void> {
    const { error } = await supabase
      .from('fleet_sets')
      .delete()
      .eq('id', id)
      .eq('org_id', orgId)

    if (error) throw error
  },

  /**
   * Get current assignment for a specific driver
   */
  async getCurrentByDriver(orgId: string, driverId: number): Promise<FleetSet | null> {
    const { data, error } = await supabase
      .from('fleet_sets')
      .select('*, drivers(id, name, driver_id), vehicles(id, plate, unit_code), trailers(id, plate, code)')
      .eq('org_id', orgId)
      .eq('driver_id', driverId)
      .is('ends_at', null)
      .limit(1)
      .maybeSingle()

    if (error) {
      if (error.code === 'PGRST116') return null
      throw error
    }
    return data
  },

  /**
   * Get current assignment for a specific vehicle
   */
  async getCurrentByVehicle(orgId: string, vehicleId: string): Promise<FleetSet | null> {
    const { data, error } = await supabase
      .from('fleet_sets')
      .select('*, drivers(id, name, driver_id), vehicles(id, plate, unit_code), trailers(id, plate, code)')
      .eq('org_id', orgId)
      .eq('vehicle_id', vehicleId)
      .is('ends_at', null)
      .maybeSingle()

    if (error) {
      if (error.code === 'PGRST116') return null
      throw error
    }
    return data
  },

  /**
   * Get current assignment for a specific trailer
   */
  async getCurrentByTrailer(orgId: string, trailerId: string): Promise<FleetSet | null> {
    const { data, error } = await supabase
      .from('fleet_sets')
      .select('*, drivers(id, name, driver_id), vehicles(id, plate, unit_code), trailers(id, plate, code)')
      .eq('org_id', orgId)
      .eq('trailer_id', trailerId)
      .is('ends_at', null)
      .maybeSingle()

    if (error) {
      if (error.code === 'PGRST116') return null
      throw error
    }
    return data
  },

  /**
   * Get assignment history for a specific driver
   */
  async getHistoryByDriver(orgId: string, driverId: number): Promise<FleetSet[]> {
    const { data, error } = await supabase
      .from('fleet_sets')
      .select(
        `
        *,
        vehicles (unit_code, plate),
        trailers (code, plate)
      `
      )
      .eq('org_id', orgId)
      .eq('driver_id', driverId)
      .order('starts_at', { ascending: false })

    if (error) throw error
    return data || []
  },

  /**
   * Validate a fleet set before creation
   * Returns detailed conflict information for all scenarios (RF-02.1)
   * 
   * Scenarios covered:
   * - Driver conflict: Driver assigned to different vehicle
   * - Vehicle conflict: Vehicle assigned to different driver
   * - Trailer conflict (Drop & Hook): Trailer assigned to different vehicle
   * - Bobtail warning: TRACTOR vehicle without trailer
   * 
   * @returns Object with validation result, warnings, and detailed conflict information
   */
  async validateFleetSet(
    orgId: string,
    driverId: number | null | undefined,
    vehicleId: string,
    trailerId: string | null | undefined
  ): Promise<FleetSetValidationResult> {
    const warnings: string[] = []
    const reassignments: ReassignmentDetails = {}

    // 1. Check Driver Availability (Only if a driver is being assigned)
    if (driverId) {
      const driverAssignment = await this.getCurrentByDriver(orgId, driverId)
      if (driverAssignment && driverAssignment.vehicle_id !== vehicleId) {
        // Driver is currently assigned to ANOTHER vehicle
        const assignmentWithRelations = driverAssignment as FleetSet & {
          vehicles?: { plate?: string; unit_code?: string } | null
        }
        const currentVehicle = assignmentWithRelations?.vehicles
        const vehiclePlate =
          currentVehicle && typeof currentVehicle === 'object' && 'plate' in currentVehicle
            ? currentVehicle.plate || 'desconocido'
            : 'desconocido'

        const message = `Esta acción desvinculará al conductor del vehículo ${vehiclePlate} y lo vinculara al vehículo seleccionado.`
        warnings.push(message)
        reassignments.driver = {
          hasConflict: true,
          currentVehicleId: driverAssignment.vehicle_id,
          currentVehiclePlate: vehiclePlate,
          message,
        }
      } else if (driverAssignment) {
        // Driver is already assigned to THIS vehicle (Update/Refresh)
        reassignments.driver = {
          hasConflict: false,
          message: 'El conductor ya está asignado a este vehículo.',
        }
      }
    }

    // 2. Check Vehicle Availability (Is it occupied?)
    const vehicleAssignment = await this.getCurrentByVehicle(orgId, vehicleId)

    if (vehicleAssignment) {
      // The vehicle has an active configuration. Are we changing it?
      const currentDriverId = vehicleAssignment.driver_id

      const assignmentWithRelations = vehicleAssignment as FleetSet & {
        drivers?: { name?: string; driver_id?: string } | null
      }
      const currentDriver = assignmentWithRelations?.drivers
      const driverName =
        currentDriver && typeof currentDriver === 'object' && 'name' in currentDriver
          ? currentDriver.name || 'Sin Conductor'
          : 'Sin Conductor'

      // Conflict logic:
      // A. Assigning NEW driver vs OLD driver (different IDs)
      // B. Removing driver (driverId is null) but vehicle HAD driver (Occupied) -> Warning "Will unassign driver"
      // C. Assigning driver (driverId exists) but vehicle was Spotting (No driver) -> Safe? Yes, just attaching driver.

      if (driverId && currentDriverId && driverId !== currentDriverId) {
        // Replacing active driver A with driver B
        const message = `El vehículo esta asignado al conductor ${driverName}.`
        warnings.push(message)
        reassignments.vehicle = {
          hasConflict: true,
          currentDriverId: vehicleAssignment.driver_id,
          currentDriverName: driverName,
          message,
        }
      } else if (!driverId && currentDriverId) {
        // Removing active driver (transiting to Spotting or Unassigned)
        const message = `Esta acción desvinculará al conductor ${driverName} del vehículo.`
        warnings.push(message)
        reassignments.vehicle = {
          hasConflict: true,
          currentDriverId: vehicleAssignment.driver_id,
          currentDriverName: driverName,
          message,
        }
      }

      // Check for Trailer Removal (Unlinking)
      if (!trailerId && vehicleAssignment.trailer_id) {
        const message = 'El remolque actual será desvinculado de este vehículo.'
        warnings.push(message)
        reassignments.trailer = {
          hasConflict: true,
          isDropAndHook: false,
          message,
        }
      }
    }

    // 3. Check Trailer Availability (Drop & Hook)
    if (trailerId) {
      const trailerAssignment = await this.getCurrentByTrailer(orgId, trailerId)
      if (trailerAssignment) {
        const currentVehicleId = trailerAssignment.vehicle_id
        const isDropAndHook = currentVehicleId !== vehicleId

        if (isDropAndHook) {
          // DROP & HOOK: Trailer is being moved from one vehicle to another
          const assignmentWithRelations = trailerAssignment as FleetSet & {
            vehicles?: { plate?: string; unit_code?: string } | null
            drivers?: { name?: string; driver_id?: string } | null
          }
          const currentVehicle = assignmentWithRelations?.vehicles
          const vehiclePlate =
            currentVehicle && typeof currentVehicle === 'object' && 'plate' in currentVehicle
              ? currentVehicle.plate || 'desconocido'
              : 'desconocido'

          const currentDriver = assignmentWithRelations?.drivers
          const driverName =
            currentDriver && typeof currentDriver === 'object' && 'name' in currentDriver
              ? currentDriver.name || 'Sin Conductor'
              : 'Sin Conductor'

          const message = `Esta acción desvinculará al remolque del vehículo ${vehiclePlate} y lo vinculara al vehículo seleccionado. `
          warnings.push(message)
          reassignments.trailer = {
            hasConflict: true,
            isDropAndHook: true,
            currentVehicleId,
            currentVehiclePlate: vehiclePlate,
            currentDriverId: trailerAssignment.driver_id,
            currentDriverName: driverName,
            message,
          }
        }
      }
    }

    // 4. Bobtail Warning - REMOVED
    // Logic removed to adhere to Clean UX principles. A tractor without a trailer is a valid state and requires no confirmation.

    return {
      valid: true,
      warnings,
      reassignments,
    }
  },
}
