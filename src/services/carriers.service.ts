import { supabase } from '../lib/supabase'
import type {
  Carrier,
  CarrierInsert,
  CarrierUpdate,
} from '../types/database.types'

/**
 * Carriers Service - CRUD operations for carriers table
 */

export const carriersService = {
  /**
   * Get all carriers for an organization
   */
  async getAll(orgId: string): Promise<Carrier[]> {
    const { data, error } = await supabase
      .from('carriers')
      .select('*')
      .eq('org_id', orgId)
      .order('commercial_name', { ascending: true })

    if (error) throw error
    return data || []
  },

  /**
   * Get a single carrier by ID
   */
  async getById(id: number, orgId: string): Promise<Carrier | null> {
    const { data, error } = await supabase
      .from('carriers')
      .select('*')
      .eq('id', id)
      .eq('org_id', orgId)
      .single()

    if (error) {
      if (error.code === 'PGRST116') return null // Not found
      throw error
    }
    return data
  },

  /**
   * Get active carriers only
   */
  async getActive(orgId: string): Promise<Carrier[]> {
    const { data, error } = await supabase
      .from('carriers')
      .select('*')
      .eq('org_id', orgId)
      .eq('is_active', true)
      .order('commercial_name', { ascending: true })

    if (error) throw error
    return data || []
  },

  /**
   * Create a new carrier
   */
  async create(carrier: CarrierInsert): Promise<Carrier> {
    const { data, error } = await supabase
      .from('carriers')
      .insert(carrier)
      .select()
      .single()

    if (error) throw error
    return data
  },

  /**
   * Update a carrier
   */
  async update(
    id: number,
    orgId: string,
    updates: CarrierUpdate
  ): Promise<Carrier> {
    const { data, error } = await supabase
      .from('carriers')
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
   * Delete a carrier (soft delete by setting is_active to false)
   */
  async softDelete(id: number, orgId: string): Promise<void> {
    const { error } = await supabase
      .from('carriers')
      .update({
        is_active: false,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .eq('org_id', orgId)

    if (error) throw error
  },

  /**
   * Hard delete a carrier (permanent deletion)
   */
  async hardDelete(id: number, orgId: string): Promise<void> {
    const { error } = await supabase
      .from('carriers')
      .delete()
      .eq('id', id)
      .eq('org_id', orgId)

    if (error) throw error
  },

  /**
   * Search carriers by name
   */
  async search(orgId: string, searchTerm: string): Promise<Carrier[]> {
    const { data, error } = await supabase
      .from('carriers')
      .select('*')
      .eq('org_id', orgId)
      .or(
        `commercial_name.ilike.%${searchTerm}%,legal_name.ilike.%${searchTerm}%`
      )
      .order('commercial_name', { ascending: true })

    if (error) throw error
    return data || []
  },

  /**
   * Get carriers by type
   */
  async getByType(
    orgId: string,
    carrierType: 'OWNER' | 'THIRD PARTY'
  ): Promise<Carrier[]> {
    const { data, error } = await supabase
      .from('carriers')
      .select('*')
      .eq('org_id', orgId)
      .eq('carrier_type', carrierType)
      .order('commercial_name', { ascending: true })

    if (error) throw error
    return data || []
  },
}
