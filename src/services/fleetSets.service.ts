import { supabase } from '../lib/supabase'
import type {
  FleetSet,
  FleetSetInsert,
  FleetSetUpdate,
} from '../types/database.types'

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

export const fleetSetsService = {
  /**
   * Get all fleet sets for an organization (including ended ones)
   */
  async getAll(orgId: string) {
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
          vehicle_code,
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
    return data || []
  },

  /**
   * Get a single fleet set by ID
   */
  async getById(id: string, orgId: string) {
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
          vehicle_code,
          unit_code,
          plate,
          vehicle_type,
          operational_status
        ),
        trailers (
          id,
          code,
          plate,
          operational_status,
          supports_multi_zone,
          compartments,
          trailer_reefer_specs (*)
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
    return data
  },

  /**
   * Get active (current) fleet sets only
   * Active = ends_at IS NULL
   */
  async getActive(orgId: string) {
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
          vehicle_code,
          plate,
          operational_status
        ),
        trailers (
          id,
          code,
          plate,
          operational_status
        )
      `
      )
      .eq('org_id', orgId)
      .is('ends_at', null)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data || []
  },

  /**
   * Get fleet sets by carrier
   */
  async getByCarrier(orgId: string, carrierId: number) {
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
          vehicle_code,
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
      .eq('carrier_id', carrierId)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data || []
  },

  /**
   * Get historical fleet sets (ended ones)
   */
  async getHistory(orgId: string) {
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
          vehicle_code,
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
   */
  async create(fleetSet: FleetSetInsert): Promise<FleetSet> {
    const now = new Date().toISOString()

    // End any existing active assignments for these assets
    await this.endAssignmentsForAssets(
      fleetSet.org_id,
      fleetSet.driver_id,
      fleetSet.vehicle_id,
      fleetSet.trailer_id,
      now
    )

    // Create the new fleet set
    const { data, error } = await supabase
      .from('fleet_sets')
      .insert({
        ...fleetSet,
        starts_at: fleetSet.starts_at || now,
        ends_at: null,
        is_active: true,
      })
      .select()
      .single()

    if (error) throw error
    return data
  },

  /**
   * End existing active assignments for given assets
   * This is called before creating a new assignment to maintain history
   */
  async endAssignmentsForAssets(
    orgId: string,
    driverId: number,
    vehicleId: string,
    trailerId: string,
    endTime: string
  ): Promise<void> {
    // End assignments with this driver
    await supabase
      .from('fleet_sets')
      .update({
        ends_at: endTime,
        is_active: false,
        updated_at: endTime,
      })
      .eq('org_id', orgId)
      .eq('driver_id', driverId)
      .is('ends_at', null)

    // End assignments with this vehicle
    await supabase
      .from('fleet_sets')
      .update({
        ends_at: endTime,
        is_active: false,
        updated_at: endTime,
      })
      .eq('org_id', orgId)
      .eq('vehicle_id', vehicleId)
      .is('ends_at', null)

    // End assignments with this trailer
    await supabase
      .from('fleet_sets')
      .update({
        ends_at: endTime,
        is_active: false,
        updated_at: endTime,
      })
      .eq('org_id', orgId)
      .eq('trailer_id', trailerId)
      .is('ends_at', null)
  },

  /**
   * Update a fleet set (only metadata like notes/set_name)
   * Cannot change the driver, vehicle, trailer - create a new assignment instead
   */
  async update(
    id: string,
    orgId: string,
    updates: FleetSetUpdate
  ): Promise<FleetSet> {
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

    if (error) throw error
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

    if (error) throw error
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
  async getCurrentByDriver(orgId: string, driverId: number) {
    const { data, error } = await supabase
      .from('fleet_sets')
      .select('*')
      .eq('org_id', orgId)
      .eq('driver_id', driverId)
      .is('ends_at', null)
      .single()

    if (error) {
      if (error.code === 'PGRST116') return null
      throw error
    }
    return data
  },

  /**
   * Get current assignment for a specific vehicle
   */
  async getCurrentByVehicle(orgId: string, vehicleId: string) {
    const { data, error } = await supabase
      .from('fleet_sets')
      .select('*')
      .eq('org_id', orgId)
      .eq('vehicle_id', vehicleId)
      .is('ends_at', null)
      .single()

    if (error) {
      if (error.code === 'PGRST116') return null
      throw error
    }
    return data
  },

  /**
   * Get current assignment for a specific trailer
   */
  async getCurrentByTrailer(orgId: string, trailerId: string) {
    const { data, error } = await supabase
      .from('fleet_sets')
      .select('*')
      .eq('org_id', orgId)
      .eq('trailer_id', trailerId)
      .is('ends_at', null)
      .single()

    if (error) {
      if (error.code === 'PGRST116') return null
      throw error
    }
    return data
  },

  /**
   * Get assignment history for a specific driver
   */
  async getHistoryByDriver(orgId: string, driverId: number) {
    const { data, error } = await supabase
      .from('fleet_sets')
      .select(
        `
        *,
        vehicles (vehicle_code, plate),
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
   * Validate a fleet set before creation (informational only)
   * Returns warnings about assets that will be reassigned
   */
  async validateFleetSet(
    orgId: string,
    carrierId: number,
    driverId: number,
    vehicleId: string,
    trailerId: string
  ): Promise<{ valid: boolean; warnings: string[] }> {
    const warnings: string[] = []

    // Check if driver has an active assignment
    const driverAssignment = await this.getCurrentByDriver(orgId, driverId)
    if (driverAssignment) {
      warnings.push(
        'El conductor tiene una asignación activa que será finalizada'
      )
    }

    // Check if vehicle has an active assignment
    const vehicleAssignment = await this.getCurrentByVehicle(orgId, vehicleId)
    if (vehicleAssignment) {
      warnings.push(
        'El vehículo tiene una asignación activa que será finalizada'
      )
    }

    // Check if trailer has an active assignment
    const trailerAssignment = await this.getCurrentByTrailer(orgId, trailerId)
    if (trailerAssignment) {
      warnings.push(
        'El remolque tiene una asignación activa que será finalizada'
      )
    }

    return {
      valid: true, // Always valid - we auto-end previous assignments
      warnings,
    }
  },
}
