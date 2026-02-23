import type { Database } from './database.types';

export type DispatchOrder = Database['public']['Tables']['dispatch_orders']['Row'] & { response_deadline?: string | null };
export type DispatchOrderInsert = Database['public']['Tables']['dispatch_orders']['Insert'] & { response_deadline?: string | null };
export type DispatchOrderUpdate = Database['public']['Tables']['dispatch_orders']['Update'] & { response_deadline?: string | null };

export type DispatchOrderItem = Database['public']['Tables']['dispatch_order_items']['Row'];
export type DispatchOrderItemInsert = Database['public']['Tables']['dispatch_order_items']['Insert'];

// State model types
export type DispatchOrderStage = Database['public']['Enums']['dispatch_order_stage'];
export type DispatchOrderSubstatus = Database['public']['Enums']['dispatch_order_substatus'];
export type DispatchOrderStateHistory = Database['public']['Tables']['dispatch_order_state_history']['Row'];
export type DispatchOrderStateHistoryInsert = Database['public']['Tables']['dispatch_order_state_history']['Insert'];

// Types that seem to be missing from the generated types or are custom
// Based on usage in dispatchOrders.service.ts

export interface DispatchOrderStopActual {
  id: string;
  dispatch_order_id: string;
  stop_id: string;
  arrival_time?: string;
  departure_time?: string;
  // Add other fields as necessary based on actual usage/table definition
}

export interface DispatchOrderStopActualInsert {
  dispatch_order_id: string;
  stop_id: string;
  arrival_time?: string;
  departure_time?: string;
}

// Result type for get_dispatch_order_fleet_candidates RPC
export interface FleetCandidate {
  fleet_set_id: string;
  score: number;
  match_score?: number;
  carrier_id?: number;
  carrier_name?: string;
  driver_id?: number;
  driver_name?: string;
  vehicle_id?: string;
  vehicle_code?: string;
  vehicle_plate?: string;
  vehicle_capacity_tn?: number;
  trailer_id?: string;
  trailer_code?: string;
  trailer_plate?: string;
  trailer_capacity_tn?: number;
  supports_multi_zone?: boolean;
  compartments?: number;
  reefer_temp_min_c?: number;
  reefer_temp_max_c?: number;
  orders?: Array<{ status: string }>;
}
