import { supabase } from '../../lib/supabase'
import type {
  Vehicle,
  VehicleInsert,
  VehicleUpdate,
  ReeferEquipmentInsert,
  ReeferEquipmentUpdate,
  ReeferEquipment,
} from '../../types/database.types'
import { reeferEquipmentsService } from './reeferEquipments.service'

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

    const { data, error } = await query.order('unit_code', {
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
      .order('unit_code', { ascending: true })

    if (error) throw error
    return data || []
  },

  /**
   * Get vehicles by operational status
   */
  async getByStatus(
    orgId: string,
    status: Vehicle['operational_status']
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
    status: Vehicle['operational_status']
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
        `unit_code.ilike.%${searchTerm}%,plate.ilike.%${searchTerm}%,vin.ilike.%${searchTerm}%`
      )
      .order('unit_code', { ascending: true })

    if (error) throw error
    return data || []
  },

  /**
   * Check if unit code exists
   */
  async unitCodeExists(
    orgId: string,
    unitCode: string,
    excludeId?: string
  ): Promise<boolean> {
    let query = supabase
      .from('vehicles')
      .select('id')
      .eq('org_id', orgId)
      .eq('unit_code', unitCode)

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

  /**
   * Create vehicle with optional reefer equipment
   */
  async createWithReefer(
    vehicle: VehicleInsert,
    reeferData?: ReeferEquipmentInsert | null
  ): Promise<Vehicle> {
    // 1. Create vehicle first to get ID
    const newVehicle = await this.create(vehicle)

    // 2. If reefer data exists, create it linked to vehicle
    if (reeferData && newVehicle.id) {
      // Ensure owner linkage is correct
      const reeferPayload: ReeferEquipmentInsert = {
        ...reeferData,
        org_id: vehicle.org_id,
        owner_type: 'VEHICLE',
        owner_id: newVehicle.id,
      }
      await reeferEquipmentsService.upsert(vehicle.org_id, reeferPayload)
    }

    return newVehicle
  },

  /**
   * Update vehicle and its reefer equipment
   */
  async updateWithReefer(
    id: string,
    orgId: string,
    vehicleUpdates: VehicleUpdate,
    reeferUpdates?: ReeferEquipmentUpdate | null
  ): Promise<Vehicle> {
    // 1. Update vehicle
    const updatedVehicle = await this.update(id, orgId, vehicleUpdates)

    // 2. Update/Create or Delete Reefer
    if (reeferUpdates) {
      const reeferPayload: ReeferEquipmentUpdate = {
        ...reeferUpdates,
        org_id: orgId,
        owner_type: 'VEHICLE',
        owner_id: id,
      }
      await reeferEquipmentsService.upsert(orgId, reeferPayload)
    }
    // Note: To delete reefer, we might need an explicit flag or separate method, 
    // currently we assume if reeferUpdates is null we do nothing (preserve existing).

    return updatedVehicle
  },

  /**
   * Get vehicle with its reefer equipment
   */
  async getWithReefer(id: string, orgId: string): Promise<{ vehicle: Vehicle | null, reefer: ReeferEquipment | null }> {
    const [vehicle, reefer] = await Promise.all([
      this.getById(id, orgId),
      reeferEquipmentsService.getByOwner(orgId, 'VEHICLE', id)
    ])

    return { vehicle, reefer }
  }
}
