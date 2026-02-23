/**
 * Orders Service for Carrier Operations
 * 
 * This service handles all carrier-specific order operations including:
 * - Fetching orders for a specific carrier
 * - Accept/Reject order operations
 * - Accept with changes (fleet set modifications)
 * - Order history
 * - Real-time subscriptions
 */

import { supabase } from '../../lib/supabase';
import { RealtimeChannel } from '@supabase/supabase-js';

import { REJECTION_REASON_LABELS } from '../../lib/constants/rejectionReasons';

// Substatus mappings for carrier view
export const CARRIER_ORDER_STATUSES = {
  // Requests - TENDERS/PENDING
  SOLICITUDES: ['PENDING'] as const,

  // Commitments - TENDERS/ACCEPTED + SCHEDULED/*
  COMPROMISOS: ['ACCEPTED', 'PROGRAMMED', 'DISPATCHED', 'EN_ROUTE_TO_ORIGIN', 'AT_ORIGIN', 'LOADING'] as const,

  // History - completed or terminated orders
  HISTORIAL: ['REJECTED', 'EXPIRED', 'OBSERVED', 'CANCELED'] as const,
} as const;

export type CarrierOrderCategory = 'solicitudes' | 'compromisos' | 'historial';

// Fleet set with relations for availability check (as returned by Supabase)
export interface FleetSetWithRelations {
  id: string;
  is_active: boolean;
  vehicle: {
    id: string;
    plate: string;
    unit_code: string;
    brand: string | null;
    model: string | null;
  } | null;
  trailer: {
    id: string;
    plate: string;
    code: string;
  } | null;
  driver: {
    id: number;
    name: string;
    driver_id: string;
  } | null;
  orders: Array<{
    id: string;
    substatus: string;
  }>;
}

// Core dispatch order fields from Supabase
export interface RejectionReason {
  code: string;
  label: string;
  category: string;
  stage: 'pre_acceptance' | 'post_acceptance';
  is_active: boolean;
}

export interface CarrierOrder {
  id: string;
  org_id: string;
  dispatch_number: string;
  stage: string;
  substatus: string;
  lane_id: string | null;
  fleet_set_id: string | null;
  carrier_id: number | null;
  driver_id: number | null;
  vehicle_id: string | null;
  trailer_id: string | null;
  planned_start_at: string;
  planned_end_at: string | null;
  actual_start_at: string | null;
  actual_end_at: string | null;
  notes: string | null;
  created_at: string;
  created_by: string;
  updated_at: string | null;
  updated_by: string | null;
  carrier_assigned_at?: string | null;
  response_deadline?: string | null;

  // Joined relations
  lane?: {
    id: string;
    name: string;
    distance: number;
    lane_stops: Array<{
      id: string;
      stop_order: number;
      stop_type: string;
      location: {
        id: number;
        name: string;
        code: string;
        city: string;
      };
    }>;
  };
  fleet_set?: {
    id: string;
    vehicle: { id: string; plate: string; unit_code: string };
    trailer?: { id: string; plate: string; code: string };
    driver?: { id: number; name: string };
  };
  items?: Array<{
    id: string;
    item_name: string;
    quantity: number;
    unit: string;
    product?: { id: number; name: string };
    thermal_profile?: { id: number; name: string; temp_min_c: number; temp_max_c: number };
  }>;
}

export interface CarrierOrderHistory {
  id: string;
  outcome: string;
  outcome_reason: string | null;
  assigned_at: string;
  responded_at: string | null;
  responded_by: string | null;
  previous_fleet_set_id: string | null;
  new_fleet_set_id: string | null;
  carrier: {
    id: number;
    commercial_name: string;
  };
  previous_fleet_set?: {
    id: string;
    vehicle: { plate: string; unit_code: string };
    driver?: { name: string };
  };
  new_fleet_set?: {
    id: string;
    vehicle: { plate: string; unit_code: string };
    driver?: { name: string };
  };
}

class OrdersService {
  private realtimeChannel: RealtimeChannel | null = null;

