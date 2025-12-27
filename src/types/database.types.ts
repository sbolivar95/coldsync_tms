// Database types generated from Supabase schema
// This file contains all TypeScript types for database tables

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

// ============= ENUMS =============

export type AccountStatus = 'ACTIVE' | 'PAST_DUE' | 'SUSPENDED' | 'CANCELED'
export type AssetOperationalStatus =
  | 'ACTIVE'
  | 'IN_SERVICE'
  | 'IN_MAINTENANCE'
  | 'OUT_OF_SERVICE'
  | 'RETIRED'
  | 'IN_TRANSIT'
export type AssignedType = 'VEHICLE' | 'TRAILER'
export type CarrierType = 'OWNER' | 'THIRD PARTY'
export type DispatchOrderStatus =
  | 'UNASSIGNED'
  | 'PENDING'
  | 'ASSIGNED'
  | 'REJECTED'
  | 'SCHEDULED'
  | 'AT_DESTINATION'
  | 'DISPATCHED'
  | 'CANCELED'
export type DriverStatus = 'AVAILABLE' | 'INACTIVE' | 'DRIVING'
export type ReeferPowerSupply = 'DIESEL' | 'ELECTRIC' | 'HYBRID'
export type StopTypes = 'PICKUP' | 'DELIVERY'
export type UserRole = 'OWNER' | 'ADMIN' | 'STAFF' | 'DRIVER' | 'DEV'

// ============= DATABASE INTERFACE (for Supabase client) =============
// Note: This is a placeholder. Supabase will use its own type inference.
// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface Database {}

// ============= TABLE TYPES =============

export interface Country {
  id: number
  name: string
  iso_code: string
  created_at?: string
}

export interface Organization {
  id: string
  comercial_name: string
  legal_name: string
  city?: string | null
  created_by: string
  base_country_id: number
  status: AccountStatus
  created_at?: string
}

export interface OrganizationMember {
  id: string
  org_id: string
  user_id: string
  role: UserRole
  created_at?: string
}

export interface PlatformUser {
  user_id: string
  role: string
  is_active: boolean
  created_at?: string
}

export interface OrgJoinCode {
  id: number
  org_id: string
  code: string
  role: UserRole
  expires_at: string
  used_at?: string | null
  used_by?: string | null
  created_by: string
  created_at?: string
}

export interface Carrier {
  id: number
  carrier_id: string
  commercial_name: string
  legal_name: string
  carrier_type: CarrierType
  tax_id: string
  legal_representative: string
  country: string
  city: string
  fiscal_address: string
  is_active: boolean
  contact_name: string
  contact_phone: string
  contact_email: string
  ops_phone_24_7: string
  finance_email: string
  contract_number?: string | null
  contract_expires_at?: string | null
  payment_terms: number
  currency?: string | null
  bank_name?: string | null
  bank_account_number?: string | null
  bank_cci_swift?: string | null
  org_id: string
  created_at?: string
  updated_at?: string
}

export interface Driver {
  id: number
  driver_id: string
  name: string
  license_number: string
  phone_number: string
  email: string
  birth_date: string
  nationality: number
  address: string
  city: string
  status: DriverStatus
  contract_date: string
  notes?: string | null
  org_id: string
  carrier_id?: number | null
  created_at?: string
  updated_at?: string
}

export interface Vehicle {
  id: string
  vehicle_code: string
  unit_code: string
  vehicle_type: string
  plate: string
  brand: string
  model: string
  year: number
  vin: string
  odometer_value: number
  odometer_unit: string
  additional_info: string
  connection_device_id?: string | null
  org_id: string
  operational_status: AssetOperationalStatus
  created_at?: string
  updated_at?: string
}

