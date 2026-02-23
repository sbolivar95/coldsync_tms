-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.
-- All custom enums are listed below to reflect the database reality.

CREATE TYPE public.account_status AS ENUM ('ACTIVE', 'PAST_DUE', 'SUSPENDED', 'CANCELED', 'INACTIVE');
CREATE TYPE public.app_load_capacity_type AS ENUM ('PALLET', 'MEAT_HOOK', 'BASKET', 'BOX', 'BIN', 'BULK', 'OTHER');
CREATE TYPE public.asset_operational_status AS ENUM ('ACTIVE', 'IN_SERVICE', 'IN_MAINTENANCE', 'OUT_OF_SERVICE', 'RETIRED', 'IN_TRANSIT');
CREATE TYPE public.assigned_type AS ENUM ('VEHICLE', 'TRAILER');
CREATE TYPE public.canceled_by_type AS ENUM ('CARRIER', 'ORGANIZATION', 'SYSTEM');
CREATE TYPE public.carrier_assignment_outcome AS ENUM ('PENDING', 'ACCEPTED', 'REJECTED', 'CANCELED_BY_ORG', 'TIMEOUT', 'REASSIGNED', 'CANCELED_OBSERVED');
CREATE TYPE public.carrier_type AS ENUM ('OWNER', 'THIRD PARTY');
CREATE TYPE public.currency_code AS ENUM ('BOB', 'USD');
CREATE TYPE public.dispatch_order_stage AS ENUM ('DISPATCH', 'TENDERS', 'SCHEDULED', 'EXECUTION', 'CONCILIATION');
CREATE TYPE public.dispatch_order_status AS ENUM ('UNASSIGNED', 'PENDING', 'ASSIGNED', 'REJECTED', 'SCHEDULED', 'AT_DESTINATION', 'DISPATCHED', 'CANCELED', 'OBSERVANCE', 'COMPLETED');
CREATE TYPE public.dispatch_order_substatus AS ENUM ('NEW', 'UNASSIGNED', 'ASSIGNED', 'PENDING', 'ACCEPTED', 'REJECTED', 'EXPIRED', 'PROGRAMMED', 'DISPATCHED', 'EN_ROUTE_TO_ORIGIN', 'AT_ORIGIN', 'LOADING', 'OBSERVED', 'IN_TRANSIT', 'AT_DESTINATION', 'DELIVERED', 'PENDING_AUDIT', 'UNDER_REVIEW', 'DISPUTED', 'APPROVED', 'CLOSED', 'CANCELED');
CREATE TYPE public.driver_status AS ENUM ('AVAILABLE', 'INACTIVE', 'DRIVING');
CREATE TYPE public.observance_cause_type AS ENUM ('TEMPERATURE', 'CLEANLINESS', 'EQUIPMENT_FAILURE', 'DOCUMENTATION', 'OTHER');
CREATE TYPE public.observance_resolution_type AS ENUM ('FIXED', 'CANCELED', 'REJECTED');
CREATE TYPE public.plan_type AS ENUM ('STARTER', 'PROFESSIONAL');
CREATE TYPE public.reefer_owner_type AS ENUM ('TRAILER', 'VEHICLE');
CREATE TYPE public.reefer_power_supply AS ENUM ('DIESEL', 'ELECTRIC', 'HYBRID');
CREATE TYPE public.stop_types AS ENUM ('PICKUP', 'MANDATORY_WAYPOINT', 'OPTIONAL_WAYPOINT', 'DROP_OFF');
CREATE TYPE public.user_role AS ENUM ('OWNER', 'ADMIN', 'STAFF', 'DRIVER', 'DEV', 'CARRIER');


