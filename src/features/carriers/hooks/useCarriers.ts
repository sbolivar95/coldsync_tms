import { useEffect } from 'react'
import { useAppStore } from '../../../stores/useAppStore'
import { carriersService } from '../../../services/database/carriers.service'
import { toast } from 'sonner'

/**
 * Hook to manage carriers data with Zustand store and intelligent caching
 * Follows the universal pattern for data hooks with shared state
 */
export function useCarriers(orgId: string | null | undefined) {
  // 1. Use Zustand store (shared state and persistent)
  const carriers = useAppStore((state) => state.carriers)
  const isLoading = useAppStore((state) => state.carriersLoading)
  const carriersLoadedOrgId = useAppStore((state) => state.carriersLoadedOrgId)
  const setCarriers = useAppStore((state) => state.setCarriers)
  const setCarriersLoading = useAppStore((state) => state.setCarriersLoading)
  const setCarriersLoadedOrgId = useAppStore((state) => state.setCarriersLoadedOrgId)

  // 2. Load function with intelligent caching
  const loadCarriers = async (force = false) => {
    if (!orgId) {
      setCarriers([])
      setCarriersLoadedOrgId(null)
      return
    }

    // CACHING: Only reload if orgId changed or forced
    if (!force && carriersLoadedOrgId === orgId && carriers.length > 0) {
      return // Already loaded for this orgId, don't reload
    }

    try {
      setCarriersLoading(true)
      const result = await carriersService.getAll(orgId)
      setCarriers(result)
      setCarriersLoadedOrgId(orgId) // Save loaded orgId
    } catch (error) {
      console.error('Error loading carriers:', error)
      toast.error('Error al cargar transportistas')
      setCarriers([])
      setCarriersLoadedOrgId(null)
    } finally {
      setCarriersLoading(false)
    }
  }

  // 3. Only load if orgId changed or no data
  useEffect(() => {
    let mounted = true

    const init = async () => {
      if (orgId && mounted) {
        // Check if we need to load
        if (carriersLoadedOrgId !== orgId || carriers.length === 0) {
          await loadCarriers()
        }
      } else if (!orgId && mounted) {
        setCarriers([])
        setCarriersLoadedOrgId(null)
      }
    }

    init()

    return () => {
      mounted = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orgId]) // Only re-run when orgId changes

  return { carriers, isLoading, loadCarriers }
}

/**
 * Hook to get active carriers only
 */
export function useActiveCarriers(orgId: string | null | undefined) {
  const { carriers, isLoading, loadCarriers } = useCarriers(orgId)
  const activeCarriers = carriers.filter((c) => c.is_active)
  return { carriers: activeCarriers, isLoading, loadCarriers }
}