  /**
   * Get all orders for a specific carrier
   * Filters by stage in ['TENDERS', 'SCHEDULED'] to show orders in tenders and scheduled stages
   */
  async getCarrierOrders(
    carrierId: number,
    orgId: string
  ): Promise<CarrierOrder[]> {
    const { data, error } = await supabase
      .from('dispatch_orders')
      .select(`
        *,
        lane:lanes!dispatch_orders_lane_id_fkey (
          id,
          name,
          distance,
          lane_stops (
            id,
            stop_order,
            stop_type,
            location:locations!lane_stops_location_id_fkey (
              id,
              name,
              code,
              city
            )
          )
        ),
        fleet_set:fleet_sets!dispatch_orders_fleet_set_id_fkey (
          id,
          vehicle:vehicles!fleet_sets_vehicle_id_fkey (
            id,
            plate,
            unit_code
          ),
          trailer:trailers!fleet_sets_trailer_id_fkey (
            id,
            plate,
            code
          ),
          driver:drivers!fleet_sets_driver_id_fkey (
            id,
            name
          )
        ),
        items:dispatch_order_items (
          id,
          item_name,
          quantity,
          unit,
          product:products!dispatch_order_items_product_id_fkey (
            id,
            name
          ),
          thermal_profile:thermal_profile!dispatch_order_items_thermal_profile_id_fkey (
            id,
            name,
            temp_min_c,
            temp_max_c
          )
        )
      `)
      .eq('carrier_id', carrierId)
      .eq('org_id', orgId)
      .in('stage', ['TENDERS', 'SCHEDULED'])
      .order('planned_start_at', { ascending: true });

    if (error) {
      console.error('Error fetching carrier orders:', error);
      throw error;
    }

    return (data || []) as unknown as CarrierOrder[];
  }

  /**
   * Get orders by category for carrier view
   * Filters by stage in ['TENDERS', 'SCHEDULED'] and substatus
   */
  async getCarrierOrdersByCategory(
    carrierId: number,
    orgId: string,
    category: CarrierOrderCategory
  ): Promise<CarrierOrder[]> {
    const substatuses = CARRIER_ORDER_STATUSES[category.toUpperCase() as keyof typeof CARRIER_ORDER_STATUSES];

    const { data, error } = await supabase
      .from('dispatch_orders')
      .select(`
        *,
        lane:lanes!dispatch_orders_lane_id_fkey (
          id,
          name,
          distance,
          lane_stops (
            id,
            stop_order,
            stop_type,
            location:locations!lane_stops_location_id_fkey (
              id,
              name,
              code,
              city
            )
          )
        ),
        fleet_set:fleet_sets!dispatch_orders_fleet_set_id_fkey (
          id,
          vehicle:vehicles!fleet_sets_vehicle_id_fkey (
            id,
            plate,
            unit_code
          ),
          trailer:trailers!fleet_sets_trailer_id_fkey (
            id,
            plate,
            code
          ),
          driver:drivers!fleet_sets_driver_id_fkey (
            id,
            name
          )
        ),
        items:dispatch_order_items (
          id,
          item_name,
          quantity,
          unit,
          product:products!dispatch_order_items_product_id_fkey (
            id,
            name
          ),
          thermal_profile:thermal_profile!dispatch_order_items_thermal_profile_id_fkey (
            id,
            name,
            temp_min_c,
            temp_max_c
          )
        )
      `)
      .eq('carrier_id', carrierId)
      .eq('org_id', orgId)
      .in('stage', ['TENDERS', 'SCHEDULED'])
      .in('substatus', substatuses)
      .order('planned_start_at', { ascending: true });

    if (error) {
      console.error('Error fetching carrier orders by category:', error);
      throw error;
    }

    return (data || []) as unknown as CarrierOrder[];
  }

  /**
   * Get rejected orders from history
   * Since rejected orders might be unassigned or assigned to others, we must query the history table.
   */
  async getCarrierRejectedOrders(
    carrierId: number,
    orgId: string
  ): Promise<CarrierOrder[]> {
    const { data, error } = await supabase
      .from('dispatch_order_carrier_history')
      .select(`
        id,
        outcome,
        outcome_reason,
        responded_at,
        dispatch_order:dispatch_orders!dispatch_order_carrier_history_dispatch_order_id_fkey (
          id,
          dispatch_number,
          status,
          planned_start_at,
          lane:lanes!dispatch_orders_lane_id_fkey (
            id,
            name
          ),
          items:dispatch_order_items (
            id
          )
        )
      `)
      .eq('carrier_id', carrierId)
      .eq('org_id', orgId)
      .eq('outcome', 'REJECTED')
      .order('responded_at', { ascending: false });

    if (error) {
      console.error('Error fetching carrier rejected orders:', error);
      throw error;
    }

    // Map history records to CarrierOrder shape for UI compatibility
    return (data || []).map((record: any) => ({
      id: record.dispatch_order?.id || record.id, // Use order ID (or history ID fallback)
      dispatch_number: record.dispatch_order?.dispatch_number || '---',
      // Force substatus to REJECTED so the badge shows correctly in the UI
      stage: 'TENDERS',
      substatus: 'REJECTED',
      lane: record.dispatch_order?.lane,
      planned_start_at: record.dispatch_order?.planned_start_at || record.responded_at,
      items: record.dispatch_order?.items || [],
      notes: record.outcome_reason, // Map reason to notes for display
      // Auxiliary fields to satisfy type (mostly unused in the card view)
      org_id: orgId,
      carrier_id: carrierId,
      created_at: record.responded_at,
    })) as unknown as CarrierOrder[];
  }

