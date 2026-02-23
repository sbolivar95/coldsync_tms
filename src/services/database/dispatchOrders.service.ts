import { supabase } from '../../lib/supabase'
import type {
  DispatchOrder,
  DispatchOrderInsert,
  DispatchOrderUpdate,
  DispatchOrderItem,
  DispatchOrderItemInsert,
  DispatchOrderStopActual,
  DispatchOrderStopActualInsert,
  FleetCandidate,
} from '../../types/dispatch.types'
import type { DispatchOrderStage, DispatchOrderSubstatus } from '../../types/database.types'
import type { DispatchOrderStateHistoryInsert } from '../../types/dispatch.types'
import { isValidTransition } from '../../types/dispatchOrderStateMachine'

// Type for carrier history records
export interface DispatchOrderCarrierHistory {
  id: string;
  outcome: string;
  outcome_reason: string | null;
  assigned_at: string;
  assigned_by: string | null;
  responded_at: string | null;
  responded_by: string | null;
  previous_fleet_set_id: string | null;
  new_fleet_set_id: string | null;
  carrier: {
    id: number;
    commercial_name: string;
  } | null;
  previous_fleet_set?: {
    id: string;
    vehicle: { plate: string; unit_code: string } | null;
    driver?: { name: string } | null;
  } | null;
  new_fleet_set?: {
    id: string;
    vehicle: { plate: string; unit_code: string } | null;
    driver?: { name: string } | null;
  } | null;
  assigned_user?: {
    first_name: string;
    last_name: string;
    email: string;
  };
  responded_user?: {
    first_name: string;
    last_name: string;
    email: string;
  };
}

/**
 * Dispatch Orders Service - CRUD operations for dispatch_orders table
 */

