export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      accessorial_charge_types: {
        Row: {
          charge_type: string
          code: string
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean
          name: string
          org_id: string
          updated_at: string | null
        }
        Insert: {
          charge_type?: string
          code: string
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          org_id: string
          updated_at?: string | null
        }
        Update: {
          charge_type?: string
          code?: string
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          org_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "accessorial_charge_types_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      carrier_allocation_periods: {
        Row: {
          carried_over: number
          carrier_id: number
          dispatched_count: number
          id: string
          org_id: string
          period_end: string
          period_start: string
          rejected_count: number
          rule_id: string
          target_orders: number
        }
        Insert: {
          carried_over?: number
          carrier_id: number
          dispatched_count?: number
          id?: string
          org_id: string
          period_end: string
          period_start: string
          rejected_count?: number
          rule_id: string
          target_orders: number
        }
        Update: {
          carried_over?: number
          carrier_id?: number
          dispatched_count?: number
          id?: string
          org_id?: string
          period_end?: string
          period_start?: string
          rejected_count?: number
          rule_id?: string
          target_orders?: number
        }
        Relationships: [
          {
            foreignKeyName: "carrier_allocation_periods_rule_id_fkey"
            columns: ["rule_id"]
            isOneToOne: false
            referencedRelation: "carrier_allocation_rules"
            referencedColumns: ["id"]
          },
        ]
      }
      cancellation_reasons: {
        Row: {
          category: string | null
          code: string
          created_at: string | null
          id: string
          is_active: boolean | null
          label: string
          org_id: string
          requires_comment: boolean | null
          updated_at: string | null
        }
        Insert: {
          category?: string | null
          code: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          label: string
          org_id: string
          requires_comment?: boolean | null
          updated_at?: string | null
        }
        Update: {
          category?: string | null
          code?: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          label?: string
          org_id?: string
          requires_comment?: boolean | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cancellation_reasons_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      carrier_allocation_rules: {
        Row: {
          carrier_contract_id: string | null
          carrier_id: number
          carryover_enabled: boolean
          created_at: string
          ends_on: string | null
          id: string
          is_active: boolean
          org_id: string
          reject_rate_threshold: number
          reset_every_days: number
          starts_on: string
          target_orders: number
          updated_at: string
        }
        Insert: {
          carrier_contract_id?: string | null
          carrier_id: number
          carryover_enabled?: boolean
          created_at?: string
          ends_on?: string | null
          id?: string
          is_active?: boolean
          org_id: string
          reject_rate_threshold?: number
          reset_every_days?: number
          starts_on: string
          target_orders?: number
          updated_at?: string
        }
        Update: {
          carrier_contract_id?: string | null
          carrier_id?: number
          carryover_enabled?: boolean
          created_at?: string
          ends_on?: string | null
          id?: string
          is_active?: boolean
          org_id?: string
          reject_rate_threshold?: number
          reset_every_days?: number
          starts_on?: string
          target_orders?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "carrier_allocation_rules_carrier_contract_id_fkey"
            columns: ["carrier_contract_id"]
            isOneToOne: false
            referencedRelation: "carrier_contracts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "carrier_allocation_rules_carrier_id_fkey"
            columns: ["carrier_id"]
            isOneToOne: false
            referencedRelation: "carriers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "carrier_allocation_rules_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      carrier_contract_accessorials: {
        Row: {
          accessorial_charge_type_id: string
          carrier_contract_id: string
          conditions: Json | null
          created_at: string | null
          id: string
          org_id: string
          updated_at: string | null
          value: number
        }
        Insert: {
          accessorial_charge_type_id: string
          carrier_contract_id: string
          conditions?: Json | null
          created_at?: string | null
          id?: string
          org_id: string
          updated_at?: string | null
          value: number
        }
        Update: {
          accessorial_charge_type_id?: string
          carrier_contract_id?: string
          conditions?: Json | null
          created_at?: string | null
          id?: string
          org_id?: string
          updated_at?: string | null
          value?: number
        }
        Relationships: [
          {
            foreignKeyName: "carrier_contract_accessorials_accessorial_charge_type_id_fkey"
            columns: ["accessorial_charge_type_id"]
            isOneToOne: false
            referencedRelation: "accessorial_charge_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "carrier_contract_accessorials_carrier_contract_id_fkey"
            columns: ["carrier_contract_id"]
            isOneToOne: false
            referencedRelation: "carrier_contracts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "carrier_contract_accessorials_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      carrier_contracts: {
        Row: {
          carrier_id: number
          contract_name: string | null
          contract_number: string
          created_at: string | null
          currency: string
          id: string
          min_commitment_type: string | null
          min_commitment_value: number | null
          notes: string | null
          org_id: string
          payment_terms: number
          status: string
          updated_at: string | null
          valid_from: string
          valid_to: string | null
        }
        Insert: {
          carrier_id: number
          contract_name?: string | null
          contract_number: string
          created_at?: string | null
          currency?: string
          id?: string
          min_commitment_type?: string | null
          min_commitment_value?: number | null
          notes?: string | null
          org_id: string
          payment_terms: number
          status?: string
          updated_at?: string | null
          valid_from: string
          valid_to?: string | null
        }
        Update: {
          carrier_id?: number
          contract_name?: string | null
          contract_number?: string
          created_at?: string | null
          currency?: string
          id?: string
          min_commitment_type?: string | null
          min_commitment_value?: number | null
          notes?: string | null
          org_id?: string
          payment_terms?: number
          status?: string
          updated_at?: string | null
          valid_from?: string
          valid_to?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "carrier_contracts_carrier_id_fkey"
            columns: ["carrier_id"]
            isOneToOne: false
            referencedRelation: "carriers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "carrier_contracts_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      carriers: {
        Row: {
          bank_account_number: string | null
          bank_cci_swift: string | null
          bank_name: string | null
          carrier_id: string
          carrier_type: Database["public"]["Enums"]["carrier_type"]
          city: string
          commercial_name: string
          contact_email: string
          contact_name: string
          contact_phone: string
          contract_expires_at: string | null
          contract_number: string | null
          country: string
          created_at: string
          currency: string | null
          finance_email: string
          fiscal_address: string
          id: number
          is_active: boolean
          legal_name: string
          legal_representative: string
          ops_phone_24_7: string
          org_id: string
          payment_terms: number
          tax_id: string
          updated_at: string
        }
        Insert: {
          bank_account_number?: string | null
          bank_cci_swift?: string | null
          bank_name?: string | null
          carrier_id: string
          carrier_type?: Database["public"]["Enums"]["carrier_type"]
          city: string
          commercial_name: string
          contact_email: string
          contact_name: string
          contact_phone: string
          contract_expires_at?: string | null
          contract_number?: string | null
          country: string
          created_at?: string
          currency?: string | null
          finance_email: string
          fiscal_address: string
          id?: number
          is_active?: boolean
          legal_name: string
          legal_representative: string
          ops_phone_24_7: string
          org_id: string
          payment_terms: number
          tax_id: string
          updated_at?: string
        }
        Update: {
          bank_account_number?: string | null
          bank_cci_swift?: string | null
          bank_name?: string | null
          carrier_id?: string
          carrier_type?: Database["public"]["Enums"]["carrier_type"]
          city?: string
          commercial_name?: string
          contact_email?: string
          contact_name?: string
          contact_phone?: string
          contract_expires_at?: string | null
          contract_number?: string | null
          country?: string
          created_at?: string
          currency?: string | null
          finance_email?: string
          fiscal_address?: string
          id?: number
          is_active?: boolean
          legal_name?: string
          legal_representative?: string
          ops_phone_24_7?: string
          org_id?: string
          payment_terms?: number
          tax_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "carriers_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      connection_device: {
        Row: {
          carrier_id: number
          flespi_device_id: number | null
          flespi_device_type_id: number | null
          has_can: boolean
          id: string
          ident: string
          notes: string | null
          org_id: string
          phone_number: string | null
          provider: number | null
          serial: string | null
          temp_mode: string
          tracked_entity_type:
          | Database["public"]["Enums"]["assigned_type"]
          | null
        }
        Insert: {
          carrier_id: number
          flespi_device_id?: number | null
          flespi_device_type_id?: number | null
          has_can?: boolean
          id?: string
          ident: string
          notes?: string | null
          org_id: string
          phone_number?: string | null
          provider?: number | null
          serial?: string | null
          temp_mode?: string
          tracked_entity_type?:
          | Database["public"]["Enums"]["assigned_type"]
          | null
        }
        Update: {
          carrier_id?: number
          flespi_device_id?: number | null
          flespi_device_type_id?: number | null
          has_can?: boolean
          id?: string
          ident?: string
          notes?: string | null
          org_id?: string
          phone_number?: string | null
          provider?: number | null
          serial?: string | null
          temp_mode?: string
          tracked_entity_type?:
          | Database["public"]["Enums"]["assigned_type"]
          | null
        }
        Relationships: [
          {
            foreignKeyName: "connection_device_carrier_id_fkey"
            columns: ["carrier_id"]
            isOneToOne: false
            referencedRelation: "carriers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "connection_device_flespi_device_type_id_fkey"
            columns: ["flespi_device_type_id"]
            isOneToOne: false
            referencedRelation: "flespi_device_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "connection_device_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "connection_device_provider_fkey"
            columns: ["provider"]
            isOneToOne: false
            referencedRelation: "telematics_provider"
            referencedColumns: ["id"]
          },
        ]
      }
      countries: {
        Row: {
          created_at: string | null
          id: number
          iso_code: string
          name: string
        }
        Insert: {
          created_at?: string | null
          id?: number
          iso_code: string
          name: string
        }
        Update: {
          created_at?: string | null
          id?: number
          iso_code?: string
          name?: string
        }
        Relationships: []
      }
      ct_unit_live_state: {
        Row: {
          address_text: string | null
          connection_device_id: string
          flespi_device_id: number | null
          heading: number | null
          id: string
          ignition: boolean | null
          is_moving: boolean | null
          is_online: boolean
          lat: number | null
          lng: number | null
          message_ts: string
          org_id: string
          server_ts: string | null
          signal_age_sec: number | null
          speed_kph: number | null
          telematics: Json | null
          temp_1_c: number | null
          temp_2_c: number | null
          temperature_c: number | null
          trailer_id: string | null
          updated_at: string
          vehicle_id: string | null
        }
        Insert: {
          address_text?: string | null
          connection_device_id: string
          flespi_device_id?: number | null
          heading?: number | null
          id?: string
          ignition?: boolean | null
          is_moving?: boolean | null
          is_online?: boolean
          lat?: number | null
          lng?: number | null
          message_ts: string
          org_id: string
          server_ts?: string | null
          signal_age_sec?: number | null
          speed_kph?: number | null
          telematics?: Json | null
          temp_1_c?: number | null
          temp_2_c?: number | null
          temperature_c?: number | null
          trailer_id?: string | null
          updated_at?: string
          vehicle_id?: string | null
        }
        Update: {
          address_text?: string | null
          connection_device_id?: string
          flespi_device_id?: number | null
          heading?: number | null
          id?: string
          ignition?: boolean | null
          is_moving?: boolean | null
          is_online?: boolean
          lat?: number | null
          lng?: number | null
          message_ts?: string
          org_id?: string
          server_ts?: string | null
          signal_age_sec?: number | null
          speed_kph?: number | null
          telematics?: Json | null
          temp_1_c?: number | null
          temp_2_c?: number | null
          temperature_c?: number | null
          trailer_id?: string | null
          updated_at?: string
          vehicle_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ct_unit_live_state_connection_device_id_fkey"
            columns: ["connection_device_id"]
            isOneToOne: false
            referencedRelation: "connection_device"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ct_unit_live_state_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ct_unit_live_state_trailer_id_fkey"
            columns: ["trailer_id"]
            isOneToOne: false
            referencedRelation: "trailers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ct_unit_live_state_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      device_assignments_history: {
        Row: {
          action: string
          assigned_entity_id: string
          assigned_entity_type: string
          connection_device_id: string | null
          created_at: string
          id: string
          metadata: Json | null
          org_id: string
          performed_by: string | null
          reason: string | null
        }
        Insert: {
          action: string
          assigned_entity_id: string
          assigned_entity_type: string
          connection_device_id?: string | null
          created_at?: string
          id?: string
          metadata?: Json | null
          org_id: string
          performed_by?: string | null
          reason?: string | null
        }
        Update: {
          action?: string
          assigned_entity_id?: string
          assigned_entity_type?: string
          connection_device_id?: string | null
          created_at?: string
          id?: string
          metadata?: Json | null
          org_id?: string
          performed_by?: string | null
          reason?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "device_assignments_history_connection_device_fkey"
            columns: ["connection_device_id"]
            isOneToOne: false
            referencedRelation: "connection_device"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "device_assignments_history_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      dispatch_order_carrier_history: {
        Row: {
          allocation_period_id: string | null
          assigned_at: string
          assigned_by: string | null
          carrier_id: number
          counted_as: string | null
          counted_at: string | null
          created_at: string
          dispatch_order_id: string
          id: string
          new_fleet_set_id: string | null
          org_id: string
          outcome: Database["public"]["Enums"]["carrier_assignment_outcome"]
          outcome_reason: string | null
          previous_fleet_set_id: string | null
          responded_at: string | null
          responded_by: string | null
        }
        Insert: {
          allocation_period_id?: string | null
          assigned_at?: string
          assigned_by?: string | null
          carrier_id: number
          counted_as?: string | null
          counted_at?: string | null
          created_at?: string
          dispatch_order_id: string
          id?: string
          new_fleet_set_id?: string | null
          org_id: string
          outcome?: Database["public"]["Enums"]["carrier_assignment_outcome"]
          outcome_reason?: string | null
          previous_fleet_set_id?: string | null
          responded_at?: string | null
          responded_by?: string | null
        }
        Update: {
          allocation_period_id?: string | null
          assigned_at?: string
          assigned_by?: string | null
          carrier_id?: number
          counted_as?: string | null
          counted_at?: string | null
          created_at?: string
          dispatch_order_id?: string
          id?: string
          new_fleet_set_id?: string | null
          org_id?: string
          outcome?: Database["public"]["Enums"]["carrier_assignment_outcome"]
          outcome_reason?: string | null
          previous_fleet_set_id?: string | null
          responded_at?: string | null
          responded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "dispatch_order_carrier_history_allocation_period_id_fkey"
            columns: ["allocation_period_id"]
            isOneToOne: false
            referencedRelation: "carrier_allocation_periods"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dispatch_order_carrier_history_carrier_id_fkey"
            columns: ["carrier_id"]
            isOneToOne: false
            referencedRelation: "carriers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dispatch_order_carrier_history_dispatch_order_id_fkey"
            columns: ["dispatch_order_id"]
            isOneToOne: false
            referencedRelation: "dispatch_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dispatch_order_carrier_history_new_fleet_set_id_fkey"
            columns: ["new_fleet_set_id"]
            isOneToOne: false
            referencedRelation: "fleet_sets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dispatch_order_carrier_history_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dispatch_order_carrier_history_previous_fleet_set_id_fkey"
            columns: ["previous_fleet_set_id"]
            isOneToOne: false
            referencedRelation: "fleet_sets"
            referencedColumns: ["id"]
          },
        ]
      }
      dispatch_order_costs: {
        Row: {
          additional_charges: number | null
          base_cost: number
          calculated_at: string | null
          calculated_by: string | null
          calculation_details: Json | null
          dispatch_order_id: string
          fuel_surcharge: number | null
          id: string
          invoice_number: string | null
          invoiced_at: string | null
          modifiers_applied: Json | null
          notes: string | null
          org_id: string
          paid_at: string | null
          penalties_applied: Json | null
          rate_card_id: string | null
          recalculated_at: string | null
          service_surcharge: number | null
          status: string
          subtotal: number
          total_cost: number
          total_penalties: number | null
        }
        Insert: {
          additional_charges?: number | null
          base_cost: number
          calculated_at?: string | null
          calculated_by?: string | null
          calculation_details?: Json | null
          dispatch_order_id: string
          fuel_surcharge?: number | null
          id?: string
          invoice_number?: string | null
          invoiced_at?: string | null
          modifiers_applied?: Json | null
          notes?: string | null
          org_id: string
          paid_at?: string | null
          penalties_applied?: Json | null
          rate_card_id?: string | null
          recalculated_at?: string | null
          service_surcharge?: number | null
          status?: string
          subtotal: number
          total_cost: number
          total_penalties?: number | null
        }
        Update: {
          additional_charges?: number | null
          base_cost?: number
          calculated_at?: string | null
          calculated_by?: string | null
          calculation_details?: Json | null
          dispatch_order_id?: string
          fuel_surcharge?: number | null
          id?: string
          invoice_number?: string | null
          invoiced_at?: string | null
          modifiers_applied?: Json | null
          notes?: string | null
          org_id?: string
          paid_at?: string | null
          penalties_applied?: Json | null
          rate_card_id?: string | null
          recalculated_at?: string | null
          service_surcharge?: number | null
          status?: string
          subtotal?: number
          total_cost?: number
          total_penalties?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "dispatch_order_costs_dispatch_order_id_fkey"
            columns: ["dispatch_order_id"]
            isOneToOne: true
            referencedRelation: "dispatch_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dispatch_order_costs_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dispatch_order_costs_rate_card_id_fkey"
            columns: ["rate_card_id"]
            isOneToOne: false
            referencedRelation: "rate_cards"
            referencedColumns: ["id"]
          },
        ]
      }
      dispatch_order_items: {
        Row: {
          created_at: string
          created_by: string
          description: string | null
          dispatch_order_id: string
          id: string
          item_name: string
          notes: string | null
          org_id: string
          product_id: number
          quantity: number
          thermal_profile_id: number | null
          unit: string
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          created_at?: string
          created_by: string
          description?: string | null
          dispatch_order_id: string
          id?: string
          item_name: string
          notes?: string | null
          org_id: string
          product_id: number
          quantity: number
          thermal_profile_id?: number | null
          unit: string
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string
          description?: string | null
          dispatch_order_id?: string
          id?: string
          item_name?: string
          notes?: string | null
          org_id?: string
          product_id?: number
          quantity?: number
          thermal_profile_id?: number | null
          unit?: string
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "dispatch_order_items_dispatch_order_id_fkey"
            columns: ["dispatch_order_id"]
            isOneToOne: false
            referencedRelation: "dispatch_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dispatch_order_items_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dispatch_order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dispatch_order_items_thermal_profile_id_fkey"
            columns: ["thermal_profile_id"]
            isOneToOne: false
            referencedRelation: "thermal_profile"
            referencedColumns: ["id"]
          },
        ]
      }
      dispatch_order_observance_history: {
        Row: {
          carrier_id: number
          cause: Database["public"]["Enums"]["observance_cause_type"]
          created_at: string
          dispatch_order_id: string
          duration_hours: number | null
          id: string
          observance_number: number
          observed_at: string
          observed_by: string | null
          org_id: string
          penalty_amount: number | null
          penalty_rule_applied: string | null
          reason: string | null
          resolution:
          | Database["public"]["Enums"]["observance_resolution_type"]
          | null
          resolution_notes: string | null
          resolved_at: string | null
          resolved_by: string | null
          temp_deviation_c: number | null
          temp_duration_hours: number | null
        }
        Insert: {
          carrier_id: number
          cause: Database["public"]["Enums"]["observance_cause_type"]
          created_at?: string
          dispatch_order_id: string
          duration_hours?: number | null
          id?: string
          observance_number: number
          observed_at?: string
          observed_by?: string | null
          org_id: string
          penalty_amount?: number | null
          penalty_rule_applied?: string | null
          reason?: string | null
          resolution?:
          | Database["public"]["Enums"]["observance_resolution_type"]
          | null
          resolution_notes?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          temp_deviation_c?: number | null
          temp_duration_hours?: number | null
        }
        Update: {
          carrier_id?: number
          cause?: Database["public"]["Enums"]["observance_cause_type"]
          created_at?: string
          dispatch_order_id?: string
          duration_hours?: number | null
          id?: string
          observance_number?: number
          observed_at?: string
          observed_by?: string | null
          org_id?: string
          penalty_amount?: number | null
          penalty_rule_applied?: string | null
          reason?: string | null
          resolution?:
          | Database["public"]["Enums"]["observance_resolution_type"]
          | null
          resolution_notes?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          temp_deviation_c?: number | null
          temp_duration_hours?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "dispatch_order_observance_history_carrier_id_fkey"
            columns: ["carrier_id"]
            isOneToOne: false
            referencedRelation: "carriers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dispatch_order_observance_history_dispatch_order_id_fkey"
            columns: ["dispatch_order_id"]
            isOneToOne: false
            referencedRelation: "dispatch_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dispatch_order_observance_history_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dispatch_order_observance_history_penalty_rule_applied_fkey"
            columns: ["penalty_rule_applied"]
            isOneToOne: false
            referencedRelation: "penalty_rules"
            referencedColumns: ["id"]
          },
        ]
      }
      dispatch_order_state_history: {
        Row: {
          changed_at: string
          changed_by: string | null
          created_at: string
          dispatch_order_id: string
          from_stage: Database["public"]["Enums"]["dispatch_order_stage"] | null
          from_substatus:
          | Database["public"]["Enums"]["dispatch_order_substatus"]
          | null
          id: string
          metadata: Json | null
          notes: string | null
          org_id: string
          reason: string | null
          to_stage: Database["public"]["Enums"]["dispatch_order_stage"]
          to_substatus: Database["public"]["Enums"]["dispatch_order_substatus"]
          trigger_type: string
        }
        Insert: {
          changed_at?: string
          changed_by?: string | null
          created_at?: string
          dispatch_order_id: string
          from_stage?:
          | Database["public"]["Enums"]["dispatch_order_stage"]
          | null
          from_substatus?:
          | Database["public"]["Enums"]["dispatch_order_substatus"]
          | null
          id?: string
          metadata?: Json | null
          notes?: string | null
          org_id: string
          reason?: string | null
          to_stage: Database["public"]["Enums"]["dispatch_order_stage"]
          to_substatus: Database["public"]["Enums"]["dispatch_order_substatus"]
          trigger_type?: string
        }
        Update: {
          changed_at?: string
          changed_by?: string | null
          created_at?: string
          dispatch_order_id?: string
          from_stage?:
          | Database["public"]["Enums"]["dispatch_order_stage"]
          | null
          from_substatus?:
          | Database["public"]["Enums"]["dispatch_order_substatus"]
          | null
          id?: string
          metadata?: Json | null
          notes?: string | null
          org_id?: string
          reason?: string | null
          to_stage?: Database["public"]["Enums"]["dispatch_order_stage"]
          to_substatus?: Database["public"]["Enums"]["dispatch_order_substatus"]
          trigger_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "dispatch_order_state_history_dispatch_order_id_fkey"
            columns: ["dispatch_order_id"]
            isOneToOne: false
            referencedRelation: "dispatch_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dispatch_order_state_history_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      dispatch_order_stop_actuals: {
        Row: {
          actual_arrival_at: string | null
          actual_departure_at: string | null
          created_at: string
          dispatch_order_id: string
          id: string
          lane_stop_id: string
          notes: string | null
          org_id: string
          updated_at: string | null
        }
        Insert: {
          actual_arrival_at?: string | null
          actual_departure_at?: string | null
          created_at?: string
          dispatch_order_id: string
          id?: string
          lane_stop_id: string
          notes?: string | null
          org_id: string
          updated_at?: string | null
        }
        Update: {
          actual_arrival_at?: string | null
          actual_departure_at?: string | null
          created_at?: string
          dispatch_order_id?: string
          id?: string
          lane_stop_id?: string
          notes?: string | null
          org_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "dispatch_order_stop_actuals_dispatch_order_id_fkey"
            columns: ["dispatch_order_id"]
            isOneToOne: false
            referencedRelation: "dispatch_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dispatch_order_stop_actuals_lane_stop_id_fkey"
            columns: ["lane_stop_id"]
            isOneToOne: false
            referencedRelation: "lane_stops"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dispatch_order_stop_actuals_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      dispatch_orders: {
        Row: {
          actual_end_at: string | null
          actual_start_at: string | null
          allocation_period_id: string | null
          cancellation_reason_id: string | null
          carrier_assigned_at: string | null
          carrier_contract_id: string | null
          carrier_id: number | null
          created_at: string
          created_by: string
          dispatch_number: string
          driver_id: number | null
          fleet_set_id: string | null
          id: string
          lane_id: string | null
          notes: string | null
          observance_count: number
          org_id: string
          pickup_window_end: string | null
          pickup_window_start: string | null
          planned_end_at: string
          planned_start_at: string
          rate_card_id: string | null
          response_deadline: string | null
          stage: Database["public"]["Enums"]["dispatch_order_stage"]
          substatus: Database["public"]["Enums"]["dispatch_order_substatus"]
          trailer_id: string | null
          updated_at: string | null
          updated_by: string | null
          vehicle_id: string | null
        }
        Insert: {
          actual_end_at?: string | null
          actual_start_at?: string | null
          allocation_period_id?: string | null
          cancellation_reason_id?: string | null
          carrier_assigned_at?: string | null
          carrier_contract_id?: string | null
          carrier_id?: number | null
          created_at?: string
          created_by: string
          dispatch_number: string
          driver_id?: number | null
          fleet_set_id?: string | null
          id?: string
          lane_id?: string | null
          notes?: string | null
          observance_count?: number
          org_id: string
          pickup_window_end?: string | null
          pickup_window_start?: string | null
          planned_end_at: string
          planned_start_at: string
          rate_card_id?: string | null
          response_deadline?: string | null
          stage?: Database["public"]["Enums"]["dispatch_order_stage"]
          substatus?: Database["public"]["Enums"]["dispatch_order_substatus"]
          trailer_id?: string | null
          updated_at?: string | null
          updated_by?: string | null
          vehicle_id?: string | null
        }
        Update: {
          actual_end_at?: string | null
          actual_start_at?: string | null
          allocation_period_id?: string | null
          cancellation_reason_id?: string | null
          carrier_assigned_at?: string | null
          carrier_contract_id?: string | null
          carrier_id?: number | null
          created_at?: string
          created_by?: string
          dispatch_number?: string
          driver_id?: number | null
          fleet_set_id?: string | null
          id?: string
          lane_id?: string | null
          notes?: string | null
          observance_count?: number
          org_id?: string
          pickup_window_end?: string | null
          pickup_window_start?: string | null
          planned_end_at?: string
          planned_start_at?: string
          rate_card_id?: string | null
          response_deadline?: string | null
          stage?: Database["public"]["Enums"]["dispatch_order_stage"]
          substatus?: Database["public"]["Enums"]["dispatch_order_substatus"]
          trailer_id?: string | null
          updated_at?: string | null
          updated_by?: string | null
          vehicle_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "dispatch_orders_allocation_period_id_fkey"
            columns: ["allocation_period_id"]
            isOneToOne: false
            referencedRelation: "carrier_allocation_periods"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dispatch_orders_cancellation_reason_fk"
            columns: ["org_id", "cancellation_reason_id"]
            isOneToOne: false
            referencedRelation: "cancellation_reasons"
            referencedColumns: ["org_id", "id"]
          },
          {
            foreignKeyName: "dispatch_orders_fleet_set_id_fkey"
            columns: ["fleet_set_id"]
            isOneToOne: false
            referencedRelation: "fleet_sets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dispatch_orders_lane_id_fkey"
            columns: ["lane_id"]
            isOneToOne: false
            referencedRelation: "lanes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dispatch_orders_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      drivers: {
        Row: {
          address: string
          birth_date: string
          carrier_id: number
          city: string
          contract_date: string
          driver_id: string
          email: string | null
          id: number
          license_number: string
          name: string
          nationality: number
          notes: string | null
          org_id: string
          phone_number: string
          status: Database["public"]["Enums"]["driver_status"]
          user_id: string | null
        }
        Insert: {
          address: string
          birth_date: string
          carrier_id: number
          city: string
          contract_date: string
          driver_id: string
          email?: string | null
          id?: number
          license_number: string
          name: string
          nationality: number
          notes?: string | null
          org_id: string
          phone_number: string
          status?: Database["public"]["Enums"]["driver_status"]
          user_id?: string | null
        }
        Update: {
          address?: string
          birth_date?: string
          carrier_id?: number
          city?: string
          contract_date?: string
          driver_id?: string
          email?: string | null
          id?: number
          license_number?: string
          name?: string
          nationality?: number
          notes?: string | null
          org_id?: string
          phone_number?: string
          status?: Database["public"]["Enums"]["driver_status"]
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "drivers_carrier_id_fkey"
            columns: ["carrier_id"]
            isOneToOne: false
            referencedRelation: "carriers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "drivers_nationality_fkey"
            columns: ["nationality"]
            isOneToOne: false
            referencedRelation: "countries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "drivers_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      fleet_sets: {
        Row: {
          carrier_id: number
          created_at: string
          driver_id: number | null
          ends_at: string | null
          id: string
          is_active: boolean
          org_id: string
          starts_at: string
          trailer_id: string | null
          updated_at: string
          vehicle_id: string
        }
        Insert: {
          carrier_id: number
          created_at?: string
          driver_id?: number | null
          ends_at?: string | null
          id?: string
          is_active?: boolean
          org_id: string
          starts_at?: string
          trailer_id?: string | null
          updated_at?: string
          vehicle_id: string
        }
        Update: {
          carrier_id?: number
          created_at?: string
          driver_id?: number | null
          ends_at?: string | null
          id?: string
          is_active?: boolean
          org_id?: string
          starts_at?: string
          trailer_id?: string | null
          updated_at?: string
          vehicle_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fleet_sets_carrier_id_fkey"
            columns: ["carrier_id"]
            isOneToOne: false
            referencedRelation: "carriers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fleet_sets_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "drivers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fleet_sets_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fleet_sets_trailer_id_fkey"
            columns: ["trailer_id"]
            isOneToOne: false
            referencedRelation: "trailers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fleet_sets_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      flespi_device_types: {
        Row: {
          id: number
          name: string
          protocol_id: number
          updated_at: string | null
        }
        Insert: {
          id: number
          name: string
          protocol_id: number
          updated_at?: string | null
        }
        Update: {
          id?: number
          name?: string
          protocol_id?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "flespi_device_types_protocol_id_fkey"
            columns: ["protocol_id"]
            isOneToOne: false
            referencedRelation: "flespi_protocols"
            referencedColumns: ["id"]
          },
        ]
      }
      flespi_protocols: {
        Row: {
          id: number
          name: string
          updated_at: string | null
        }
        Insert: {
          id: number
          name: string
          updated_at?: string | null
        }
        Update: {
          id?: number
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      lane_stops: {
        Row: {
          estimated_duration: number | null
          id: string
          lane_id: string
          location_id: number
          notes: string | null
          org_id: string
          stop_order: number
          stop_type: Database["public"]["Enums"]["stop_types"] | null
        }
        Insert: {
          estimated_duration?: number | null
          id?: string
          lane_id: string
          location_id: number
          notes?: string | null
          org_id: string
          stop_order: number
          stop_type?: Database["public"]["Enums"]["stop_types"] | null
        }
        Update: {
          estimated_duration?: number | null
          id?: string
          lane_id?: string
          location_id?: number
          notes?: string | null
          org_id?: string
          stop_order?: number
          stop_type?: Database["public"]["Enums"]["stop_types"] | null
        }
        Relationships: [
          {
            foreignKeyName: "lane_stops_lane_id_fkey"
            columns: ["lane_id"]
            isOneToOne: false
            referencedRelation: "lanes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lane_stops_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lane_stops_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      lane_types: {
        Row: {
          description: string | null
          id: number
          is_active: boolean
          name: string
          org_id: string
        }
        Insert: {
          description?: string | null
          id?: number
          is_active?: boolean
          name: string
          org_id: string
        }
        Update: {
          description?: string | null
          id?: number
          is_active?: boolean
          name?: string
          org_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "lane_types_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      lanes: {
        Row: {
          currency: Database["public"]["Enums"]["currency_code"]
          distance: number
          id: string
          is_active: boolean
          lane_id: string
          lane_type_id: number | null
          name: string
          operational_buffer: number | null
          org_id: string
          supersedes_lane_id: string | null
          transit_time: number | null
        }
        Insert: {
          currency?: Database["public"]["Enums"]["currency_code"]
          distance: number
          id?: string
          is_active?: boolean
          lane_id: string
          lane_type_id?: number | null
          name: string
          operational_buffer?: number | null
          org_id: string
          supersedes_lane_id?: string | null
          transit_time?: number | null
        }
        Update: {
          currency?: Database["public"]["Enums"]["currency_code"]
          distance?: number
          id?: string
          is_active?: boolean
          lane_id?: string
          lane_type_id?: number | null
          name?: string
          operational_buffer?: number | null
          org_id?: string
          supersedes_lane_id?: string | null
          transit_time?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "lanes_lane_type_id_fkey"
            columns: ["lane_type_id"]
            isOneToOne: false
            referencedRelation: "lane_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lanes_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lanes_supersedes_lane_id_fkey"
            columns: ["supersedes_lane_id"]
            isOneToOne: false
            referencedRelation: "lanes"
            referencedColumns: ["id"]
          },
        ]
      }
      load_capacity_types: {
        Row: {
          code: string
          created_at: string
          id: number
          name: string
        }
        Insert: {
          code: string
          created_at?: string
          id?: number
          name: string
        }
        Update: {
          code?: string
          created_at?: string
          id?: number
          name?: string
        }
        Relationships: []
      }
      location_types: {
        Row: {
          allowed_stop_types: Database["public"]["Enums"]["stop_types"][] | null
          created_at: string | null
          description: string | null
          id: number
          name: string
          org_id: string
        }
        Insert: {
          allowed_stop_types?:
          | Database["public"]["Enums"]["stop_types"][]
          | null
          created_at?: string | null
          description?: string | null
          id?: number
          name: string
          org_id: string
        }
        Update: {
          allowed_stop_types?:
          | Database["public"]["Enums"]["stop_types"][]
          | null
          created_at?: string | null
          description?: string | null
          id?: number
          name?: string
          org_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "type_location_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      locations: {
        Row: {
          address: string
          city: string
          code: string
          country_id: number
          created_at: string | null
          default_dwell_time_hours: number | null
          geofence_data: Json
          geofence_type: string
          id: number
          is_active: boolean
          name: string
          num_docks: number
          org_id: string
          type_location_id: number | null
          updated_at: string | null
        }
        Insert: {
          address: string
          city: string
          code: string
          country_id: number
          created_at?: string | null
          default_dwell_time_hours?: number | null
          geofence_data: Json
          geofence_type: string
          id?: number
          is_active?: boolean
          name: string
          num_docks: number
          org_id: string
          type_location_id?: number | null
          updated_at?: string | null
        }
        Update: {
          address?: string
          city?: string
          code?: string
          country_id?: number
          created_at?: string | null
          default_dwell_time_hours?: number | null
          geofence_data?: Json
          geofence_type?: string
          id?: number
          is_active?: boolean
          name?: string
          num_docks?: number
          org_id?: string
          type_location_id?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "locations_country_id_fkey"
            columns: ["country_id"]
            isOneToOne: false
            referencedRelation: "countries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "locations_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "locations_type_location_id_fkey"
            columns: ["type_location_id"]
            isOneToOne: false
            referencedRelation: "location_types"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_members: {
        Row: {
          carrier_id: number | null
          created_at: string
          driver_id: number | null
          email: string
          first_name: string
          id: string
          is_active: boolean
          is_carrier_member: boolean
          last_name: string
          org_id: string
          phone: string | null
          role: Database["public"]["Enums"]["user_role"]
          status: string
          user_id: string | null
        }
        Insert: {
          carrier_id?: number | null
          created_at?: string
          driver_id?: number | null
          email?: string
          first_name?: string
          id?: string
          is_active?: boolean
          is_carrier_member?: boolean
          last_name?: string
          org_id: string
          phone?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          status?: string
          user_id?: string | null
        }
        Update: {
          carrier_id?: number | null
          created_at?: string
          driver_id?: number | null
          email?: string
          first_name?: string
          id?: string
          is_active?: boolean
          is_carrier_member?: boolean
          last_name?: string
          org_id?: string
          phone?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          status?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "account_users_account_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_members_carrier_id_fkey"
            columns: ["carrier_id"]
            isOneToOne: false
            referencedRelation: "carriers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_members_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "drivers"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_severities: {
        Row: {
          code: string
          created_at: string
          description: string | null
          id: string
          name: string
          org_id: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          code: string
          created_at?: string
          description?: string | null
          id?: string
          name: string
          org_id: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          code?: string
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          org_id?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_severities_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_transport_contexts: {
        Row: {
          code: string
          created_at: string
          description: string | null
          id: string
          name: string
          org_id: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          code: string
          created_at?: string
          description?: string | null
          id?: string
          name: string
          org_id: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          code?: string
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          org_id?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_transport_contexts_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          base_country_id: number
          billing_email: string | null
          city: string | null
          comercial_name: string
          contact_email: string | null
          contact_name: string | null
          contact_phone: string | null
          created_at: string
          created_by: string
          currency: Database["public"]["Enums"]["currency_code"] | null
          fiscal_address: string | null
          id: string
          legal_name: string
          plan_type: Database["public"]["Enums"]["plan_type"] | null
          status: Database["public"]["Enums"]["account_status"]
          tax_id: string | null
          time_zone: string | null
          updated_at: string | null
        }
        Insert: {
          base_country_id: number
          billing_email?: string | null
          city?: string | null
          comercial_name: string
          contact_email?: string | null
          contact_name?: string | null
          contact_phone?: string | null
          created_at?: string
          created_by: string
          currency?: Database["public"]["Enums"]["currency_code"] | null
          fiscal_address?: string | null
          id?: string
          legal_name: string
          plan_type?: Database["public"]["Enums"]["plan_type"] | null
          status?: Database["public"]["Enums"]["account_status"]
          tax_id?: string | null
          time_zone?: string | null
          updated_at?: string | null
        }
        Update: {
          base_country_id?: number
          billing_email?: string | null
          city?: string | null
          comercial_name?: string
          contact_email?: string | null
          contact_name?: string | null
          contact_phone?: string | null
          created_at?: string
          created_by?: string
          currency?: Database["public"]["Enums"]["currency_code"] | null
          fiscal_address?: string | null
          id?: string
          legal_name?: string
          plan_type?: Database["public"]["Enums"]["plan_type"] | null
          status?: Database["public"]["Enums"]["account_status"]
          tax_id?: string | null
          time_zone?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "organizations_base_country_id_fkey"
            columns: ["base_country_id"]
            isOneToOne: false
            referencedRelation: "countries"
            referencedColumns: ["id"]
          },
        ]
      }
      penalty_rules: {
        Row: {
          applies_to_routes: string[] | null
          carrier_contract_id: string | null
          condition_description: string
          created_at: string | null
          duration_max_hours: number | null
          duration_min_hours: number | null
          id: string
          is_active: boolean | null
          org_id: string
          penalty_type: string
          penalty_value: number | null
          priority: number | null
          rule_type: string
          temp_duration_max_hours: number | null
          temp_duration_min_hours: number | null
          temp_max_c: number | null
          temp_min_c: number | null
          updated_at: string | null
        }
        Insert: {
          applies_to_routes?: string[] | null
          carrier_contract_id?: string | null
          condition_description: string
          created_at?: string | null
          duration_max_hours?: number | null
          duration_min_hours?: number | null
          id?: string
          is_active?: boolean | null
          org_id: string
          penalty_type: string
          penalty_value?: number | null
          priority?: number | null
          rule_type: string
          temp_duration_max_hours?: number | null
          temp_duration_min_hours?: number | null
          temp_max_c?: number | null
          temp_min_c?: number | null
          updated_at?: string | null
        }
        Update: {
          applies_to_routes?: string[] | null
          carrier_contract_id?: string | null
          condition_description?: string
          created_at?: string | null
          duration_max_hours?: number | null
          duration_min_hours?: number | null
          id?: string
          is_active?: boolean | null
          org_id?: string
          penalty_type?: string
          penalty_value?: number | null
          priority?: number | null
          rule_type?: string
          temp_duration_max_hours?: number | null
          temp_duration_min_hours?: number | null
          temp_max_c?: number | null
          temp_min_c?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "penalty_rules_carrier_contract_id_fkey"
            columns: ["carrier_contract_id"]
            isOneToOne: false
            referencedRelation: "carrier_contracts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "penalty_rules_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      platform_users: {
        Row: {
          created_at: string
          is_active: boolean
          role: string
          user_id: string
        }
        Insert: {
          created_at?: string
          is_active?: boolean
          role: string
          user_id: string
        }
        Update: {
          created_at?: string
          is_active?: boolean
          role?: string
          user_id?: string
        }
        Relationships: []
      }
      product_thermal_profiles: {
        Row: {
          id: number
          org_id: string
          product_id: number
          thermal_profile_id: number
        }
        Insert: {
          id?: number
          org_id: string
          product_id: number
          thermal_profile_id: number
        }
        Update: {
          id?: number
          org_id?: string
          product_id?: number
          thermal_profile_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "product_thermal_profiles_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_thermal_profile_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_thermal_profile_thermal_profile_id_fkey"
            columns: ["thermal_profile_id"]
            isOneToOne: false
            referencedRelation: "thermal_profile"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          created_at: string | null
          description: string | null
          id: number
          is_active: boolean
          name: string
          org_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: number
          is_active?: boolean
          name: string
          org_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: number
          is_active?: boolean
          name?: string
          org_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "products_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      rate_card_charges: {
        Row: {
          apply_before_pct: boolean
          charge_type: string
          created_at: string | null
          id: string
          is_active: boolean
          label: string | null
          rate_basis: string
          rate_card_id: string
          sort_order: number
          value: number
        }
        Insert: {
          apply_before_pct?: boolean
          charge_type: string
          created_at?: string | null
          id?: string
          is_active?: boolean
          label?: string | null
          rate_basis: string
          rate_card_id: string
          sort_order?: number
          value: number
        }
        Update: {
          apply_before_pct?: boolean
          charge_type?: string
          created_at?: string | null
          id?: string
          is_active?: boolean
          label?: string | null
          rate_basis?: string
          rate_card_id?: string
          sort_order?: number
          value?: number
        }
        Relationships: [
          {
            foreignKeyName: "rate_card_charges_rate_card_id_fkey"
            columns: ["rate_card_id"]
            isOneToOne: false
            referencedRelation: "rate_cards"
            referencedColumns: ["id"]
          },
        ]
      }
      rate_cards: {
        Row: {
          base_value: number
          carrier_contract_id: string
          carrier_id: number | null
          created_at: string | null
          id: string
          is_active: boolean
          lane_id: string
          min_charge: number
          name: string | null
          org_id: string
          thermal_profile_id: number | null
          updated_at: string | null
          valid_from: string
          valid_to: string | null
        }
        Insert: {
          base_value: number
          carrier_contract_id: string
          carrier_id?: number | null
          created_at?: string | null
          id?: string
          is_active?: boolean
          lane_id: string
          min_charge?: number
          name?: string | null
          org_id: string
          thermal_profile_id?: number | null
          updated_at?: string | null
          valid_from: string
          valid_to?: string | null
        }
        Update: {
          base_value?: number
          carrier_contract_id?: string
          carrier_id?: number | null
          created_at?: string | null
          id?: string
          is_active?: boolean
          lane_id?: string
          min_charge?: number
          name?: string | null
          org_id?: string
          thermal_profile_id?: number | null
          updated_at?: string | null
          valid_from?: string
          valid_to?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "rate_cards_carrier_contract_id_fkey"
            columns: ["carrier_contract_id"]
            isOneToOne: false
            referencedRelation: "carrier_contracts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rate_cards_carrier_id_fkey"
            columns: ["carrier_id"]
            isOneToOne: false
            referencedRelation: "carriers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rate_cards_lane_id_fkey"
            columns: ["lane_id"]
            isOneToOne: false
            referencedRelation: "lanes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rate_cards_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rate_cards_thermal_profile_id_fkey"
            columns: ["thermal_profile_id"]
            isOneToOne: false
            referencedRelation: "thermal_profile"
            referencedColumns: ["id"]
          },
        ]
      }
      rate_charge_breaks: {
        Row: {
          charge_id: string
          created_at: string | null
          id: string
          max_value: number | null
          min_value: number
          rate_value: number
        }
        Insert: {
          charge_id: string
          created_at?: string | null
          id?: string
          max_value?: number | null
          min_value: number
          rate_value: number
        }
        Update: {
          charge_id?: string
          created_at?: string | null
          id?: string
          max_value?: number | null
          min_value?: number
          rate_value?: number
        }
        Relationships: [
          {
            foreignKeyName: "rate_charge_breaks_charge_id_fkey"
            columns: ["charge_id"]
            isOneToOne: false
            referencedRelation: "rate_card_charges"
            referencedColumns: ["id"]
          },
        ]
      }
      reefer_equipments: {
        Row: {
          brand: string | null
          consumption_lph: number | null
          created_at: string | null
          diesel_capacity_l: number | null
          id: number
          model: string | null
          org_id: string
          owner_id: string
          owner_type: Database["public"]["Enums"]["reefer_owner_type"]
          power_type: Database["public"]["Enums"]["reefer_power_supply"] | null
          reefer_hours: number | null
          serial_number: string | null
          temp_max_c: number | null
          temp_min_c: number | null
          updated_at: string | null
          year: number | null
        }
        Insert: {
          brand?: string | null
          consumption_lph?: number | null
          created_at?: string | null
          diesel_capacity_l?: number | null
          id?: number
          model?: string | null
          org_id: string
          owner_id: string
          owner_type: Database["public"]["Enums"]["reefer_owner_type"]
          power_type?: Database["public"]["Enums"]["reefer_power_supply"] | null
          reefer_hours?: number | null
          serial_number?: string | null
          temp_max_c?: number | null
          temp_min_c?: number | null
          updated_at?: string | null
          year?: number | null
        }
        Update: {
          brand?: string | null
          consumption_lph?: number | null
          created_at?: string | null
          diesel_capacity_l?: number | null
          id?: number
          model?: string | null
          org_id?: string
          owner_id?: string
          owner_type?: Database["public"]["Enums"]["reefer_owner_type"]
          power_type?: Database["public"]["Enums"]["reefer_power_supply"] | null
          reefer_hours?: number | null
          serial_number?: string | null
          temp_max_c?: number | null
          temp_min_c?: number | null
          updated_at?: string | null
          year?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "reefer_equipments_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      rejection_reasons: {
        Row: {
          category: string | null
          code: string
          created_at: string | null
          is_active: boolean | null
          label: string
          stage: string | null
        }
        Insert: {
          category?: string | null
          code: string
          created_at?: string | null
          is_active?: boolean | null
          label: string
          stage?: string | null
        }
        Update: {
          category?: string | null
          code?: string
          created_at?: string | null
          is_active?: boolean | null
          label?: string
          stage?: string | null
        }
        Relationships: []
      }
      telematics_provider: {
        Row: {
          id: number
          name: string
        }
        Insert: {
          id?: number
          name: string
        }
        Update: {
          id?: number
          name?: string
        }
        Relationships: []
      }
      thermal_profile: {
        Row: {
          created_at: string | null
          description: string | null
          id: number
          is_active: boolean
          name: string
          org_id: string
          temp_max_c: number
          temp_min_c: number
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: number
          is_active?: boolean
          name: string
          org_id: string
          temp_max_c: number
          temp_min_c: number
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: number
          is_active?: boolean
          name?: string
          org_id?: string
          temp_max_c?: number
          temp_min_c?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "thermal_profile_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      trailers: {
        Row: {
          brand: string | null
          carrier_id: number
          code: string
          compartments: number
          connection_device_id: string | null
          created_at: string
          height_m: number
          id: string
          insulation_thickness_cm: number | null
          length_m: number
          load_capacity_quantity: number | null
          load_capacity_type:
          | Database["public"]["Enums"]["app_load_capacity_type"]
          | null
          model: string | null
          notes: string | null
          operational_status: Database["public"]["Enums"]["asset_operational_status"]
          org_id: string
          plate: string
          supports_multi_zone: boolean
          tare_weight_tn: number
          transport_capacity_weight_tn: number
          updated_at: string
          vin: string | null
          volume_m3: number
          width_m: number
          year: number | null
        }
        Insert: {
          brand?: string | null
          carrier_id: number
          code: string
          compartments?: number
          connection_device_id?: string | null
          created_at?: string
          height_m: number
          id?: string
          insulation_thickness_cm?: number | null
          length_m: number
          load_capacity_quantity?: number | null
          load_capacity_type?:
          | Database["public"]["Enums"]["app_load_capacity_type"]
          | null
          model?: string | null
          notes?: string | null
          operational_status?: Database["public"]["Enums"]["asset_operational_status"]
          org_id: string
          plate: string
          supports_multi_zone: boolean
          tare_weight_tn: number
          transport_capacity_weight_tn: number
          updated_at?: string
          vin?: string | null
          volume_m3: number
          width_m: number
          year?: number | null
        }
        Update: {
          brand?: string | null
          carrier_id?: number
          code?: string
          compartments?: number
          connection_device_id?: string | null
          created_at?: string
          height_m?: number
          id?: string
          insulation_thickness_cm?: number | null
          length_m?: number
          load_capacity_quantity?: number | null
          load_capacity_type?:
          | Database["public"]["Enums"]["app_load_capacity_type"]
          | null
          model?: string | null
          notes?: string | null
          operational_status?: Database["public"]["Enums"]["asset_operational_status"]
          org_id?: string
          plate?: string
          supports_multi_zone?: boolean
          tare_weight_tn?: number
          transport_capacity_weight_tn?: number
          updated_at?: string
          vin?: string | null
          volume_m3?: number
          width_m?: number
          year?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "trailers_carrier_id_fkey"
            columns: ["carrier_id"]
            isOneToOne: false
            referencedRelation: "carriers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trailers_connection_device_id_fkey"
            columns: ["connection_device_id"]
            isOneToOne: true
            referencedRelation: "connection_device"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trailers_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      vehicles: {
        Row: {
          additional_info: string
          brand: string
          carrier_id: number
          compartments: number | null
          connection_device_id: string | null
          created_at: string | null
          height_m: number | null
          id: string
          insulation_thickness_cm: number | null
          length_m: number | null
          load_capacity_quantity: number | null
          load_capacity_type:
          | Database["public"]["Enums"]["app_load_capacity_type"]
          | null
          model: string
          notes: string | null
          odometer_unit: string
          odometer_value: number
          operational_status: Database["public"]["Enums"]["asset_operational_status"]
          org_id: string
          plate: string
          supports_multi_zone: boolean | null
          tare_weight_tn: number | null
          transport_capacity_weight_tn: number | null
          unit_code: string
          updated_at: string | null
          vehicle_type: string
          vin: string
          volume_m3: number | null
          width_m: number | null
          year: number
        }
        Insert: {
          additional_info: string
          brand: string
          carrier_id: number
          compartments?: number | null
          connection_device_id?: string | null
          created_at?: string | null
          height_m?: number | null
          id?: string
          insulation_thickness_cm?: number | null
          length_m?: number | null
          load_capacity_quantity?: number | null
          load_capacity_type?:
          | Database["public"]["Enums"]["app_load_capacity_type"]
          | null
          model: string
          notes?: string | null
          odometer_unit?: string
          odometer_value?: number
          operational_status?: Database["public"]["Enums"]["asset_operational_status"]
          org_id: string
          plate: string
          supports_multi_zone?: boolean | null
          tare_weight_tn?: number | null
          transport_capacity_weight_tn?: number | null
          unit_code: string
          updated_at?: string | null
          vehicle_type: string
          vin: string
          volume_m3?: number | null
          width_m?: number | null
          year: number
        }
        Update: {
          additional_info?: string
          brand?: string
          carrier_id?: number
          compartments?: number | null
          connection_device_id?: string | null
          created_at?: string | null
          height_m?: number | null
          id?: string
          insulation_thickness_cm?: number | null
          length_m?: number | null
          load_capacity_quantity?: number | null
          load_capacity_type?:
          | Database["public"]["Enums"]["app_load_capacity_type"]
          | null
          model?: string
          notes?: string | null
          odometer_unit?: string
          odometer_value?: number
          operational_status?: Database["public"]["Enums"]["asset_operational_status"]
          org_id?: string
          plate?: string
          supports_multi_zone?: boolean | null
          tare_weight_tn?: number | null
          transport_capacity_weight_tn?: number | null
          unit_code?: string
          updated_at?: string | null
          vehicle_type?: string
          vin?: string
          volume_m3?: number | null
          width_m?: number | null
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "vehicles_carrier_id_fkey"
            columns: ["carrier_id"]
            isOneToOne: false
            referencedRelation: "carriers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vehicles_connection_device_id_fkey"
            columns: ["connection_device_id"]
            isOneToOne: true
            referencedRelation: "connection_device"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vehicles_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      admin_create_org_and_owner: {
        Args: {
          p_base_country_id: number
          p_city: string
          p_comercial_name: string
          p_legal_name: string
          p_owner_full_name: string
          p_owner_user_id: string
        }
        Returns: string
      }
      assign_dispatch_to_fleet_set: {
        Args: {
          p_dispatch_order_id: string
          p_fleet_set_id: string
          p_user_id: string
        }
        Returns: {
          actual_end_at: string | null
          actual_start_at: string | null
          allocation_period_id: string | null
          carrier_assigned_at: string | null
          carrier_contract_id: string | null
          carrier_id: number | null
          created_at: string
          created_by: string
          dispatch_number: string
          driver_id: number | null
          fleet_set_id: string | null
          id: string
          lane_id: string | null
          notes: string | null
          observance_count: number
          org_id: string
          pickup_window_end: string | null
          pickup_window_start: string | null
          planned_end_at: string
          planned_start_at: string
          rate_card_id: string | null
          response_deadline: string | null
          stage: Database["public"]["Enums"]["dispatch_order_stage"]
          substatus: Database["public"]["Enums"]["dispatch_order_substatus"]
          trailer_id: string | null
          updated_at: string | null
          updated_by: string | null
          vehicle_id: string | null
        }
        SetofOptions: {
          from: "*"
          to: "dispatch_orders"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      auto_assign_dispatch_to_best_fleet: {
        Args: { p_dispatch_order_id: string; p_user_id: string }
        Returns: Json
      }
      batch_auto_assign_dispatch_orders: {
        Args: { p_dispatch_order_ids: string[]; p_user_id: string }
        Returns: Json
      }
      carrier_accept_dispatch_order: {
        Args: { p_accepted_by: string; p_dispatch_order_id: string }
        Returns: {
          actual_end_at: string | null
          actual_start_at: string | null
          allocation_period_id: string | null
          carrier_assigned_at: string | null
          carrier_contract_id: string | null
          carrier_id: number | null
          created_at: string
          created_by: string
          dispatch_number: string
          driver_id: number | null
          fleet_set_id: string | null
          id: string
          lane_id: string | null
          notes: string | null
          observance_count: number
          org_id: string
          pickup_window_end: string | null
          pickup_window_start: string | null
          planned_end_at: string
          planned_start_at: string
          rate_card_id: string | null
          response_deadline: string | null
          stage: Database["public"]["Enums"]["dispatch_order_stage"]
          substatus: Database["public"]["Enums"]["dispatch_order_substatus"]
          trailer_id: string | null
          updated_at: string | null
          updated_by: string | null
          vehicle_id: string | null
        }
        SetofOptions: {
          from: "*"
          to: "dispatch_orders"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      carrier_accept_with_changes: {
        Args: {
          p_accepted_by: string
          p_dispatch_order_id: string
          p_new_fleet_set_id: string
          p_reason?: string
        }
        Returns: {
          actual_end_at: string | null
          actual_start_at: string | null
          allocation_period_id: string | null
          carrier_assigned_at: string | null
          carrier_contract_id: string | null
          carrier_id: number | null
          created_at: string
          created_by: string
          dispatch_number: string
          driver_id: number | null
          fleet_set_id: string | null
          id: string
          lane_id: string | null
          notes: string | null
          observance_count: number
          org_id: string
          pickup_window_end: string | null
          pickup_window_start: string | null
          planned_end_at: string
          planned_start_at: string
          rate_card_id: string | null
          response_deadline: string | null
          stage: Database["public"]["Enums"]["dispatch_order_stage"]
          substatus: Database["public"]["Enums"]["dispatch_order_substatus"]
          trailer_id: string | null
          updated_at: string | null
          updated_by: string | null
          vehicle_id: string | null
        }
        SetofOptions: {
          from: "*"
          to: "dispatch_orders"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      carrier_previously_rejected_order: {
        Args: { p_carrier_id: number; p_dispatch_order_id: string }
        Returns: boolean
      }
      carrier_reject_dispatch_order: {
        Args: {
          p_dispatch_order_id: string
          p_reason: string
          p_rejected_by: string
        }
        Returns: {
          actual_end_at: string | null
          actual_start_at: string | null
          allocation_period_id: string | null
          carrier_assigned_at: string | null
          carrier_contract_id: string | null
          carrier_id: number | null
          created_at: string
          created_by: string
          dispatch_number: string
          driver_id: number | null
          fleet_set_id: string | null
          id: string
          lane_id: string | null
          notes: string | null
          observance_count: number
          org_id: string
          pickup_window_end: string | null
          pickup_window_start: string | null
          planned_end_at: string
          planned_start_at: string
          rate_card_id: string | null
          response_deadline: string | null
          stage: Database["public"]["Enums"]["dispatch_order_stage"]
          substatus: Database["public"]["Enums"]["dispatch_order_substatus"]
          trailer_id: string | null
          updated_at: string | null
          updated_by: string | null
          vehicle_id: string | null
        }
        SetofOptions: {
          from: "*"
          to: "dispatch_orders"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      complete_dispatch_order: {
        Args: {
          p_actual_end_at?: string
          p_completed_by: string
          p_dispatch_order_id: string
        }
        Returns: {
          actual_end_at: string | null
          actual_start_at: string | null
          allocation_period_id: string | null
          carrier_assigned_at: string | null
          carrier_contract_id: string | null
          carrier_id: number | null
          created_at: string
          created_by: string
          dispatch_number: string
          driver_id: number | null
          fleet_set_id: string | null
          id: string
          lane_id: string | null
          notes: string | null
          observance_count: number
          org_id: string
          pickup_window_end: string | null
          pickup_window_start: string | null
          planned_end_at: string
          planned_start_at: string
          rate_card_id: string | null
          response_deadline: string | null
          stage: Database["public"]["Enums"]["dispatch_order_stage"]
          substatus: Database["public"]["Enums"]["dispatch_order_substatus"]
          trailer_id: string | null
          updated_at: string | null
          updated_by: string | null
          vehicle_id: string | null
        }
        SetofOptions: {
          from: "*"
          to: "dispatch_orders"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      dispatch_order: {
        Args: { p_dispatch_order_id: string; p_dispatched_by: string }
        Returns: {
          actual_end_at: string | null
          actual_start_at: string | null
          allocation_period_id: string | null
          carrier_assigned_at: string | null
          carrier_contract_id: string | null
          carrier_id: number | null
          created_at: string
          created_by: string
          dispatch_number: string
          driver_id: number | null
          fleet_set_id: string | null
          id: string
          lane_id: string | null
          notes: string | null
          observance_count: number
          org_id: string
          pickup_window_end: string | null
          pickup_window_start: string | null
          planned_end_at: string
          planned_start_at: string
          rate_card_id: string | null
          response_deadline: string | null
          stage: Database["public"]["Enums"]["dispatch_order_stage"]
          substatus: Database["public"]["Enums"]["dispatch_order_substatus"]
          trailer_id: string | null
          updated_at: string | null
          updated_by: string | null
          vehicle_id: string | null
        }
        SetofOptions: {
          from: "*"
          to: "dispatch_orders"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      ensure_current_period: {
        Args: { p_carrier_id: number; p_org_id: string; p_ref_date?: string }
        Returns: {
          carried_over: number
          carrier_id: number
          dispatched_count: number
          id: string
          org_id: string
          period_end: string
          period_start: string
          rejected_count: number
          rule_id: string
          target_orders: number
        }
        SetofOptions: {
          from: "*"
          to: "carrier_allocation_periods"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      get_allocation_period_for_date: {
        Args: { p_carrier_id: number; p_org_id: string; p_target_date: string }
        Returns: {
          carried_over: number
          carrier_id: number
          dispatched_count: number
          id: string
          org_id: string
          period_end: string
          period_start: string
          rejected_count: number
          rule_id: string
          target_orders: number
        }
        SetofOptions: {
          from: "*"
          to: "carrier_allocation_periods"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      get_best_fleet_candidate_for_dispatch: {
        Args: { p_dispatch_order_id: string }
        Returns: string
      }
      get_carrier_allocation_status: {
        Args: { p_as_of_date?: string; p_carrier_id: number; p_org_id: string }
        Returns: {
          carried_over: number
          dispatched_count: number
          is_over_rejection_threshold: boolean
          period_end: string
          period_start: string
          rejected_count: number
          rejection_rate: number
          remaining_quota: number
          target_orders: number
          total_quota: number
        }[]
      }
      get_carrier_observance_stats: {
        Args: {
          p_carrier_id: number
          p_from_date?: string
          p_org_id: string
          p_to_date?: string
        }
        Returns: {
          by_cleanliness: number
          by_documentation: number
          by_equipment_failure: number
          by_other: number
          by_temperature: number
          resolved_canceled: number
          resolved_fixed: number
          resolved_rejected: number
          still_open: number
          total_observances: number
        }[]
      }
      get_carrier_type_options: {
        Args: never
        Returns: {
          label: string
          value: string
        }[]
      }
      get_currency_code_options: {
        Args: never
        Returns: {
          label: string
          value: string
        }[]
      }
      get_dispatch_order_carrier_history: {
        Args: { p_dispatch_order_id: string }
        Returns: {
          assigned_at: string
          carrier_id: number
          carrier_name: string
          counted_as: string
          duration_hours: number
          outcome: Database["public"]["Enums"]["carrier_assignment_outcome"]
          outcome_reason: string
          responded_at: string
        }[]
      }
      get_dispatch_order_fleet_candidates: {
        Args: { p_dispatch_order_id: string; p_limit?: number }
        Returns: Json[]
      }
      get_dispatch_order_observance_history: {
        Args: { p_dispatch_order_id: string }
        Returns: {
          carrier_id: number
          carrier_name: string
          cause: Database["public"]["Enums"]["observance_cause_type"]
          duration_hours: number
          observance_number: number
          observed_at: string
          observed_by_name: string
          reason: string
          resolution: Database["public"]["Enums"]["observance_resolution_type"]
          resolution_notes: string
          resolved_at: string
          resolved_by_name: string
        }[]
      }
      get_expired_pending_assignments: {
        Args: { p_org_id: string }
        Returns: {
          assigned_at: string
          carrier_id: number
          carrier_name: string
          dispatch_number: string
          dispatch_order_id: string
          hours_overdue: number
          hours_pending: number
          timeout_threshold_hours: number
        }[]
      }
      get_org_allocation_statuses: {
        Args: { p_as_of_date?: string; p_org_id: string }
        Returns: {
          carried_over: number
          carrier_id: number
          dispatched_count: number
          is_over_rejection_threshold: boolean
          period_end: string
          period_start: string
          rejected_count: number
          rejection_rate: number
          remaining_quota: number
          target_orders: number
          total_quota: number
        }[]
      }
      get_user_org_role: {
        Args: { p_org_id: string; p_user_id?: string }
        Returns: Database["public"]["Enums"]["user_role"]
      }
      has_org_min_role: {
        Args: {
          p_min_role: Database["public"]["Enums"]["user_role"]
          p_org_id: string
        }
        Returns: boolean
      }
      is_org_member: {
        Args: { p_org_id: string; p_user_id?: string }
        Returns: boolean
      }
      is_platform_admin: { Args: never; Returns: boolean }
      mark_dispatch_order_arrived: {
        Args: {
          p_actual_start_at?: string
          p_dispatch_order_id: string
          p_marked_by: string
        }
        Returns: {
          actual_end_at: string | null
          actual_start_at: string | null
          allocation_period_id: string | null
          carrier_assigned_at: string | null
          carrier_contract_id: string | null
          carrier_id: number | null
          created_at: string
          created_by: string
          dispatch_number: string
          driver_id: number | null
          fleet_set_id: string | null
          id: string
          lane_id: string | null
          notes: string | null
          observance_count: number
          org_id: string
          pickup_window_end: string | null
          pickup_window_start: string | null
          planned_end_at: string
          planned_start_at: string
          rate_card_id: string | null
          response_deadline: string | null
          stage: Database["public"]["Enums"]["dispatch_order_stage"]
          substatus: Database["public"]["Enums"]["dispatch_order_substatus"]
          trailer_id: string | null
          updated_at: string | null
          updated_by: string | null
          vehicle_id: string | null
        }
        SetofOptions: {
          from: "*"
          to: "dispatch_orders"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      mark_dispatch_order_observance: {
        Args: {
          p_cause: Database["public"]["Enums"]["observance_cause_type"]
          p_dispatch_order_id: string
          p_observed_by: string
          p_reason?: string
        }
        Returns: {
          actual_end_at: string | null
          actual_start_at: string | null
          allocation_period_id: string | null
          carrier_assigned_at: string | null
          carrier_contract_id: string | null
          carrier_id: number | null
          created_at: string
          created_by: string
          dispatch_number: string
          driver_id: number | null
          fleet_set_id: string | null
          id: string
          lane_id: string | null
          notes: string | null
          observance_count: number
          org_id: string
          pickup_window_end: string | null
          pickup_window_start: string | null
          planned_end_at: string
          planned_start_at: string
          rate_card_id: string | null
          response_deadline: string | null
          stage: Database["public"]["Enums"]["dispatch_order_stage"]
          substatus: Database["public"]["Enums"]["dispatch_order_substatus"]
          trailer_id: string | null
          updated_at: string | null
          updated_by: string | null
          vehicle_id: string | null
        }
        SetofOptions: {
          from: "*"
          to: "dispatch_orders"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      org_cancel_dispatch_order: {
        Args: {
          p_canceled_by: string
          p_dispatch_order_id: string
          p_reason?: string
        }
        Returns: {
          actual_end_at: string | null
          actual_start_at: string | null
          allocation_period_id: string | null
          carrier_assigned_at: string | null
          carrier_contract_id: string | null
          carrier_id: number | null
          created_at: string
          created_by: string
          dispatch_number: string
          driver_id: number | null
          fleet_set_id: string | null
          id: string
          lane_id: string | null
          notes: string | null
          observance_count: number
          org_id: string
          pickup_window_end: string | null
          pickup_window_start: string | null
          planned_end_at: string
          planned_start_at: string
          rate_card_id: string | null
          response_deadline: string | null
          stage: Database["public"]["Enums"]["dispatch_order_stage"]
          substatus: Database["public"]["Enums"]["dispatch_order_substatus"]
          trailer_id: string | null
          updated_at: string | null
          updated_by: string | null
          vehicle_id: string | null
        }
        SetofOptions: {
          from: "*"
          to: "dispatch_orders"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      org_cancel_observed_dispatch_order: {
        Args: {
          p_canceled_by: string
          p_dispatch_order_id: string
          p_reason?: string
        }
        Returns: {
          actual_end_at: string | null
          actual_start_at: string | null
          allocation_period_id: string | null
          carrier_assigned_at: string | null
          carrier_contract_id: string | null
          carrier_id: number | null
          created_at: string
          created_by: string
          dispatch_number: string
          driver_id: number | null
          fleet_set_id: string | null
          id: string
          lane_id: string | null
          notes: string | null
          observance_count: number
          org_id: string
          pickup_window_end: string | null
          pickup_window_start: string | null
          planned_end_at: string
          planned_start_at: string
          rate_card_id: string | null
          response_deadline: string | null
          stage: Database["public"]["Enums"]["dispatch_order_stage"]
          substatus: Database["public"]["Enums"]["dispatch_order_substatus"]
          trailer_id: string | null
          updated_at: string | null
          updated_by: string | null
          vehicle_id: string | null
        }
        SetofOptions: {
          from: "*"
          to: "dispatch_orders"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      resolve_observance_to_scheduled: {
        Args: {
          p_dispatch_order_id: string
          p_resolution_notes?: string
          p_resolved_by: string
        }
        Returns: {
          actual_end_at: string | null
          actual_start_at: string | null
          allocation_period_id: string | null
          carrier_assigned_at: string | null
          carrier_contract_id: string | null
          carrier_id: number | null
          created_at: string
          created_by: string
          dispatch_number: string
          driver_id: number | null
          fleet_set_id: string | null
          id: string
          lane_id: string | null
          notes: string | null
          observance_count: number
          org_id: string
          pickup_window_end: string | null
          pickup_window_start: string | null
          planned_end_at: string
          planned_start_at: string
          rate_card_id: string | null
          response_deadline: string | null
          stage: Database["public"]["Enums"]["dispatch_order_stage"]
          substatus: Database["public"]["Enums"]["dispatch_order_substatus"]
          trailer_id: string | null
          updated_at: string | null
          updated_by: string | null
          vehicle_id: string | null
        }
        SetofOptions: {
          from: "*"
          to: "dispatch_orders"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      role_rank: {
        Args: { p_role: Database["public"]["Enums"]["user_role"] }
        Returns: number
      }
      rollover_period_if_needed: {
        Args: { p_carrier_id: number; p_org_id: string; p_ref_date?: string }
        Returns: {
          carried_over: number
          carrier_id: number
          dispatched_count: number
          id: string
          org_id: string
          period_end: string
          period_start: string
          rejected_count: number
          rule_id: string
          target_orders: number
        }
        SetofOptions: {
          from: "*"
          to: "carrier_allocation_periods"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      send_dispatch_order_to_carrier: {
        Args: { p_dispatch_order_id: string; p_sent_by: string }
        Returns: {
          actual_end_at: string | null
          actual_start_at: string | null
          allocation_period_id: string | null
          carrier_assigned_at: string | null
          carrier_contract_id: string | null
          carrier_id: number | null
          created_at: string
          created_by: string
          dispatch_number: string
          driver_id: number | null
          fleet_set_id: string | null
          id: string
          lane_id: string | null
          notes: string | null
          observance_count: number
          org_id: string
          pickup_window_end: string | null
          pickup_window_start: string | null
          planned_end_at: string
          planned_start_at: string
          rate_card_id: string | null
          response_deadline: string | null
          stage: Database["public"]["Enums"]["dispatch_order_stage"]
          substatus: Database["public"]["Enums"]["dispatch_order_substatus"]
          trailer_id: string | null
          updated_at: string | null
          updated_by: string | null
          vehicle_id: string | null
        }
        SetofOptions: {
          from: "*"
          to: "dispatch_orders"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      timeout_carrier_assignment: {
        Args: {
          p_dispatch_order_id: string
          p_reason?: string
          p_timed_out_by: string
        }
        Returns: {
          actual_end_at: string | null
          actual_start_at: string | null
          allocation_period_id: string | null
          carrier_assigned_at: string | null
          carrier_contract_id: string | null
          carrier_id: number | null
          created_at: string
          created_by: string
          dispatch_number: string
          driver_id: number | null
          fleet_set_id: string | null
          id: string
          lane_id: string | null
          notes: string | null
          observance_count: number
          org_id: string
          pickup_window_end: string | null
          pickup_window_start: string | null
          planned_end_at: string
          planned_start_at: string
          response_deadline: string | null
          stage: Database["public"]["Enums"]["dispatch_order_stage"]
          substatus: Database["public"]["Enums"]["dispatch_order_substatus"]
          trailer_id: string | null
          updated_at: string | null
          updated_by: string | null
          vehicle_id: string | null
        }
        SetofOptions: {
          from: "*"
          to: "dispatch_orders"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      timeout_expired_assignments_for_org: {
        Args: { p_org_id: string; p_processed_by: string }
        Returns: {
          assigned_at: string
          carrier_id: number
          carrier_name: string
          dispatch_number: string
          dispatch_order_id: string
          hours_pending: number
          timeout_threshold_hours: number
        }[]
      }
      timeout_expired_carrier_assignments: {
        Args: never
        Returns: {
          assigned_at: string
          carrier_id: number
          dispatch_order_id: string
          org_id: string
          timeout_hours: number
        }[]
      }
    }
    Enums: {
      account_status:
      | "ACTIVE"
      | "PAST_DUE"
      | "SUSPENDED"
      | "CANCELED"
      | "INACTIVE"
      app_load_capacity_type:
      | "PALLET"
      | "MEAT_HOOK"
      | "BASKET"
      | "BOX"
      | "BIN"
      | "BULK"
      | "OTHER"
      asset_operational_status:
      | "ACTIVE"
      | "IN_SERVICE"
      | "IN_MAINTENANCE"
      | "OUT_OF_SERVICE"
      | "RETIRED"
      | "IN_TRANSIT"
      assigned_type: "VEHICLE" | "TRAILER"
      canceled_by_type: "CARRIER" | "ORGANIZATION" | "SYSTEM"
      carrier_assignment_outcome:
      | "PENDING"
      | "ACCEPTED"
      | "REJECTED"
      | "CANCELED_BY_ORG"
      | "TIMEOUT"
      | "REASSIGNED"
      | "CANCELED_OBSERVED"
      carrier_type: "OWNER" | "THIRD PARTY"
      currency_code: "BOB" | "USD"
      dispatch_order_stage:
      | "DISPATCH"
      | "TENDERS"
      | "SCHEDULED"
      | "EXECUTION"
      | "CONCILIATION"
      dispatch_order_status:
      | "UNASSIGNED"
      | "PENDING"
      | "ASSIGNED"
      | "REJECTED"
      | "SCHEDULED"
      | "AT_DESTINATION"
      | "DISPATCHED"
      | "CANCELED"
      | "OBSERVANCE"
      | "COMPLETED"
      dispatch_order_substatus:
      | "NEW"
      | "UNASSIGNED"
      | "ASSIGNED"
      | "PENDING"
      | "ACCEPTED"
      | "REJECTED"
      | "EXPIRED"
      | "PROGRAMMED"
      | "DISPATCHED"
      | "EN_ROUTE_TO_ORIGIN"
      | "AT_ORIGIN"
      | "LOADING"
      | "OBSERVED"
      | "IN_TRANSIT"
      | "AT_DESTINATION"
      | "DELIVERED"
      | "PENDING_AUDIT"
      | "UNDER_REVIEW"
      | "DISPUTED"
      | "APPROVED"
      | "CLOSED"
      | "CANCELED"
      driver_status: "AVAILABLE" | "INACTIVE" | "DRIVING"
      observance_cause_type:
      | "TEMPERATURE"
      | "CLEANLINESS"
      | "EQUIPMENT_FAILURE"
      | "DOCUMENTATION"
      | "OTHER"
      observance_resolution_type: "FIXED" | "CANCELED" | "REJECTED"
      plan_type: "STARTER" | "PROFESSIONAL"
      reefer_owner_type: "TRAILER" | "VEHICLE"
      reefer_power_supply: "DIESEL" | "ELECTRIC" | "HYBRID"
      stop_types:
      | "PICKUP"
      | "MANDATORY_WAYPOINT"
      | "OPTIONAL_WAYPOINT"
      | "DROP_OFF"
      user_role: "OWNER" | "ADMIN" | "STAFF" | "DRIVER" | "DEV" | "CARRIER"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
  | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
  | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
  ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
    DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
  : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
    DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
  ? R
  : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
    DefaultSchema["Views"])
  ? (DefaultSchema["Tables"] &
    DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
      Row: infer R
    }
  ? R
  : never
  : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
  | keyof DefaultSchema["Tables"]
  | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
  ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
  : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
    Insert: infer I
  }
  ? I
  : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
  ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
    Insert: infer I
  }
  ? I
  : never
  : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
  | keyof DefaultSchema["Tables"]
  | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
  ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
  : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
    Update: infer U
  }
  ? U
  : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
  ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
    Update: infer U
  }
  ? U
  : never
  : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
  | keyof DefaultSchema["Enums"]
  | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
  ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
  : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
  ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
  : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
  | keyof DefaultSchema["CompositeTypes"]
  | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
  ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
  : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
  ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
  : never

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      account_status: [
        "ACTIVE",
        "PAST_DUE",
        "SUSPENDED",
        "CANCELED",
        "INACTIVE",
      ],
      app_load_capacity_type: [
        "PALLET",
        "MEAT_HOOK",
        "BASKET",
        "BOX",
        "BIN",
        "BULK",
        "OTHER",
      ],
      asset_operational_status: [
        "ACTIVE",
        "IN_SERVICE",
        "IN_MAINTENANCE",
        "OUT_OF_SERVICE",
        "RETIRED",
        "IN_TRANSIT",
      ],
      assigned_type: ["VEHICLE", "TRAILER"],
      canceled_by_type: ["CARRIER", "ORGANIZATION", "SYSTEM"],
      carrier_assignment_outcome: [
        "PENDING",
        "ACCEPTED",
        "REJECTED",
        "CANCELED_BY_ORG",
        "TIMEOUT",
        "REASSIGNED",
        "CANCELED_OBSERVED",
      ],
      carrier_type: ["OWNER", "THIRD PARTY"],
      currency_code: ["BOB", "USD"],
      dispatch_order_stage: [
        "DISPATCH",
        "TENDERS",
        "SCHEDULED",
        "EXECUTION",
        "CONCILIATION",
      ],
      dispatch_order_status: [
        "UNASSIGNED",
        "PENDING",
        "ASSIGNED",
        "REJECTED",
        "SCHEDULED",
        "AT_DESTINATION",
        "DISPATCHED",
        "CANCELED",
        "OBSERVANCE",
        "COMPLETED",
      ],
      dispatch_order_substatus: [
        "NEW",
        "UNASSIGNED",
        "ASSIGNED",
        "PENDING",
        "ACCEPTED",
        "REJECTED",
        "EXPIRED",
        "PROGRAMMED",
        "DISPATCHED",
        "EN_ROUTE_TO_ORIGIN",
        "AT_ORIGIN",
        "LOADING",
        "OBSERVED",
        "IN_TRANSIT",
        "AT_DESTINATION",
        "DELIVERED",
        "PENDING_AUDIT",
        "UNDER_REVIEW",
        "DISPUTED",
        "APPROVED",
        "CLOSED",
        "CANCELED",
      ],
      driver_status: ["AVAILABLE", "INACTIVE", "DRIVING"],
      observance_cause_type: [
        "TEMPERATURE",
        "CLEANLINESS",
        "EQUIPMENT_FAILURE",
        "DOCUMENTATION",
        "OTHER",
      ],
      observance_resolution_type: ["FIXED", "CANCELED", "REJECTED"],
      plan_type: ["STARTER", "PROFESSIONAL"],
      reefer_owner_type: ["TRAILER", "VEHICLE"],
      reefer_power_supply: ["DIESEL", "ELECTRIC", "HYBRID"],
      stop_types: [
        "PICKUP",
        "MANDATORY_WAYPOINT",
        "OPTIONAL_WAYPOINT",
        "DROP_OFF",
      ],
      user_role: ["OWNER", "ADMIN", "STAFF", "DRIVER", "DEV", "CARRIER"],
    },
  },
} as const

// Type aliases for table rows
export type Product = Database['public']['Tables']['products']['Row']
export type ProductInsert = Database['public']['Tables']['products']['Insert']
export type ProductUpdate = Database['public']['Tables']['products']['Update']

export type ThermalProfile = Database['public']['Tables']['thermal_profile']['Row']
export type ThermalProfileInsert = Database['public']['Tables']['thermal_profile']['Insert']
export type ThermalProfileUpdate = Database['public']['Tables']['thermal_profile']['Update']

export type ProductThermalProfile = Database['public']['Tables']['product_thermal_profiles']['Row']
export type ProductThermalProfileInsert = Database['public']['Tables']['product_thermal_profiles']['Insert']
export type ProductThermalProfileUpdate = Database['public']['Tables']['product_thermal_profiles']['Update']

export type Lane = Database['public']['Tables']['lanes']['Row']
export type LaneInsert = Database['public']['Tables']['lanes']['Insert']
export type LaneUpdate = Database['public']['Tables']['lanes']['Update']

export type DispatchOrder = Database['public']['Tables']['dispatch_orders']['Row']
export type DispatchOrderInsert = Database['public']['Tables']['dispatch_orders']['Insert']
export type DispatchOrderUpdate = Database['public']['Tables']['dispatch_orders']['Update']

export type Carrier = Database['public']['Tables']['carriers']['Row']
export type CarrierInsert = Database['public']['Tables']['carriers']['Insert']
export type CarrierUpdate = Database['public']['Tables']['carriers']['Update']

export type FleetSet = Database['public']['Tables']['fleet_sets']['Row']
export type FleetSetInsert = Database['public']['Tables']['fleet_sets']['Insert']
export type FleetSetUpdate = Database['public']['Tables']['fleet_sets']['Update']

export type DispatchOrderStage = Database['public']['Enums']['dispatch_order_stage']
export type DispatchOrderSubstatus = Database['public']['Enums']['dispatch_order_substatus']

export type LaneStop = Database['public']['Tables']['lane_stops']['Row']
export type LaneStopInsert = Database['public']['Tables']['lane_stops']['Insert']
export type LaneStopUpdate = Database['public']['Tables']['lane_stops']['Update']

export type Organization = Database['public']['Tables']['organizations']['Row']
export type OrganizationInsert = Database['public']['Tables']['organizations']['Insert']
export type OrganizationUpdate = Database['public']['Tables']['organizations']['Update']

export type Location = Database['public']['Tables']['locations']['Row']
export type LocationInsert = Database['public']['Tables']['locations']['Insert']
export type LocationUpdate = Database['public']['Tables']['locations']['Update']

export type LaneType = Database['public']['Tables']['lane_types']['Row']
export type LaneTypeInsert = Database['public']['Tables']['lane_types']['Insert']
export type LaneTypeUpdate = Database['public']['Tables']['lane_types']['Update']

export type OrganizationMember = Database['public']['Tables']['organization_members']['Row']
export type OrganizationMemberInsert = Database['public']['Tables']['organization_members']['Insert']
export type OrganizationMemberUpdate = Database['public']['Tables']['organization_members']['Update']

export type FlespiProtocol = Database['public']['Tables']['flespi_protocols']['Row']
export type FlespiProtocolInsert = Database['public']['Tables']['flespi_protocols']['Insert']
export type FlespiProtocolUpdate = Database['public']['Tables']['flespi_protocols']['Update']

export type FlespiDeviceType = Database['public']['Tables']['flespi_device_types']['Row']
export type FlespiDeviceTypeInsert = Database['public']['Tables']['flespi_device_types']['Insert']
export type FlespiDeviceTypeUpdate = Database['public']['Tables']['flespi_device_types']['Update']

// Hardware & Telematics types
export type ConnectionDevice = Database['public']['Tables']['connection_device']['Row']
export type ConnectionDeviceInsert = Database['public']['Tables']['connection_device']['Insert']
export type ConnectionDeviceUpdate = Database['public']['Tables']['connection_device']['Update']

export type TelematicsProvider = Database['public']['Tables']['telematics_provider']['Row']
export type TelematicsProviderInsert = Database['public']['Tables']['telematics_provider']['Insert']
export type TelematicsProviderUpdate = Database['public']['Tables']['telematics_provider']['Update']

export type AssignedType = 'VEHICLE' | 'TRAILER' | 'INVENTORY'

// Vehicle & Trailer types (if not already exported)
export type Vehicle = Database['public']['Tables']['vehicles']['Row']
export type VehicleInsert = Database['public']['Tables']['vehicles']['Insert']
export type VehicleUpdate = Database['public']['Tables']['vehicles']['Update']

export type Trailer = Database['public']['Tables']['trailers']['Row']
export type TrailerInsert = Database['public']['Tables']['trailers']['Insert']
export type TrailerUpdate = Database['public']['Tables']['trailers']['Update']

export type Driver = Database['public']['Tables']['drivers']['Row']
export type DriverInsert = Database['public']['Tables']['drivers']['Insert']
export type DriverUpdate = Database['public']['Tables']['drivers']['Update']
