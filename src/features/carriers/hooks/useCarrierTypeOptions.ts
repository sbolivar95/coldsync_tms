import { useState, useEffect } from 'react'
import { carriersService } from '../../../services/database/carriers.service'
import { useAppStore } from '../../../stores/useAppStore'
import { toast } from 'sonner'

export interface CarrierTypeOption {
  value: string
  label: string
}

/**
 * Hook to fetch carrier type options from Supabase
 * Uses global store for persistence between navigations (Rule: Prevention of re-loading)
 */
export function useCarrierTypeOptions() {
  const options = useAppStore((state) => state.carrierTypeOptions)
  const setOptions = useAppStore((state) => state.setCarrierTypeOptions)
  const [isLoading, setIsLoading] = useState(options.length === 0)

  useEffect(() => {
    // If we have cached options in store, no need to fetch
    if (options.length > 0) {
      setIsLoading(false)
      return
    }

    const fetchOptions = async () => {
      try {
        setIsLoading(true)
        const data = await carriersService.getCarrierTypeOptions()
        setOptions(data)
      } catch (error) {
        console.error('Error fetching carrier type options:', error)
        toast.error('Error al cargar tipos de transportista')
        // Don't set empty array in store to allow retry, but strictly we could.
        // For now, keep local loading state correct.
      } finally {
        setIsLoading(false)
      }
    }

    fetchOptions()
  }, [options.length, setOptions])

  return { options, isLoading }
}
