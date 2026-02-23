import { supabase } from '../../lib/supabase'
import type {
    Lane,
    LaneInsert,
    LaneUpdate,
    LaneStop,
    LaneType,
    LaneTypeInsert,
    LaneTypeUpdate,
} from '../../types/database.types'

/**
 * Lanes Service - CRUD operations for lanes table
 */

export const lanesService = {
    /**
     * Get all lanes for an organization
     */
    async getAll(orgId: string) {
        const { data, error } = await supabase
            .from('lanes')
            .select(
                `
        *,
        lane_types (
          id,
          name
        )
      `
            )
            .eq('org_id', orgId)
            .order('name', { ascending: true })

        if (error) throw error
        return data || []
    },

    /**
     * Get a single lane by ID with stops
     */
    async getById(id: string, orgId: string) {
        const { data, error } = await supabase
            .from('lanes')
            .select(
                `
        *,
        lane_types (
          id,
          name
        ),
        lane_stops (
          *,
          locations (
            id,
            name,
            code,
            city,
            address
          )
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

        // Sort stops by stop_order
        if (data && data.lane_stops) {
            data.lane_stops.sort((a: any, b: any) => a.stop_order - b.stop_order)
        }

        return data
    },

    /**
     * Get all lanes with their stops
     */
    async getAllWithStops(orgId: string) {
        const { data, error } = await supabase
            .from('lanes')
            .select(
                `
        *,
        lane_types (
          id,
          name
        ),
        lane_stops (
          *,
          locations (
            id,
            name,
            code,
            city
          )
        )
      `
            )
            .eq('org_id', orgId)
            .order('name', { ascending: true })

        if (error) throw error

        // Sort stops for each lane
        return (data || []).map((lane) => ({
            ...lane,
            lane_stops: lane.lane_stops?.sort(
                (a: any, b: any) => a.stop_order - b.stop_order
            ),
        }))
    },

    /**
     * Get active lanes
     */
    async getActive(orgId: string) {
        const { data, error } = await supabase
            .from('lanes')
            .select(
                `
        *,
        lane_types (
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
     * Get lanes by type
     */
    async getByType(orgId: string, laneTypeId: number) {
        const { data, error } = await supabase
            .from('lanes')
            .select(
                `
        *,
        lane_types (
          id,
          name
        )
      `
            )
            .eq('org_id', orgId)
            .eq('lane_type_id', laneTypeId)
            .order('name', { ascending: true })

        if (error) throw error
        return data || []
    },

    /**
     * Create a new lane
     */
    async create(lane: LaneInsert): Promise<Lane> {
        const { data, error } = await supabase
            .from('lanes')
            .insert(lane)
            .select()
            .single()

        if (error) throw error
        return data
    },

    /**
     * Create lane with stops (transaction-like operation)
     */
    async createWithStops(
        lane: LaneInsert,
        stops: Array<Omit<LaneStop, 'id' | 'lane_id' | 'org_id'>>
    ) {
        // Create lane first
        const newLane = await this.create(lane)

        // Then create stops
        if (stops.length > 0) {
            const stopsToInsert = stops.map((stop, index) => ({
                lane_id: newLane.id,
                org_id: lane.org_id,
                stop_order: stop.stop_order ?? index + 1,
                location_id: stop.location_id,
                stop_type: stop.stop_type,
                notes: stop.notes,
                estimated_duration: stop.estimated_duration ?? 0,
            }))

            const { error: stopsError } = await supabase
                .from('lane_stops')
                .insert(stopsToInsert)

            if (stopsError) {
                // Rollback: delete the lane if stops creation fails
                await this.hardDelete(newLane.id, lane.org_id)
                throw stopsError
            }
        }

        return this.getById(newLane.id, lane.org_id)
    },

    /**
     * Update a lane
     */
    async update(
        id: string,
        orgId: string,
        updates: LaneUpdate
    ): Promise<Lane> {
        const { data, error } = await supabase
            .from('lanes')
            .update(updates)
            .eq('id', id)
            .eq('org_id', orgId)
            .select()
            .single()

        if (error) throw error
        return data
    },

    /**
     * Soft delete a lane
     */
    async softDelete(id: string, orgId: string): Promise<void> {
        const { error } = await supabase
            .from('lanes')
            .update({ is_active: false })
            .eq('id', id)
            .eq('org_id', orgId)

        if (error) throw error
    },

    /**
     * Hard delete a lane
     */
    async hardDelete(id: string, orgId: string): Promise<void> {
        const { error } = await supabase
            .from('lanes')
            .delete()
            .eq('id', id)
            .eq('org_id', orgId)

        if (error) throw error
    },

    /**
     * Search lanes by name or lane_id
     */
    async search(orgId: string, searchTerm: string) {
        const { data, error } = await supabase
            .from('lanes')
            .select(
                `
        *,
        lane_types (
          id,
          name
        )
      `
            )
            .eq('org_id', orgId)
            .or(`name.ilike.%${searchTerm}%,lane_id.ilike.%${searchTerm}%`)
            .order('name', { ascending: true })

        if (error) throw error
        return data || []
    },

    /**
     * Check if lane_id exists
     */
    async laneIdExists(
        orgId: string,
        laneId: string,
        excludeId?: string
    ): Promise<boolean> {
        let query = supabase
            .from('lanes')
            .select('id')
            .eq('org_id', orgId)
            .eq('lane_id', laneId)

        if (excludeId) {
            query = query.neq('id', excludeId)
        }

        const { data, error } = await query

        if (error) throw error
        return (data?.length ?? 0) > 0
    },
}

/**
 * Lane Stops Service - CRUD operations for lane_stops table
 */

export const laneStopsService = {
    /**
     * Get all stops for a lane
     */
    async getByLaneId(laneId: string, orgId: string) {
        const { data, error } = await supabase
            .from('lane_stops')
            .select(
                `
        *,
        locations (
          id,
          name,
          code,
          city,
          address
        )
      `
            )
            .eq('lane_id', laneId)
            .eq('org_id', orgId)
            .order('stop_order', { ascending: true })

        if (error) throw error
        return data || []
    },

    /**
     * Add a stop to a lane
     */
    async create(stop: Omit<LaneStop, 'id'>): Promise<LaneStop> {
        const { data, error } = await supabase
            .from('lane_stops')
            .insert(stop)
            .select()
            .single()

        if (error) throw error
        return data
    },

    /**
     * Update a lane stop
     */
    async update(
        id: string,
        orgId: string,
        updates: Partial<Omit<LaneStop, 'id' | 'lane_id' | 'org_id'>>
    ): Promise<LaneStop> {
        const { data, error } = await supabase
            .from('lane_stops')
            .update(updates)
            .eq('id', id)
            .eq('org_id', orgId)
            .select()
            .single()

        if (error) throw error
        return data
    },

    /**
     * Delete a lane stop
     */
    async delete(id: string, orgId: string): Promise<void> {
        const { error } = await supabase
            .from('lane_stops')
            .delete()
            .eq('id', id)
            .eq('org_id', orgId)

        if (error) throw error
    },

    /**
     * Replace all stops for a lane
     */
    async replaceForLane(
        laneId: string,
        orgId: string,
        stops: Array<Omit<LaneStop, 'id' | 'lane_id' | 'org_id'>>
    ): Promise<void> {
        // First, remove all existing stops
        const { error: deleteError } = await supabase
            .from('lane_stops')
            .delete()
            .eq('lane_id', laneId)
            .eq('org_id', orgId)

        if (deleteError) throw deleteError

        // Then, add new stops
        if (stops.length > 0) {
            const stopsToInsert = stops.map((stop, index) => ({
                lane_id: laneId,
                org_id: orgId,
                stop_order: stop.stop_order ?? index + 1,
                location_id: stop.location_id,
                stop_type: stop.stop_type,
                notes: stop.notes,
            }))

            const { error: insertError } = await supabase
                .from('lane_stops')
                .insert(stopsToInsert)

            if (insertError) throw insertError
        }
    },

    /**
     * Reorder stops for a lane
     */
    async reorder(
        laneId: string,
        orgId: string,
        stopOrders: Array<{ id: string; stop_order: number }>
    ): Promise<void> {
        const updatePromises = stopOrders.map(({ id, stop_order }) =>
            supabase
                .from('lane_stops')
                .update({ stop_order })
                .eq('id', id)
                .eq('lane_id', laneId)
                .eq('org_id', orgId)
        )

        const results = await Promise.all(updatePromises)
        const error = results.find((r) => r.error)?.error

        if (error) throw error
    },
}

/**
 * Lane Types Service - CRUD operations for lane_types table
 */

export const laneTypesService = {
    /**
     * Get all lane types for an organization
     */
    async getAll(orgId: string): Promise<LaneType[]> {
        const { data, error } = await supabase
            .from('lane_types')
            .select('*')
            .eq('org_id', orgId)
            .eq('is_active', true)
            .order('name', { ascending: true })

        if (error) throw error
        return data || []
    },

    /**
     * Get a single lane type by ID
     */
    async getById(id: number, orgId: string): Promise<LaneType | null> {
        const { data, error } = await supabase
            .from('lane_types')
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
     * Create a new lane type
     */
    async create(laneType: LaneTypeInsert): Promise<LaneType> {
        const { data, error } = await supabase
            .from('lane_types')
            .insert(laneType)
            .select()
            .single()

        if (error) throw error
        return data
    },

    /**
     * Update a lane type
     */
    async update(
        id: number,
        orgId: string,
        updates: LaneTypeUpdate
    ): Promise<LaneType> {
        const { data, error } = await supabase
            .from('lane_types')
            .update(updates)
            .eq('id', id)
            .eq('org_id', orgId)
            .select()
            .single()

        if (error) throw error
        return data
    },

    /**
     * Soft delete a lane type
     */
    async delete(id: number, orgId: string): Promise<void> {
        const { error } = await supabase
            .from('lane_types')
            .update({ is_active: false })
            .eq('id', id)
            .eq('org_id', orgId)

        if (error) throw error
    },
}