  /**
   * Accept an order (standard accept)
   */
  async acceptOrder(
    dispatchOrderId: string,
    acceptedBy: string
  ): Promise<CarrierOrder> {
    const { data, error } = await supabase.rpc('carrier_accept_dispatch_order', {
      p_dispatch_order_id: dispatchOrderId,
      p_accepted_by: acceptedBy,
    });

    if (error) {
      console.error('Error accepting order:', error);
      throw error;
    }

    return data as CarrierOrder;
  }

  /**
   * Accept an order with a different fleet set (Accept with Changes)
   */
  async acceptOrderWithChanges(
    dispatchOrderId: string,
    acceptedBy: string,
    newFleetSetId: string,
    reason?: string
  ): Promise<CarrierOrder> {
    // 1. Get Current Order's Fleet Set (Fleet A)
    const { data: currentOrder } = await supabase
      .from('dispatch_orders')
      .select('fleet_set_id')
      .eq('id', dispatchOrderId)
      .single();

    // 2. Find any Conflicting Pending Order (Order B) that holds New Fleet Set (Fleet B)
    const { data: conflictingOrders } = await supabase
      .from('dispatch_orders')
      .select('id')
      .eq('fleet_set_id', newFleetSetId)
      .eq('substatus', 'PENDING'); // Only swap with Pending orders

    // 3. Perform Swap: Assign Fleet A (or null) to Order B
    if (conflictingOrders && conflictingOrders.length > 0) {
      const oldFleetSetId = currentOrder?.fleet_set_id || null;
      for (const conflict of conflictingOrders) {
        // We update directly. If Fleet A is null, Order B becomes Unassigned.
        // If Fleet A is valid, Order B gets Fleet A.
        const { error: swapError } = await supabase
          .from('dispatch_orders')
          .update({ fleet_set_id: oldFleetSetId })
          .eq('id', conflict.id);

        if (swapError) {
          console.error("Error swapping fleet set:", swapError);
          // We proceed anyway? Or throw? Better to throw to prevent partial state.
          throw new Error("Failed to swap fleet set on conflicting order");
        }
      }
    }

    // 4. Proceed with original logic: Assign Fleet B to Order A and Accept
    const { data, error } = await supabase.rpc('carrier_accept_with_changes', {
      p_dispatch_order_id: dispatchOrderId,
      p_accepted_by: acceptedBy,
      p_new_fleet_set_id: newFleetSetId,
      p_reason: reason,
    });

    if (error) {
      console.error('Error accepting order with changes:', error);
      throw error;
    }

    return data as CarrierOrder;
  }

  /**
   * Get human readable label for a rejection code
   */
  getRejectionLabel(code: string): string {
    return REJECTION_REASON_LABELS[code] || code;
  }

  /**
   * Get rejection reasons
   * @param stage 'pre_acceptance' (default) or 'post_acceptance'
   */
  async getRejectionReasons(stage: 'pre_acceptance' | 'post_acceptance' = 'pre_acceptance'): Promise<RejectionReason[]> {
    // Return from local constant to ensure availability
    // We can filter specific codes for post_acceptance if needed in the future
    return Object.entries(REJECTION_REASON_LABELS).map(([code, label]) => ({
      code,
      label,
      stage,
      category: 'operational', // Default category
      is_active: true
    }));
  }

