import { supabase } from '../lib/supabase'
import type {
  Location,
  LocationInsert,
  LocationUpdate,
  LocationType,
} from '../types/database.types'

/**
 * Locations Service - CRUD operations for locations table
 */
export const locationsService = {
  /**
   * Get all locations for an organization
   */
  async getAll(orgId: string): Promise<Location[]> {
    const { data, error } = await supabase
      .from('locations')
      .select(
        `
        *,
        countries (
          id,
          name,
          iso_code
        ),
        location_types (
          id,
          name,
          description
        )
      `
      )
      .eq('org_id', orgId)
      .order('name', { ascending: true })

    if (error) throw error
    return data || []
  },

  /**
   * Get a single location by ID
   */
  async getById(id: number, orgId: string) {
    const { data, error } = await supabase
      .from('locations')
      .select(
        `
        *,
        countries (
          id,
          name,
          iso_code
        ),
        location_types (
          id,
          name,
          description
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
   * Get active locations
   */
  async getActive(orgId: string): Promise<Location[]> {
    const { data, error } = await supabase
      .from('locations')
      .select(
        `
        *,
        countries (
          id,
          name,
          iso_code
        ),
        location_types (
          id,
          name
        )
      `
      )
      .eq('org_id', orgId)
      .eq('is_active', true)
      .order('name', { ascending: true })

    if (error) throw error
    return data || []
  },

  /**
   * Get locations by type
   */
  async getByType(orgId: string, typeId: number): Promise<Location[]> {
    const { data, error } = await supabase
      .from('locations')
      .select(
        `
        *,
        countries (
          id,
          name,
          iso_code
        ),
        location_types (
          id,
          name
        )
      `
      )
      .eq('org_id', orgId)
      .eq('type_location_id', typeId)
      .order('name', { ascending: true })

    if (error) throw error
    return data || []
  },

  /**
   * Get locations by city
   */
  async getByCity(orgId: string, city: string): Promise<Location[]> {
    const { data, error } = await supabase
      .from('locations')
      .select(
        `
        *,
        countries (
          id,
          name,
          iso_code
        ),
        location_types (
          id,
          name
        )
      `
      )
      .eq('org_id', orgId)
      .ilike('city', city)
      .order('name', { ascending: true })

    if (error) throw error
    return data || []
  },

  /**
   * Create a new location
   */
  async create(location: LocationInsert): Promise<Location> {
    const { data, error } = await supabase
      .from('locations')
      .insert(location)
      .select()
      .single()

    if (error) throw error
    return data
  },

  /**
   * Update a location
   */
  async update(
    id: number,
    orgId: string,
    updates: LocationUpdate
  ): Promise<Location> {
    const { data, error } = await supabase
      .from('locations')
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
   * Soft delete a location
   */
  async softDelete(id: number, orgId: string): Promise<void> {
    const { error } = await supabase
      .from('locations')
      .update({
        is_active: false,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .eq('org_id', orgId)

    if (error) throw error
  },

  /**
   * Hard delete a location
   */
  async hardDelete(id: number, orgId: string): Promise<void> {
    const { error } = await supabase
      .from('locations')
      .delete()
      .eq('id', id)
      .eq('org_id', orgId)

    if (error) throw error
  },

  /**
   * Search locations by name, code, or address
   */
  async search(orgId: string, searchTerm: string): Promise<Location[]> {
    const { data, error } = await supabase
      .from('locations')
      .select(
        `
        *,
        countries (
          id,
          name,
          iso_code
        ),
        location_types (
          id,
          name
        )
      `
      )
      .eq('org_id', orgId)
      .or(
        `name.ilike.%${searchTerm}%,code.ilike.%${searchTerm}%,address.ilike.%${searchTerm}%`
      )
      .order('name', { ascending: true })

    if (error) throw error
    return data || []
  },

  /**
   * Check if code exists
   */
  async codeExists(
    orgId: string,
    code: string,
    excludeId?: number
  ): Promise<boolean> {
    let query = supabase
      .from('locations')
      .select('id')
      .eq('org_id', orgId)
      .eq('code', code)

    if (excludeId !== undefined) {
      query = query.neq('id', excludeId)
    }

    const { data, error } = await query

    if (error) throw error
    return (data?.length ?? 0) > 0
  },
}

/**
 * Location Types Service - CRUD operations for location_types table
 */
export const locationTypesService = {
  async getAll(orgId: string): Promise<LocationType[]> {
    const { data, error } = await supabase
      .from('location_types')
      .select('*')
      .eq('org_id', orgId)
      .order('name', { ascending: true })

    if (error) throw error
    return data || []
  },

  async getById(id: number, orgId: string): Promise<LocationType | null> {
    const { data, error } = await supabase
      .from('location_types')
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

  async create(
    locationType: Omit<LocationType, 'id' | 'created_at'>
  ): Promise<LocationType> {
    const { data, error } = await supabase
      .from('location_types')
      .insert(locationType)
      .select()
      .single()

    if (error) throw error
    return data
  },

  async update(
    id: number,
    orgId: string,
    updates: Partial<Omit<LocationType, 'id' | 'created_at'>>
  ): Promise<LocationType> {
    const { data, error } = await supabase
      .from('location_types')
      .update(updates)
      .eq('id', id)
      .eq('org_id', orgId)
      .select()
      .single()

    if (error) throw error
    return data
  },

  async delete(id: number, orgId: string): Promise<void> {
    const { error } = await supabase
      .from('location_types')
      .delete()
      .eq('id', id)
      .eq('org_id', orgId)

    if (error) throw error
  },
}
