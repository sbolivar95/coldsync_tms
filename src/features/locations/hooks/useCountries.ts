import { useState, useEffect, useRef } from 'react'
import { toast } from 'sonner'
import { countriesService } from '../../../services/database/organizations.service'
import type { SmartOption } from '../../../components/widgets/SmartSelect'

/**
 * Hook for loading and managing countries data
 * Follows project pattern for data loading with caching
 */
export function useCountries() {
  const [countries, setCountries] = useState<SmartOption[]>([])
  const [loading, setLoading] = useState(false)
  const loadedRef = useRef(false)

  const loadCountries = async () => {
    if (loadedRef.current) return

    try {
      setLoading(true)
      const countriesData = await countriesService.getAll()
      setCountries(
        countriesData.map((country) => ({
          value: country.id.toString(),
          label: country.name,
        }))
      )
      loadedRef.current = true
    } catch (error) {
      console.error('Error loading countries:', error)
      toast.error('Error al cargar la lista de países')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!loadedRef.current) {
      loadCountries()
    }
  }, [])

  return {
    countries,
    loading,
    loadCountries
  }
}