import { supabase } from '../lib/supabase'

// ============================================================================
// TYPES
// ============================================================================

export type UserRole = 'OWNER' | 'ADMIN' | 'STAFF' | 'DRIVER'

export interface OrganizationMember {
  id: string
  org_id: string
  user_id: string
  role: UserRole
  full_name: string
  email: string
  phone?: string | null
  created_at: string
}

export interface OrganizationMemberDisplay {
  id: string
  orgId: string
  userId: string
  fullName: string
  email: string
  phone: string
  role: UserRole
  status: 'Activo' | 'Inactivo'
  createdAt: string
}

export interface JoinCode {
  id: number
  org_id: string
  code: string
  role: UserRole
  expires_at: string
  used_at?: string | null
  used_by?: string | null
  created_by: string
  created_at: string
}

export interface JoinCodeDisplay {
  id: number
  code: string
  role: UserRole
  expiresAt: string
  isUsed: boolean
  isExpired: boolean
  createdAt: string
}

// For provision-org-member edge function (platform admin only)
export interface ProvisionMemberRequest {
  org_id: string
  email: string
  role: UserRole
  full_name: string
}

export interface ProvisionMemberResponse {
  org_id: string
  user_id: string
  role: UserRole
  full_name: string
  temp_password: string
}

// ============================================================================
// ORGANIZATION MEMBERS SERVICE
// ============================================================================

export const usersService = {
  /**
   * Get all members for an organization
   */
  async getAll(orgId: string): Promise<OrganizationMember[]> {
    const { data, error } = await supabase
      .from('organization_members')
      .select('*')
      .eq('org_id', orgId)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data || []
  },

  /**
   * Get a single member by ID
   */
  async getById(id: string, orgId: string): Promise<OrganizationMember | null> {
    const { data, error } = await supabase
      .from('organization_members')
      .select('*')
      .eq('id', id)
      .eq('org_id', orgId)
      .single()

    if (error) {
      if (error.code === 'PGRST116') return null
      throw error
    }
    return data
  },

  /**
   * Update a member's role
   */
  async updateRole(
    id: string,
    orgId: string,
    role: UserRole
  ): Promise<OrganizationMember> {
    const { data, error } = await supabase
      .from('organization_members')
      .update({ role })
      .eq('id', id)
      .eq('org_id', orgId)
      .select()
      .single()

    if (error) throw error
    return data
  },

  /**
   * Update member details (full_name, phone)
   */
  async update(
    id: string,
    orgId: string,
    updates: { full_name?: string; phone?: string }
  ): Promise<OrganizationMember> {
    const { data, error } = await supabase
      .from('organization_members')
      .update(updates)
      .eq('id', id)
      .eq('org_id', orgId)
      .select()
      .single()

    if (error) throw error
    return data
  },

  /**
   * Remove a member from an organization
   * Note: This only removes the membership, not the auth user
   */
  async remove(id: string, orgId: string): Promise<void> {
    const { error } = await supabase
      .from('organization_members')
      .delete()
      .eq('id', id)
      .eq('org_id', orgId)

    if (error) throw error
  },

  /**
   * Provision a new member using edge function (platform admin only)
   * This creates both the auth user AND the organization membership
   */
  async provision(
    request: ProvisionMemberRequest
  ): Promise<ProvisionMemberResponse> {
    const { data: sessionData } = await supabase.auth.getSession()
    const accessToken = sessionData.session?.access_token

    if (!accessToken) {
      throw new Error('No authenticated session')
    }

    const response = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/provision-org-member`,
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
      throw new Error(result.error || 'Failed to provision member')
    }

    return result
  },
}

// ============================================================================
// JOIN CODES SERVICE
// ============================================================================

export const joinCodesService = {
  /**
   * Get all join codes for an organization
   */
  async getAll(orgId: string): Promise<JoinCode[]> {
    const { data, error } = await supabase
      .from('org_join_codes')
      .select('*')
      .eq('org_id', orgId)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data || []
  },

  /**
   * Get active (unused and not expired) join codes
   */
  async getActive(orgId: string): Promise<JoinCode[]> {
    const { data, error } = await supabase
      .from('org_join_codes')
      .select('*')
      .eq('org_id', orgId)
      .is('used_at', null)
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })

    if (error) throw error
    return data || []
  },

  /**
   * Create a new one-time join code using the RPC function
   */
  async create(
    orgId: string,
    role: UserRole = 'STAFF',
    expiresInMinutes: number = 60
  ): Promise<string> {
    const { data, error } = await supabase.rpc('create_one_time_join_code', {
      p_org_id: orgId,
      p_role: role,
      p_expires_in_minutes: expiresInMinutes,
    })

    if (error) throw error
    return data as string
  },

  /**
   * Delete a join code (only if not used)
   */
  async delete(id: number, orgId: string): Promise<void> {
    const { error } = await supabase
      .from('org_join_codes')
      .delete()
      .eq('id', id)
      .eq('org_id', orgId)
      .is('used_at', null)

    if (error) throw error
  },
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

export const toUserDisplay = (
  member: OrganizationMember
): OrganizationMemberDisplay => ({
  id: member.id,
  orgId: member.org_id,
  userId: member.user_id,
  fullName: member.full_name,
  email: member.email,
  phone: member.phone || '',
  role: member.role,
  status: 'Activo', // All members in the table are active
  createdAt: member.created_at,
})

export const toJoinCodeDisplay = (code: JoinCode): JoinCodeDisplay => {
  const now = new Date()
  const expiresAt = new Date(code.expires_at)

  return {
    id: code.id,
    code: code.code,
    role: code.role,
    expiresAt: code.expires_at,
    isUsed: !!code.used_at,
    isExpired: expiresAt < now,
    createdAt: code.created_at,
  }
}

export const getRoleLabel = (role: UserRole): string => {
  const labels: Record<UserRole, string> = {
    OWNER: 'Propietario',
    ADMIN: 'Administrador',
    STAFF: 'Personal',
    DRIVER: 'Conductor',
  }
  return labels[role] || role
}

export const ROLE_OPTIONS: { value: UserRole; label: string }[] = [
  { value: 'OWNER', label: 'Propietario' },
  { value: 'ADMIN', label: 'Administrador' },
  { value: 'STAFF', label: 'Personal' },
  { value: 'DRIVER', label: 'Conductor' },
]
