// src/lib/auth-context.tsx
import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'
import type { User } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'

export type UserRole = 'OWNER' | 'ADMIN' | 'STAFF' | 'DRIVER'
export type PlatformRole = 'DEV' | 'PLATFORM_ADMIN'

export interface OrganizationMember {
  org_id: string
  user_id: string
  role: UserRole
  organization?: {
    id: string
    comercial_name: string
    legal_name: string
  }
}

export interface PlatformUser {
  user_id: string
  role: PlatformRole
  is_active: boolean
}

interface AuthContextType {
  user: User | null
  organizationMember: OrganizationMember | null
  platformUser: PlatformUser | null
  isPlatformAdmin: boolean
  isOrgMember: boolean
  loading: boolean
  signIn: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
  refreshUserData: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null)
  const [organizationMember, setOrganizationMember] =
    useState<OrganizationMember | null>(null)
  const [platformUser, setPlatformUser] = useState<PlatformUser | null>(null)

  // Split loading: auth init + extra user-data lookup
  const [authLoading, setAuthLoading] = useState(true)
  const [userDataLoading, setUserDataLoading] = useState(false)
  const loading = authLoading || userDataLoading

  type SupabaseResult<T> = { data: T; error: any }

  function withTimeout<T>(
    promise: PromiseLike<T>,
    ms: number,
    label: string
  ): Promise<T> {
    return new Promise((resolve, reject) => {
      const id = window.setTimeout(
        () => reject(new Error(`Timeout after ${ms}ms (${label})`)),
        ms
      )

      promise.then(
        (v) => {
          window.clearTimeout(id)
          resolve(v)
        },
        (e) => {
          window.clearTimeout(id)
          reject(e)
        }
      )
    })
  }

  const fetchUserData = async (userId: string) => {
    setUserDataLoading(true)

    try {
      // Check if platform admin
      const platformRes = await withTimeout(
        supabase
          .from('platform_users')
          .select('user_id, role, is_active')
          .eq('user_id', userId)
          .eq('is_active', true)
          .maybeSingle()
          .then((r) => r as SupabaseResult<PlatformUser | null>),
        8000,
        'platform_users'
      )

      if (platformRes.error)
        console.error('platform_users error:', platformRes.error)

      const platformUserData = platformRes.data ?? null
      setPlatformUser(platformUserData)

      const isPlatformAdmin = Boolean(
        platformUserData?.is_active &&
          ['DEV', 'PLATFORM_ADMIN'].includes(platformUserData.role)
      )

      // If platform admin, check for selected organization
      if (isPlatformAdmin) {
        const selectedOrgId = localStorage.getItem(
          'platform_admin_selected_org'
        )

        if (selectedOrgId) {
          // Fetch the selected organization
          const orgRes = await withTimeout(
            supabase
              .from('organizations')
              .select('id, comercial_name, legal_name')
              .eq('id', selectedOrgId)
              .eq('status', 'ACTIVE')
              .maybeSingle()
              .then(
                (r) =>
                  r as SupabaseResult<{
                    id: string
                    comercial_name: string
                    legal_name: string
                  } | null>
              ),
            8000,
            'organizations'
          )

          if (orgRes.error) console.error('organizations error:', orgRes.error)

          if (orgRes.data) {
            // Set as virtual organization member with admin access
            setOrganizationMember({
              org_id: orgRes.data.id,
              user_id: userId,
              role: 'ADMIN', // Platform admins get admin-level access
              organization: {
                id: orgRes.data.id,
                comercial_name: orgRes.data.comercial_name,
                legal_name: orgRes.data.legal_name,
              },
            })
            console.log('Platform admin - Selected org:', orgRes.data)
            setUserDataLoading(false)
            return
          } else {
            // Selected org not found or inactive, clear selection
            localStorage.removeItem('platform_admin_selected_org')
          }
        }

        // No org selected or org not found - platform admin in global view
        setOrganizationMember(null)
        console.log('Platform admin - Global view (no org selected)')
        setUserDataLoading(false)
        return
      }

      // Not a platform admin - fetch regular organization membership
      const memberRes = await withTimeout(
        supabase
          .from('organization_members')
          .select('org_id, user_id, role')
          .eq('user_id', userId)
          .maybeSingle()
          .then(
            (r) =>
              r as SupabaseResult<Pick<
                OrganizationMember,
                'org_id' | 'user_id' | 'role'
              > | null>
          ),
        8000,
        'organization_members'
      )

      if (memberRes.error)
        console.error('organization_members error:', memberRes.error)

      const member = memberRes.data
        ? {
            org_id: memberRes.data.org_id,
            user_id: memberRes.data.user_id,
            role: memberRes.data.role,
          }
        : null

      if (member?.org_id) {
        const orgRes = await withTimeout(
          supabase
            .from('organizations')
            .select('id, comercial_name, legal_name')
            .eq('id', member.org_id)
            .maybeSingle()
            .then(
              (r) =>
                r as SupabaseResult<{
                  id: string
                  comercial_name: string
                  legal_name: string
                } | null>
            ),
          8000,
          'organizations'
        )

        if (orgRes.error) console.error('organizations error:', orgRes.error)

        setOrganizationMember({
          ...member,
          organization: orgRes.data ?? undefined,
        })
      } else {
        setOrganizationMember(null)
      }

      console.log('platformUser:', platformUserData ?? null)
      console.log('orgMember:', memberRes.data ?? null)
    } catch (e) {
      console.error('fetchUserData failed:', e)
      setPlatformUser(null)
      setOrganizationMember(null)
    } finally {
      setUserDataLoading(false)
    }
  }

  const clearUserData = () => {
    setPlatformUser(null)
    setOrganizationMember(null)
    // Clear platform admin org selection on logout
    localStorage.removeItem('platform_admin_selected_org')
  }

  const refreshUserData = async () => {
    const { data, error } = await supabase.auth.getUser()
    if (error) console.error('getUser error:', error)
    if (data.user) await fetchUserData(data.user.id)
  }

  useEffect(() => {
    let cancelled = false

    const init = async () => {
      setAuthLoading(true)
      try {
        const { data, error } = await supabase.auth.getSession()
        if (error) throw error

        const sessionUser = data.session?.user ?? null
        if (cancelled) return

        setUser(sessionUser)
      } catch (e) {
        console.error('Auth init failed:', e)
        if (cancelled) return
        setUser(null)
        setPlatformUser(null)
        setOrganizationMember(null)
      } finally {
        if (!cancelled) setAuthLoading(false)
      }
    }

    init()

    const { data: sub } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        const sessionUser = session?.user ?? null
        setUser(sessionUser)

        if (sessionUser) {
          // Fetch in background; won't block UI forever due to timeout
          fetchUserData(sessionUser.id)
        } else {
          setPlatformUser(null)
          setOrganizationMember(null)
        }
      }
    )

    // ALSO: if you already have a session at init time, trigger fetch once (non-blocking)
    supabase.auth.getSession().then(({ data }) => {
      const u = data.session?.user
      if (u && !cancelled) fetchUserData(u.id)
    })

    return () => {
      cancelled = true
      sub.subscription.unsubscribe()
    }
  }, [])

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    if (error) throw error
    // onAuthStateChange will fire and fetchUserData()
  }

  const signOut = async () => {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
    setUser(null)
    clearUserData()
  }

  const isPlatformAdmin = useMemo(() => {
    return Boolean(
      platformUser?.is_active &&
        ['DEV', 'PLATFORM_ADMIN'].includes(platformUser.role)
    )
  }, [platformUser])

  const isOrgMember = useMemo(
    () => Boolean(organizationMember),
    [organizationMember]
  )

  const value: AuthContextType = {
    user,
    organizationMember,
    platformUser,
    isPlatformAdmin,
    isOrgMember,
    loading,
    signIn,
    signOut,
    refreshUserData,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within an AuthProvider')
  return context
}
