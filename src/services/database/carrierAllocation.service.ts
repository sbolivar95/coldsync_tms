import { supabase } from '../../lib/supabase'
import type { Database } from '../../types/database.types'

export type CarrierAllocationRule = Database['public']['Tables']['carrier_allocation_rules']['Row']
export type CarrierAllocationRuleInsert = Database['public']['Tables']['carrier_allocation_rules']['Insert']
export type CarrierAllocationRuleUpdate = Database['public']['Tables']['carrier_allocation_rules']['Update']

export interface CarrierAllocationStatus {
  period_start: string
  period_end: string
  target_orders: number
  carried_over: number
  total_quota: number
  dispatched_count: number
  rejected_count: number
  remaining_quota: number
  rejection_rate: number
  is_over_rejection_threshold: boolean
}

export const carrierAllocationService = {
  /**
   * Get the active allocation rule for a carrier
   */
  async getRule(orgId: string, carrierId: number): Promise<CarrierAllocationRule | null> {
    const today = new Date().toISOString().split('T')[0]
    
    const { data, error } = await supabase
      .from('carrier_allocation_rules')
      .select('*')
      .eq('org_id', orgId)
      .eq('carrier_id', carrierId)
      .eq('is_active', true)
      .lte('starts_on', today)
      .or(`ends_on.is.null,ends_on.gte.${today}`)
      .order('starts_on', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (error) throw error
    return data
  },

  /**
   * Create or update an allocation rule
   * Note: This simple implementation updates the existing active rule or creates a new one.
   * For a full history system, we would always create new rules.
   */
  async upsertRule(orgId: string, rule: CarrierAllocationRuleInsert): Promise<CarrierAllocationRule> {
    const { data, error } = await supabase
      .from('carrier_allocation_rules')
      .upsert({
        ...rule,
        org_id: orgId
      })
      .select()
      .single()

    if (error) throw error
    return data
  },

  /**
   * Get the current allocation status for a carrier
   * Uses the RPC function 'get_carrier_allocation_status'
   */
  async getAllocationStatus(orgId: string, carrierId: number): Promise<CarrierAllocationStatus | null> {
    const today = new Date().toISOString().split('T')[0]
    
    const { data, error } = await supabase.rpc('get_carrier_allocation_status', {
      p_org_id: orgId,
      p_carrier_id: carrierId,
      p_as_of_date: today
    })

    if (error) {
      // P0001 is raised when no active rule is found, which is expected for new carriers
      // or carriers without rules. We should return null in this case.
      if (error.code === 'P0001') {
        return null
      }
      
      console.error('Error fetching allocation status:', error)
      return null
    }

    // The RPC returns a set of rows, but we expect a single row for a specific carrier/date
    // If it returns multiple (unlikely given the logic), we take the first one
    if (Array.isArray(data) && data.length > 0) {
      return data[0] as CarrierAllocationStatus
    } else if (data && !Array.isArray(data)) {
        return data as unknown as CarrierAllocationStatus
    }

    return null
  },

  /**
   * Get allocation status for all carriers in an organization for a specific date (default today)
   */
  async getOrgAllocationStatuses(orgId: string): Promise<Record<number, CarrierAllocationStatus> | null> {
    const today = new Date().toISOString().split('T')[0]
    
    // Call RPC function
    const { data, error } = await supabase.rpc('get_org_allocation_statuses', {
      p_org_id: orgId,
      p_as_of_date: today
    })

    if (error) {
      console.error('Error fetching org allocation statuses:', error)
      return null
    }

    // Transform array to map by carrier_id
    if (!data) return {}
    
    const statuses: Record<number, CarrierAllocationStatus> = {}
    data.forEach((item: any) => {
      statuses[item.carrier_id] = item as CarrierAllocationStatus
    })
    
    return statuses
  },

  /**
   * Get allocation periods history for a carrier
   */
  async getAllocationPeriods(
    orgId: string, 
    carrierId: number, 
    range?: { start: string, end: string }
  ): Promise<Database['public']['Tables']['carrier_allocation_periods']['Row'][]> {
    let query = supabase
      .from('carrier_allocation_periods')
      .select('*')
      .eq('org_id', orgId)
      .eq('carrier_id', carrierId)
      .order('period_start', { ascending: false })

    if (range) {
      query = query
        .gte('period_start', range.start)
        .lte('period_end', range.end)
    }

    const { data, error } = await query

    if (error) {
      console.error('Error fetching allocation periods:', error)
      return []
    }

    return data
  }
}
