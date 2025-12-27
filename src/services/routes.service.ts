import { supabase } from '../lib/supabase'
import type {
  Route,
  RouteInsert,
  RouteUpdate,
  RouteStop,
  RouteType,
} from '../types/database.types'

/**
 * Routes Service - CRUD operations for routes table
 */

export const routesService = {
  /**
   * Get all routes for an organization
   */
  async getAll(orgId: string) {
    const { data, error } = await supabase
      .from('routes')
      .select(
        `
        *,
        route_types (
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
   * Get a single route by ID with stops
   */
  async getById(id: string, orgId: string) {
    const { data, error } = await supabase
      .from('routes')
      .select(
        `
        *,
        route_types (
          id,
          name
        ),
        route_stops (
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
    if (data && data.route_stops) {
      data.route_stops.sort((a: any, b: any) => a.stop_order - b.stop_order)
    }

    return data
  },

  /**
   * Get all routes with their stops
   */
  async getAllWithStops(orgId: string) {
    const { data, error } = await supabase
      .from('routes')
      .select(
        `
        *,
        route_types (
          id,
          name
        ),
        route_stops (
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

    // Sort stops for each route
    return (data || []).map((route) => ({
      ...route,
      route_stops: route.route_stops?.sort(
        (a: any, b: any) => a.stop_order - b.stop_order
      ),
    }))
  },

  /**
   * Get active routes
   */
  async getActive(orgId: string) {
    const { data, error } = await supabase
      .from('routes')
      .select(
        `
        *,
        route_types (
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
   * Get routes by type
   */
  async getByType(orgId: string, routeTypeId: number) {
    const { data, error } = await supabase
      .from('routes')
      .select(
        `
        *,
        route_types (
          id,
          name
        )
      `
      )
      .eq('org_id', orgId)
      .eq('route_type_id', routeTypeId)
      .order('name', { ascending: true })

    if (error) throw error
    return data || []
  },

  /**
   * Create a new route
   */
  async create(route: RouteInsert): Promise<Route> {
    const { data, error } = await supabase
      .from('routes')
      .insert(route)
      .select()
      .single()

    if (error) throw error
    return data
  },

  /**
   * Create route with stops (transaction-like operation)
   */
  async createWithStops(
    route: RouteInsert,
    stops: Array<Omit<RouteStop, 'id' | 'route_id' | 'org_id'>>
  ) {
    // Create route first
    const newRoute = await this.create(route)

    // Then create stops
    if (stops.length > 0) {
      const stopsToInsert = stops.map((stop, index) => ({
        route_id: newRoute.id,
        org_id: route.org_id,
        stop_order: stop.stop_order ?? index + 1,
        location_id: stop.location_id,
        stop_type: stop.stop_type,
        notes: stop.notes,
      }))

      const { error: stopsError } = await supabase
        .from('route_stops')
        .insert(stopsToInsert)

      if (stopsError) {
        // Rollback: delete the route if stops creation fails
        await this.hardDelete(newRoute.id, route.org_id)
        throw stopsError
      }
    }

    return this.getById(newRoute.id, route.org_id)
  },

  /**
   * Update a route
   */
  async update(
    id: string,
    orgId: string,
    updates: RouteUpdate
  ): Promise<Route> {
    const { data, error } = await supabase
      .from('routes')
      .update(updates)
      .eq('id', id)
      .eq('org_id', orgId)
      .select()
      .single()

    if (error) throw error
    return data
  },

  /**
   * Soft delete a route
   */
  async softDelete(id: string, orgId: string): Promise<void> {
    const { error } = await supabase
      .from('routes')
      .update({ is_active: false })
      .eq('id', id)
      .eq('org_id', orgId)

    if (error) throw error
  },

  /**
   * Hard delete a route
   */
  async hardDelete(id: string, orgId: string): Promise<void> {
    const { error } = await supabase
      .from('routes')
      .delete()
      .eq('id', id)
      .eq('org_id', orgId)

    if (error) throw error
  },

  /**
   * Search routes by name or route_id
   */
  async search(orgId: string, searchTerm: string) {
    const { data, error } = await supabase
      .from('routes')
      .select(
        `
        *,
        route_types (
          id,
          name
        )
      `
      )
      .eq('org_id', orgId)
      .or(`name.ilike.%${searchTerm}%,route_id.ilike.%${searchTerm}%`)
      .order('name', { ascending: true })

    if (error) throw error
    return data || []
  },

  /**
   * Check if route_id exists
   */
  async routeIdExists(
    orgId: string,
    routeId: string,
    excludeId?: string
  ): Promise<boolean> {
    let query = supabase
      .from('routes')
      .select('id')
      .eq('org_id', orgId)
      .eq('route_id', routeId)

    if (excludeId) {
      query = query.neq('id', excludeId)
    }

    const { data, error } = await query

    if (error) throw error
    return (data?.length ?? 0) > 0
  },
}

/**
 * Route Stops Service - CRUD operations for route_stops table
 */

export const routeStopsService = {
  /**
   * Get all stops for a route
   */
  async getByRouteId(routeId: string, orgId: string) {
    const { data, error } = await supabase
      .from('route_stops')
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
      .eq('route_id', routeId)
      .eq('org_id', orgId)
      .order('stop_order', { ascending: true })

    if (error) throw error
    return data || []
  },

  /**
   * Add a stop to a route
   */
  async create(stop: Omit<RouteStop, 'id'>): Promise<RouteStop> {
    const { data, error } = await supabase
      .from('route_stops')
      .insert(stop)
      .select()
      .single()

    if (error) throw error
    return data
  },

  /**
   * Update a route stop
   */
  async update(
    id: string,
    orgId: string,
    updates: Partial<Omit<RouteStop, 'id' | 'route_id' | 'org_id'>>
  ): Promise<RouteStop> {
    const { data, error } = await supabase
      .from('route_stops')
      .update(updates)
      .eq('id', id)
      .eq('org_id', orgId)
      .select()
      .single()

    if (error) throw error
    return data
  },

  /**
   * Delete a route stop
   */
  async delete(id: string, orgId: string): Promise<void> {
    const { error } = await supabase
      .from('route_stops')
      .delete()
      .eq('id', id)
      .eq('org_id', orgId)

    if (error) throw error
  },

  /**
   * Replace all stops for a route
   */
  async replaceForRoute(
    routeId: string,
    orgId: string,
    stops: Array<Omit<RouteStop, 'id' | 'route_id' | 'org_id'>>
  ): Promise<void> {
    // First, remove all existing stops
    const { error: deleteError } = await supabase
      .from('route_stops')
      .delete()
      .eq('route_id', routeId)
      .eq('org_id', orgId)

    if (deleteError) throw deleteError

    // Then, add new stops
    if (stops.length > 0) {
      const stopsToInsert = stops.map((stop, index) => ({
        route_id: routeId,
        org_id: orgId,
        stop_order: stop.stop_order ?? index + 1,
        location_id: stop.location_id,
        stop_type: stop.stop_type,
        notes: stop.notes,
      }))

      const { error: insertError } = await supabase
        .from('route_stops')
        .insert(stopsToInsert)

      if (insertError) throw insertError
    }
  },

  /**
   * Reorder stops for a route
   */
  async reorder(
    routeId: string,
    orgId: string,
    stopOrders: Array<{ id: string; stop_order: number }>
  ): Promise<void> {
    const updatePromises = stopOrders.map(({ id, stop_order }) =>
      supabase
        .from('route_stops')
        .update({ stop_order })
        .eq('id', id)
        .eq('route_id', routeId)
        .eq('org_id', orgId)
    )

    const results = await Promise.all(updatePromises)
    const error = results.find((r) => r.error)?.error

    if (error) throw error
  },
}

/**
 * Route Types Service - CRUD operations for route_types table
 */

export const routeTypesService = {
  /**
   * Get all route types for an organization
   */
  async getAll(orgId: string): Promise<RouteType[]> {
    const { data, error } = await supabase
      .from('route_types')
      .select('*')
      .eq('org_id', orgId)
      .order('name', { ascending: true })

    if (error) throw error
    return data || []
  },

  /**
   * Get a single route type by ID
   */
  async getById(id: number, orgId: string): Promise<RouteType | null> {
    const { data, error } = await supabase
      .from('route_types')
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
   * Create a new route type
   */
  async create(routeType: Omit<RouteType, 'id'>): Promise<RouteType> {
    const { data, error } = await supabase
      .from('route_types')
      .insert(routeType)
      .select()
      .single()

    if (error) throw error
    return data
  },

  /**
   * Update a route type
   */
  async update(
    id: number,
    orgId: string,
    updates: Partial<Omit<RouteType, 'id'>>
  ): Promise<RouteType> {
    const { data, error } = await supabase
      .from('route_types')
      .update(updates)
      .eq('id', id)
      .eq('org_id', orgId)
      .select()
      .single()

    if (error) throw error
    return data
  },

  /**
   * Delete a route type
   */
  async delete(id: number, orgId: string): Promise<void> {
    const { error } = await supabase
      .from('route_types')
      .delete()
      .eq('id', id)
      .eq('org_id', orgId)

    if (error) throw error
  },
}