CREATE TABLE public.accessorial_charge_types (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL,
  code text NOT NULL,
  name text NOT NULL,
  description text,
  charge_type text NOT NULL DEFAULT 'FIXED'::text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT accessorial_charge_types_pkey PRIMARY KEY (id),
  CONSTRAINT accessorial_charge_types_org_id_fkey FOREIGN KEY (org_id) REFERENCES public.organizations(id)
);
CREATE TABLE public.cancellation_reasons (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL,
  code text NOT NULL,
  label text NOT NULL,
  category text,
  requires_comment boolean DEFAULT false,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT cancellation_reasons_pkey PRIMARY KEY (id),
  CONSTRAINT cancellation_reasons_org_id_id_uniq UNIQUE (org_id, id),
  CONSTRAINT cancellation_reasons_org_id_fkey FOREIGN KEY (org_id) REFERENCES public.organizations(id)
);
CREATE UNIQUE INDEX idx_cancellation_reasons_org_code_upper ON public.cancellation_reasons USING btree (org_id, upper(code));
CREATE TABLE public.carrier_allocation_periods (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  rule_id uuid NOT NULL,
  org_id uuid NOT NULL,
  carrier_id integer NOT NULL,
  period_start date NOT NULL,
  period_end date NOT NULL,
  target_orders integer NOT NULL,
  carried_over integer NOT NULL DEFAULT 0,
  dispatched_count integer NOT NULL DEFAULT 0,
  rejected_count integer NOT NULL DEFAULT 0,
  CONSTRAINT carrier_allocation_periods_pkey PRIMARY KEY (id),
  CONSTRAINT carrier_allocation_periods_rule_id_fkey FOREIGN KEY (rule_id) REFERENCES public.carrier_allocation_rules(id)
);
CREATE TABLE public.carrier_allocation_rules (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL,
  carrier_id integer NOT NULL,
  starts_on date NOT NULL,
  ends_on date,
  target_orders integer NOT NULL DEFAULT 0,
  reset_every_days integer NOT NULL DEFAULT 7 CHECK (reset_every_days > 0),
  carryover_enabled boolean NOT NULL DEFAULT true,
  reject_rate_threshold numeric NOT NULL DEFAULT 0.50,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  carrier_contract_id uuid,
  CONSTRAINT carrier_allocation_rules_pkey PRIMARY KEY (id),
  CONSTRAINT carrier_allocation_rules_carrier_id_fkey FOREIGN KEY (carrier_id) REFERENCES public.carriers(id),
  CONSTRAINT carrier_allocation_rules_org_id_fkey FOREIGN KEY (org_id) REFERENCES public.organizations(id),
  CONSTRAINT carrier_allocation_rules_carrier_contract_id_fkey FOREIGN KEY (carrier_contract_id) REFERENCES public.carrier_contracts(id)
);
CREATE TABLE public.carrier_contract_accessorials (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL,
  carrier_contract_id uuid NOT NULL,
  accessorial_charge_type_id uuid NOT NULL,
  value numeric NOT NULL,
  conditions jsonb,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT carrier_contract_accessorials_pkey PRIMARY KEY (id),
  CONSTRAINT carrier_contract_accessorials_org_id_fkey FOREIGN KEY (org_id) REFERENCES public.organizations(id),
  CONSTRAINT carrier_contract_accessorials_carrier_contract_id_fkey FOREIGN KEY (carrier_contract_id) REFERENCES public.carrier_contracts(id),
  CONSTRAINT carrier_contract_accessorials_accessorial_charge_type_id_fkey FOREIGN KEY (accessorial_charge_type_id) REFERENCES public.accessorial_charge_types(id)
);
CREATE TABLE public.carrier_contracts (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL,
  carrier_id integer NOT NULL,
  contract_number text NOT NULL,
  contract_name text,
  valid_from date NOT NULL,
  valid_to date,
  payment_terms integer NOT NULL,
  currency text NOT NULL DEFAULT 'USD'::text,
  min_commitment_type text,
  min_commitment_value numeric,
  status text NOT NULL DEFAULT 'ACTIVE'::text,
  notes text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT carrier_contracts_pkey PRIMARY KEY (id),
  CONSTRAINT carrier_contracts_org_id_fkey FOREIGN KEY (org_id) REFERENCES public.organizations(id),
  CONSTRAINT carrier_contracts_carrier_id_fkey FOREIGN KEY (carrier_id) REFERENCES public.carriers(id)
);
CREATE TABLE public.carriers (
  id integer NOT NULL DEFAULT nextval('carriers_id_seq'::regclass),
  carrier_id text NOT NULL,
  commercial_name text NOT NULL,
  legal_name text NOT NULL,
  carrier_type public.carrier_type NOT NULL DEFAULT 'THIRD PARTY'::public.carrier_type,
  tax_id text NOT NULL,
  legal_representative text NOT NULL,
  country text NOT NULL,
  city text NOT NULL,
  fiscal_address text NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  contact_name text NOT NULL,
  contact_phone text NOT NULL,
  contact_email text NOT NULL,
  ops_phone_24_7 text NOT NULL,
  finance_email text NOT NULL,
  contract_number text,
  contract_expires_at date,
  payment_terms integer NOT NULL,
  currency text,
  bank_name text,
  bank_account_number text,
  bank_cci_swift text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  org_id uuid NOT NULL,
  CONSTRAINT carriers_pkey PRIMARY KEY (id),
  CONSTRAINT carriers_org_id_fkey FOREIGN KEY (org_id) REFERENCES public.organizations(id)
);
CREATE TABLE public.connection_device (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  provider integer,
  tracked_entity_type public.assigned_type DEFAULT 'TRAILER'::public.assigned_type,
  ident text NOT NULL UNIQUE,
  phone_number text UNIQUE,
  serial text UNIQUE,
  notes text,
  org_id uuid NOT NULL,
  flespi_device_id bigint UNIQUE,
  carrier_id integer NOT NULL,
  flespi_device_type_id integer,
  has_can boolean DEFAULT false,
  temp_mode text DEFAULT 'NONE'::text CHECK (temp_mode = ANY (ARRAY['NONE'::text, 'REEFER'::text, 'AMBIENT'::text])),
  CONSTRAINT connection_device_pkey PRIMARY KEY (id),
  CONSTRAINT connection_device_carrier_id_fkey FOREIGN KEY (carrier_id) REFERENCES public.carriers(id),
  CONSTRAINT connection_device_provider_fkey FOREIGN KEY (provider) REFERENCES public.telematics_provider(id),
  CONSTRAINT connection_device_org_id_fkey FOREIGN KEY (org_id) REFERENCES public.organizations(id),
  CONSTRAINT connection_device_flespi_device_type_id_fkey FOREIGN KEY (flespi_device_type_id) REFERENCES public.flespi_device_types(id)
);
CREATE TABLE public.countries (
  id bigint NOT NULL DEFAULT nextval('countries_id_seq'::regclass),
  name text NOT NULL UNIQUE,
  created_at timestamp with time zone DEFAULT now(),
  iso_code text NOT NULL UNIQUE,
  CONSTRAINT countries_pkey PRIMARY KEY (id)
);
CREATE TABLE public.device_assignments_history (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  connection_device_id uuid,
  assigned_entity_type text NOT NULL,
  assigned_entity_id uuid NOT NULL,
  action text NOT NULL,
  performed_by uuid,
  reason text,
  metadata jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  org_id uuid NOT NULL,
  CONSTRAINT device_assignments_history_pkey PRIMARY KEY (id),
  CONSTRAINT device_assignments_history_connection_device_fkey FOREIGN KEY (connection_device_id) REFERENCES public.connection_device(id),
  CONSTRAINT device_assignments_history_org_id_fkey FOREIGN KEY (org_id) REFERENCES public.organizations(id)
);
CREATE TABLE public.dispatch_order_carrier_history (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL,
  dispatch_order_id uuid NOT NULL,
  carrier_id integer NOT NULL,
  assigned_at timestamp with time zone NOT NULL DEFAULT now(),
  assigned_by uuid,
  responded_at timestamp with time zone,
  responded_by uuid,
  outcome public.carrier_assignment_outcome NOT NULL DEFAULT 'PENDING'::public.carrier_assignment_outcome,
  outcome_reason text,
  allocation_period_id uuid,
  counted_as text CHECK (counted_as = ANY (ARRAY['dispatched'::text, 'rejected'::text, NULL::text])),
  counted_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  previous_fleet_set_id uuid,
  new_fleet_set_id uuid,
  CONSTRAINT dispatch_order_carrier_history_pkey PRIMARY KEY (id),
  CONSTRAINT dispatch_order_carrier_history_org_id_fkey FOREIGN KEY (org_id) REFERENCES public.organizations(id),
  CONSTRAINT dispatch_order_carrier_history_dispatch_order_id_fkey FOREIGN KEY (dispatch_order_id) REFERENCES public.dispatch_orders(id),
  CONSTRAINT dispatch_order_carrier_history_carrier_id_fkey FOREIGN KEY (carrier_id) REFERENCES public.carriers(id),
  CONSTRAINT dispatch_order_carrier_history_assigned_by_fkey FOREIGN KEY (assigned_by) REFERENCES auth.users(id),
  CONSTRAINT dispatch_order_carrier_history_responded_by_fkey FOREIGN KEY (responded_by) REFERENCES auth.users(id),
  CONSTRAINT dispatch_order_carrier_history_allocation_period_id_fkey FOREIGN KEY (allocation_period_id) REFERENCES public.carrier_allocation_periods(id),
  CONSTRAINT dispatch_order_carrier_history_previous_fleet_set_id_fkey FOREIGN KEY (previous_fleet_set_id) REFERENCES public.fleet_sets(id),
  CONSTRAINT dispatch_order_carrier_history_new_fleet_set_id_fkey FOREIGN KEY (new_fleet_set_id) REFERENCES public.fleet_sets(id)
);
CREATE TABLE public.dispatch_order_costs (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL,
  dispatch_order_id uuid NOT NULL UNIQUE,
  rate_card_id uuid,
  base_cost numeric NOT NULL,
  calculation_details jsonb,
  fuel_surcharge numeric DEFAULT 0,
  service_surcharge numeric DEFAULT 0,
  additional_charges numeric DEFAULT 0,
  modifiers_applied jsonb,
  penalties_applied jsonb,
  total_penalties numeric DEFAULT 0,
  subtotal numeric NOT NULL,
  total_cost numeric NOT NULL CHECK (total_cost >= 0::numeric),
  calculated_at timestamp with time zone DEFAULT now(),
  calculated_by uuid,
  recalculated_at timestamp with time zone,
  status text NOT NULL DEFAULT 'DRAFT'::text,
  invoice_number text,
  invoiced_at timestamp with time zone,
  paid_at timestamp with time zone,
  notes text,
  CONSTRAINT dispatch_order_costs_pkey PRIMARY KEY (id),
  CONSTRAINT dispatch_order_costs_org_id_fkey FOREIGN KEY (org_id) REFERENCES public.organizations(id),
  CONSTRAINT dispatch_order_costs_dispatch_order_id_fkey FOREIGN KEY (dispatch_order_id) REFERENCES public.dispatch_orders(id),
  CONSTRAINT dispatch_order_costs_rate_card_id_fkey FOREIGN KEY (rate_card_id) REFERENCES public.rate_cards(id),
  CONSTRAINT dispatch_order_costs_calculated_by_fkey FOREIGN KEY (calculated_by) REFERENCES auth.users(id)
);
CREATE TABLE public.dispatch_order_items (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL,
  dispatch_order_id uuid NOT NULL,
  product_id bigint NOT NULL,
  item_name text NOT NULL,
  description text,
  quantity numeric NOT NULL CHECK (quantity > 0::numeric),
  unit text NOT NULL,
  notes text,
  created_by uuid NOT NULL,
  updated_by uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone,
  thermal_profile_id bigint,
  CONSTRAINT dispatch_order_items_pkey PRIMARY KEY (id),
  CONSTRAINT dispatch_order_items_org_id_fkey FOREIGN KEY (org_id) REFERENCES public.organizations(id),
  CONSTRAINT dispatch_order_items_dispatch_order_id_fkey FOREIGN KEY (dispatch_order_id) REFERENCES public.dispatch_orders(id),
  CONSTRAINT dispatch_order_items_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id),
  CONSTRAINT dispatch_order_items_thermal_profile_id_fkey FOREIGN KEY (thermal_profile_id) REFERENCES public.thermal_profile(id)
);
CREATE TABLE public.dispatch_order_observance_history (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL,
  dispatch_order_id uuid NOT NULL,
  carrier_id integer NOT NULL,
  observance_number integer NOT NULL,
  cause public.observance_cause_type NOT NULL,
  reason text,
  observed_at timestamp with time zone NOT NULL DEFAULT now(),
  observed_by uuid,
  resolution public.observance_resolution_type,
  resolution_notes text,
  resolved_at timestamp with time zone,
  resolved_by uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  penalty_rule_applied uuid,
  penalty_amount numeric,
  duration_hours numeric,
  temp_deviation_c numeric,
  temp_duration_hours numeric,
  CONSTRAINT dispatch_order_observance_history_pkey PRIMARY KEY (id),
  CONSTRAINT dispatch_order_observance_history_org_id_fkey FOREIGN KEY (org_id) REFERENCES public.organizations(id),
  CONSTRAINT dispatch_order_observance_history_dispatch_order_id_fkey FOREIGN KEY (dispatch_order_id) REFERENCES public.dispatch_orders(id),
  CONSTRAINT dispatch_order_observance_history_carrier_id_fkey FOREIGN KEY (carrier_id) REFERENCES public.carriers(id),
  CONSTRAINT dispatch_order_observance_history_observed_by_fkey FOREIGN KEY (observed_by) REFERENCES auth.users(id),
  CONSTRAINT dispatch_order_observance_history_resolved_by_fkey FOREIGN KEY (resolved_by) REFERENCES auth.users(id),
  CONSTRAINT dispatch_order_observance_history_penalty_rule_applied_fkey FOREIGN KEY (penalty_rule_applied) REFERENCES public.penalty_rules(id)
);
CREATE TABLE public.dispatch_order_state_history (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  dispatch_order_id uuid NOT NULL,
  from_stage public.dispatch_order_stage,
  from_substatus public.dispatch_order_substatus,
  to_stage public.dispatch_order_stage NOT NULL,
  to_substatus public.dispatch_order_substatus NOT NULL,
  changed_by uuid,
  changed_at timestamp with time zone NOT NULL DEFAULT now(),
  trigger_type text NOT NULL DEFAULT 'USER'::text,
  reason text,
  notes text,
  metadata jsonb,
  org_id uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT dispatch_order_state_history_pkey PRIMARY KEY (id),
  CONSTRAINT dispatch_order_state_history_dispatch_order_id_fkey FOREIGN KEY (dispatch_order_id) REFERENCES public.dispatch_orders(id),
  CONSTRAINT dispatch_order_state_history_changed_by_fkey FOREIGN KEY (changed_by) REFERENCES auth.users(id),
  CONSTRAINT dispatch_order_state_history_org_id_fkey FOREIGN KEY (org_id) REFERENCES public.organizations(id)
);
CREATE TABLE public.dispatch_order_stop_actuals (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL,
  dispatch_order_id uuid NOT NULL,
  lane_stop_id uuid NOT NULL,
  actual_arrival_at timestamp with time zone,
  actual_departure_at timestamp with time zone,
  notes text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone,
  CONSTRAINT dispatch_order_stop_actuals_pkey PRIMARY KEY (id),
  CONSTRAINT dispatch_order_stop_actuals_lane_stop_id_fkey FOREIGN KEY (lane_stop_id) REFERENCES public.lane_stops(id),
  CONSTRAINT dispatch_order_stop_actuals_org_id_fkey FOREIGN KEY (org_id) REFERENCES public.organizations(id),
  CONSTRAINT dispatch_order_stop_actuals_dispatch_order_id_fkey FOREIGN KEY (dispatch_order_id) REFERENCES public.dispatch_orders(id)
);
CREATE TABLE public.dispatch_orders (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL,
  dispatch_number text NOT NULL,
  carrier_id integer,
  driver_id integer,
  vehicle_id uuid,
  trailer_id uuid,
  planned_start_at timestamp with time zone NOT NULL,
  planned_end_at timestamp with time zone NOT NULL,
  actual_start_at timestamp with time zone,
  actual_end_at timestamp with time zone,
  notes text,
  created_by uuid NOT NULL,
  updated_by uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone,
  fleet_set_id uuid,
  carrier_assigned_at timestamp with time zone,
  allocation_period_id uuid,
  observance_count integer NOT NULL DEFAULT 0,
  pickup_window_start time without time zone,
  pickup_window_end time without time zone,
  lane_id uuid,
  carrier_contract_id uuid,
  rate_card_id uuid,
  response_deadline timestamp with time zone,
  stage public.dispatch_order_stage NOT NULL DEFAULT 'DISPATCH'::public.dispatch_order_stage,
  substatus public.dispatch_order_substatus NOT NULL DEFAULT 'NEW'::public.dispatch_order_substatus,
  cancellation_reason_id uuid,
  CONSTRAINT dispatch_orders_pkey PRIMARY KEY (id),
  CONSTRAINT dispatch_orders_fleet_set_id_fkey FOREIGN KEY (fleet_set_id) REFERENCES public.fleet_sets(id),
  CONSTRAINT dispatch_orders_lane_id_fkey FOREIGN KEY (lane_id) REFERENCES public.lanes(id),
  CONSTRAINT dispatch_orders_org_id_fkey FOREIGN KEY (org_id) REFERENCES public.organizations(id),
  CONSTRAINT dispatch_orders_allocation_period_id_fkey FOREIGN KEY (allocation_period_id) REFERENCES public.carrier_allocation_periods(id),
  CONSTRAINT dispatch_orders_cancellation_reason_fk FOREIGN KEY (org_id, cancellation_reason_id) REFERENCES public.cancellation_reasons(org_id, id) ON UPDATE RESTRICT ON DELETE RESTRICT,
  CONSTRAINT dispatch_orders_cancellation_reason_required_chk CHECK (
    substatus <> 'CANCELED'::dispatch_order_substatus
    OR (
      cancellation_reason_id IS NOT NULL
      AND stage IN (
        'DISPATCH'::dispatch_order_stage,
        'TENDERS'::dispatch_order_stage,
        'SCHEDULED'::dispatch_order_stage
      )
    )
  )
);
CREATE INDEX idx_dispatch_orders_org_stage_substatus ON public.dispatch_orders USING btree (org_id, stage, substatus);
CREATE INDEX idx_dispatch_orders_cancellation_reason_id ON public.dispatch_orders USING btree (cancellation_reason_id);
CREATE TABLE public.drivers (
  id integer NOT NULL DEFAULT nextval('drivers_id_seq'::regclass),
  driver_id text NOT NULL,
  name text NOT NULL,
  license_number text NOT NULL,
  phone_number text NOT NULL,
  email text,
  birth_date date NOT NULL,
  nationality bigint NOT NULL,
  address text NOT NULL,
  city text NOT NULL,
  status public.driver_status NOT NULL DEFAULT 'AVAILABLE'::public.driver_status,
  contract_date date NOT NULL,
  notes text,
  org_id uuid NOT NULL,
  carrier_id integer NOT NULL,
  user_id uuid,
  CONSTRAINT drivers_pkey PRIMARY KEY (id),
  CONSTRAINT drivers_org_id_fkey FOREIGN KEY (org_id) REFERENCES public.organizations(id),
  CONSTRAINT drivers_carrier_id_fkey FOREIGN KEY (carrier_id) REFERENCES public.carriers(id),
  CONSTRAINT drivers_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id),
  CONSTRAINT drivers_nationality_fkey FOREIGN KEY (nationality) REFERENCES public.countries(id)
);
CREATE TABLE public.fleet_sets (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL,
  carrier_id integer NOT NULL,
  driver_id integer,
  vehicle_id uuid NOT NULL,
  trailer_id uuid,
  starts_at timestamp with time zone NOT NULL DEFAULT now(),
  ends_at timestamp with time zone,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT fleet_sets_pkey PRIMARY KEY (id),
  CONSTRAINT fleet_sets_org_id_fkey FOREIGN KEY (org_id) REFERENCES public.organizations(id),
  CONSTRAINT fleet_sets_carrier_id_fkey FOREIGN KEY (carrier_id) REFERENCES public.carriers(id),
  CONSTRAINT fleet_sets_driver_id_fkey FOREIGN KEY (driver_id) REFERENCES public.drivers(id),
  CONSTRAINT fleet_sets_vehicle_id_fkey FOREIGN KEY (vehicle_id) REFERENCES public.vehicles(id),
  CONSTRAINT fleet_sets_trailer_id_fkey FOREIGN KEY (trailer_id) REFERENCES public.trailers(id)
);
CREATE TABLE public.flespi_device_types (
  id integer NOT NULL,
  name text NOT NULL,
  protocol_id integer NOT NULL,
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT flespi_device_types_pkey PRIMARY KEY (id),
  CONSTRAINT flespi_device_types_protocol_id_fkey FOREIGN KEY (protocol_id) REFERENCES public.flespi_protocols(id)
);
CREATE TABLE public.flespi_protocols (
  id integer NOT NULL,
  name text NOT NULL,
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT flespi_protocols_pkey PRIMARY KEY (id)
);
CREATE TABLE public.lane_stops (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  lane_id uuid NOT NULL,
  location_id bigint NOT NULL,
  stop_order integer NOT NULL,
  notes text,
  stop_type public.stop_types,
  org_id uuid NOT NULL,
  estimated_duration numeric DEFAULT 0,
  CONSTRAINT lane_stops_pkey PRIMARY KEY (id),
  CONSTRAINT lane_stops_org_id_fkey FOREIGN KEY (org_id) REFERENCES public.organizations(id),
  CONSTRAINT lane_stops_lane_id_fkey FOREIGN KEY (lane_id) REFERENCES public.lanes(id),
  CONSTRAINT lane_stops_location_id_fkey FOREIGN KEY (location_id) REFERENCES public.locations(id)
);
CREATE TABLE public.lane_types (
  id integer NOT NULL DEFAULT nextval('lane_types_id_seq'::regclass),
  name text NOT NULL,
  org_id uuid NOT NULL,
  description text,
  is_active boolean NOT NULL DEFAULT true,
  CONSTRAINT lane_types_pkey PRIMARY KEY (id),
  CONSTRAINT lane_types_org_id_fkey FOREIGN KEY (org_id) REFERENCES public.organizations(id)
);
CREATE TABLE public.lanes (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  lane_id text NOT NULL UNIQUE,
  name text NOT NULL,
  distance numeric NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  org_id uuid NOT NULL,
  lane_type_id integer,
  transit_time numeric,
  operational_buffer numeric,
  currency public.currency_code NOT NULL DEFAULT 'USD'::public.currency_code,
  supersedes_lane_id uuid,
  CONSTRAINT lanes_pkey PRIMARY KEY (id),
  CONSTRAINT lanes_org_id_fkey FOREIGN KEY (org_id) REFERENCES public.organizations(id),
  CONSTRAINT lanes_lane_type_id_fkey FOREIGN KEY (lane_type_id) REFERENCES public.lane_types(id),
  CONSTRAINT lanes_supersedes_lane_id_fkey FOREIGN KEY (supersedes_lane_id) REFERENCES public.lanes(id)
);
CREATE TABLE public.load_capacity_types (
  id integer NOT NULL DEFAULT nextval('load_capacity_types_id_seq'::regclass),
  code text NOT NULL UNIQUE,
  name text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT load_capacity_types_pkey PRIMARY KEY (id)
);
CREATE TABLE public.location_types (
  id bigint NOT NULL DEFAULT nextval('type_location_id_seq'::regclass),
  name text NOT NULL,
  description text,
  created_at timestamp with time zone DEFAULT now(),
  org_id uuid NOT NULL,
  allowed_stop_types ARRAY DEFAULT '{MANDATORY_WAYPOINT,OPTIONAL_WAYPOINT,PICKUP,DROP_OFF}'::stop_types[],
  CONSTRAINT location_types_pkey PRIMARY KEY (id),
  CONSTRAINT type_location_org_id_fkey FOREIGN KEY (org_id) REFERENCES public.organizations(id)
);
CREATE TABLE public.locations (
  id bigint NOT NULL DEFAULT nextval('locations_id_seq'::regclass),
  type_location_id bigint,
  name character varying NOT NULL,
  address text NOT NULL,
  geofence_type text NOT NULL CHECK (geofence_type = ANY (ARRAY['polygon'::text, 'circular'::text])),
  geofence_data jsonb NOT NULL,
  num_docks bigint NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  code character varying NOT NULL,
  org_id uuid NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  city text NOT NULL,
  country_id integer NOT NULL,
  default_dwell_time_hours numeric DEFAULT 0,
  CONSTRAINT locations_pkey PRIMARY KEY (id),
  CONSTRAINT locations_type_location_id_fkey FOREIGN KEY (type_location_id) REFERENCES public.location_types(id),
  CONSTRAINT locations_org_id_fkey FOREIGN KEY (org_id) REFERENCES public.organizations(id),
  CONSTRAINT locations_country_id_fkey FOREIGN KEY (country_id) REFERENCES public.countries(id)
);
CREATE TABLE public.organization_members (
  org_id uuid NOT NULL,
  user_id uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  role public.user_role NOT NULL DEFAULT 'ADMIN'::public.user_role,
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  first_name text NOT NULL DEFAULT 'Unknown'::text,
  email text NOT NULL DEFAULT 'Unknown'::text,
  phone text,
  last_name text NOT NULL DEFAULT '''Unknown''::text'::text,
  is_active boolean NOT NULL DEFAULT true,
  status text NOT NULL DEFAULT 'active'::text,
  is_carrier_member boolean NOT NULL DEFAULT false,
  carrier_id integer,
  driver_id integer,
  CONSTRAINT organization_members_pkey PRIMARY KEY (id),
  CONSTRAINT organization_members_carrier_id_fkey FOREIGN KEY (carrier_id) REFERENCES public.carriers(id),
  CONSTRAINT organization_members_driver_id_fkey FOREIGN KEY (driver_id) REFERENCES public.drivers(id),
  CONSTRAINT organization_members_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id),
  CONSTRAINT account_users_account_id_fkey FOREIGN KEY (org_id) REFERENCES public.organizations(id)
);
CREATE TABLE public.organization_severities (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL,
  code text NOT NULL,
  name text NOT NULL,
  description text,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT organization_severities_pkey PRIMARY KEY (id),
  CONSTRAINT organization_severities_org_id_fkey FOREIGN KEY (org_id) REFERENCES public.organizations(id)
);
CREATE TABLE public.organization_transport_contexts (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL,
  code text NOT NULL,
  name text NOT NULL,
  description text,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT organization_transport_contexts_pkey PRIMARY KEY (id),
  CONSTRAINT organization_transport_contexts_org_id_fkey FOREIGN KEY (org_id) REFERENCES public.organizations(id)
);
CREATE TABLE public.organizations (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  comercial_name text NOT NULL,
  legal_name text NOT NULL UNIQUE,
  city text,
  created_by uuid NOT NULL,
  status public.account_status NOT NULL DEFAULT 'ACTIVE'::public.account_status,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone,
  base_country_id bigint NOT NULL,
  tax_id text,
  fiscal_address text,
  billing_email text,
  currency public.currency_code DEFAULT 'USD'::public.currency_code,
  time_zone text DEFAULT 'America/La_Paz'::text,
  contact_name text,
  contact_phone text,
  contact_email text,
  plan_type public.plan_type DEFAULT 'PROFESSIONAL'::public.plan_type,
  CONSTRAINT organizations_pkey PRIMARY KEY (id),
  CONSTRAINT organizations_base_country_id_fkey FOREIGN KEY (base_country_id) REFERENCES public.countries(id),
  CONSTRAINT organizations_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id)
);
CREATE TABLE public.penalty_rules (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL,
  carrier_contract_id uuid,
  rule_type text NOT NULL,
  condition_description text NOT NULL,
  penalty_type text NOT NULL,
  penalty_value numeric,
  duration_min_hours numeric,
  duration_max_hours numeric,
  temp_min_c numeric,
  temp_max_c numeric,
  temp_duration_min_hours numeric,
  temp_duration_max_hours numeric,
  applies_to_routes ARRAY,
  is_active boolean DEFAULT true,
  priority integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT penalty_rules_pkey PRIMARY KEY (id),
  CONSTRAINT penalty_rules_org_id_fkey FOREIGN KEY (org_id) REFERENCES public.organizations(id),
  CONSTRAINT penalty_rules_carrier_contract_id_fkey FOREIGN KEY (carrier_contract_id) REFERENCES public.carrier_contracts(id)
);
CREATE TABLE public.platform_users (
  user_id uuid NOT NULL,
  role character varying NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT platform_users_pkey PRIMARY KEY (user_id),
  CONSTRAINT platform_users_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);
CREATE TABLE public.product_thermal_profiles (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  product_id bigint NOT NULL,
  thermal_profile_id bigint NOT NULL,
  org_id uuid NOT NULL,
  CONSTRAINT product_thermal_profiles_pkey PRIMARY KEY (id),
  CONSTRAINT products_thermal_profile_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id),
  CONSTRAINT products_thermal_profile_thermal_profile_id_fkey FOREIGN KEY (thermal_profile_id) REFERENCES public.thermal_profile(id),
  CONSTRAINT product_thermal_profiles_org_id_fkey FOREIGN KEY (org_id) REFERENCES public.organizations(id)
);
CREATE TABLE public.products (
  id bigint NOT NULL DEFAULT nextval('products_id_seq'::regclass),
  org_id uuid NOT NULL,
  name text NOT NULL,
  description text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  is_active boolean NOT NULL DEFAULT true,
  CONSTRAINT products_pkey PRIMARY KEY (id),
  CONSTRAINT products_org_id_fkey FOREIGN KEY (org_id) REFERENCES public.organizations(id)
);
CREATE TABLE public.rate_card_charges (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  rate_card_id uuid NOT NULL,
  charge_type text NOT NULL CHECK (charge_type = ANY (ARRAY['BASE'::text, 'FREIGHT'::text, 'DISTANCE'::text, 'DISTANCE_WEIGHT'::text, 'TIME'::text, 'FUEL'::text, 'REEFER'::text, 'STOP'::text, 'HANDLING'::text, 'DETENTION'::text, 'CUSTOM'::text])),
  rate_basis text NOT NULL CHECK (rate_basis = ANY (ARRAY['FLAT'::text, 'PER_TN'::text, 'PER_KM'::text, 'PER_TN_KM'::text, 'PER_HOUR'::text, 'PER_STOP'::text, 'PERCENTAGE'::text])),
  value numeric NOT NULL,
  label text,
  sort_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  apply_before_pct boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  weight_source text NOT NULL DEFAULT 'ACTUAL'::text CHECK (weight_source = ANY (ARRAY['ACTUAL'::text, 'TRUCK_CAPACITY'::text])),
  CONSTRAINT rate_card_charges_pkey PRIMARY KEY (id),
  CONSTRAINT rate_card_charges_rate_card_id_fkey FOREIGN KEY (rate_card_id) REFERENCES public.rate_cards(id)
);
CREATE TABLE public.rate_card_thermal_modifiers (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  rate_card_id uuid NOT NULL,
  thermal_profile_id bigint NOT NULL,
  modifier_type text NOT NULL CHECK (modifier_type = ANY (ARRAY['MULTIPLIER'::text, 'FIXED_ADD'::text])),
  value numeric NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT rate_card_thermal_modifiers_pkey PRIMARY KEY (id),
  CONSTRAINT rate_card_thermal_modifiers_rate_card_id_fkey FOREIGN KEY (rate_card_id) REFERENCES public.rate_cards(id),
  CONSTRAINT rate_card_thermal_modifiers_thermal_profile_id_fkey FOREIGN KEY (thermal_profile_id) REFERENCES public.thermal_profile(id)
);
CREATE TABLE public.rate_cards (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL,
  carrier_contract_id uuid NOT NULL,
  lane_id uuid NOT NULL,
  thermal_profile_id bigint,
  base_value numeric NOT NULL CHECK (base_value > 0::numeric),
  valid_from date NOT NULL,
  valid_to date,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  carrier_id integer,
  name text,
  CONSTRAINT rate_cards_pkey PRIMARY KEY (id),
  CONSTRAINT rate_cards_org_id_fkey FOREIGN KEY (org_id) REFERENCES public.organizations(id),
  CONSTRAINT rate_cards_carrier_contract_id_fkey FOREIGN KEY (carrier_contract_id) REFERENCES public.carrier_contracts(id),
  CONSTRAINT rate_cards_thermal_profile_id_fkey FOREIGN KEY (thermal_profile_id) REFERENCES public.thermal_profile(id),
  CONSTRAINT rate_cards_lane_id_fkey FOREIGN KEY (lane_id) REFERENCES public.lanes(id),
  CONSTRAINT rate_cards_carrier_id_fkey FOREIGN KEY (carrier_id) REFERENCES public.carriers(id)
);
CREATE TABLE public.rate_charge_breaks (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  charge_id uuid NOT NULL,
  min_value numeric NOT NULL,
  max_value numeric,
  rate_value numeric NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT rate_charge_breaks_pkey PRIMARY KEY (id),
  CONSTRAINT rate_charge_breaks_charge_id_fkey FOREIGN KEY (charge_id) REFERENCES public.rate_card_charges(id)
);
CREATE TABLE public.reefer_equipments (
  id integer GENERATED ALWAYS AS IDENTITY NOT NULL,
  org_id uuid NOT NULL,
  brand character varying,
  model character varying,
  year integer,
  serial_number character varying,
  reefer_hours numeric,
  power_type public.reefer_power_supply DEFAULT 'DIESEL'::public.reefer_power_supply,
  diesel_capacity_l numeric,
  consumption_lph numeric,
  temp_min_c numeric,
  temp_max_c numeric,
  owner_type public.reefer_owner_type NOT NULL,
  owner_id uuid NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT reefer_equipments_pkey PRIMARY KEY (id),
  CONSTRAINT reefer_equipments_org_id_fkey FOREIGN KEY (org_id) REFERENCES public.organizations(id)
);
CREATE TABLE public.rejection_reasons (
  code text NOT NULL,
  label text NOT NULL,
  category text DEFAULT 'general'::text,
  stage text DEFAULT 'pre_acceptance'::text,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT rejection_reasons_pkey PRIMARY KEY (code)
);
CREATE TABLE public.telematics_provider (
  id integer NOT NULL DEFAULT nextval('telematics_provider_id_seq'::regclass),
  name text NOT NULL UNIQUE,
  CONSTRAINT telematics_provider_pkey PRIMARY KEY (id)
);
CREATE TABLE public.thermal_profile (
  id bigint NOT NULL DEFAULT nextval('thermal_profiles_id_seq'::regclass),
  org_id uuid NOT NULL,
  name text NOT NULL,
  description text,
  temp_min_c numeric NOT NULL,
  temp_max_c numeric NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  is_active boolean NOT NULL DEFAULT true,
  CONSTRAINT thermal_profile_pkey PRIMARY KEY (id),
  CONSTRAINT thermal_profile_org_id_fkey FOREIGN KEY (org_id) REFERENCES public.organizations(id)
);
CREATE TABLE public.trailers (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  code text NOT NULL,
  plate text NOT NULL,
  transport_capacity_weight_tn numeric NOT NULL,
  volume_m3 numeric NOT NULL,
  tare_weight_tn numeric NOT NULL,
  length_m numeric NOT NULL,
  width_m numeric NOT NULL,
  height_m numeric NOT NULL,
  supports_multi_zone boolean NOT NULL,
  compartments bigint NOT NULL DEFAULT 1,
  insulation_thickness_cm numeric,
  notes text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  connection_device_id uuid UNIQUE,
  org_id uuid NOT NULL,
  operational_status public.asset_operational_status NOT NULL DEFAULT 'ACTIVE'::public.asset_operational_status,
  carrier_id integer NOT NULL,
  brand text,
  model text,
  year integer,
  vin text,
  load_capacity_type public.app_load_capacity_type,
  load_capacity_quantity numeric,
  CONSTRAINT trailers_pkey PRIMARY KEY (id),
  CONSTRAINT trailers_connection_device_id_fkey FOREIGN KEY (connection_device_id) REFERENCES public.connection_device(id),
  CONSTRAINT trailers_carrier_id_fkey FOREIGN KEY (carrier_id) REFERENCES public.carriers(id),
  CONSTRAINT trailers_org_id_fkey FOREIGN KEY (org_id) REFERENCES public.organizations(id)
);
CREATE TABLE public.vehicles (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  unit_code character varying NOT NULL UNIQUE,
  vehicle_type character varying NOT NULL,
  plate character varying NOT NULL UNIQUE,
  brand character varying NOT NULL,
  model character varying NOT NULL,
  year smallint NOT NULL,
  vin character varying NOT NULL,
  odometer_value numeric NOT NULL DEFAULT '0'::numeric,
  odometer_unit character varying NOT NULL DEFAULT 'km'::character varying,
  additional_info text NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone,
  connection_device_id uuid UNIQUE,
  org_id uuid NOT NULL,
  operational_status public.asset_operational_status NOT NULL DEFAULT 'ACTIVE'::public.asset_operational_status,
  carrier_id integer NOT NULL,
  transport_capacity_weight_tn numeric,
  volume_m3 numeric,
  tare_weight_tn numeric,
  length_m numeric,
  width_m numeric,
  height_m numeric,
  insulation_thickness_cm numeric,
  compartments bigint DEFAULT 1,
  supports_multi_zone boolean DEFAULT false,
  notes text,
  load_capacity_type public.app_load_capacity_type,
  load_capacity_quantity numeric,
  CONSTRAINT vehicles_pkey PRIMARY KEY (id),
  CONSTRAINT vehicles_org_id_fkey FOREIGN KEY (org_id) REFERENCES public.organizations(id),
  CONSTRAINT vehicles_carrier_id_fkey FOREIGN KEY (carrier_id) REFERENCES public.carriers(id),
  CONSTRAINT vehicles_connection_device_id_fkey FOREIGN KEY (connection_device_id) REFERENCES public.connection_device(id)
);