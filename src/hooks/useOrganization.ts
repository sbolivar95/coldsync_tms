// src/hooks/useOrganization.ts
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

export function useOrganization() {
  const [orgId, setOrgId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    async function loadOrg() {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser()
        if (!user) {
          setLoading(false)
          return
        }

        const { data: member, error: memberError } = await supabase
          .from('organization_members')
          .select('org_id')
          .eq('user_id', user.id)
          .single()

        if (memberError) throw memberError

        setOrgId(member.org_id)
      } catch (err) {
        setError(err as Error)
      } finally {
        setLoading(false)
      }
    }

    loadOrg()
  }, [])

  return { orgId, loading, error }
}
