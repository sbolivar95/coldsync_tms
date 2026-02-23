import { useState, useEffect } from 'react'
import { countriesService } from '../../../services/database/organizations.service'
import { toast } from 'sonner'
import type { Country } from '../../../types/database.types'

/**
 * Hook to manage countries data
 * Countries are loaded once and cached in component state
 */
export function useCountries() {
  const [countries, setCountries] = useState<Country[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchCountries = async () => {
      try {
        setIsLoading(true)
        const data = await countriesService.getAll()
        setCountries(data as Country[])
      } catch (error) {
        console.error('Error fetching countries:', error)
        toast.error('Error al cargar países')
        setCountries([])
      } finally {
        setIsLoading(false)
      }
    }

    fetchCountries()
  }, [])

  return { countries, isLoading }
}