  /**
   * Reject an order
   */
  /**
   * Reject an order
   */
  async rejectOrder(
    dispatchOrderId: string,
    rejectedBy: string,
    reason?: string,
    orgId?: string,
    carrierId?: number
  ): Promise<CarrierOrder> {
    const { data, error } = await supabase.rpc('carrier_reject_dispatch_order', {
      p_dispatch_order_id: dispatchOrderId,
      p_rejected_by: rejectedBy,
      p_reason: reason,
    });

    if (error) {
      console.error('Error rejecting order:', error);
      throw error;
    }

    // Verify history creation and fix if missing
    if (orgId && carrierId) {
      try {
        // Check if a rejection record exists for this order/carrier created/updated recently
        const { data: history } = await supabase
          .from('dispatch_order_carrier_history')
          .select('id, outcome')
          .eq('dispatch_order_id', dispatchOrderId)
          .eq('carrier_id', carrierId)
          .eq('outcome', 'REJECTED')
          .eq('responded_by', rejectedBy)
          .order('responded_at', { ascending: false })
          .limit(1);

        if (!history || history.length === 0) {
          console.warn('Rejection history missing after RPC, inserting manually...');

          // Insert history record manually
          await supabase
            .from('dispatch_order_carrier_history')
            .insert({
              org_id: orgId,
              dispatch_order_id: dispatchOrderId,
              carrier_id: carrierId,
              outcome: 'REJECTED',
              outcome_reason: reason,
              assigned_by: rejectedBy, // Track who did it
              responded_by: rejectedBy,
              responded_at: new Date().toISOString(),
              counted_as: 'rejected',
              counted_at: new Date().toISOString()
            });
        }
      } catch (histError) {
        console.error('Error verifying/fixing rejection history:', histError);
        // Don't fail the operation if just history checking fails
      }
    }


    // Explicitly unassign the fleet set to ensure it disappears from the calendar
    // The RPC sets status to REJECTED but might not clear the fleet_set_id if business logic varies
    try {
      await supabase
        .from('dispatch_orders')
        .update({
          fleet_set_id: null,
          driver_id: null,
          vehicle_id: null,
          trailer_id: null,
          carrier_assigned_at: null // Optional: Clear assignment time
        })
        .eq('id', dispatchOrderId);

    } catch (cleanupError) {
      console.error('Error cleaning up rejected order assignment:', cleanupError);
      // Non-blocking
    }

    return data as CarrierOrder;
  }

  /**
   * Get order history for a specific dispatch order
   */
  async getOrderHistory(dispatchOrderId: string): Promise<CarrierOrderHistory[]> {
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
      .order('assigned_at', { ascending: false });

    if (error) {
      console.error('Error fetching order history:', error);
      throw error;
    }

    // Collect all user IDs to fetch
    const userIds = new Set<string>();
    data?.forEach(record => {
      if (record.assigned_by) userIds.add(record.assigned_by);
      if (record.responded_by) userIds.add(record.responded_by);
    });

    let usersMap = new Map<string, { first_name: string; last_name: string; email: string }>();

    if (userIds.size > 0) {
      const { data: usersData } = await supabase
        .from('organization_members')
        .select('user_id, first_name, last_name, email')
        .in('user_id', Array.from(userIds));

      usersData?.forEach(u => {
        if (u.user_id) {
          usersMap.set(u.user_id, { first_name: u.first_name, last_name: u.last_name, email: u.email });
        }
      });
    }

    // Enrich with fleet set details if there were changes
    const enrichedData = await Promise.all(
      (data || []).map(async (record) => {
        let previous_fleet_set = null;
        let new_fleet_set = null;

        if (record.previous_fleet_set_id) {
          const { data: prevFs } = await supabase
            .from('fleet_sets')
            .select(`
              id,
              vehicle:vehicles!fleet_sets_vehicle_id_fkey (plate, unit_code),
              driver:drivers!fleet_sets_driver_id_fkey (name)
            `)
            .eq('id', record.previous_fleet_set_id)
            .single();
          previous_fleet_set = prevFs;
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
            .single();
          new_fleet_set = newFs;
        }

        return {
          ...record,
          previous_fleet_set,
          new_fleet_set,
          assigned_user: record.assigned_by ? usersMap.get(record.assigned_by) : undefined,
          responded_user: record.responded_by ? usersMap.get(record.responded_by) : undefined,
        };
      })
    );

    return enrichedData as unknown as CarrierOrderHistory[];
  }

