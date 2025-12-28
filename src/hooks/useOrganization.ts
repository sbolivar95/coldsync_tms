// src/hooks/useOrganization.ts
import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'

/**
 * Hook to get the current organization ID.
 *
 * This hook handles two scenarios:
 * 1. Regular users: Gets orgId from organization_members table
 * 2. Platform admins: Gets orgId from localStorage (platform_admin_selected_org)
 *    when they have selected an organization to manage
 *
 * Usage:
 * ```tsx
 * const { orgId, loading, error, refresh } = useOrganization()
 * ```
 */
export function useOrganization() {
  const [orgId, setOrgId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const loadOrg = useCallback(async () => {
    try {
      setLoading(true)

      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        setOrgId(null)
        setLoading(false)
        return
      }

      // First, check if user is a platform admin
      const { data: platformUser, error: platformError } = await supabase
        .from('platform_users')
        .select('role, is_active')
        .eq('user_id', user.id)
        .maybeSingle()

      const isPlatformAdmin =
        !platformError &&
        platformUser?.is_active === true &&
        ['DEV', 'PLATFORM_ADMIN'].includes(platformUser.role)

      // If platform admin, check localStorage for selected org
      if (isPlatformAdmin) {
        const selectedOrgId = localStorage.getItem(
          'platform_admin_selected_org'
        )

        if (selectedOrgId) {
          // Verify the org exists and is active
          const { data: org, error: orgError } = await supabase
            .from('organizations')
            .select('id')
            .eq('id', selectedOrgId)
            .eq('status', 'ACTIVE')
            .maybeSingle()

          if (!orgError && org) {
            setOrgId(org.id)
            setLoading(false)
            return
          } else {
            // Selected org not found or inactive, clear selection
            localStorage.removeItem('platform_admin_selected_org')
          }
        }

        // Platform admin without selected org - return null (global view)
        setOrgId(null)
        setLoading(false)
        return
      }

      // Regular user - get org from organization_members
      const { data: member, error: memberError } = await supabase
        .from('organization_members')
        .select('org_id')
        .eq('user_id', user.id)
        .maybeSingle()

      if (memberError) {
        throw memberError
      }

      setOrgId(member?.org_id || null)
    } catch (err) {
      console.error('useOrganization error:', err)
      setError(err as Error)
      setOrgId(null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadOrg()

    // Listen for storage events (when org selection changes in another tab)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'platform_admin_selected_org') {
        loadOrg()
      }
    }

    window.addEventListener('storage', handleStorageChange)

    // Also listen for custom event when selection changes in the same tab
    const handleOrgChange = () => {
      loadOrg()
    }

    window.addEventListener('platform_admin_org_changed', handleOrgChange)

    return () => {
      window.removeEventListener('storage', handleStorageChange)
      window.removeEventListener('platform_admin_org_changed', handleOrgChange)
    }
  }, [loadOrg])

  return { orgId, loading, error, refresh: loadOrg }
}

/**
 * Utility function to trigger org change event.
 * Call this after changing the selected org in localStorage
 * to notify all useOrganization hooks to refresh.
 */
export function dispatchOrgChangeEvent() {
  window.dispatchEvent(new CustomEvent('platform_admin_org_changed'))
}
