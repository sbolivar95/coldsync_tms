import { supabase } from '../lib/supabase'

export type UserRole = 'OWNER' | 'ADMIN' | 'STAFF' | 'DRIVER'

export interface OrganizationMember {
  id: string
  org_id: string
  user_id: string
  role: UserRole
  created_at: string
}

export interface OrganizationMemberInsert {
  org_id: string
  user_id: string
  role: UserRole
}

export interface OrganizationMemberUpdate {
  role?: UserRole
}

export interface UserProfile {
  id: string
  email: string
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
 * Organization Members Service - CRUD operations for organization_members table
 */
export const organizationMembersService = {
  /**
   * Get all members for an organization with their user profiles
   */
  async getAll(orgId: string): Promise<OrganizationMemberWithProfile[]> {
    const { data: members, error: membersError } = await supabase
      .from('organization_members')
      .select('*')
      .eq('org_id', orgId)
      .order('created_at', { ascending: false })

    if (membersError) throw membersError
    if (!members || members.length === 0) return []

    // Get user profiles from auth.users
    const userIds = members.map((m) => m.user_id)
    const {
      data: { users },
      error: usersError,
    } = await supabase.auth.admin.listUsers()

    if (usersError) {
      console.error('Error fetching user profiles:', usersError)
      // Return members without profiles if we can't fetch users
      return members.map((member) => ({
        ...member,
        user: undefined,
      }))
    }

    // Map users to members
    const usersMap = new Map(users?.map((u) => [u.id, u]) || [])

    return members.map((member) => ({
      ...member,
      user: usersMap.get(member.user_id)
        ? {
            id: usersMap.get(member.user_id)!.id,
            email: usersMap.get(member.user_id)!.email || '',
            user_metadata: usersMap.get(member.user_id)!.user_metadata,
          }
        : undefined,
    }))
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

    // Get user profile
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.admin.getUserById(userId)

    if (userError) {
      console.error('Error fetching user profile:', userError)
      return {
        ...member,
        user: undefined,
      }
    }

    return {
      ...member,
      user: user
        ? {
            id: user.id,
            email: user.email || '',
            user_metadata: user.user_metadata,
          }
        : undefined,
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
   * Remove a member from an organization
   */
  async remove(userId: string, orgId: string): Promise<void> {
    const { error } = await supabase
      .from('organization_members')
      .delete()
      .eq('user_id', userId)
      .eq('org_id', orgId)

    if (error) throw error
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
}

/**
 * User Profile Service - Operations for auth.users
 * Note: These operations require service role key for full access
 */
export const userProfileService = {
  /**
   * Update user metadata (first name, last name, phone)
   */
  async updateMetadata(
    userId: string,
    metadata: {
      first_name?: string
      last_name?: string
      phone?: string
    }
  ): Promise<UserProfile> {
    const {
      data: { user },
      error,
    } = await supabase.auth.admin.updateUserById(userId, {
      user_metadata: metadata,
    })

    if (error) throw error
    if (!user) throw new Error('User not found')

    return {
      id: user.id,
      email: user.email || '',
      user_metadata: user.user_metadata,
    }
  },

  /**
   * Update user email
   */
  async updateEmail(userId: string, email: string): Promise<UserProfile> {
    const {
      data: { user },
      error,
    } = await supabase.auth.admin.updateUserById(userId, { email })

    if (error) throw error
    if (!user) throw new Error('User not found')

    return {
      id: user.id,
      email: user.email || '',
      user_metadata: user.user_metadata,
    }
  },

  /**
   * Get user by ID
   */
  async getById(userId: string): Promise<UserProfile | null> {
    const {
      data: { user },
      error,
    } = await supabase.auth.admin.getUserById(userId)

    if (error) {
      console.error('Error fetching user:', error)
      return null
    }

    if (!user) return null

    return {
      id: user.id,
      email: user.email || '',
      user_metadata: user.user_metadata,
    }
  },
}
