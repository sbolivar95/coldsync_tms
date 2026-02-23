import { supabase } from '../../lib/supabase'
import type { Organization as DatabaseOrganization } from '../../types/database.types'

// ============================================================================
// TYPES
// ============================================================================

// Currency enum
export type OrganizationCurrency = 'BOB' | 'USD'

// Plan type enum
export type OrganizationPlanType = 'STARTER' | 'PROFESSIONAL'

// Extended Organization type with JOIN fields
export interface Organization extends DatabaseOrganization {
  base_country?: string // Country name from JOIN
}

export interface Country {
  id: number
  name: string
  iso_code: string
}

export interface OrganizationInsert {
  comercial_name: string
  legal_name: string
  city?: string | null
  base_country_id: number
  // Fiscal fields
  tax_id: string
  fiscal_address: string
  billing_email: string
  // Contact fields
  contact_name: string
  contact_phone: string
  contact_email: string
  // Configuration fields (optional - DB defaults)
  currency?: OrganizationCurrency
  time_zone?: string
  plan_type?: OrganizationPlanType
}

export interface OrganizationUpdate {
  comercial_name?: string
  legal_name?: string
  city?: string | null
  base_country_id?: number
    status?: 'ACTIVE' | 'INACTIVE'
  // Fiscal fields
  tax_id?: string
  fiscal_address?: string
  billing_email?: string
  // Contact fields
  contact_name?: string
  contact_phone?: string
  contact_email?: string
  // Configuration fields
  currency?: OrganizationCurrency
  time_zone?: string
  plan_type?: OrganizationPlanType
}

// For provision-org-owner edge function
export interface ProvisionOrgOwnerRequest {
  owner_email: string
  owner_full_name: string
  comercial_name: string
  legal_name: string
  city?: string | null
  base_country_id: number
}

export interface ProvisionOrgOwnerResponse {
  org_id: string
  owner_user_id: string
  owner_full_name: string
  temp_password?: string
}

// ============================================================================
// ORGANIZATIONS SERVICE
// ============================================================================

