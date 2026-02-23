import { useFormContext } from 'react-hook-form'
import { useEffect, useState } from 'react'
import type { DriverFormData } from '../../../../../lib/schemas/driver.schemas'
import { countriesService } from '../../../../../services/database/organizations.service'
import { toast } from 'sonner'
import { DriverGeneralForm } from '../components/DriverGeneralForm'

interface DriverGeneralTabProps {
  currentAssignment?: any
}

export function DriverGeneralTab({ currentAssignment }: DriverGeneralTabProps) {
  const form = useFormContext<DriverFormData>()
  const [countries, setCountries] = useState<
    Array<{ value: string; label: string }>
  >([])
  const [loadingCountries, setLoadingCountries] = useState(false)

  // Load countries from database
  useEffect(() => {
    if (countries.length === 0) {
      loadCountries()
    }
  }, [])

  const loadCountries = async () => {
    try {
      setLoadingCountries(true)
      const countriesData = await countriesService.getAll()
      setCountries(
        countriesData.map((country) => ({
          value: country.id.toString(), // Convert to string for SmartSelect
          label: country.name,
        }))
      )
    } catch (error) {
      console.error('Error loading countries:', error)
      toast.error('Error al cargar países')
    } finally {
      setLoadingCountries(false)
    }
  }

  return (
    <div className='space-y-6'>
      <DriverGeneralForm
        form={form}
        countries={countries}
        loadingCountries={loadingCountries}
        currentAssignment={currentAssignment}
      />
    </div>
  )
}
