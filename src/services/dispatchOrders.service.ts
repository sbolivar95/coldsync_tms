import { supabase } from '../lib/supabase'
import type {
  DispatchOrder,
  DispatchOrderInsert,
  DispatchOrderUpdate,
  DispatchOrderItem,
  DispatchOrderItemInsert,
  DispatchOrderStop,
  DispatchOrderStopInsert,
  DispatchOrderStatus,
  FleetCandidate,
} from '../types/database.types'

/**
 * Dispatch Orders Service - CRUD operations for dispatch_orders table
 */

export const dispatchOrdersService = {
  /**
   * Get all dispatch orders for an organization
   */
  async getAll(orgId: string) {
    const { data, error } = await supabase
      .from('dispatch_orders')
      .select(
        `
        *,
        carriers (
          id,
          commercial_name
        ),
        drivers (
          id,
          name
        ),
        vehicles (
          id,
          vehicle_code,
          plate
        ),
        trailers (
          id,
          code,
          plate
        ),
        fleet_sets (
          id,
          carrier_id,
          driver_id
        )
      `
      )
      .eq('org_id', orgId)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data || []
  },

  /**
   * Get a single dispatch order by ID with all details
   */
  async getById(id: string, orgId: string) {
    const { data, error } = await supabase
      .from('dispatch_orders')
      .select(
        `
        *,
        carriers (
          id,
          commercial_name,
          contact_name,
          contact_phone
        ),
        drivers (
          id,
          name,
          phone_number
        ),
        vehicles (
          id,
          vehicle_code,
          plate
        ),
        trailers (
          id,
          code,
          plate
        ),
        fleet_sets (
          id,
          carrier_id,
          driver_id,
          vehicle_id,
          trailer_id
        ),
        dispatch_order_items (
          *,
          products (
            id,
            name
          )
        ),
        dispatch_order_stops (
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

    // Sort items and stops
    if (data) {
      if (data.dispatch_order_stops) {
        data.dispatch_order_stops.sort(
          (a: any, b: any) => a.stop_order - b.stop_order
        )
      }
    }

    return data
  },

  /**
   * Get dispatch orders by status
   */
  async getByStatus(orgId: string, status: DispatchOrderStatus) {
    const { data, error } = await supabase
      .from('dispatch_orders')
      .select(
        `
        *,
        carriers (commercial_name),
        drivers (name),
        vehicles (vehicle_code, plate),
        trailers (code, plate)
      `
      )
      .eq('org_id', orgId)
      .eq('status', status)
      .order('planned_start_at', { ascending: true })

    if (error) throw error
    return data || []
  },

  /**
   * Get dispatch orders by carrier
   */
  async getByCarrier(orgId: string, carrierId: number) {
    const { data, error } = await supabase
      .from('dispatch_orders')
      .select(
        `
        *,
        carriers (commercial_name),
        drivers (name),
        vehicles (vehicle_code),
        trailers (code)
      `
      )
      .eq('org_id', orgId)
      .eq('carrier_id', carrierId)
      .order('planned_start_at', { ascending: false })

    if (error) throw error
    return data || []
  },

  /**
   * Get dispatch orders by driver
   */
  async getByDriver(orgId: string, driverId: number) {
    const { data, error } = await supabase
      .from('dispatch_orders')
      .select(
        `
        *,
        carriers (commercial_name),
        drivers (name),
        vehicles (vehicle_code),
        trailers (code)
      `
      )
      .eq('org_id', orgId)
      .eq('driver_id', driverId)
      .order('planned_start_at', { ascending: false })

    if (error) throw error
    return data || []
  },

  /**
   * Get dispatch orders by date range
   */
  async getByDateRange(orgId: string, startDate: string, endDate: string) {
    const { data, error } = await supabase
      .from('dispatch_orders')
      .select(
        `
        *,
        carriers (commercial_name),
        drivers (name),
        vehicles (vehicle_code),
        trailers (code)
      `
      )
      .eq('org_id', orgId)
      .gte('planned_start_at', startDate)
      .lte('planned_start_at', endDate)
      .order('planned_start_at', { ascending: true })

    if (error) throw error
    return data || []
  },

  /**
   * Create a new dispatch order
   */
  async create(order: DispatchOrderInsert): Promise<DispatchOrder> {
    const { data, error } = await supabase
      .from('dispatch_orders')
      .insert(order)
      .select()
      .single()

    if (error) throw error
    return data
  },

  /**
   * Create dispatch order with items and stops (transaction-like operation)
   */
  async createWithDetails(
    order: DispatchOrderInsert,
    items: Array<Omit<DispatchOrderItemInsert, 'dispatch_order_id' | 'org_id'>>,
    stops: Array<Omit<DispatchOrderStopInsert, 'dispatch_order_id' | 'org_id'>>
  ) {
    // Create order first
    const newOrder = await this.create(order)

    try {
      // Create items
      if (items.length > 0) {
        const itemsToInsert = items.map((item) => ({
          dispatch_order_id: newOrder.id,
          org_id: order.org_id,
          ...item,
        }))

        const { error: itemsError } = await supabase
          .from('dispatch_order_items')
          .insert(itemsToInsert)

        if (itemsError) throw itemsError
      }

      // Create stops
      if (stops.length > 0) {
        const stopsToInsert = stops.map((stop, index) => ({
          dispatch_order_id: newOrder.id,
          org_id: order.org_id,
          stop_order: stop.stop_order ?? index + 1,
          stop_type: stop.stop_type,
          location_id: stop.location_id,
          notes: stop.notes,
          created_by: stop.created_by,
          updated_by: stop.updated_by,
        }))

        const { error: stopsError } = await supabase
          .from('dispatch_order_stops')
          .insert(stopsToInsert)

        if (stopsError) throw stopsError
      }

      return this.getById(newOrder.id, order.org_id)
    } catch (error) {
      // Rollback: delete the order if items/stops creation fails
      await this.hardDelete(newOrder.id, order.org_id)
      throw error
    }
  },

  /**
   * Update a dispatch order
   */
  async update(
    id: string,
    orgId: string,
    updates: DispatchOrderUpdate
  ): Promise<DispatchOrder> {
    const { data, error } = await supabase
      .from('dispatch_orders')
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
   * Update dispatch order status
   */
  async updateStatus(
    id: string,
    orgId: string,
    status: DispatchOrderStatus,
    userId: string
  ): Promise<DispatchOrder> {
    const { data, error } = await supabase
      .from('dispatch_orders')
      .update({
        status,
        updated_by: userId,
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
   * Hard delete a dispatch order
   */
  async hardDelete(id: string, orgId: string): Promise<void> {
    const { error } = await supabase
      .from('dispatch_orders')
      .delete()
      .eq('id', id)
      .eq('org_id', orgId)

    if (error) throw error
  },

  /**
   * Search dispatch orders
   */
  async search(orgId: string, searchTerm: string) {
    const { data, error } = await supabase
      .from('dispatch_orders')
      .select(
        `
        *,
        carriers (commercial_name),
        drivers (name),
        vehicles (vehicle_code),
        trailers (code)
      `
      )
      .eq('org_id', orgId)
      .ilike('dispatch_number', `%${searchTerm}%`)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data || []
  },

  /**
   * Get fleet candidates for a dispatch order using SQL function
   */
  async getFleetCandidates(
    dispatchOrderId: string,
    limit: number = 50
  ): Promise<FleetCandidate[]> {
    const { data, error } = await supabase.rpc(
      'get_dispatch_order_fleet_candidates',
      {
        p_dispatch_order_id: dispatchOrderId,
        p_limit: limit,
      }
    )

    if (error) throw error
    return data || []
  },

  /**
   * Assign a fleet set to a dispatch order using SQL function
   */
  async assignFleetSet(
    dispatchOrderId: string,
    fleetSetId: string
  ): Promise<void> {
    const { error } = await supabase.rpc('assign_dispatch_to_fleet_set', {
      p_dispatch_order_id: dispatchOrderId,
      p_fleet_set_id: fleetSetId,
    })

    if (error) throw error
  },
}

/**
 * Dispatch Order Items Service - CRUD operations for dispatch_order_items table
 */

export const dispatchOrderItemsService = {
  /**
   * Get all items for a dispatch order
   */
  async getByOrderId(orderId: string, orgId: string) {
    const { data, error } = await supabase
      .from('dispatch_order_items')
      .select(
        `
        *,
        products (
          id,
          name,
          description
        )
      `
      )
      .eq('dispatch_order_id', orderId)
      .eq('org_id', orgId)

    if (error) throw error
    return data || []
  },

  /**
   * Add an item to a dispatch order
   */
  async create(item: DispatchOrderItemInsert): Promise<DispatchOrderItem> {
    const { data, error } = await supabase
      .from('dispatch_order_items')
      .insert(item)
      .select()
      .single()

    if (error) throw error
    return data
  },

  /**
   * Update a dispatch order item
   */
  async update(
    id: string,
    orgId: string,
    updates: Partial<
      Omit<
        DispatchOrderItem,
        'id' | 'dispatch_order_id' | 'org_id' | 'created_at'
      >
    >
  ): Promise<DispatchOrderItem> {
    const { data, error } = await supabase
      .from('dispatch_order_items')
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
   * Delete a dispatch order item
   */
  async delete(id: string, orgId: string): Promise<void> {
    const { error } = await supabase
      .from('dispatch_order_items')
      .delete()
      .eq('id', id)
      .eq('org_id', orgId)

    if (error) throw error
  },

  /**
   * Replace all items for a dispatch order
   */
  async replaceForOrder(
    orderId: string,
    orgId: string,
    items: Array<Omit<DispatchOrderItemInsert, 'dispatch_order_id' | 'org_id'>>
  ): Promise<void> {
    // First, remove all existing items
    const { error: deleteError } = await supabase
      .from('dispatch_order_items')
      .delete()
      .eq('dispatch_order_id', orderId)
      .eq('org_id', orgId)

    if (deleteError) throw deleteError

    // Then, add new items
    if (items.length > 0) {
      const itemsToInsert = items.map((item) => ({
        dispatch_order_id: orderId,
        org_id: orgId,
        ...item,
      }))

      const { error: insertError } = await supabase
        .from('dispatch_order_items')
        .insert(itemsToInsert)

      if (insertError) throw insertError
    }
  },
}

/**
 * Dispatch Order Stops Service - CRUD operations for dispatch_order_stops table
 */

export const dispatchOrderStopsService = {
  /**
   * Get all stops for a dispatch order
   */
  async getByOrderId(orderId: string, orgId: string) {
    const { data, error } = await supabase
      .from('dispatch_order_stops')
      .select(
        `
        *,
        locations (
          id,
          name,
          code,
          city,
          address,
          num_docks
        )
      `
      )
      .eq('dispatch_order_id', orderId)
      .eq('org_id', orgId)
      .order('stop_order', { ascending: true })

    if (error) throw error
    return data || []
  },

  /**
   * Add a stop to a dispatch order
   */
  async create(stop: DispatchOrderStopInsert): Promise<DispatchOrderStop> {
    const { data, error } = await supabase
      .from('dispatch_order_stops')
      .insert(stop)
      .select()
      .single()

    if (error) throw error
    return data
  },

  /**
   * Update a dispatch order stop
   */
  async update(
    id: string,
    orgId: string,
    updates: Partial<
      Omit<
        DispatchOrderStop,
        'id' | 'dispatch_order_id' | 'org_id' | 'created_at'
      >
    >
  ): Promise<DispatchOrderStop> {
    const { data, error } = await supabase
      .from('dispatch_order_stops')
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
   * Delete a dispatch order stop
   */
  async delete(id: string, orgId: string): Promise<void> {
    const { error } = await supabase
      .from('dispatch_order_stops')
      .delete()
      .eq('id', id)
      .eq('org_id', orgId)

    if (error) throw error
  },

  /**
   * Replace all stops for a dispatch order
   */
  async replaceForOrder(
    orderId: string,
    orgId: string,
    stops: Array<Omit<DispatchOrderStopInsert, 'dispatch_order_id' | 'org_id'>>
  ): Promise<void> {
    // First, remove all existing stops
    const { error: deleteError } = await supabase
      .from('dispatch_order_stops')
      .delete()
      .eq('dispatch_order_id', orderId)
      .eq('org_id', orgId)

    if (deleteError) throw deleteError

    // Then, add new stops
    if (stops.length > 0) {
      const stopsToInsert = stops.map((stop, index) => ({
        dispatch_order_id: orderId,
        org_id: orgId,
        stop_order: stop.stop_order ?? index + 1,
        stop_type: stop.stop_type,
        location_id: stop.location_id,
        notes: stop.notes,
        created_by: stop.created_by,
        updated_by: stop.updated_by,
      }))

      const { error: insertError } = await supabase
        .from('dispatch_order_stops')
        .insert(stopsToInsert)

      if (insertError) throw insertError
    }
  },

  /**
   * Reorder stops for a dispatch order
   */
  async reorder(
    orderId: string,
    orgId: string,
    stopOrders: Array<{ id: string; stop_order: number }>
  ): Promise<void> {
    const updatePromises = stopOrders.map(({ id, stop_order }) =>
      supabase
        .from('dispatch_order_stops')
        .update({
          stop_order,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .eq('dispatch_order_id', orderId)
        .eq('org_id', orgId)
    )

    const results = await Promise.all(updatePromises)
    const error = results.find((r) => r.error)?.error

    if (error) throw error
  },
}