export const organizationsService = {
  /**
   * Get all organizations (platform admin only)
   */
  async getAll(): Promise<Organization[]> {
    const { data, error } = await supabase
      .from('organizations')
      .select(`
        *,
        countries (
          name
        )
      `)
      .order('comercial_name', { ascending: true })

    if (error) throw error

    // Transform the data to include country name
    return (data || []).map(org => ({
      ...org,
      base_country: org.countries?.name || null
    }))
  },

  /**
   * Get a single organization by ID
   */
  async getById(id: string): Promise<Organization | null> {
    const { data, error } = await supabase
      .from('organizations')
      .select(`
        *,
        countries (
          name
        )
      `)
      .eq('id', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') return null
      throw error
    }

    // Transform the data to include country name
    return {
      ...data,
      base_country: data.countries?.name || null
    }
  },

  /**
   * Get active organizations
   */
  async getActive(): Promise<Organization[]> {
    const { data, error } = await supabase
      .from('organizations')
      .select(`
        *,
        countries (
          name
        )
      `)
      .eq('status', 'ACTIVE')
      .order('comercial_name', { ascending: true })

    if (error) throw error

    // Transform the data to include country name
    return (data || []).map(org => ({
      ...org,
      base_country: org.countries?.name || null
    }))
  },

  /**
   * Create a new organization
   */
  async create(data: OrganizationInsert): Promise<Organization> {
    const { data: sessionData } = await supabase.auth.getSession()
    const userId = sessionData.session?.user?.id

    if (!userId) {
      throw new Error('No authenticated session')
    }

    const { data: organization, error } = await supabase
      .from('organizations')
      .insert({
        ...data,
        created_by: userId,
        status: 'ACTIVE', // Default status for new organizations
      })
      .select('*')
      .single()

    if (error) throw error
    return organization
  },

  /**
   * Update an organization
   * @param id - Organization ID
   * @param updates - Fields to update
   * @param userRole - User role (OWNER, ADMIN, etc.) - optional for backward compatibility
   * @param isPlatformUser - Whether user is platform admin - optional for backward compatibility
   */
  async update(
    id: string,
    updates: OrganizationUpdate,
    userRole?: string,
    isPlatformUser?: boolean
  ): Promise<Organization> {
    // If user is OWNER (not Platform Admin), filter restricted fields
    if (!isPlatformUser && userRole === 'OWNER') {
      const restrictedFields = [
        'legal_name',
        'tax_id',
        'billing_email',
        'plan_type',
        'status'
      ]

      // Check if user is trying to update restricted fields
      const attemptedRestricted = restrictedFields.filter(
        field => field in updates && updates[field as keyof OrganizationUpdate] !== undefined
      )

      if (attemptedRestricted.length > 0) {
        throw new Error(
          `No tienes permisos para editar los siguientes campos: ${attemptedRestricted.join(', ')}. Estos campos solo pueden ser modificados por un administrador de plataforma.`
        )
      }

      // Filter out restricted fields (defensive programming)
      const allowedUpdates = Object.fromEntries(
        Object.entries(updates).filter(
          ([key]) => !restrictedFields.includes(key)
        )
      ) as OrganizationUpdate

      // Use only allowed fields
      updates = allowedUpdates
    }

    const { data, error } = await supabase
      .from('organizations')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select(`
        *,
        countries (
          name
        )
      `)
      .single()

    if (error) throw error

    // Transform the data to include country name
    return {
      ...data,
      base_country: data.countries?.name || null
    }
  },

  /**
   * Change organization status
   */
  async updateStatus(
    id: string,
    status: 'ACTIVE' | 'INACTIVE'
  ): Promise<void> {
    const { error } = await supabase
      .from('organizations')
      .update({
        status,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)

    if (error) throw error
  },

  /**
   * Delete an organization (soft delete by setting status to INACTIVE)
   */
  async delete(id: string): Promise<void> {
      await this.updateStatus(id, 'INACTIVE')
  },

  /**
   * Search organizations by name
   */
  async search(searchTerm: string): Promise<Organization[]> {
    const { data, error } = await supabase
      .from('organizations')
      .select(`
        *,
        countries (
          name
        )
      `)
      .or(
        `comercial_name.ilike.%${searchTerm}%,legal_name.ilike.%${searchTerm}%`
      )
      .order('comercial_name', { ascending: true })

    if (error) throw error

    // Transform the data to include country name
    return (data || []).map(org => ({
      ...org,
      base_country: org.countries?.name || null
    }))
  },

  /**
   * Provision a new organization with owner using edge function
   * This creates both the organization AND the owner user account
   */
  async provisionWithOwner(
    request: ProvisionOrgOwnerRequest
  ): Promise<ProvisionOrgOwnerResponse> {
    const { data: sessionData } = await supabase.auth.getSession()
    const accessToken = sessionData.session?.access_token

    if (!accessToken) {
      throw new Error('No authenticated session')
    }

    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
    if (!supabaseUrl) {
      throw new Error('VITE_SUPABASE_URL environment variable is not set')
    }

    const response = await fetch(
      `${supabaseUrl}/functions/v1/provision-org-owner`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(request),
      }
    )

    const result: unknown = await response.json()

    if (!response.ok) {
      const errorResult = result as { error?: string }
      throw new Error(errorResult.error || 'Failed to provision organization')
    }

    return result as ProvisionOrgOwnerResponse
  },
}

// ============================================================================
// COUNTRIES SERVICE
// ============================================================================

export const countriesService = {
  /**
   * Get all countries
   */
  async getAll(): Promise<Country[]> {
    const { data, error } = await supabase
      .from('countries')
      .select('*')
      .order('name', { ascending: true })

    if (error) throw error
    return data || []
  },

  /**
   * Get a country by ID
   */
  async getById(id: number): Promise<Country | null> {
    const { data, error } = await supabase
      .from('countries')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') return null
      throw error
    }
    return data
  },
}
