import { supabase } from '../../lib/supabase'
import { createClient } from '@supabase/supabase-js'
import type { Organization } from '../../types/database.types'
import type { OrganizationMember } from '../../types/database.types'
import { organizationsService } from './organizations.service'

export interface AuthUser {
  id: string
  email: string
  user_metadata?: {
    first_name?: string
    last_name?: string
    phone?: string
    temp_password?: boolean
  }
}

export interface AuthSession {
  user: AuthUser
  organization: Organization | null
  organizationMember: OrganizationMember | null
  organizationMembers: OrganizationMember[]
  isPlatformUser: boolean
  needsPasswordChange?: boolean // Flag to indicate password change is required
}

// Promise gating for session fetching to prevent concurrent redundant calls
let currentSessionPromise: Promise<AuthSession | null> | null = null

export interface LoginCredentials {
  email: string
  password: string
  orgId?: string
}

/**
 * Authentication Service - Handles login, logout, and session management
 */
export const authService = {
  /**
   * Login with email and password
   * Validates organization membership if orgId is provided
   */
  async login(credentials: LoginCredentials): Promise<AuthSession> {
    const { email, password, orgId } = credentials

    // Step 1: Authenticate with Supabase
    const { data: authData, error: authError } =
      await supabase.auth.signInWithPassword({
        email,
        password,
      })

    if (authError) {
      // Supabase blocks login natively when banned_until is active
      // Only show custom message if error is specifically "User is banned"
      // Don't show for incorrect credentials or other errors
      const errorMessage = authError.message || ''
      // Check if message is exactly "User is banned" (case insensitive)
      if (errorMessage.toLowerCase().trim() === 'user is banned') {
        throw new Error('Tu cuenta está suspendida. Contacta al administrador')
      }
      // For other errors (incorrect credentials, etc.), show original message
      throw new Error(authError.message || 'Error al iniciar sesión')
    }

    if (!authData.user) {
      throw new Error('No se pudo obtener la información del usuario')
    }

    const user: AuthUser = {
      id: authData.user.id,
      email: authData.user.email || '',
      user_metadata: authData.user.user_metadata as AuthUser['user_metadata'] | undefined,
    }

    // Step 2: Get all ACTIVE organization memberships for this user
    // Note: Supabase already blocks login if banned_until is set (handled natively)
    const { data: memberships, error: membershipsError } = await supabase
      .from('organization_members')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_active', true) // Only get active memberships

    if (membershipsError) {
      throw new Error('Error al obtener las membresías de organización')
    }

    // Check if user is platform user
    const isPlatform = await this.isPlatformUser(user.id)

    if (!memberships || memberships.length === 0) {
      // User has no ACTIVE organization memberships
      // IMPORTANT: Check if user has deleted memberships (soft-deleted)
      // Use admin client to bypass RLS and see deleted memberships
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
      const supabaseServiceKey = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY

      interface MembershipCheck {
        id: string
        status: string | null
        is_active: boolean | null
      }

      let allMemberships: MembershipCheck[] = []

      if (supabaseServiceKey && supabaseUrl) {
        // Create temporary admin client for this query only
        const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
          auth: { persistSession: false }
        })

        const result = await supabaseAdmin
          .from('organization_members')
          .select('id, status, is_active')
          .eq('user_id', user.id)

        allMemberships = (result.data as MembershipCheck[]) || []
      } else {
        // Fallback: try with normal client (may fail due to RLS)
        const result = await supabase
          .from('organization_members')
          .select('id, status, is_active')
          .eq('user_id', user.id)

        allMemberships = (result.data as MembershipCheck[]) || []
      }

      // Check if user has deleted memberships (status = 'inactive')
      const hasDeletedMemberships = allMemberships.some((m) => {
        const status = m.status?.toLowerCase()?.trim() || ''
        return status === 'inactive'
      })

      if (hasDeletedMemberships) {
        // Usuario tiene membresías pero todas están eliminadas - BLOQUEAR ACCESO
        await supabase.auth.signOut({ scope: 'local' })
        throw new Error('Credenciales inválidas')
      }

      // Si no es usuario de plataforma y no tiene membresías, bloquear acceso
      if (!isPlatform) {
        await supabase.auth.signOut({ scope: 'local' })
        throw new Error('Credenciales inválidas')
      }

      // Usuario de plataforma puede tener sesión sin membresías
      // Check if user needs to change password (temp_password in user_metadata)
      const needsPasswordChange = user.user_metadata?.temp_password === true

      return {
        user,
        organization: null,
        organizationMember: null,
        organizationMembers: [],
        isPlatformUser: isPlatform,
        needsPasswordChange, // Flag to indicate password change is required
      }
    }

    // Step 3: If orgId is provided, validate active membership
    if (orgId) {
      const membership = memberships.find((m) => m.org_id === orgId)
      if (!membership) {
        // Note: If user is suspended, Supabase already blocked login via banned_until
        throw new Error('No tienes acceso a esta organización')
      }

      // Get organization details
      const organization = await organizationsService.getById(orgId)
      if (!organization) {
        throw new Error('Organización no encontrada')
      }

      // Get all members of this organization (without user profiles for login)
      const { data: organizationMembers, error: membersError } = await supabase
        .from('organization_members')
        .select('*')
        .eq('org_id', orgId)
        .order('created_at', { ascending: false })

      if (membersError) {
        throw new Error('Error al obtener los miembros de la organización')
      }

      // Check if user needs to change password (temp_password in user_metadata)
      const needsPasswordChange = user.user_metadata?.temp_password === true

      return {
        user,
        organization,
        organizationMember: membership,
        organizationMembers: organizationMembers || [],
        isPlatformUser: isPlatform,
        needsPasswordChange, // Flag to indicate password change is required
      }
    }

    // Step 4: If no orgId provided, use the first organization (or let user select)
    const firstMembership = memberships[0]
    const organization = await organizationsService.getById(
      firstMembership.org_id
    )

    if (!organization) {
      throw new Error('Organización no encontrada')
    }

    // Get all members of this organization (without user profiles for login)
    const { data: organizationMembers, error: membersError } = await supabase
      .from('organization_members')
      .select('*')
      .eq('org_id', organization.id)
      .order('created_at', { ascending: false })

    if (membersError) {
      throw new Error('Error al obtener los miembros de la organización')
    }

    // Check if user needs to change password (temp_password in user_metadata)
    const needsPasswordChange = user.user_metadata?.temp_password === true

    return {
      user,
      organization,
      organizationMember: firstMembership,
      organizationMembers: organizationMembers || [],
      isPlatformUser: isPlatform,
      needsPasswordChange, // Flag to indicate password change is required
    }
  },

  /**
   * Logout current user
   * Uses 'local' scope to sign out only from the current session
   * 'global' scope requires admin privileges and may cause 403 errors
   */
  async logout(): Promise<void> {
    const { error } = await supabase.auth.signOut({ scope: 'local' })
    if (error) {
      throw new Error(error.message || 'Error al cerrar sesión')
    }
  },

  /**
   * Get current session with concurrency gating
   */
  async getCurrentSession(): Promise<AuthSession | null> {
    if (currentSessionPromise) {
      return currentSessionPromise
    }

    currentSessionPromise = this._getCurrentSessionInternal()
    try {
      const result = await currentSessionPromise
      return result
    } finally {
      currentSessionPromise = null
    }
  },

  /**
   * Internal implementation of session fetching
   */
  async _getCurrentSessionInternal(): Promise<AuthSession | null> {
    const {
      data: { session },
      error,
    } = await supabase.auth.getSession()

    if (error) {
      console.error('Error getting session:', error)
      return null
    }

    if (!session?.user) {
      return null
    }

    // IMPORTANT: Check if user is banned (banned_until)
    // If user is banned, Supabase should reject token refresh,
    // but we check explicitly here for additional security
    // Note: We cannot query auth.users directly, but Supabase
    // should reject refresh if banned_until is active
    // If we reach here, token is valid, but we check
    // is_active to ensure user is not suspended

    const user: AuthUser = {
      id: session.user.id,
      email: session.user.email || '',
      user_metadata: session.user.user_metadata as AuthUser['user_metadata'] | undefined,
    }

    // Check if user is platform user
    const isPlatform = await this.isPlatformUser(user.id)

    // Get organization memberships (only active)
    // IMPORTANT: If is_active = false, user is suspended and should not have session
    // Note: Supabase already blocks if banned_until is set (handled natively)
    const { data: memberships, error: membershipsError } = await supabase
      .from('organization_members')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_active', true)

    if (membershipsError || !memberships || memberships.length === 0) {
      // User has no active memberships
      // If platform user, allow session without organization
      if (isPlatform) {
        return {
          user,
          organization: null,
          organizationMember: null,
          organizationMembers: [],
          isPlatformUser: isPlatform,
        }
      }
      // Non-platform user without active memberships - clear session
      return null
    }

    // Use the first organization (or could be stored in session/localStorage)
    const firstMembership = memberships[0]
    const organization = await organizationsService.getById(
      firstMembership.org_id
    )

    if (!organization) {
      return {
        user,
        organization: null,
        organizationMember: null,
        organizationMembers: [],
        isPlatformUser: isPlatform,
      }
    }

    // Get all members of this organization (without user profiles for login)
    const { data: organizationMembers, error: membersError } = await supabase
      .from('organization_members')
      .select('*')
      .eq('org_id', organization.id)
      .order('created_at', { ascending: false })

    if (membersError) {
      console.error('Error fetching organization members:', membersError)
      // Return empty array if error, but don't fail the session
    }

    return {
      user,
      organization,
      organizationMember: firstMembership,
      organizationMembers: organizationMembers || [],
      isPlatformUser: isPlatform,
    }
  },

  /**
   * Switch to a different organization
   */
  async switchOrganization(orgId: string): Promise<AuthSession> {
    // Ensure we have a valid, synced session before switching
    // This awaits any pending background refresh/sync
    await this.getCurrentSession()

    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession()

    if (sessionError || !session?.user) {
      throw new Error('Usuario no autenticado')
    }

    const authUser = session.user

    const user: AuthUser = {
      id: authUser.id,
      email: authUser.email || '',
      user_metadata: authUser.user_metadata as AuthUser['user_metadata'] | undefined,
    }

    // Check if user is platform user
    const isPlatform = await this.isPlatformUser(user.id)

    // Validate active membership
    // Note: Supabase already blocks if banned_until is set (handled natively)
    const { data: membership, error: membershipError } = await supabase
      .from('organization_members')
      .select('*')
      .eq('user_id', user.id)
      .eq('org_id', orgId)
      .eq('is_active', true)
      .single()

    if (membershipError || !membership) {
      throw new Error('No tienes acceso a esta organización')
    }

    // Get organization details
    const organization = await organizationsService.getById(orgId)
    if (!organization) {
      throw new Error('Organización no encontrada')
    }

    // Get all members of this organization (without user profiles for login)
    const { data: organizationMembers, error: membersError } = await supabase
      .from('organization_members')
      .select('*')
      .eq('org_id', orgId)
      .order('created_at', { ascending: false })

    if (membersError) {
      throw new Error('Error al obtener los miembros de la organización')
    }

    return {
      user,
      organization,
      organizationMember: membership,
      organizationMembers: organizationMembers || [],
      isPlatformUser: isPlatform,
    }
  },

  /**
   * Change user password
   * No current password required - useful for password recovery scenarios
   */
  async changePassword(newPassword: string): Promise<void> {
    // Verify user is authenticated
    const {
      data: { user: authUser },
      error: getUserError,
    } = await supabase.auth.getUser()

    if (getUserError || !authUser) {
      throw new Error('Usuario no autenticado')
    }

    // Update password
    const { error: updateError } = await supabase.auth.updateUser({
      password: newPassword,
    })

    if (updateError) {
      throw new Error(
        updateError.message ||
        'Error al cambiar la contraseña. Por favor intenta nuevamente.'
      )
    }
  },

  /**
   * Check if user is a platform user
   */
  async isPlatformUser(userId: string): Promise<boolean> {
    const { data, error } = await supabase
      .from('platform_users')
      .select('user_id, is_active')
      .eq('user_id', userId)
      .eq('is_active', true)
      .maybeSingle()

    if (error) {
      console.error('Error checking platform user:', error)
      return false
    }

    return !!data
  },

  /**
   * Update user metadata (first name, last name, phone, etc.)
   */
  async updateUserMetadata(metadata: {
    first_name?: string
    last_name?: string
    phone?: string
  }): Promise<void> {
    const { error } = await supabase.auth.updateUser({
      data: metadata,
    })

    if (error) {
      throw new Error(error.message || 'Error al actualizar los datos del usuario')
    }
  },

  /**
   * Send password reset email
   */
  async resetPasswordForEmail(email: string): Promise<void> {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    })

    if (error) {
      throw new Error(error.message || 'Error al enviar el correo de recuperación')
    }
  },

  /**
   * Switch to a different organization for platform users
   * Platform users are not affiliated to any org_id, so they can switch to any organization
   */
  async switchOrganizationForPlatformUser(orgId: string): Promise<AuthSession> {
    // Ensure we have a valid, synced session before switching
    // This awaits any pending background refresh/sync
    await this.getCurrentSession()

    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession()

    if (sessionError || !session?.user) {
      throw new Error('Usuario no autenticado')
    }

    const authUser = session.user

    // Verify user is a platform user
    const isPlatform = await this.isPlatformUser(authUser.id)
    if (!isPlatform) {
      throw new Error(
        'Esta función solo está disponible para usuarios de plataforma'
      )
    }

    const user: AuthUser = {
      id: authUser.id,
      email: authUser.email || '',
      user_metadata: authUser.user_metadata as AuthUser['user_metadata'] | undefined,
    }

    // Get organization details
    const organization = await organizationsService.getById(orgId)
    if (!organization) {
      throw new Error('Organización no encontrada')
    }

    // Get all members of this organization
    const { data: organizationMembers, error: membersError } = await supabase
      .from('organization_members')
      .select('*')
      .eq('org_id', orgId)
      .order('created_at', { ascending: false })

    if (membersError) {
      throw new Error('Error al obtener los miembros de la organización')
    }

    return {
      user,
      organization,
      organizationMember: null, // Platform users are not organization members
      organizationMembers: organizationMembers || [],
      isPlatformUser: true, // This method is only called for platform users
    }
  },
}
