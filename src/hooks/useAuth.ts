import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAppStore } from '../stores/useAppStore'
import { authService } from '../services/database/auth.service'
import { supabase } from '../lib/supabase'
import { useShallow } from 'zustand/react/shallow'

// Module-level guards (implementation details, not UI state)
let isInitStarted = false
let globalSubscription: { unsubscribe: () => void } | null = null

/**
 * Fetches the full auth session (user + org metadata) from Supabase
 * and syncs it to the Zustand store. Single source of truth for
 * the pattern: getCurrentSession → setAuthSession / clearAuthSession.
 */
async function syncAuthSession(): Promise<void> {
  const { setAuthSession, clearAuthSession } = useAppStore.getState()
  try {
    const session = await authService.getCurrentSession()
    if (session) {
      setAuthSession(session)
    } else {
      clearAuthSession()
    }
  } catch {
    clearAuthSession()
  }
}

/**
 * Hook to manage authentication state and operations.
 *
 * Session lifecycle:
 * 1. On first mount, fetches the full session (user + org metadata) via syncAuthSession.
 * 2. Supabase's autoRefreshToken + persistSession handle token rotation and storage.
 * 3. onAuthStateChange listens for auth events:
 *    - SIGNED_IN: Full metadata fetch ONLY when transitioning from unauthenticated.
 *      On tab return, Supabase fires SIGNED_IN as confirmation — if already
 *      authenticated, skip to avoid blocking the auth pipeline (Supabase awaits callbacks).
 *    - TOKEN_REFRESHED: Token rotation only — Supabase saves tokens internally.
 *    - USER_UPDATED: Full metadata re-fetch (user data changed).
 *    - SIGNED_OUT: Clears auth state.
 *
 * Persistence (handled by Supabase, NOT by this hook):
 * - Tab visible + idle: auto-refresh ticker runs every ~10s, refreshes before expiry.
 * - Tab hidden: ticker paused, _recoverAndRefresh() on tab return.
 * - Page refresh / browser restart: session recovered from localStorage (persistSession: true).
 * - Realtime: Supabase client internally updates WebSocket tokens on rotation.
 */
export function useAuth() {
  const navigate = useNavigate()
  const {
    isAuthenticated,
    isAuthInitializing,
    user,
    organization,
    organizationMember,
    organizationMembers,
  } = useAppStore(
    useShallow((state) => ({
      isAuthenticated: state.isAuthenticated,
      isAuthInitializing: state.isAuthInitializing,
      user: state.user,
      organization: state.organization,
      organizationMember: state.organizationMember,
      organizationMembers: state.organizationMembers,
    }))
  )

  // Initialize session on mount (only once globally)
  useEffect(() => {
    if (isInitStarted) return
    isInitStarted = true

    async function init() {
      useAppStore.getState().setAuthInitializing(true)
      await syncAuthSession()
      useAppStore.getState().setAuthInitializing(false)
    }

    init()
  }, [])

  // Setup global auth state change listener (only once, after init completes)
  useEffect(() => {
    if (globalSubscription || isAuthInitializing) return

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        const { isAuthenticated: isAuthed } = useAppStore.getState()

        // Session ended
        if (event === 'SIGNED_OUT' || (event === 'INITIAL_SESSION' && !session)) {
          useAppStore.getState().clearAuthSession()
          return
        }

        // Token rotation only — Supabase handles storage internally.
        // No DB queries needed, just verify session is alive.
        if (event === 'TOKEN_REFRESHED') {
          if (!session) useAppStore.getState().clearAuthSession()
          return
        }

        // SIGNED_IN fires on every tab return via _recoverAndRefresh().
        // If already authenticated → tab-return confirmation, skip re-fetch.
        // If not authenticated → genuine sign-in, fetch full metadata.
        if (event === 'SIGNED_IN' || (event === 'INITIAL_SESSION' && session)) {
          if (!isAuthed) await syncAuthSession()
          return
        }

        // User metadata changed — re-fetch full session
        if (event === 'USER_UPDATED') {
          await syncAuthSession()
        }
      }
    )

    globalSubscription = subscription
  }, [isAuthInitializing])

  const logout = async () => {
    try {
      await authService.logout()
      useAppStore.getState().clearAuthSession()
      navigate('/login')
    } catch {
      // Logout error — user will be redirected anyway
    }
  }

  const switchOrganization = async (orgId: string) => {
    const session = await authService.switchOrganization(orgId)
    useAppStore.getState().setAuthSession(session)
  }

  return {
    isAuthenticated,
    isInitializing: isAuthInitializing,
    user,
    organization,
    organizationMember,
    organizationMembers,
    logout,
    switchOrganization,
  }
}
