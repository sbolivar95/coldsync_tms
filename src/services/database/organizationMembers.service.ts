import { supabase } from '../../lib/supabase'
import type { OrganizationMember, UserRole } from '../../types/database.types'

export interface OrganizationMemberInsert {
  org_id: string
  user_id: string
  role: UserRole
  first_name: string
  last_name: string
  email: string
  phone?: string
  is_carrier_member?: boolean
  carrier_id?: number | null
  driver_id?: number | null
}

export interface OrganizationMemberUpdate {
  role?: UserRole
  first_name?: string
  last_name?: string
  phone?: string
  is_carrier_member?: boolean
  carrier_id?: number | null
  driver_id?: number | null
}

export interface UserProfile {
  id: string
  email: string
  last_sign_in_at?: string
  user_metadata?: {
    first_name?: string
    last_name?: string
    phone?: string
  }
}

export interface OrganizationMemberWithProfile extends OrganizationMember {
  user?: UserProfile
}

/**
 * Map UserRole enum to Spanish role label
 */
export function mapUserRoleToLabel(role: UserRole): string {
  const roleMap: Record<UserRole, string> = {
    OWNER: 'Propietario',
    ADMIN: 'Administrador',
    STAFF: 'Personal',
    DRIVER: 'Conductor',
    DEV: 'Desarrollador',
    CARRIER: 'Transportista',
  }
  return roleMap[role] || role
}


// For invitation method
export interface InvitationRequest {
  org_id: string
  email: string
  role: UserRole
  first_name: string
  last_name: string
  direct_create?: boolean
  phone?: string
  is_carrier_member?: boolean
  carrier_id?: number | null
  driver_id?: number | null
}

export interface InvitationResponse {
  email_sent: boolean
}

/**
 * Organization Members Service - CRUD operations for organization_members table
 */