  /**
   * Get available fleet sets for a carrier
   */
  async getAvailableFleetSets(carrierId: number, orgId: string): Promise<FleetSetWithRelations[]> {
    const { data, error } = await supabase
      .from('fleet_sets')
      .select(`
        id,
        is_active,
        vehicle:vehicles!fleet_sets_vehicle_id_fkey (
          id,
          plate,
          unit_code,
          brand,
          model
        ),
        trailer:trailers!fleet_sets_trailer_id_fkey (
          id,
          plate,
          code
        ),
        driver:drivers!fleet_sets_driver_id_fkey (
          id,
          name,
          driver_id
        ),
        orders:dispatch_orders!dispatch_orders_fleet_set_id_fkey (
          id,
          substatus
        )
      `)
      .eq('carrier_id', carrierId)
      .eq('org_id', orgId)
      .eq('is_active', true)
      .is('ends_at', null);

    if (error) {
      console.error('Error fetching available fleet sets:', error);
      throw error;
    }

    return data as unknown as FleetSetWithRelations[];
  }

  /**
   * Subscribe to real-time updates for carrier orders
   */
  subscribeToCarrierOrders(
    carrierId: number,
    // orgId param removed primarily because it was unused
    orgId: string,
    onUpdate: (payload: { eventType: string; new: CarrierOrder | null; old: CarrierOrder | null }) => void
  ): () => void {
    // Unsubscribe from existing channel if any
    this.unsubscribe();

    this.realtimeChannel = supabase
      .channel(`carrier_orders_${carrierId}_${orgId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'dispatch_orders',
          filter: `carrier_id=eq.${carrierId},org_id=eq.${orgId}`,
        },
        (payload) => {
          onUpdate({
            eventType: payload.eventType,
            new: payload.new as CarrierOrder | null,
            old: payload.old as CarrierOrder | null,
          });
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'dispatch_order_carrier_history',
          filter: `carrier_id=eq.${carrierId},org_id=eq.${orgId}`,
        },
        (payload) => {
          // Carrier history changes might affect order state
          onUpdate({
            eventType: `history_${payload.eventType}`,
            new: payload.new as CarrierOrder | null,
            old: payload.old as CarrierOrder | null,
          });
        }
      )
      .subscribe();

    return () => this.unsubscribe();
  }

  /**
   * Unsubscribe from real-time updates
   */
  unsubscribe(): void {
    if (this.realtimeChannel) {
      supabase.removeChannel(this.realtimeChannel);
      this.realtimeChannel = null;
    }
  }

  /**
   * Get order counts by category for carrier
   */
  async getCarrierOrderCounts(
    carrierId: number,
    orgId: string
  ): Promise<{ solicitudes: number; compromisos: number; historial: number }> {
    const { data, error } = await supabase
      .from('dispatch_orders')
      .select('substatus')
      .eq('carrier_id', carrierId)
      .eq('org_id', orgId)
      .in('stage', ['TENDERS', 'SCHEDULED']);

    if (error) {
      console.error('Error fetching order counts:', error);
      throw error;
    }

    const orders = data || [];

    return {
      solicitudes: orders.filter(o =>
        CARRIER_ORDER_STATUSES.SOLICITUDES.includes(o.substatus)
      ).length,
      compromisos: orders.filter(o =>
        CARRIER_ORDER_STATUSES.COMPROMISOS.includes(o.substatus)
      ).length,
      historial: orders.filter(o =>
        CARRIER_ORDER_STATUSES.HISTORIAL.includes(o.substatus)
      ).length,
    };
  }

  /**
   * Calculate time remaining for order response (TTL)
   * Default: 24 hours before planned_start_at
   */
  calculateTimeRemaining(order: CarrierOrder): {
    hoursRemaining: number;
    isExpired: boolean;
    isUrgent: boolean;
  } {
    const now = new Date();

    let deadline: Date;
    if (order.response_deadline) {
      deadline = new Date(order.response_deadline);
    } else {
      // Fallback: 24h before planned_start_at
      const plannedStart = new Date(order.planned_start_at);
      deadline = new Date(plannedStart.getTime() - 24 * 60 * 60 * 1000);
    }

    const msRemaining = deadline.getTime() - now.getTime();
    const hoursRemaining = Math.max(0, msRemaining / (1000 * 60 * 60));

    return {
      hoursRemaining,
      isExpired: msRemaining <= 0,
      isUrgent: hoursRemaining > 0 && hoursRemaining <= 6, // Last 6 hours is urgent
    };
  }
}

export const ordersService = new OrdersService();
