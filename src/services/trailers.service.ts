import { supabase } from '../lib/supabase'
import type {
  Trailer,
  TrailerInsert,
  TrailerUpdate,
  TrailerReeferSpecs,
  AssetOperationalStatus,
} from '../types/database.types'

/**
 * Trailers Service - CRUD operations for trailers table
 */

export const trailersService = {
  /**
   * Get all trailers for an organization
   */
  async getAll(orgId: string): Promise<Trailer[]> {
    const { data, error } = await supabase
      .from('trailers')
      .select('*')
      .eq('org_id', orgId)
      .order('code', { ascending: true })

    if (error) throw error
    return data || []
  },

  /**
   * Get a single trailer by ID
   */
  async getById(id: string, orgId: string): Promise<Trailer | null> {
    const { data, error } = await supabase
      .from('trailers')
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
   * Get trailer with reefer specs
   */
  async getWithReeferSpecs(id: string, orgId: string) {
    const { data, error } = await supabase
      .from('trailers')
      .select(
        `
        *,
        trailer_reefer_specs (*)
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
   * Get all trailers with their reefer specs
   */
  async getAllWithReeferSpecs(orgId: string) {
    const { data, error } = await supabase
      .from('trailers')
      .select(
        `
        *,
        trailer_reefer_specs (*)
      `
      )
      .eq('org_id', orgId)
      .order('code', { ascending: true })

    if (error) throw error
    return data || []
  },

  /**
   * Get active trailers
   */
  async getActive(orgId: string): Promise<Trailer[]> {
    const { data, error } = await supabase
      .from('trailers')
      .select('*')
      .eq('org_id', orgId)
      .eq('operational_status', 'ACTIVE')
      .order('code', { ascending: true })

    if (error) throw error
    return data || []
  },

  /**
   * Get trailers by operational status
   */
  async getByStatus(
    orgId: string,
    status: AssetOperationalStatus
  ): Promise<Trailer[]> {
    const { data, error } = await supabase
      .from('trailers')
      .select('*')
      .eq('org_id', orgId)
      .eq('operational_status', status)
      .order('code', { ascending: true })

    if (error) throw error
    return data || []
  },

  /**
   * Get multi-zone trailers
   */
  async getMultiZone(orgId: string): Promise<Trailer[]> {
    const { data, error } = await supabase
      .from('trailers')
      .select('*')
      .eq('org_id', orgId)
      .eq('supports_multi_zone', true)
      .order('code', { ascending: true })

    if (error) throw error
    return data || []
  },

  /**
   * Create a new trailer
   */
  async create(trailer: TrailerInsert): Promise<Trailer> {
    const { data, error } = await supabase
      .from('trailers')
      .insert(trailer)
      .select()
      .single()

    if (error) throw error
    return data
  },

  /**
   * Create trailer with reefer specs (transaction-like operation)
   */
  async createWithReeferSpecs(
    trailer: TrailerInsert,
    reeferSpecs: Omit<
      TrailerReeferSpecs,
      'id' | 'trailer_id' | 'org_id' | 'updated_at'
    >
  ) {
    // Create trailer first
    const newTrailer = await this.create(trailer)

    // Then create reefer specs
    const { data: specs, error: specsError } = await supabase
      .from('trailer_reefer_specs')
      .insert({
        trailer_id: newTrailer.id,
        org_id: trailer.org_id,
        ...reeferSpecs,
      })
      .select()
      .single()

    if (specsError) {
      // Rollback: delete the trailer if reefer specs creation fails
      await this.delete(newTrailer.id, trailer.org_id)
      throw specsError
    }

    return { trailer: newTrailer, reeferSpecs: specs }
  },

  /**
   * Update a trailer
   */
  async update(
    id: string,
    orgId: string,
    updates: TrailerUpdate
  ): Promise<Trailer> {
    const { data, error } = await supabase
      .from('trailers')
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
   * Update trailer operational status
   */
  async updateStatus(
    id: string,
    orgId: string,
    status: AssetOperationalStatus
  ): Promise<Trailer> {
    const { data, error } = await supabase
      .from('trailers')
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
   * Delete a trailer
   */
  async delete(id: string, orgId: string): Promise<void> {
    const { error } = await supabase
      .from('trailers')
      .delete()
      .eq('id', id)
      .eq('org_id', orgId)

    if (error) throw error
  },

  /**
   * Search trailers by code or plate
   */
  async search(orgId: string, searchTerm: string): Promise<Trailer[]> {
    const { data, error } = await supabase
      .from('trailers')
      .select('*')
      .eq('org_id', orgId)
      .or(`code.ilike.%${searchTerm}%,plate.ilike.%${searchTerm}%`)
      .order('code', { ascending: true })

    if (error) throw error
    return data || []
  },

  /**
   * Check if code exists
   */
  async codeExists(
    orgId: string,
    code: string,
    excludeId?: string
  ): Promise<boolean> {
    let query = supabase
      .from('trailers')
      .select('id')
      .eq('org_id', orgId)
      .eq('code', code)

    if (excludeId) {
      query = query.neq('id', excludeId)
    }

    const { data, error } = await query

    if (error) throw error
    return (data?.length ?? 0) > 0
  },
}

/**
 * Trailer Reefer Specs Service - CRUD operations for trailer_reefer_specs table
 */
export const trailerReeferSpecsService = {
  /**
   * Get reefer specs for a trailer
   */
  async getByTrailerId(
    trailerId: string,
    orgId: string
  ): Promise<TrailerReeferSpecs | null> {
    const { data, error } = await supabase
      .from('trailer_reefer_specs')
      .select('*')
      .eq('trailer_id', trailerId)
      .eq('org_id', orgId)
      .single()

    if (error) {
      if (error.code === 'PGRST116') return null
      throw error
    }
    return data
  },

  /**
   * Create reefer specs for a trailer
   */
  async create(
    trailerId: string,
    orgId: string,
    specs: Omit<
      TrailerReeferSpecs,
      'id' | 'trailer_id' | 'org_id' | 'updated_at'
    >
  ): Promise<TrailerReeferSpecs> {
    const { data, error } = await supabase
      .from('trailer_reefer_specs')
      .insert({
        trailer_id: trailerId,
        org_id: orgId,
        ...specs,
      })
      .select()
      .single()

    if (error) throw error
    return data
  },

  /**
   * Update reefer specs
   */
  async update(
    trailerId: string,
    orgId: string,
    updates: Partial<Omit<TrailerReeferSpecs, 'id' | 'trailer_id' | 'org_id'>>
  ): Promise<TrailerReeferSpecs> {
    const { data, error } = await supabase
      .from('trailer_reefer_specs')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('trailer_id', trailerId)
      .eq('org_id', orgId)
      .select()
      .single()

    if (error) throw error
    return data
  },

  /**
   * Delete reefer specs
   */
  async delete(trailerId: string, orgId: string): Promise<void> {
    const { error } = await supabase
      .from('trailer_reefer_specs')
      .delete()
      .eq('trailer_id', trailerId)
      .eq('org_id', orgId)

    if (error) throw error
  },
}
