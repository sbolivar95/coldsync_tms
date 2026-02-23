import { supabase } from '../../lib/supabase'
import type {
  ThermalProfile,
  ThermalProfileInsert,
  ThermalProfileUpdate,
} from '../../types/database.types'

/**
 * Thermal Profiles Service - CRUD operations for thermal_profile table
 */

export const thermalProfilesService = {
  /**
   * Get all thermal profiles for an organization
   */
  async getAll(orgId: string): Promise<ThermalProfile[]> {
    const { data, error } = await supabase
      .from('thermal_profile')
      .select('*')
      .eq('org_id', orgId)
      .order('name', { ascending: true })

    if (error) throw error
    return data || []
  },

  /**
   * Get a single thermal profile by ID
   */
  async getById(id: number, orgId: string): Promise<ThermalProfile | null> {
    const { data, error } = await supabase
      .from('thermal_profile')
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
   * Get active thermal profiles
   */
  async getActive(orgId: string): Promise<ThermalProfile[]> {
    const { data, error } = await supabase
      .from('thermal_profile')
      .select('*')
      .eq('org_id', orgId)
      .eq('is_active', true)
      .order('name', { ascending: true })

    if (error) throw error
    return data || []
  },

  /**
   * Create a new thermal profile
   */
  async create(profile: ThermalProfileInsert): Promise<ThermalProfile> {
    const { data, error } = await supabase
      .from('thermal_profile')
      .insert(profile)
      .select()
      .single()

    if (error) throw error
    return data
  },

  /**
   * Update a thermal profile
   */
  async update(
    id: number,
    orgId: string,
    updates: ThermalProfileUpdate
  ): Promise<ThermalProfile> {
    const { data, error } = await supabase
      .from('thermal_profile')
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
   * Soft delete a thermal profile (set is_active to false)
   */
  async softDelete(id: number, orgId: string): Promise<void> {
    const { error } = await supabase
      .from('thermal_profile')
      .update({
        is_active: false,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .eq('org_id', orgId)

    if (error) throw error
  },

  /**
   * Reactivate a thermal profile (set is_active to true)
   */
  async reactivate(id: number, orgId: string): Promise<ThermalProfile> {
    const { data, error } = await supabase
      .from('thermal_profile')
      .update({
        is_active: true,
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
   * Hard delete a thermal profile (permanent deletion)
   */
  async hardDelete(id: number, orgId: string): Promise<void> {
    const { error } = await supabase
      .from('thermal_profile')
      .delete()
      .eq('id', id)
      .eq('org_id', orgId)

    if (error) throw error
  },

  /**
   * Search thermal profiles by name
   */
  async search(orgId: string, searchTerm: string): Promise<ThermalProfile[]> {
    const { data, error } = await supabase
      .from('thermal_profile')
      .select('*')
      .eq('org_id', orgId)
      .ilike('name', `%${searchTerm}%`)
      .order('name', { ascending: true })

    if (error) throw error
    return data || []
  },
}