export const organizationMembersService = {
  /**
   * Get all members for an organization
   */
  async getAll(orgId: string): Promise<OrganizationMemberWithProfile[]> {
    const { data: members, error: membersError } = await supabase
      .from('organization_members')
      .select('*')
      .eq('org_id', orgId)
      .neq('status', 'inactive') // Filter out soft-deleted users
      .neq('status', 'Inactivo') // Handle legacy Spanish value if exists
      .order('created_at', { ascending: false })

    if (membersError) throw membersError
    if (!members || members.length === 0) return []

    // Return members without user profiles (admin functions not available)
    return members.map((member) => ({
      ...member,
      user: undefined,
    }))
  },

  /**
   * Get a single member by member ID
   */
  async getById(
    memberId: string,
    orgId: string
  ): Promise<OrganizationMemberWithProfile | null> {
    const { data: member, error: memberError } = await supabase
      .from('organization_members')
      .select('*')
      .eq('id', memberId)
      .eq('org_id', orgId)
      .single()

    if (memberError) {
      if (memberError.code === 'PGRST116') return null
      throw memberError
    }

    // Return member without user profile (admin functions not available)
    return {
      ...member,
      user: undefined,
    }
  },

  /**
   * Get a single member by user ID
   */
  async getByUserId(
    userId: string,
    orgId: string
  ): Promise<OrganizationMemberWithProfile | null> {
    const { data: member, error: memberError } = await supabase
      .from('organization_members')
      .select('*')
      .eq('user_id', userId)
      .eq('org_id', orgId)
      .single()

    if (memberError) {
      if (memberError.code === 'PGRST116') return null
      throw memberError
    }

    // Return member without user profile (admin functions not available)
    return {
      ...member,
      user: undefined,
    }
  },

  /**
   * Get a single member by email
   * Useful for checking existence before creation
   */
  async getByEmail(
    email: string,
    orgId: string
  ): Promise<OrganizationMemberWithProfile | null> {
    const { data: member, error: memberError } = await supabase
      .from('organization_members')
      .select('*')
      .eq('email', email)
      .eq('org_id', orgId)
      .maybeSingle()

    if (memberError) throw memberError

    if (!member) return null

    // Return member without user profile
    return {
      ...member,
      user: undefined,
    }
  },

  /**
   * Update a member's role
   */
  async updateRole(
    userId: string,
    orgId: string,
    role: UserRole
  ): Promise<OrganizationMember> {
    const { data, error } = await supabase
      .from('organization_members')
      .update({ role })
      .eq('user_id', userId)
      .eq('org_id', orgId)
      .select()
      .single()

    if (error) throw error
    return data
  },

  /**
   * Update a member's details (role, first_name, last_name, phone)
   */
  async update(
    userId: string,
    orgId: string,
    updates: OrganizationMemberUpdate
  ): Promise<OrganizationMember> {
    const { data, error } = await supabase
      .from('organization_members')
      .update(updates)
      .eq('user_id', userId)
      .eq('org_id', orgId)
      .select()
      .single()

    if (error) throw error
    return data
  },

  /**
   * Remove a member from an organization by user_id
   */
  async remove(userId: string, orgId: string): Promise<void> {
    const { data, error } = await supabase
      .from('organization_members')
      .update({
        status: 'inactive',
        is_active: false
      })
      .eq('user_id', userId)
      .eq('org_id', orgId)
      .select()

    if (error) {
      throw new Error(`Error al eliminar usuario: ${error.message}`)
    }

    // Verify that at least one row was updated
    if (!data || data.length === 0) {
      throw new Error('No se encontró el usuario para eliminar. Puede que ya haya sido eliminado.')
    }
  },

  /**
   * Remove a member from an organization by member id
   * Used for pending invitations (user_id IS NULL)
   */
  async removeById(memberId: string, orgId: string): Promise<void> {
    const { data, error } = await supabase
      .from('organization_members')
      .update({
        status: 'inactive',
        is_active: false
      })
      .eq('id', memberId)
      .eq('org_id', orgId)
      .select()

    if (error) {
      throw new Error(`Error al eliminar usuario: ${error.message}`)
    }

    // Verify that at least one row was updated
    if (!data || data.length === 0) {
      throw new Error('No se encontró el usuario para eliminar. Puede que ya haya sido eliminado.')
    }
  },

  /**
   * Suspend a member (set is_active = false)
   * Only works for members with user_id IS NOT NULL (cannot suspend pending invitations)
   */
  async suspend(memberId: string, orgId: string): Promise<void> {
    // First, verify that the member exists and has a user_id (not pending)
    const { data: member, error: findError } = await supabase
      .from('organization_members')
      .select('user_id')
      .eq('id', memberId)
      .eq('org_id', orgId)
      .maybeSingle()

    if (findError) {
      throw new Error(`Error finding member: ${findError.message}`)
    }

    if (!member) {
      throw new Error('Miembro no encontrado')
    }

    if (member.user_id === null) {
      throw new Error('No se puede suspender un usuario que no ha aceptado la invitación. Debe aceptar la invitación primero.')
    }

    // Update is_active to false and status to 'suspended'
    const { error: updateError } = await supabase
      .from('organization_members')
      .update({ is_active: false, status: 'suspended' })
      .eq('id', memberId)
      .eq('org_id', orgId)

    if (updateError) {
      throw new Error(`Error al suspender usuario: ${updateError.message}`)
    }

    // Sync banned_until using Edge Function
    // IMPORTANT: If this fails, user will still be able to login even if is_active = false
    try {
      const { data: sessionData } = await supabase.auth.getSession()
      const accessToken = sessionData.session?.access_token

      if (!accessToken) {
        throw new Error('No hay sesión autenticada para sincronizar banned_until')
      }

      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
      if (!supabaseUrl) {
        throw new Error('VITE_SUPABASE_URL no está configurado')
      }

      const response = await fetch(`${supabaseUrl}/functions/v1/sync-banned-until`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ userId: member.user_id, isActive: false }),
      })

      if (!response.ok) {
        const errorText = await response.text()
        let errorMessage = 'Error al sincronizar banned_until'
        try {
          const errorData = JSON.parse(errorText)
          errorMessage = errorData.error || errorMessage
        } catch {
          errorMessage = errorText || errorMessage
        }
        throw new Error(`${errorMessage}. El usuario fue suspendido pero puede que aún pueda hacer login.`)
      }
    } catch (error) {
      // Si la Edge Function falla, lanzar error para que el admin sepa
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido al sincronizar banned_until'
      throw new Error(`${errorMessage}. El usuario fue suspendido pero puede que aún pueda hacer login.`)
    }
  },

  /**
   * Reactivate a member (set is_active = true)
   * Only works for members with user_id IS NOT NULL (cannot reactivate pending invitations)
   */
  async reactivate(memberId: string, orgId: string): Promise<void> {
    // First, verify that the member exists and has a user_id (not pending)
    const { data: member, error: findError } = await supabase
      .from('organization_members')
      .select('user_id')
      .eq('id', memberId)
      .eq('org_id', orgId)
      .maybeSingle()

    if (findError) {
      throw new Error(`Error finding member: ${findError.message}`)
    }

    if (!member) {
      throw new Error('Miembro no encontrado')
    }

    if (member.user_id === null) {
      throw new Error('No se puede reactivar un usuario que no ha aceptado la invitación. Debe aceptar la invitación primero.')
    }

    // Update is_active to true and status to 'active'
    const { error: updateError } = await supabase
      .from('organization_members')
      .update({ is_active: true, status: 'active' })
      .eq('id', memberId)
      .eq('org_id', orgId)

    if (updateError) {
      throw new Error(`Error al reactivar usuario: ${updateError.message}`)
    }

    // Sync banned_until using Edge Function
    // IMPORTANT: If this fails, user will not be able to login even if is_active = true
    try {
      const { data: sessionData } = await supabase.auth.getSession()
      const accessToken = sessionData.session?.access_token

      if (!accessToken) {
        throw new Error('No hay sesión autenticada para sincronizar banned_until')
      }

      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
      if (!supabaseUrl) {
        throw new Error('VITE_SUPABASE_URL no está configurado')
      }

      const response = await fetch(`${supabaseUrl}/functions/v1/sync-banned-until`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ userId: member.user_id, isActive: true }),
      })

      if (!response.ok) {
        const errorText = await response.text()
        let errorMessage = 'Error al sincronizar banned_until'
        try {
          const errorData = JSON.parse(errorText)
          errorMessage = errorData.error || errorMessage
        } catch {
          errorMessage = errorText || errorMessage
        }
        throw new Error(`${errorMessage}. El usuario fue reactivado pero puede que no pueda hacer login.`)
      }
    } catch (error) {
      // Si la Edge Function falla, lanzar error para que el admin sepa
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido al sincronizar banned_until'
      throw new Error(`${errorMessage}. El usuario fue reactivado pero puede que no pueda hacer login.`)
    }
  },

  /**
   * Add a member to an organization
   * Note: This requires admin privileges to create the user first
   */
  async add(member: OrganizationMemberInsert): Promise<OrganizationMember> {
    const { data, error } = await supabase
      .from('organization_members')
      .insert(member)
      .select()
      .single()

    if (error) throw error
    return data
  },

  /**
   * METHOD: Create Direct - Create user immediately with temp password
   */
  async createDirectly(request: InvitationRequest): Promise<{ temp_password?: string }> {
    try {
      const result = await this.provision({
        ...request,
        direct_create: true
      })

      return {
        temp_password: result.temp_password
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      throw new Error(errorMessage)
    }
  },

  /**
   * METHOD: Invitation - Provision user via edge function
   * Creates authenticated user and organization membership
   */
  async invite(request: InvitationRequest): Promise<InvitationResponse> {
    try {
      // Call provision edge function to create user and member
      const result = await this.provision({
        org_id: request.org_id,
        email: request.email,
        role: request.role,
        first_name: request.first_name,
        last_name: request.last_name,
        phone: request.phone, // Pass phone from request
        is_carrier_member: request.is_carrier_member,
        carrier_id: request.carrier_id,
        driver_id: request.driver_id,
      })

      // The edge function already sends the password setup email automatically
      const emailSent = result.password_setup_email_sent

      return {
        email_sent: emailSent,
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error)
      throw new Error(errorMessage)
    }
  },

  /**
   * METHOD: Resend invitation - Generate new code for expired invitation
   */
  async resendInvitation(
    orgId: string,
    email: string,
    role: UserRole,
    firstName: string,
    lastName: string,
    phone?: string,
    isCarrierMember?: boolean,
    carrierId?: number | null,
    driverId?: number | null
  ): Promise<InvitationResponse> {
    // Create new invitation (generates new magic link via Supabase)
    return this.invite({
      org_id: orgId,
      email,
      role,
      first_name: firstName,
      last_name: lastName,
      phone, // Include phone number if provided
      is_carrier_member: isCarrierMember,
      carrier_id: carrierId,
      driver_id: driverId,
    })
  },

  /**
   * METHOD: Complete registration using magic link
   * NOTE: This method is no longer needed as Supabase magic links handle user creation automatically.
   * The Edge Function `provision-org-member` creates the user and membership when the magic link is clicked.
   * This method is kept for backwards compatibility but should not be used.
   * @deprecated Use magic links via invite() method instead
   */
  async activateFromInvitation(
    _code: string,
    _userId: string,
    _userData: {
      full_name?: string
      phone?: string
    }
  ): Promise<OrganizationMember> {
    // This method is deprecated - magic links handle activation automatically
    throw new Error('This method is deprecated. Use magic links via invite() method instead.')
  },

  /**
   * Send invitation email (placeholder - implement with your email service)
   */
  async sendInvitationEmail(
    _email: string,
    _code: string,
    _tempPassword?: string
  ): Promise<boolean> {
    // TODO: Implement with Resend or your email service
    // For now, return true (email "sent")
    return true
  },

  /**
   * METHOD: Accept invitation - Update user_id when user accepts magic link
   * This is called when a user accepts an invitation via magic link and sets their password
   * Updates the organization_members record from user_id IS NULL to the actual user_id
   * 
   * Handles two scenarios:
   * 1. New invitation: Finds record with user_id IS NULL and status != 'inactive'
   * 2. Re-invited deleted user: Finds the most recent non-inactive record with matching email
   * 
   * IMPORTANT: When a user is deleted and re-invited, a new record is created with user_id IS NULL.
   * This method finds that new record and activates it, ignoring any old deleted records.
   */
  async acceptInvitation(
    userId: string,
    email: string
  ): Promise<OrganizationMember | null> {
    const normalizedEmail = email.toLowerCase().trim()

    // Strategy: Find the most recent non-inactive record with user_id IS NULL
    // This handles both new invitations and re-invited deleted users
    // When a deleted user is re-invited, a NEW record is created with user_id IS NULL
    const { data: pendingMember, error: findError } = await supabase
      .from('organization_members')
      .select('*')
      .eq('email', normalizedEmail)
      .is('user_id', null)
      .neq('status', 'inactive')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (findError) {
      throw new Error(`Error finding pending invitation: ${findError.message}`)
    }

    if (!pendingMember) {
      // No pending invitation found - user might have already accepted or invitation doesn't exist
      // This could happen if:
      // 1. Invitation was already accepted
      // 2. Invitation doesn't exist
      // 3. Edge case: All records are inactive (shouldn't happen for new invitations)
      return null
    }

    // Update the record with user_id and set is_active = true, status = 'active'
    // This activates the invitation and links it to the authenticated user
    const { data: updatedMember, error: updateError } = await supabase
      .from('organization_members')
      .update({
        user_id: userId,
        is_active: true,
        status: 'active'
      })
      .eq('id', pendingMember.id)
      .select()
      .single()

    if (updateError) {
      throw new Error(`Error accepting invitation: ${updateError.message}`)
    }

    return updatedMember
  },

  /**
   * Provision a new organization member using edge function
   * This creates both the auth user AND the organization membership
   */
  async provision(request: {
    org_id: string
    email: string
    role: UserRole
    first_name: string
    last_name: string
    phone?: string
    direct_create?: boolean
    is_carrier_member?: boolean
    carrier_id?: number | null
    driver_id?: number | null
  }): Promise<{
    org_id: string
    user_id: string
    role: UserRole
    first_name: string
    last_name: string
    full_name: string
    password_setup_email_sent: boolean
    temp_password?: string
    platform_admin_bypass_used: boolean
  }> {
    const { data: sessionData } = await supabase.auth.getSession()
    const accessToken = sessionData.session?.access_token

    if (!accessToken) {
      throw new Error('No authenticated session')
    }

    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
    if (!supabaseUrl) {
      throw new Error('VITE_SUPABASE_URL is not configured')
    }

    // Use hyphens to match the deployed function URL
    const functionName = 'provision-org-member'
    const response = await fetch(
      `${supabaseUrl}/functions/v1/${functionName}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(request),
      }
    )

    if (!response.ok) {
      const responseText = await response.text()
      let errorData
      try {
        errorData = JSON.parse(responseText)
      } catch (e) {
        // failed to parse
      }

      const message = errorData?.error || responseText || response.statusText || 'Failed to provision organization member'
      const details = errorData?.details ? ` (${errorData.details})` : ''

      throw new Error(`${message}${details}`)
    }

    const result = await response.json()

    // Map response to expected format
    // Edge Function may return different format, so we normalize it
    return {
      org_id: result.org_id || request.org_id,
      user_id: result.user_id || result.member_id || '',
      role: result.role || request.role,
      first_name: result.first_name || request.first_name,
      last_name: result.last_name || request.last_name,
      full_name: result.full_name || `${request.first_name} ${request.last_name}`,
      password_setup_email_sent: result.password_setup_email_sent || result.magic_link_email_sent || false,
      temp_password: result.temp_password || result.tempPassword || undefined,
      platform_admin_bypass_used: result.platform_admin_bypass_used || false,
    }
  },
}

/**
 * Helper function to convert OrganizationMemberWithProfile to User type for UI
 */
export function mapMemberToUser(
  member: OrganizationMemberWithProfile
): import('../../types/user.types').User {
  const firstName = member.first_name || ''
  const lastName = member.last_name || ''
  const email = member.email || ''
  const phone = member.phone || ''

  // Calculate status based on status column (priority) or user_id/is_active fallback
  let status: 'Activo' | 'Inactivo' | 'Suspendido' = 'Activo'

  // Normalize status check (case insensitive)
  const dbStatus = member.status?.toLowerCase() || ''

  if (dbStatus === 'inactive') {
    // Soft deleted users
    status = 'Inactivo'
  } else if (member.is_active === false || dbStatus === 'suspended') {
    // If not soft-deleted but is_active is false, user is suspended
    status = 'Suspendido'
  } else {
    // Default to Activo (includes user_id=null pending invites and active users)
    status = 'Activo'
  }

  return {
    id: member.id,
    firstName,
    lastName,
    email,
    role: mapUserRoleToLabel(member.role),
    status,
    phone,
    organizationId: member.org_id,
    createdAt: member.created_at,
  }
}
