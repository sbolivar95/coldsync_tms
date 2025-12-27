import { supabase } from '../lib/supabase'
import type {
  Vehicle,
  VehicleInsert,
  VehicleUpdate,
  AssetOperationalStatus,
} from '../types/database.types'

/**
 * Vehicles Service - CRUD operations for vehicles table
 */

export const vehiclesService = {
  /**
   * Get all vehicles for an organization
   */
  // vehicles.service.ts
  async getAll(orgId: string, carrierId?: number): Promise<Vehicle[]> {
    let query = supabase.from('vehicles').select('*').eq('org_id', orgId)

    if (carrierId != null) {
      query = query.eq('carrier_id', carrierId)
    }

    const { data, error } = await query.order('vehicle_code', {
      ascending: true,
    })

    if (error) throw error
    return data ?? []
  },
  /**
   * Get a single vehicle by ID
   */
  async getById(id: string, orgId: string): Promise<Vehicle | null> {
    const { data, error } = await supabase
      .from('vehicles')
      .select('*')
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
   * Get active vehicles
   */
  async getActive(orgId: string): Promise<Vehicle[]> {
    const { data, error } = await supabase
      .from('vehicles')
      .select('*')
      .eq('org_id', orgId)
      .eq('operational_status', 'ACTIVE')
      .order('vehicle_code', { ascending: true })

    if (error) throw error
    return data || []
  },

  /**
   * Get vehicles by operational status
   */
  async getByStatus(
    orgId: string,
    status: AssetOperationalStatus
  ): Promise<Vehicle[]> {
    const { data, error } = await supabase
      .from('vehicles')
      .select('*')
      .eq('org_id', orgId)
      .eq('operational_status', status)
      .order('vehicle_code', { ascending: true })

    if (error) throw error
    return data || []
  },

  /**
   * Get vehicles by type
   */
  async getByType(orgId: string, vehicleType: string): Promise<Vehicle[]> {
    const { data, error } = await supabase
      .from('vehicles')
      .select('*')
      .eq('org_id', orgId)
      .eq('vehicle_type', vehicleType)
      .order('vehicle_code', { ascending: true })

    if (error) throw error
    return data || []
  },

  /**
   * Create a new vehicle
   */
  async create(vehicle: VehicleInsert): Promise<Vehicle> {
    const { data, error } = await supabase
      .from('vehicles')
      .insert(vehicle)
      .select()
      .single()

    if (error) throw error
    return data
  },

  /**
   * Update a vehicle
   */
  async update(
    id: string,
    orgId: string,
    updates: VehicleUpdate
  ): Promise<Vehicle> {
    const { data, error } = await supabase
      .from('vehicles')
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
   * Update vehicle operational status
   */
  async updateStatus(
    id: string,
    orgId: string,
    status: AssetOperationalStatus
  ): Promise<Vehicle> {
    const { data, error } = await supabase
      .from('vehicles')
      .update({
        operational_status: status,
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
   * Update odometer reading
   */
  async updateOdometer(
    id: string,
    orgId: string,
    value: number,
    unit: string = 'km'
  ): Promise<Vehicle> {
    const { data, error } = await supabase
      .from('vehicles')
      .update({
        odometer_value: value,
        odometer_unit: unit,
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
   * Delete a vehicle
   */
  async delete(id: string, orgId: string): Promise<void> {
    const { error } = await supabase
      .from('vehicles')
      .delete()
      .eq('id', id)
      .eq('org_id', orgId)

    if (error) throw error
  },

  /**
   * Search vehicles by code, plate, or VIN
   */
  async search(orgId: string, searchTerm: string): Promise<Vehicle[]> {
    const { data, error } = await supabase
      .from('vehicles')
      .select('*')
      .eq('org_id', orgId)
      .or(
        `vehicle_code.ilike.%${searchTerm}%,unit_code.ilike.%${searchTerm}%,plate.ilike.%${searchTerm}%,vin.ilike.%${searchTerm}%`
      )
      .order('vehicle_code', { ascending: true })

    if (error) throw error
    return data || []
  },

  /**
   * Check if vehicle code exists
   */
  async codeExists(
    orgId: string,
    vehicleCode: string,
    excludeId?: string
  ): Promise<boolean> {
    let query = supabase
      .from('vehicles')
      .select('id')
      .eq('org_id', orgId)
      .eq('vehicle_code', vehicleCode)

    if (excludeId) {
      query = query.neq('id', excludeId)
    }

    const { data, error } = await query

    if (error) throw error
    return (data?.length ?? 0) > 0
  },

  /**
   * Check if plate exists
   */
  async plateExists(
    orgId: string,
    plate: string,
    excludeId?: string
  ): Promise<boolean> {
    let query = supabase
      .from('vehicles')
      .select('id')
      .eq('org_id', orgId)
      .eq('plate', plate)

    if (excludeId) {
      query = query.neq('id', excludeId)
    }

    const { data, error } = await query

    if (error) throw error
    return (data?.length ?? 0) > 0
  },
}
