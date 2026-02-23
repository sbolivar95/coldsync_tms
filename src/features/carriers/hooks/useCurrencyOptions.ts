import { useState, useEffect } from 'react'
import { carriersService } from '../../../services/database/carriers.service'
import { toast } from 'sonner'

export interface CurrencyOption {
  value: string
  label: string
}

/**
 * Hook to fetch currency options from Supabase
 */
export function useCurrencyOptions() {
  const [options, setOptions] = useState<CurrencyOption[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchOptions = async () => {
      try {
        setIsLoading(true)
        const data = await carriersService.getCurrencyOptions()
        setOptions(data)
      } catch (error) {
        console.error('Error fetching currency options:', error)
        toast.error('Error al cargar monedas')
        setOptions([])
      } finally {
        setIsLoading(false)
      }
    }

    fetchOptions()
  }, [])

  return { options, isLoading }
}
