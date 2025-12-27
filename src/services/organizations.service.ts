import { supabase } from '../lib/supabase'

// ============================================================================
// TYPES
// ============================================================================

export interface Organization {
  id: string
  comercial_name: string
  legal_name: string
  city?: string | null
  created_by: string
  base_country_id: number
  status: 'ACTIVE' | 'PAST_DUE' | 'SUSPENDED' | 'CANCELED'
  created_at?: string
  updated_at?: string
  // Joined data
  country?: {
    id: number
    name: string
    iso_code: string
  }
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
}

export interface OrganizationUpdate {
  comercial_name?: string
  legal_name?: string
  city?: string | null
  base_country_id?: number
  status?: 'ACTIVE' | 'PAST_DUE' | 'SUSPENDED' | 'CANCELED'
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
  temp_password: string
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
      .select(
        `
        *,
        country:countries(id, name, iso_code)
      `
      )
      .order('comercial_name', { ascending: true })

    if (error) throw error
    return data || []
  },

  /**
   * Get a single organization by ID
   */
  async getById(id: string): Promise<Organization | null> {
    const { data, error } = await supabase
      .from('organizations')
      .select(
        `
        *,
        country:countries(id, name, iso_code)
      `
      )
      .eq('id', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') return null
      throw error
    }
    return data
  },

  /**
   * Get active organizations
   */
  async getActive(): Promise<Organization[]> {
    const { data, error } = await supabase
      .from('organizations')
      .select(
        `
        *,
        country:countries(id, name, iso_code)
      `
      )
      .eq('status', 'ACTIVE')
      .order('comercial_name', { ascending: true })

    if (error) throw error
    return data || []
  },

  /**
   * Update an organization
   */
  async update(id: string, updates: OrganizationUpdate): Promise<Organization> {
    const { data, error } = await supabase
      .from('organizations')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select(
        `
        *,
        country:countries(id, name, iso_code)
      `
      )
      .single()

    if (error) throw error
    return data
  },

  /**
   * Change organization status (soft delete by setting to CANCELED)
   */
  async updateStatus(
    id: string,
    status: 'ACTIVE' | 'PAST_DUE' | 'SUSPENDED' | 'CANCELED'
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
   * Search organizations by name
   */
  async search(searchTerm: string): Promise<Organization[]> {
    const { data, error } = await supabase
      .from('organizations')
      .select(
        `
        *,
        country:countries(id, name, iso_code)
      `
      )
      .or(
        `comercial_name.ilike.%${searchTerm}%,legal_name.ilike.%${searchTerm}%`
      )
      .order('comercial_name', { ascending: true })

    if (error) throw error
    return data || []
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

    const response = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/provision-org-owner`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(request),
      }
    )

    const result = await response.json()

    if (!response.ok) {
      throw new Error(result.error || 'Failed to provision organization')
    }

    return result
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
