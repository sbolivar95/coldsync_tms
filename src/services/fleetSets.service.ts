import { supabase } from '../lib/supabase'
import type {
  FleetSet,
  FleetSetInsert,
  FleetSetUpdate,
} from '../types/database.types'

/**
 * Fleet Sets Service - CRUD operations for fleet_sets table
 * A fleet set combines carrier, driver, vehicle, and trailer into a single operational unit
 */

export const fleetSetsService = {
  /**
   * Get all fleet sets for an organization
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
          status,
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
          status,
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
   * Get active fleet sets
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
          status,
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
      .eq('is_active', true)
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
   * Get fleet sets by driver
   */
  async getByDriver(orgId: string, driverId: number) {
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
      .eq('driver_id', driverId)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data || []
  },

  /**
   * Create a new fleet set
   */
  async create(fleetSet: FleetSetInsert): Promise<FleetSet> {
    const { data, error } = await supabase
      .from('fleet_sets')
      .insert(fleetSet)
      .select()
      .single()

    if (error) throw error
    return data
  },

  /**
   * Update a fleet set
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
   * End a fleet set (mark as inactive)
   */
  async end(id: string, orgId: string, endDate?: string): Promise<FleetSet> {
    const { data, error } = await supabase
      .from('fleet_sets')
      .update({
        is_active: false,
        ends_at: endDate || new Date().toISOString(),
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
   * Reactivate a fleet set
   */
  async reactivate(id: string, orgId: string): Promise<FleetSet> {
    const { data, error } = await supabase
      .from('fleet_sets')
      .update({
        is_active: true,
        ends_at: null,
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
   * Delete a fleet set
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
   * Check if a driver is already in an active fleet set
   */
  async isDriverInActiveFleetSet(
    orgId: string,
    driverId: number,
    excludeId?: string
  ): Promise<boolean> {
    let query = supabase
      .from('fleet_sets')
      .select('id')
      .eq('org_id', orgId)
      .eq('driver_id', driverId)
      .eq('is_active', true)
      .is('ends_at', null)

    if (excludeId) {
      query = query.neq('id', excludeId)
    }

    const { data, error } = await query

    if (error) throw error
    return (data?.length ?? 0) > 0
  },

  /**
   * Check if a vehicle is already in an active fleet set
   */
  async isVehicleInActiveFleetSet(
    orgId: string,
    vehicleId: string,
    excludeId?: string
  ): Promise<boolean> {
    let query = supabase
      .from('fleet_sets')
      .select('id')
      .eq('org_id', orgId)
      .eq('vehicle_id', vehicleId)
      .eq('is_active', true)
      .is('ends_at', null)

    if (excludeId) {
      query = query.neq('id', excludeId)
    }

    const { data, error } = await query

    if (error) throw error
    return (data?.length ?? 0) > 0
  },

  /**
   * Check if a trailer is already in an active fleet set
   */
  async isTrailerInActiveFleetSet(
    orgId: string,
    trailerId: string,
    excludeId?: string
  ): Promise<boolean> {
    let query = supabase
      .from('fleet_sets')
      .select('id')
      .eq('org_id', orgId)
      .eq('trailer_id', trailerId)
      .eq('is_active', true)
      .is('ends_at', null)

    if (excludeId) {
      query = query.neq('id', excludeId)
    }

    const { data, error } = await query

    if (error) throw error
    return (data?.length ?? 0) > 0
  },
}
