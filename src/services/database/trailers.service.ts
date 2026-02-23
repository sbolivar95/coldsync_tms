import { supabase } from '../../lib/supabase'
import type {
  Trailer,
  TrailerInsert,
  TrailerUpdate,
  ReeferEquipment,
  ReeferEquipmentInsert,
} from '../../types/database.types'
import { reeferEquipmentsService } from './reeferEquipments.service'

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
   * Uses the new reefer_equipments table instead of trailer_reefer_specs
   */
  async getWithReeferSpecs(id: string, orgId: string) {
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

    // Get reefer equipment using the new service
    const reeferEquipment = await reeferEquipmentsService.getByOwner(
      orgId,
      'TRAILER',
      id
    )

    // Return trailer with reefer equipment
    return {
      ...data,
      reefer_equipment: reeferEquipment,
    }
  },

  /**
   * Get all trailers with their reefer specs
   * Uses the new reefer_equipments table instead of trailer_reefer_specs
   */
  async getAllWithReeferSpecs(orgId: string) {
    const { data, error } = await supabase
      .from('trailers')
      .select('*')
      .eq('org_id', orgId)
      .order('code', { ascending: true })

    if (error) throw error

    // Get reefer equipment for each trailer
    const trailersWithSpecs = await Promise.all(
      (data || []).map(async (trailer) => {
        const reeferEquipment = await reeferEquipmentsService.getByOwner(
          orgId,
          'TRAILER',
          trailer.id
        )

        return {
          ...trailer,
          reefer_equipment: reeferEquipment,
        }
      })
    )

    return trailersWithSpecs
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
    status: Trailer['operational_status']
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
   * Uses the new reefer_equipments table instead of trailer_reefer_specs
   */
  async createWithReeferSpecs(
    trailer: TrailerInsert,
    reeferSpecs: Partial<Omit<ReeferEquipmentInsert, 'owner_type' | 'owner_id' | 'org_id'>>
  ) {
    // Create trailer first
    const newTrailer = await this.create(trailer)

    try {
      // Create reefer equipment
      const reeferEquipment: ReeferEquipmentInsert = {
        org_id: trailer.org_id,
        owner_type: 'TRAILER',
        owner_id: newTrailer.id,
        ...reeferSpecs,
      }

      const equipment = await reeferEquipmentsService.upsert(
        trailer.org_id,
        reeferEquipment
      )

      // Return trailer with reefer equipment
      return {
        trailer: newTrailer,
        reeferEquipment: equipment,
      }
    } catch (specsError) {
      // Rollback: delete the trailer if reefer specs creation fails
      await this.delete(newTrailer.id, trailer.org_id)
      throw specsError
    }
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
    status: Trailer['operational_status']
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
 * Trailer Reefer Specs Service - Wrapper for reefer_equipments
 */
export const trailerReeferSpecsService = {
  /**
   * Get reefer specs for a trailer
   */
  async getByTrailerId(
    trailerId: string,
    orgId: string
  ): Promise<ReeferEquipment | null> {
    return await reeferEquipmentsService.getByOwner(
      orgId,
      'TRAILER',
      trailerId
    )
  },

  /**
   * Create reefer specs for a trailer
   */
  async create(
    trailerId: string,
    orgId: string,
    specs: Partial<Omit<ReeferEquipmentInsert, 'owner_type' | 'owner_id' | 'org_id'>>
  ): Promise<ReeferEquipment> {
    const reeferEquipment: ReeferEquipmentInsert = {
      org_id: orgId,
      owner_type: 'TRAILER',
      owner_id: trailerId,
      ...specs,
    }

    return await reeferEquipmentsService.upsert(
      orgId,
      reeferEquipment
    )
  },

  /**
   * Update reefer specs
   */
  async update(
    trailerId: string,
    orgId: string,
    updates: Partial<Omit<ReeferEquipmentInsert, 'owner_type' | 'owner_id' | 'org_id'>>
  ): Promise<ReeferEquipment> {
    // Get existing equipment first
    const existing = await reeferEquipmentsService.getByOwner(
      orgId,
      'TRAILER',
      trailerId
    )

    if (!existing) {
      throw new Error('Reefer equipment not found for this trailer')
    }

    // Include ID for update
    return await reeferEquipmentsService.upsert(orgId, {
      ...existing,
      org_id: orgId,
      owner_type: 'TRAILER',
      owner_id: trailerId,
      ...updates,
    } as ReeferEquipmentInsert)
  },

  /**
   * Delete reefer specs
   */
  async delete(trailerId: string, orgId: string): Promise<void> {
    await reeferEquipmentsService.deleteByOwner(orgId, 'TRAILER', trailerId)
  },
}