export const dispatchOrdersService = {
  /**
   * Get all dispatch orders for an organization
   * Includes basic lane information for display
   */
  async getAll(orgId: string) {
    const { data, error } = await supabase
      .from('dispatch_orders')
      .select(
        `
        *,
        fleet_sets (
          id,
          carrier_id,
          driver_id,
          vehicle_id,
          trailer_id,
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
            unit_code,
            plate
          ),
          trailers (
            id,
            code,
            plate,
            supports_multi_zone,
            compartments
          )
        ),
        lanes:lane_id (
          id,
          lane_id,
          name,
          distance,
          lane_type_id,
          lane_types:lane_type_id (
            id,
            name
          ),
          lane_stops (
            id,
            stop_order,
            location_id,
            locations (
              id,
              name,
              code,
              city,
              address
            )
          )
        ),
        dispatch_order_items (
          id,
          product_id,
          item_name,
          quantity,
          unit,
          thermal_profile_id,
          products (
            id,
            name
          ),
          thermal_profile:thermal_profile_id (
            id,
            name,
            temp_min_c,
            temp_max_c
          )
        ),
        dispatch_order_costs (
          id,
          total_cost,
          base_cost,
          fuel_surcharge,
          additional_charges,
          status
        )
      `
      )
      .eq('org_id', orgId)
      .order('planned_start_at', { ascending: true })

    if (error) throw error

    // Sort lane stops by stop_order for each order
    if (data) {
      data.forEach((order: any) => {
        if (order.lanes?.lane_stops) {
          order.lanes.lane_stops.sort(
            (a: any, b: any) => a.stop_order - b.stop_order
          )
        }
      })
    }

    // Fetch reefer specs for all fleet set trailers in the results
    if (data) {
      const trailerIds = data
        .map((order: any) => order.fleet_sets?.trailers?.id)
        .filter(Boolean) as string[]

      if (trailerIds.length > 0) {
        const { data: reefers } = await supabase
          .from('reefer_equipments')
          .select('*')
          .eq('org_id', orgId)
          .eq('owner_type', 'TRAILER')
          .in('owner_id', trailerIds)

        if (reefers) {
          data.forEach((order: any) => {
            if (order.fleet_sets?.trailers) {
              const trailer = order.fleet_sets.trailers
              const reefer = reefers.find(r => r.owner_id === trailer.id)
              if (reefer) {
                trailer.trailer_reefer_specs = {
                  id: reefer.id,
                  temp_min_c: reefer.temp_min_c,
                  temp_max_c: reefer.temp_max_c,
                  brand: reefer.brand,
                  model: reefer.model
                }
              }
            }
          })
        }
      }
    }

    return data || []
  },

  /**
   * Get a single dispatch order by ID with all details
   * Stops are now fetched from lane_stops via lane_id
   */
  async getById(id: string, orgId: string) {
    const { data, error } = await supabase
      .from('dispatch_orders')
      .select(
        `
        *,
        fleet_sets (
          id,
          carrier_id,
          driver_id,
          vehicle_id,
          trailer_id,
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
            unit_code,
            vehicle_type,
            plate
          ),
          trailers (
            id,
            code,
            plate
          )
        ),
        dispatch_order_items (
          *,
          products (
            id,
            name
          ),
          thermal_profile:thermal_profile_id (
            id,
            name,
            temp_min_c,
            temp_max_c
          )
        ),
        lanes:lane_id (
          id,
          lane_id,
          name,
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
        ),
        dispatch_order_costs (
          id,
          total_cost,
          base_cost,
          fuel_surcharge,
          additional_charges,
          status
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

    // Sort items and lane stops
    if (data) {
      if (data.dispatch_order_items) {
        // Items are already sorted by creation order, but we can ensure consistency
      }
      if (data.lanes?.lane_stops) {
        data.lanes.lane_stops.sort(
          (a: any, b: any) => a.stop_order - b.stop_order
        )
      }
    }

    return data
  },

  /**
   * Get dispatch orders by stage and optional substatus
   */
  async getByStage(
    orgId: string,
    stage: DispatchOrderStage,
    substatus?: DispatchOrderSubstatus
  ) {
    let query = supabase
      .from('dispatch_orders')
      .select(
        `
        *,
        fleet_sets (
          id,
          carrier_id,
          driver_id,
          vehicle_id,
          trailer_id,
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
            unit_code,
            plate
          ),
          trailers (
            id,
            code,
            plate
          )
        )
      `
      )
      .eq('org_id', orgId)
      .eq('stage', stage)

    if (substatus) {
      query = query.eq('substatus', substatus)
    }

    const { data, error } = await query.order('planned_start_at', { ascending: true })

    if (error) throw error
    return data || []
  },

  /**
   * Get dispatch orders by carrier
   * Note: Fetches all orders and filters by carrier through fleet_sets relationship
   */
  async getByCarrier(orgId: string, carrierId: number) {
    const { data, error } = await supabase
      .from('dispatch_orders')
      .select(
        `
        *,
        fleet_sets (
          id,
          carrier_id,
          driver_id,
          vehicle_id,
          trailer_id,
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
            unit_code
          ),
          trailers (
            id,
            code
          )
        )
      `
      )
      .eq('org_id', orgId)
      .order('planned_start_at', { ascending: false })

    if (error) throw error

    // Filter by carrier_id through fleet_sets relationship
    const filtered = (data || []).filter((order: any) =>
      order.fleet_sets?.carrier_id === carrierId
    )

    return filtered
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
        fleet_sets (
          id,
          carriers (commercial_name),
          drivers (name),
          vehicles (unit_code),
          trailers (code)
        )
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
        fleet_sets (
          id,
          carriers (commercial_name),
          drivers (name),
          vehicles (unit_code),
          trailers (code)
        )
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
   * Create dispatch order with items (transaction-like operation)
   * Note: Stops are now derived from lane_stops via lane_id (set in order.lane_id)
   * The stops parameter is kept for backward compatibility but is ignored
   */
  async createWithDetails(
    order: DispatchOrderInsert,
    items: Array<Omit<DispatchOrderItemInsert, 'dispatch_order_id' | 'org_id'>>
  ) {
    // Validate lane_id is present
    if (!order.lane_id) {
      throw new Error('lane_id is required when creating a dispatch order')
    }

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

      // Note: Stops are now derived from lane_stops via lane_id
      // Fetch the order with items and lane stops
      const { data: fullOrder, error: fetchError } = await supabase
        .from('dispatch_orders')
        .select(
          `
          *,
          dispatch_order_items (
            *,
            products (
              id,
              name
            ),
            thermal_profile:thermal_profile_id (
              id,
              name,
              temp_min_c,
              temp_max_c
            )
          ),
          lanes:lane_id (
            id,
            lane_id,
            name,
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
          )
        `
        )
        .eq('id', newOrder.id)
        .eq('org_id', order.org_id)
        .single()

      if (fetchError) throw fetchError

      // Sort lane stops by stop_order
      if (fullOrder && fullOrder.lanes?.lane_stops) {
        fullOrder.lanes.lane_stops.sort(
          (a: any, b: any) => a.stop_order - b.stop_order
        )
      }

      return fullOrder
    } catch (error) {
      // Rollback: delete the order if items creation fails
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
        fleet_sets (
          id,
          carriers (commercial_name),
          drivers (name),
          vehicles (unit_code),
          trailers (code)
        )
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
    fleetSetId: string,
    userId: string
  ): Promise<DispatchOrder> {
    // Use fetch directly - the Supabase client can hang in react-dnd drop contexts
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
    const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error('Missing Supabase environment variables')
    }

    // Get access token via getSession() which triggers automatic token refresh
    const { data: { session } } = await supabase.auth.getSession()
    if (!session?.access_token) {
      throw new Error('No active session found')
    }
    const accessToken = session.access_token

    const rpcUrl = `${supabaseUrl}/rest/v1/rpc/assign_dispatch_to_fleet_set`

    const response = await fetch(rpcUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': supabaseAnonKey,
        'Authorization': `Bearer ${accessToken}`,
        'Prefer': 'return=representation',
      },
      body: JSON.stringify({
        p_dispatch_order_id: dispatchOrderId,
        p_fleet_set_id: fleetSetId,
        p_user_id: userId,
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('RPC assign_dispatch_to_fleet_set error:', errorText)
      let errorData
      try {
        errorData = JSON.parse(errorText)
      } catch {
        errorData = { message: errorText }
      }
      throw new Error(errorData.message || `RPC call failed with status ${response.status}`)
    }

    const data = await response.json()

    if (!data) {
      throw new Error('RPC function returned no data')
    }

    return data as DispatchOrder
  },

  /**
   * Unassign a dispatch order from its fleet set
   * Sets fleet_set_id to null and transitions to DISPATCH/UNASSIGNED
   */
  async unassignFleetSet(
    dispatchOrderId: string,
    orgId: string,
    userId: string
  ): Promise<DispatchOrder> {
    const { data, error } = await supabase
      .from('dispatch_orders')
      .update({
        fleet_set_id: null,
        carrier_id: null,
        driver_id: null,
        vehicle_id: null,
        trailer_id: null,
        stage: 'DISPATCH' as DispatchOrderStage,
        substatus: 'UNASSIGNED' as DispatchOrderSubstatus,
        updated_by: userId,
        updated_at: new Date().toISOString(),
      })
      .eq('id', dispatchOrderId)
      .eq('org_id', orgId)
      .select()
      .single()

    if (error) throw error
    return data
  },

  /**
   * Send dispatch order to carrier for approval (ASSIGNED → PENDING)
   * Creates carrier history record with outcome='PENDING'
   */
  async sendToCarrier(
    dispatchOrderId: string,
    sentBy: string
  ): Promise<DispatchOrder> {
    const { data, error } = await supabase.rpc('send_dispatch_order_to_carrier', {
      p_dispatch_order_id: dispatchOrderId,
      p_sent_by: sentBy,
    })

    if (error) throw error
    if (!data) throw new Error('RPC function returned no data')
    return data as DispatchOrder
  },

  /**
   * Carrier accepts dispatch order (PENDING → SCHEDULED)
   * Updates carrier history to outcome='ACCEPTED'
   */
  async carrierAccept(
    dispatchOrderId: string,
    acceptedBy: string
  ): Promise<DispatchOrder> {
    const { data, error } = await supabase.rpc('carrier_accept_dispatch_order', {
      p_dispatch_order_id: dispatchOrderId,
      p_accepted_by: acceptedBy,
    })

    if (error) throw error
    if (!data) throw new Error('RPC function returned no data')
    return data as DispatchOrder
  },

  /**
   * Carrier rejects dispatch order (→ REJECTED)
   * Updates carrier history to outcome='REJECTED'
   */
  async carrierReject(
    dispatchOrderId: string,
    rejectedBy: string,
    reason: string
  ): Promise<DispatchOrder> {
    const { data, error } = await supabase.rpc('carrier_reject_dispatch_order', {
      p_dispatch_order_id: dispatchOrderId,
      p_rejected_by: rejectedBy,
      p_reason: reason,
    })

    if (error) throw error
    if (!data) throw new Error('RPC function returned no data')
    return data as DispatchOrder
  },

  /**
   * Organization cancels dispatch order
   * Does not count against carrier metrics
   */
  async orgCancelDispatchOrder(
    dispatchOrderId: string,
    canceledBy: string,
    reason: string,
    cancellationReasonId: string
  ): Promise<DispatchOrder> {
    const { data, error } = await supabase.rpc('org_cancel_dispatch_order', {
      p_dispatch_order_id: dispatchOrderId,
      p_canceled_by: canceledBy,
      p_cancellation_reason_id: cancellationReasonId,
      p_reason: reason,
    })

    if (error) throw error
    // RPC returns the updated order
    if (!data) throw new Error('RPC function returned no data')
    return data as DispatchOrder
  },

  /**
   * Get carrier history for a dispatch order
   */
  /**
   * Get carrier history for a dispatch order
   */
  async getCarrierHistory(dispatchOrderId: string): Promise<DispatchOrderCarrierHistory[]> {
    const { data, error } = await supabase
      .from('dispatch_order_carrier_history')
      .select(`
        id,
        outcome,
        outcome_reason,
        assigned_at,
        assigned_by,
        responded_at,
        responded_by,
        previous_fleet_set_id,
        new_fleet_set_id,
        carrier:carriers!dispatch_order_carrier_history_carrier_id_fkey (
          id,
          commercial_name
        )
      `)
      .eq('dispatch_order_id', dispatchOrderId)
      .order('assigned_at', { ascending: false })

    if (error) throw error

    // Collect all user IDs to fetch
    const userIds = new Set<string>()
    data?.forEach((record: any) => {
      if (record.assigned_by) userIds.add(record.assigned_by)
      if (record.responded_by) userIds.add(record.responded_by)
    })

    let usersMap = new Map<string, { first_name: string; last_name: string; email: string }>()

    if (userIds.size > 0) {
      const { data: usersData } = await supabase
        .from('organization_members')
        .select('user_id, first_name, last_name, email')
        .in('user_id', Array.from(userIds))

      usersData?.forEach((u: any) => {
        if (u.user_id) {
          usersMap.set(u.user_id, { first_name: u.first_name, last_name: u.last_name, email: u.email })
        }
      })
    }

    // Enrich with fleet set details if there were changes
    const enrichedData = await Promise.all(
      (data || []).map(async (record: any) => {
        let previous_fleet_set = null
        let new_fleet_set = null

        if (record.previous_fleet_set_id) {
          const { data: prevFs } = await supabase
            .from('fleet_sets')
            .select(`
              id,
              vehicle:vehicles!fleet_sets_vehicle_id_fkey (plate, unit_code),
              driver:drivers!fleet_sets_driver_id_fkey (name)
            `)
            .eq('id', record.previous_fleet_set_id)
            .single()
          previous_fleet_set = prevFs
        }

        if (record.new_fleet_set_id) {
          const { data: newFs } = await supabase
            .from('fleet_sets')
            .select(`
              id,
              vehicle:vehicles!fleet_sets_vehicle_id_fkey (plate, unit_code),
              driver:drivers!fleet_sets_driver_id_fkey (name)
            `)
            .eq('id', record.new_fleet_set_id)
            .single()
          new_fleet_set = newFs
        }

        return {
          ...record,
          previous_fleet_set,
          new_fleet_set,
          assigned_user: record.assigned_by ? usersMap.get(record.assigned_by) : undefined,
          responded_user: record.responded_by ? usersMap.get(record.responded_by) : undefined,
        }
      })
    )

    return enrichedData
  },

  /**
   * Auto-assign the best fleet to a dispatch order
   */
  async autoAssignFleet(
    dispatchOrderId: string,
    userId: string
  ): Promise<{ success: boolean; message: string; fleet_set_id?: string; dispatch_order?: DispatchOrder }> {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
    const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error('Missing Supabase environment variables')
    }

    // Get access token via getSession() which triggers automatic token refresh
    const { data: { session } } = await supabase.auth.getSession()
    if (!session?.access_token) {
      throw new Error('No active session found')
    }
    const accessToken = session.access_token

    const rpcUrl = `${supabaseUrl}/rest/v1/rpc/auto_assign_dispatch_to_best_fleet`

    const response = await fetch(rpcUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': supabaseAnonKey,
        'Authorization': `Bearer ${accessToken}`,
        'Prefer': 'return=representation',
      },
      body: JSON.stringify({
        p_dispatch_order_id: dispatchOrderId,
        p_user_id: userId,
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      let errorData
      try {
        errorData = JSON.parse(errorText)
      } catch {
        errorData = { message: errorText }
      }
      throw new Error(errorData.message || `RPC call failed with status ${response.status}`)
    }

    return await response.json()
  },

  /**
   * Batch auto-assign the best fleet to multiple dispatch orders
   */
  async batchAutoAssignFleet(
    dispatchOrderIds: string[],
    userId: string
  ): Promise<{
    success: boolean
    message: string
    total: number
    success_count: number
    fail_count: number
    results: {
      successful: Array<{
        dispatch_order_id: string
        dispatch_number: string
        success: boolean
        message: string
        fleet_set_id?: string
        dispatch_order?: DispatchOrder
      }>
      failed: Array<{
        dispatch_order_id: string
        dispatch_number: string | null
        success: boolean
        message: string
      }>
    }
  }> {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
    const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error('Missing Supabase environment variables')
    }

    // Get access token via getSession() which triggers automatic token refresh
    const { data: { session } } = await supabase.auth.getSession()
    if (!session?.access_token) {
      throw new Error('No active session found')
    }
    const accessToken = session.access_token

    const rpcUrl = `${supabaseUrl}/rest/v1/rpc/batch_auto_assign_dispatch_orders`

    const response = await fetch(rpcUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': supabaseAnonKey,
        'Authorization': `Bearer ${accessToken}`,
        'Prefer': 'return=representation',
      },
      body: JSON.stringify({
        p_dispatch_order_ids: dispatchOrderIds,
        p_user_id: userId,
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      let errorData
      try {
        errorData = JSON.parse(errorText)
      } catch {
        errorData = { message: errorText }
      }
      throw new Error(errorData.message || `RPC call failed with status ${response.status}`)
    }

    return await response.json()
  },

  // ─── State Machine Methods ──────────────────────────────────────────────

  /**
   * Transition an order to a new stage + substatus.
   * Updates both new columns (stage, substatus) and legacy status column.
   * Inserts a row into dispatch_order_state_history.
   *
   * @param params.validate - If true (default), validates the transition
   */
  async transitionState(params: {
    dispatchOrderId: string;
    orgId: string;
    userId: string;
    fromStage: DispatchOrderStage;
    fromSubstatus: DispatchOrderSubstatus;
    toStage: DispatchOrderStage;
    toSubstatus: DispatchOrderSubstatus;
    triggerType?: 'USER' | 'SYSTEM' | 'GPS' | 'TIMER';
    reason?: string;
    notes?: string;
    metadata?: Record<string, unknown>;
    validate?: boolean;
  }): Promise<DispatchOrder> {
    const {
      dispatchOrderId, orgId, userId,
      fromStage, fromSubstatus, toStage, toSubstatus,
      triggerType = 'USER', reason, notes, metadata,
      validate = true,
    } = params;

    // Validate transition
    if (validate && !isValidTransition(fromSubstatus, toStage, toSubstatus)) {
      throw new Error(
        `Invalid state transition: ${fromStage}/${fromSubstatus} → ${toStage}/${toSubstatus}`
      );
    }

    // Update the order
    const { data: updatedOrder, error: updateError } = await supabase
      .from('dispatch_orders')
      .update({
        stage: toStage,
        substatus: toSubstatus,
        updated_by: userId,
        updated_at: new Date().toISOString(),
      })
      .eq('id', dispatchOrderId)
      .eq('org_id', orgId)
      .select()
      .single();

    if (updateError) throw updateError;

    // Insert state history record
    const historyRecord: DispatchOrderStateHistoryInsert = {
      dispatch_order_id: dispatchOrderId,
      from_stage: fromStage,
      from_substatus: fromSubstatus,
      to_stage: toStage,
      to_substatus: toSubstatus,
      changed_by: userId,
      trigger_type: triggerType,
      reason: reason || null,
      notes: notes || null,
      metadata: metadata ? (metadata as any) : null,
      org_id: orgId,
    };

    const { error: historyError } = await supabase
      .from('dispatch_order_state_history')
      .insert(historyRecord);

    if (historyError) {
      console.error('Failed to insert state history:', historyError);
      // Don't throw — the order was already updated successfully
    }

    return updatedOrder;
  },

  /**
   * Get state history for a dispatch order
   */
  async getStateHistory(dispatchOrderId: string) {
    const { data, error } = await supabase
      .from('dispatch_order_state_history')
      .select('*')
      .eq('dispatch_order_id', dispatchOrderId)
      .order('changed_at', { ascending: true });

    if (error) throw error;
    return data || [];
  },

  // ─── Cancellation Methods ───────────────────────────────────────────────

  /**
   * Cancel a single dispatch order
   * 
   * @param orderId - Dispatch order ID
   * @param orgId - Organization ID (multitenant validation)
   * @param canceledBy - User ID who is canceling
   * @param cancellationReasonId - Cancellation reason from catalog
   * @param comment - Optional comment (required if reason requires_comment)
   * 
   * @throws Error if order is not in cancelable stage (DISPATCH/TENDERS/SCHEDULED)
   * @throws Error if comment is required but not provided
   * @throws Error if cancellation reason doesn't belong to organization
   */
  async cancelOrder(
    orderId: string,
    orgId: string,
    canceledBy: string,
    cancellationReasonId: string,
    comment?: string
  ): Promise<DispatchOrder> {
    // 1. Get current order state
    const { data: currentOrder, error: fetchError } = await supabase
      .from('dispatch_orders')
      .select('stage, substatus')
      .eq('id', orderId)
      .eq('org_id', orgId)
      .single();

    if (fetchError) throw fetchError;
    if (!currentOrder) throw new Error('Order not found');

    // 2. Validate stage (only DISPATCH, TENDERS, SCHEDULED can be canceled)
    const cancelableStages: DispatchOrderStage[] = ['DISPATCH', 'TENDERS', 'SCHEDULED'];
    if (!cancelableStages.includes(currentOrder.stage)) {
      throw new Error(
        `Cannot cancel order in stage ${currentOrder.stage}. Only DISPATCH, TENDERS, and SCHEDULED orders can be canceled.`
      );
    }

    // 3. Validate cancellation reason and check if comment is required
    const { data: reason, error: reasonError } = await supabase
      .from('cancellation_reasons')
      .select('requires_comment')
      .eq('id', cancellationReasonId)
      .eq('org_id', orgId)
      .eq('is_active', true)
      .single();

    if (reasonError || !reason) {
      throw new Error('Invalid or inactive cancellation reason');
    }

    if (reason.requires_comment && !comment) {
      throw new Error('Comment is required for this cancellation reason');
    }

    // 4. Update order using state machine transition
    await this.transitionState({
      dispatchOrderId: orderId,
      orgId,
      userId: canceledBy,
      fromStage: currentOrder.stage,
      fromSubstatus: currentOrder.substatus,
      toStage: currentOrder.stage, // Keep same stage
      toSubstatus: 'CANCELED' as DispatchOrderSubstatus,
      triggerType: 'USER',
      reason: 'ORDER_CANCELED_BY_SHIPPER',
      notes: comment ?? undefined,
      metadata: {
        cancellation_reason_id: cancellationReasonId,
      },
      validate: true,
    });

    // 5. Update cancellation_reason_id in dispatch_orders
    const { data: finalOrder, error: updateError } = await supabase
      .from('dispatch_orders')
      .update({
        cancellation_reason_id: cancellationReasonId,
        updated_by: canceledBy,
        updated_at: new Date().toISOString(),
      })
      .eq('id', orderId)
      .eq('org_id', orgId)
      .select()
      .single();

    if (updateError) throw updateError;

    return finalOrder;
  },

  /**
   * Cancel multiple dispatch orders in bulk
   * 
   * @param orderIds - Array of dispatch order IDs
   * @param orgId - Organization ID (multitenant validation)
   * @param canceledBy - User ID who is canceling
   * @param cancellationReasonId - Cancellation reason from catalog
   * @param comment - Optional comment (required if reason requires_comment)
   * 
   * @returns Summary with successful and failed cancellations
   */
  async bulkCancelOrders(
    orderIds: string[],
    orgId: string,
    canceledBy: string,
    cancellationReasonId: string,
    comment?: string
  ): Promise<{
    success: boolean;
    message: string;
    total: number;
    success_count: number;
    fail_count: number;
    results: {
      successful: Array<{
        order_id: string;
        dispatch_number: string;
        success: boolean;
        message: string;
      }>;
      failed: Array<{
        order_id: string;
        dispatch_number: string | null;
        success: boolean;
        message: string;
      }>;
    };
  }> {
    const successful: Array<{
      order_id: string;
      dispatch_number: string;
      success: boolean;
      message: string;
    }> = [];
    const failed: Array<{
      order_id: string;
      dispatch_number: string | null;
      success: boolean;
      message: string;
    }> = [];

    // Process each order
    for (const orderId of orderIds) {
      try {
        // Get dispatch_number for reporting
        const { data: order } = await supabase
          .from('dispatch_orders')
          .select('dispatch_number')
          .eq('id', orderId)
          .eq('org_id', orgId)
          .single();

        const dispatchNumber = order?.dispatch_number || 'Unknown';

        // Attempt to cancel
        await this.cancelOrder(orderId, orgId, canceledBy, cancellationReasonId, comment);

        successful.push({
          order_id: orderId,
          dispatch_number: dispatchNumber,
          success: true,
          message: 'Order canceled successfully',
        });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';

        // Try to get dispatch_number even on failure
        const { data: order } = await supabase
          .from('dispatch_orders')
          .select('dispatch_number')
          .eq('id', orderId)
          .eq('org_id', orgId)
          .single();

        failed.push({
          order_id: orderId,
          dispatch_number: order?.dispatch_number || null,
          success: false,
          message: errorMessage,
        });
      }
    }

    const successCount = successful.length;
    const failCount = failed.length;
    const total = orderIds.length;

    return {
      success: failCount === 0,
      message:
        failCount === 0
          ? `Successfully canceled ${successCount} order(s)`
          : `Canceled ${successCount} order(s), ${failCount} failed`,
      total,
      success_count: successCount,
      fail_count: failCount,
      results: {
        successful,
        failed,
      },
    };
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
 * Dispatch Order Stop Actuals Service - CRUD operations for dispatch_order_stop_actuals table
 * This table records actual arrival/departure times for lane stops in dispatch orders
 */

export const dispatchOrderStopActualsService = {
  /**
   * Get all stop actuals for a dispatch order
   */
  async getByOrderId(orderId: string, orgId: string) {
    const { data, error } = await supabase
      .from('dispatch_order_stop_actuals')
      .select(
        `
        *,
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
      .eq('dispatch_order_id', orderId)
      .eq('org_id', orgId)
      .order('created_at', { ascending: true })

    if (error) throw error
    return data || []
  },

  /**
   * Create or update a stop actual for a dispatch order
   */
  async upsert(actual: DispatchOrderStopActualInsert): Promise<DispatchOrderStopActual> {
    const { data, error } = await supabase
      .from('dispatch_order_stop_actuals')
      .upsert(
        {
          ...actual,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: 'dispatch_order_id,lane_stop_id',
        }
      )
      .select()
      .single()

    if (error) throw error
    return data
  },

  /**
   * Update a stop actual
   */
  async update(
    id: string,
    orgId: string,
    updates: Partial<
      Omit<
        DispatchOrderStopActual,
        'id' | 'dispatch_order_id' | 'org_id' | 'created_at'
      >
    >
  ): Promise<DispatchOrderStopActual> {
    const { data, error } = await supabase
      .from('dispatch_order_stop_actuals')
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
   * Delete a stop actual
   */
  async delete(id: string, orgId: string): Promise<void> {
    const { error } = await supabase
      .from('dispatch_order_stop_actuals')
      .delete()
      .eq('id', id)
      .eq('org_id', orgId)

    if (error) throw error
  },
}
