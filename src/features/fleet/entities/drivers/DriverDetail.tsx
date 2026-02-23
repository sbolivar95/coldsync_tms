import { PageHeader } from '../../../../layouts/PageHeader'
import { useState, useEffect } from 'react'
import { DriverGeneralTab } from './tabs/DriverGeneralTab'
import { DetailFooter } from '../../../../components/widgets/DetailFooter'
import { useFormChanges } from '../../../../hooks/useFormChanges'
import type { Driver } from '../../../../types/database.types'
import { driverSchema, type DriverFormData } from '../../../../lib/schemas/driver.schemas'
import { useForm, FormProvider } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { ScrollArea } from '../../../../components/ui/ScrollArea'
import { fleetSetsService } from '../../../../services/database/fleetSets.service'
import { useAppStore } from '../../../../stores/useAppStore'

interface DriverDetailProps {
  driver: Driver | null // null for create mode
  onBack: () => void
  onSave: (data: DriverFormData) => Promise<void>
  mode?: 'view' | 'edit' | 'create'
  carrierId?: number // Required for create mode
}

export function DriverDetail({
  driver,
  onBack,
  onSave,
  mode = 'view',
  carrierId,
}: DriverDetailProps) {
  const organization = useAppStore((state) => state.organization)
  const [activeTab, setActiveTab] = useState('general')
  const [isEditing, setIsEditing] = useState(mode === 'edit' || mode === 'create')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [justSaved, setJustSaved] = useState(false)
  const [originalData, setOriginalData] = useState<DriverFormData | null>(null)
  const [currentAssignment, setCurrentAssignment] = useState<any>(null)

  // Update isEditing when mode changes
  useEffect(() => {
    setIsEditing(mode === 'edit' || mode === 'create')
  }, [mode])

  // Single form instance shared across all tabs
  const form = useForm<DriverFormData>({
    resolver: zodResolver(driverSchema) as any,
    defaultValues: {
      driver_id: '',
      name: '',
      license_number: '',
      phone_number: '',
      email: '',
      birth_date: '',
      nationality: 1,
      address: '',
      city: '',
      status: 'AVAILABLE',
      contract_date: '',
      notes: null,
      carrier_id: carrierId || 0,
    },
  })

  // Use hook for change detection
  const { hasChanges } = useFormChanges(form, originalData, mode)

  // Load assignment
  useEffect(() => {
    if (driver?.id && organization?.id) {
      fleetSetsService.getCurrentByDriver(organization.id, driver.id)
        .then(setCurrentAssignment)
        .catch(console.error)
    } else {
      setCurrentAssignment(null)
    }
  }, [driver, organization?.id])

  // Reset form when driver changes
  useEffect(() => {
    if (driver) {
      const newFormData: DriverFormData = {
        driver_id: driver.driver_id,
        name: driver.name,
        license_number: driver.license_number,
        phone_number: driver.phone_number,
        email: driver.email || '',
        birth_date: typeof driver.birth_date === 'string' ? driver.birth_date : new Date(driver.birth_date).toISOString().split('T')[0],
        nationality: Number(driver.nationality || 1),
        address: driver.address,
        city: driver.city,
        status: driver.status as any,
        contract_date: typeof driver.contract_date === 'string' ? driver.contract_date : new Date(driver.contract_date).toISOString().split('T')[0],
        notes: driver.notes,
        carrier_id: driver.carrier_id || 0,
      }
      form.reset(newFormData)
      setOriginalData(newFormData)
      setJustSaved(false)
    } else if (carrierId) {
      // Set default carrierId for new drivers
      const currentValues = form.getValues()
      if (currentValues.carrier_id !== carrierId) {
        form.setValue('carrier_id', carrierId)
      }
    }
  }, [driver, carrierId, form])

  const handleSave = async () => {
    const isValid = await form.trigger()
    if (!isValid) {
      toast.error('Por favor corrige los errores en el formulario')
      return
    }

    setIsSubmitting(true)
    setJustSaved(false)

    try {
      const formData = form.getValues()
      await onSave(formData)

      // Update original data to reflect saved state
      setOriginalData({ ...formData })
      setJustSaved(true)

      // Success toast handled by parent

      if (mode === 'create') {
        onBack()
      } else {
        // Keep in edit mode but update state
        // setIsEditing(false); // Optional: if we want to switch to view mode
      }

      setTimeout(() => setJustSaved(false), 3000)
    } catch (error) {
      console.error('Error saving driver:', error)
      // Error toast handled by parent
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCancel = () => {
    onBack()
  }

  return (
    <FormProvider {...form}>
      <div className='flex flex-col h-full'>
        <PageHeader
          tabs={[
            {
              id: 'general',
              label: 'General',
              active: activeTab === 'general',
              onClick: () => setActiveTab('general'),
            },
          ]}
        />

        <div className='flex-1 overflow-hidden'>
          <ScrollArea className='h-full'>
            <div className='p-6 bg-gray-50 pb-24'>
              <div className='max-w-6xl mx-auto'>
                {/* Render tab but hide inactive one to preserve form state */}
                <div className={activeTab === 'general' ? '' : 'hidden'}>
                  <DriverGeneralTab currentAssignment={currentAssignment} />
                </div>
              </div>
            </div>
          </ScrollArea>
        </div>

        <DetailFooter
          onCancel={handleCancel}
          onSave={handleSave}
          isSubmitting={isSubmitting}
          hasChanges={hasChanges}
          justSaved={justSaved}
          showFooter={isEditing}
        />
      </div>
    </FormProvider>
  )
}
