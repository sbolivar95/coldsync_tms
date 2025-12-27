import { supabase } from '../lib/supabase'

export interface Organization {
  id: string
  comercial_name: string
  legal_name: string
  city: string | null
  created_by: string
  base_country_id: number
  status: 'ACTIVE' | 'SUSPENDED' | 'CLOSED'
  created_at: string
  updated_at: string | null
}

export interface OrganizationInsert {
  comercial_name: string
  legal_name: string
  city?: string | null
  created_by: string
  base_country_id: number
  status?: 'ACTIVE' | 'SUSPENDED' | 'CLOSED'
}

export interface OrganizationUpdate {
  comercial_name?: string
  legal_name?: string
  city?: string | null
  base_country_id?: number
  status?: 'ACTIVE' | 'SUSPENDED' | 'CLOSED'
}

export interface Country {
  id: number
  name: string
  iso_code: string
  created_at: string
}

export interface ProvisionOrgOwnerRequest {
  owner_email: string
  comercial_name: string
  legal_name: string
  city?: string | null
  base_country_id: number
}

export interface ProvisionOrgOwnerResponse {
  org_id: string
  owner_user_id: string
  temp_password: string
}

export interface ProvisionOrgMemberRequest {
  org_id: string
  email: string
  role: 'OWNER' | 'ADMIN' | 'STAFF' | 'DRIVER'
}

export interface ProvisionOrgMemberResponse {
  org_id: string
  user_id: string
  role: string
  temp_password: string
}

/**
 * Organizations Service - CRUD operations for organizations table
 */
export const organizationsService = {
  /**
   * Get all organizations (platform admin only)
   */
  async getAll(): Promise<Organization[]> {
    const { data, error } = await supabase
      .from('organizations')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error
    return data || []
  },

  /**
   * Get a single organization by ID
   */
  async getById(id: string): Promise<Organization | null> {
    const { data, error } = await supabase
      .from('organizations')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') return null
      throw error
    }
    return data
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
      .select()
      .single()

    if (error) throw error
    return data
  },

  /**
   * Create organization with owner via Edge Function
   * This requires platform admin privileges
   */
  async createWithOwner(
    request: ProvisionOrgOwnerRequest
  ): Promise<ProvisionOrgOwnerResponse> {
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession()

    if (sessionError || !session) {
      throw new Error('No active session')
    }

    const response = await fetch(
      `${supabase.supabaseUrl}/functions/v1/provision-org-owner`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify(request),
      }
    )

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to create organization')
    }

    return await response.json()
  },

  /**
   * Add member to organization via Edge Function
   * This requires platform admin privileges
   */
  async addMember(
    request: ProvisionOrgMemberRequest
  ): Promise<ProvisionOrgMemberResponse> {
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession()

    if (sessionError || !session) {
      throw new Error('No active session')
    }

    const response = await fetch(
      `${supabase.supabaseUrl}/functions/v1/provision-org-member`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify(request),
      }
    )

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to add member')
    }

    return await response.json()
  },

  /**
   * Get organization with member count
   */
  async getWithStats(id: string) {
    const { data, error } = await supabase
      .from('organizations')
      .select(
        `
        *,
        organization_members (count)
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
}

/**
 * Countries Service - For country selection
 */
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
   * Get a single country by ID
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

  /**
   * Search countries by name
   */
  async search(searchTerm: string): Promise<Country[]> {
    const { data, error } = await supabase
      .from('countries')
      .select('*')
      .ilike('name', `%${searchTerm}%`)
      .order('name', { ascending: true })
      .limit(10)

    if (error) throw error
    return data || []
  },
}