export interface Trailer {
  id: string
  code: string
  plate: string
  transport_capacity_weight_tn: number
  volume_m3: number
  tare_weight_tn: number
  length_m: number
  width_m: number
  height_m: number
  supports_multi_zone: boolean
  compartments: number
  insulation_thickness_cm?: number | null
  notes?: string | null
  connection_device_id?: string | null
  org_id: string
  operational_status: AssetOperationalStatus
  created_at?: string
  updated_at?: string
}

export interface TrailerReeferSpecs {
  id: number
  trailer_id: string
  power_type?: ReeferPowerSupply
  reefer_hours?: number | null
  diesel_capacity_l?: number | null
  consumption_lph?: number | null
  refrigeration_brand?: string | null
  model?: string | null
  model_year?: number | null
  temp_min_c?: number | null
  temp_max_c?: number | null
  org_id: string
  updated_at?: string
}

export interface FleetSet {
  id: string
  org_id: string
  carrier_id: number
  driver_id: number
  vehicle_id: string
  trailer_id: string
  starts_at: string
  ends_at?: string | null
  is_active: boolean
  notes?: string | null
  created_at?: string
  updated_at?: string
}

export interface TelematicsProvider {
  id: number
  name: string
  org_id: string
}

export interface HardwareDevice {
  id: number
  name: string
  org_id: string
  flespi_device_type_id: number
  created_at?: string
  update_up?: string
}

export interface ConnectionDevice {
  id: string
  provider?: number | null
  hardware?: number | null
  tracked_entity_type: AssignedType
  ident: string
  phone_number?: string | null
  serial?: string | null
  notes?: string | null
  org_id: string
  flespi_device_id?: number | null
}

export interface DeviceAssignmentsHistory {
  id: string
  connection_device_id?: string | null
  assigned_entity_type: string
  assigned_entity_id: string
  action: string
  performed_by?: string | null
  reason?: string | null
  metadata?: Json | null
  org_id: string
  created_at?: string
}

export interface LocationType {
  id: number
  name: string
  description?: string | null
  org_id: string
  created_at?: string
}

export interface Location {
  id: number
  type_location_id?: number | null
  name: string
  code: string
  address: string
  city: string
  geofence_type: 'polygon' | 'circular'
  geofence_data: Json
  num_docks: number
  is_active: boolean
  org_id: string
  created_at?: string
  updated_at?: string
}

export interface Product {
  id: number
  org_id: string
  name: string
  description?: string | null
  is_active: boolean
  created_at?: string
  updated_at?: string
}

export interface ThermalProfile {
  id: number
  org_id: string
  name: string
  description?: string | null
  temp_min_c: number
  temp_max_c: number
  is_active: boolean
  created_at?: string
  updated_at?: string
}

export interface ProductThermalProfile {
  id: number
  product_id: number
  thermal_profile_id: number
  org_id: string
}

export interface RouteType {
  id: number
  name: string
  org_id: string
}

export interface Route {
  id: string
  route_id: string
  name: string
  distance: number
  service_cycle?: number | null
  is_active: boolean
  base_rate: number
  km_rate?: number | null
  hourly_rate?: number | null
  loading_time?: number | null
  unloading_time?: number | null
  hoos_hour?: number | null
  refuel_time?: number | null
  operational_buffer?: number | null
  transit_time?: number | null
  org_id: string
  route_type_id?: number | null
}

export interface RouteStop {
  id: string
  route_id: string
  location_id: number
  stop_order: number
  notes?: string | null
  stop_type?: StopTypes | null
  org_id: string
}

export interface DispatchOrder {
  id: string
  org_id: string
  dispatch_number: string
  status: DispatchOrderStatus
  carrier_id?: number | null
  driver_id?: number | null
  vehicle_id?: string | null
  trailer_id?: string | null
  fleet_set_id?: string | null
  planned_start_at: string
  planned_end_at: string
  actual_start_at?: string | null
  actual_end_at?: string | null
  notes?: string | null
  created_by: string
  updated_by?: string | null
  created_at?: string
  updated_at?: string
}

