/**
 * Cancellation Reasons Service
 * 
 * Handles operations for cancellation_reasons catalog.
 * This catalog is organization-specific (multitenant) and defines
 * the reasons why a shipper can cancel a dispatch order.
 */

import { supabase } from '../../lib/supabase';

export interface CancellationReason {
  id: string;
  org_id: string;
  code: string;
  label: string;
  category: string | null;
  requires_comment: boolean | null;
  is_active: boolean | null;
  created_at: string | null;
  updated_at: string | null;
}

export const cancellationReasonsService = {
  /**
   * Get all active cancellation reasons for an organization
   * Filters by org_id and is_active = true
   * Orders by category and label for consistent display
   */
  async getActiveReasons(orgId: string): Promise<CancellationReason[]> {
    const { data, error } = await supabase
      .from('cancellation_reasons')
      .select('*')
      .eq('org_id', orgId)
      .eq('is_active', true)
      .order('category', { ascending: true })
      .order('label', { ascending: true });

    if (error) {
      console.error('Error fetching cancellation reasons:', error);
      throw error;
    }

    return data || [];
  },

  /**
   * Get a specific cancellation reason by ID
   * Validates org_id for multitenant security
   */
  async getById(id: string, orgId: string): Promise<CancellationReason | null> {
    const { data, error } = await supabase
      .from('cancellation_reasons')
      .select('*')
      .eq('id', id)
      .eq('org_id', orgId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // Not found
        return null;
      }
      console.error('Error fetching cancellation reason:', error);
      throw error;
    }

    return data;
  },

  /**
   * Validate if a cancellation reason requires a comment
   * Used for frontend validation before submitting
   */
  async requiresComment(reasonId: string, orgId: string): Promise<boolean> {
    const reason = await this.getById(reasonId, orgId);
    return reason?.requires_comment ?? false;
  },
};
