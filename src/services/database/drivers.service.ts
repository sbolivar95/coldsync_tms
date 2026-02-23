import { supabase } from '../../lib/supabase'
import type {
  Driver,
  DriverInsert,
  DriverUpdate,
} from '../../types/database.types'

/**
 * Drivers Service - CRUD operations for drivers table
 */

export const driversService = {
  /**
   * Get all drivers for an organization
   */
  async getAll(orgId: string): Promise<Driver[]> {
    const { data, error } = await supabase
      .from('drivers')
      .select('*')
      .eq('org_id', orgId)
      .order('name', { ascending: true })

    if (error) throw error
    return data || []
  },

  /**
   * Get a single driver by ID
   */
  async getById(id: number, orgId: string): Promise<Driver | null> {
    const { data, error } = await supabase
      .from('drivers')
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
   * Get drivers by carrier
   */
  async getByCarrier(orgId: string, carrierId: number): Promise<Driver[]> {
    const { data, error } = await supabase
      .from('drivers')
      .select('*')
      .eq('org_id', orgId)
      .eq('carrier_id', carrierId)
      .order('name', { ascending: true })

    if (error) throw error
    return data || []
  },

  /**
   * Get available drivers
   */
  async getAvailable(orgId: string): Promise<Driver[]> {
    const { data, error } = await supabase
      .from('drivers')
      .select('*')
      .eq('org_id', orgId)
      .eq('status', 'AVAILABLE')
      .order('name', { ascending: true })

    if (error) throw error
    return data || []
  },

  /**
   * Get drivers by status
   */
  async getByStatus(orgId: string, status: Driver['status']): Promise<Driver[]> {
    const { data, error } = await supabase
      .from('drivers')
      .select('*')
      .eq('org_id', orgId)
      .eq('status', status)
      .order('name', { ascending: true })

    if (error) throw error
    return data || []
  },

  /**
   * Create a new driver
   */
  async create(driver: DriverInsert): Promise<Driver> {
    const { data, error } = await supabase
      .from('drivers')
      .insert(driver)
      .select()
      .single()

    if (error) throw error
    return data
  },

  /**
   * Update a driver
   */
  async update(
    id: number,
    orgId: string,
    updates: DriverUpdate
  ): Promise<Driver> {
    const { data, error } = await supabase
      .from('drivers')
      .update(updates)
      .eq('id', id)
      .eq('org_id', orgId)
      .select()
      .single()

    if (error) throw error
    return data
  },

  /**
   * Update driver status
   */
  async updateStatus(
    id: number,
    orgId: string,
    status: Driver['status']
  ): Promise<Driver> {
    const { data, error } = await supabase
      .from('drivers')
      .update({ status })
      .eq('id', id)
      .eq('org_id', orgId)
      .select()
      .single()

    if (error) throw error
    return data
  },

  /**
   * Delete a driver
   */
  async delete(id: number, orgId: string): Promise<void> {
    const { error } = await supabase
      .from('drivers')
      .delete()
      .eq('id', id)
      .eq('org_id', orgId)

    if (error) throw error
  },

  /**
   * Search drivers by name or email
   */
  async search(orgId: string, searchTerm: string): Promise<Driver[]> {
    const { data, error } = await supabase
      .from('drivers')
      .select('*')
      .eq('org_id', orgId)
      .or(
        `name.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%,driver_id.ilike.%${searchTerm}%`
      )
      .order('name', { ascending: true })

    if (error) throw error
    return data || []
  },
}