export interface DispatchOrderItem {
  id: string
  org_id: string
  dispatch_order_id: string
  product_id: number
  item_name: string
  description?: string | null
  quantity: number
  unit: string
  notes?: string | null
  created_by: string
  updated_by?: string | null
  created_at?: string
  updated_at?: string
}

export interface DispatchOrderStop {
  id: string
  dispatch_order_id: string
  stop_order: number
  stop_type: StopTypes
  location_id: number
  notes?: string | null
  created_by: string
  updated_by?: string | null
  org_id: string
  created_at?: string
  updated_at?: string
}

export interface CarrierAllocationRule {
  id: string
  org_id: string
  carrier_id: number
  starts_on: string
  ends_on?: string | null
  target_orders: number
  reset_every_days: number
  carryover_enabled: boolean
  reject_rate_threshold: number
  is_active: boolean
  created_at?: string
  updated_at?: string
}

export interface CarrierAllocationPeriod {
  id: string
  rule_id: string
  org_id: string
  carrier_id: number
  period_start: string
  period_end: string
  target_orders: number
  carried_over: number
  dispatched_count: number
  rejected_count: number
}

// ============= INSERT TYPES (for creating new records) =============

export type CarrierInsert = Omit<Carrier, 'id' | 'created_at' | 'updated_at'>
export type DriverInsert = Omit<Driver, 'id' | 'created_at' | 'updated_at'>
export type VehicleInsert = Omit<Vehicle, 'created_at' | 'updated_at'>
export type TrailerInsert = Omit<Trailer, 'created_at' | 'updated_at'>
export type FleetSetInsert = Omit<FleetSet, 'created_at' | 'updated_at'>
export type LocationInsert = Omit<Location, 'id' | 'created_at' | 'updated_at'>
export type ProductInsert = Omit<Product, 'id' | 'created_at' | 'updated_at'>
export type ThermalProfileInsert = Omit<
  ThermalProfile,
  'id' | 'created_at' | 'updated_at'
>
export type RouteInsert = Omit<Route, 'created_at' | 'updated_at'>
export type DispatchOrderInsert = Omit<
  DispatchOrder,
  'created_at' | 'updated_at'
>
export type DispatchOrderItemInsert = Omit<
  DispatchOrderItem,
  'created_at' | 'updated_at'
>
export type DispatchOrderStopInsert = Omit<
  DispatchOrderStop,
  'created_at' | 'updated_at'
>

// ============= UPDATE TYPES (for updating records) =============

export type CarrierUpdate = Partial<Omit<Carrier, 'id' | 'created_at'>>
export type DriverUpdate = Partial<Omit<Driver, 'id' | 'created_at'>>
export type VehicleUpdate = Partial<Omit<Vehicle, 'id' | 'created_at'>>
export type TrailerUpdate = Partial<Omit<Trailer, 'id' | 'created_at'>>
export type FleetSetUpdate = Partial<Omit<FleetSet, 'id' | 'created_at'>>
export type LocationUpdate = Partial<Omit<Location, 'id' | 'created_at'>>
export type ProductUpdate = Partial<Omit<Product, 'id' | 'created_at'>>
export type ThermalProfileUpdate = Partial<
  Omit<ThermalProfile, 'id' | 'created_at'>
>
export type RouteUpdate = Partial<Omit<Route, 'id' | 'created_at'>>
export type DispatchOrderUpdate = Partial<
  Omit<DispatchOrder, 'id' | 'created_at'>
>

// ============= FLEET CANDIDATES TYPE (from SQL function) =============

export interface FleetCandidate {
  fleet_set_id: string
  carrier_id: number
  carrier_name: string
  driver_id: number
  driver_name: string
  vehicle_id: string
  vehicle_code: string
  vehicle_plate: string
  trailer_id: string
  trailer_code: string
  trailer_plate: string
  supports_multi_zone: boolean
  compartments: number
  reefer_temp_min_c?: number | null
  reefer_temp_max_c?: number | null
  temp_margin?: number | null
}
