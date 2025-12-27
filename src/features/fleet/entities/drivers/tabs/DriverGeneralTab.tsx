import { Card } from '../../../../../components/ui/Card'
import {
  InputField,
  SelectField,
} from '../../../../../components/widgets/FormField'
import { FormActions } from '../../../../../components/widgets/FormActions'
import { useState, useEffect } from 'react'
import { driversService } from '../../../../../services/drivers.service'
import { carriersService } from '../../../../../services/carriers.service'
import { supabase } from '../../../../../lib/supabase'
import { useOrganization } from '@/hooks/useOrganization'
import type {
  Driver,
  DriverInsert,
  DriverUpdate,
} from '../../../../../types/database.types'

interface DriverGeneralTabProps {
  driver?: Driver | null
  isCreating?: boolean
  onSave?: () => void
  onCancel?: () => void
  carrierId?: number // Optional: pre-select carrier
}

export function DriverGeneralTab({
  driver,
  isCreating = false,
  onSave,
  onCancel,
  carrierId: preSelectedCarrierId,
}: DriverGeneralTabProps) {
  const { orgId } = useOrganization()
  const [saving, setSaving] = useState(false)
  const [carriers, setCarriers] = useState<any[]>([])
  const [countries, setCountries] = useState<any[]>([])

  const [formData, setFormData] = useState({
    driver_id: driver?.driver_id || '',
    name: driver?.name || '',
    license_number: driver?.license_number || '',
    phone_number: driver?.phone_number || '',
    email: driver?.email || '',
    birth_date: driver?.birth_date || '',
    nationality: driver?.nationality || 1,
    address: driver?.address || '',
    city: driver?.city || '',
    status: driver?.status || 'AVAILABLE',
    contract_date:
      driver?.contract_date || new Date().toISOString().split('T')[0],
    carrier_id: driver?.carrier_id || preSelectedCarrierId || null,
    notes: driver?.notes || '',
  })

  // Load carriers and countries
  useEffect(() => {
    if (!orgId) return

    async function loadOptions() {
      try {
        const [carriersData, countriesData] = await Promise.all([
          carriersService.getActive(orgId!),
          supabase.from('countries').select('*').order('name'),
        ])

        setCarriers(carriersData)
        if (countriesData.data) {
          setCountries(countriesData.data)
        }
      } catch (err) {
        console.error('Error loading options:', err)
      }
    }

    loadOptions()
  }, [orgId])

  // Auto-generate driver ID if creating
  useEffect(() => {
    if (isCreating && !formData.driver_id) {
      const timestamp = Date.now().toString().slice(-6)
      setFormData((prev) => ({
        ...prev,
        driver_id: `DRV-${timestamp}`,
      }))
    }
  }, [isCreating, formData.driver_id])

  const handleChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleSave = async () => {
    if (!orgId) {
      alert('No se pudo obtener la organización')
      return
    }

    // Validate required fields
    const requiredFields = [
      'driver_id',
      'name',
      'license_number',
      'phone_number',
      'email',
      'birth_date',
      'address',
      'city',
      'contract_date',
    ]

    for (const field of requiredFields) {
      if (!formData[field as keyof typeof formData]) {
        alert(`El campo es requerido: ${field}`)
        return
      }
    }

    // Validate email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(formData.email)) {
      alert('El email no es válido')
      return
    }

    try {
      setSaving(true)

      if (isCreating) {
        const newDriver: DriverInsert = {
          org_id: orgId,
          driver_id: formData.driver_id,
          name: formData.name,
          license_number: formData.license_number,
          phone_number: formData.phone_number,
          email: formData.email,
          birth_date: formData.birth_date,
          nationality: formData.nationality,
          address: formData.address,
          city: formData.city,
          status: formData.status as any,
          contract_date: formData.contract_date,
          carrier_id: formData.carrier_id,
          notes: formData.notes || null,
        }

        await driversService.create(newDriver)
        alert('Conductor creado exitosamente')
      } else if (driver) {
        const updates: DriverUpdate = {
          driver_id: formData.driver_id,
          name: formData.name,
          license_number: formData.license_number,
          phone_number: formData.phone_number,
          email: formData.email,
          birth_date: formData.birth_date,
          nationality: formData.nationality,
          address: formData.address,
          city: formData.city,
          status: formData.status as any,
          contract_date: formData.contract_date,
          carrier_id: formData.carrier_id,
          notes: formData.notes || null,
        }

        await driversService.update(driver.id, orgId, updates)
        alert('Conductor actualizado exitosamente')
      }

      if (onSave) {
        onSave()
      }
    } catch (err) {
      console.error('Error saving driver:', err)
      alert('Error al guardar el conductor')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className='space-y-6'>
      {/* Información Personal */}
      <Card className='p-6'>
        <div className='mb-5'>
          <h3 className='text-sm font-semibold text-gray-900 uppercase tracking-wide'>
            Información Personal
          </h3>
        </div>

        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5'>
          <InputField
            label='ID Conductor'
            id='driver_id'
            required
            value={formData.driver_id}
            onChange={(e) => handleChange('driver_id', e.target.value)}
            disabled={!isCreating}
            placeholder='Ej: DRV-001'
          />

          <InputField
            label='Nombre Completo'
            id='name'
            required
            value={formData.name}
            onChange={(e) => handleChange('name', e.target.value)}
            placeholder='Nombre y apellidos'
          />

          <InputField
            label='Fecha de Nacimiento'
            id='birth_date'
            type='date'
            required
            value={formData.birth_date}
            onChange={(e) => handleChange('birth_date', e.target.value)}
          />

          <SelectField
            label='Nacionalidad'
            id='nationality'
            required
            value={formData.nationality.toString()}
            onChange={(e) =>
              handleChange('nationality', parseInt(e.target.value))
            }
            options={countries.map((c) => ({
              value: c.id.toString(),
              label: c.name,
            }))}
          />

          <InputField
            label='Dirección'
            id='address'
            required
            value={formData.address}
            onChange={(e) => handleChange('address', e.target.value)}
            placeholder='Dirección completa'
          />

          <InputField
            label='Ciudad'
            id='city'
            required
            value={formData.city}
            onChange={(e) => handleChange('city', e.target.value)}
            placeholder='Ciudad de residencia'
          />
        </div>
      </Card>

      {/* Licencia y Contacto */}
      <Card className='p-6'>
        <div className='mb-5'>
          <h3 className='text-sm font-semibold text-gray-900 uppercase tracking-wide'>
            Licencia y Contacto
          </h3>
        </div>

        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5'>
          <InputField
            label='Número de Licencia'
            id='license_number'
            required
            value={formData.license_number}
            onChange={(e) => handleChange('license_number', e.target.value)}
            placeholder='Número de licencia de conducir'
          />

          <InputField
            label='Teléfono'
            id='phone_number'
            type='tel'
            required
            value={formData.phone_number}
            onChange={(e) => handleChange('phone_number', e.target.value)}
            placeholder='+591 70000000'
          />

          <InputField
            label='Email'
            id='email'
            type='email'
            required
            value={formData.email}
            onChange={(e) => handleChange('email', e.target.value)}
            placeholder='conductor@ejemplo.com'
          />
        </div>
      </Card>

      {/* Información Laboral */}
      <Card className='p-6'>
        <div className='mb-5'>
          <h3 className='text-sm font-semibold text-gray-900 uppercase tracking-wide'>
            Información Laboral
          </h3>
        </div>

        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5'>
          <SelectField
            label='Transportista'
            id='carrier_id'
            value={formData.carrier_id?.toString() || 'none'}
            onChange={(e) =>
              handleChange(
                'carrier_id',
                e.target.value === 'none' ? null : parseInt(e.target.value)
              )
            }
            options={[
              { value: 'none', label: 'Sin asignar' },
              ...carriers.map((c) => ({
                value: c.id.toString(),
                label: c.commercial_name,
              })),
            ]}
          />

          <InputField
            label='Fecha de Contratación'
            id='contract_date'
            type='date'
            required
            value={formData.contract_date}
            onChange={(e) => handleChange('contract_date', e.target.value)}
          />

          <SelectField
            label='Estado'
            id='status'
            required
            value={formData.status}
            onChange={(e) => handleChange('status', e.target.value)}
            options={[
              { value: 'AVAILABLE', label: 'Disponible' },
              { value: 'DRIVING', label: 'En Ruta' },
              { value: 'INACTIVE', label: 'Inactivo' },
            ]}
          />
        </div>
      </Card>

      {/* Notas */}
      <Card className='p-6'>
        <div className='mb-5'>
          <h3 className='text-sm font-semibold text-gray-900 uppercase tracking-wide'>
            Notas Adicionales
          </h3>
        </div>

        <div className='grid grid-cols-1 gap-5'>
          <div>
            <label
              htmlFor='notes'
              className='block text-sm font-medium text-gray-700 mb-1'
            >
              Notas
            </label>
            <textarea
              id='notes'
              rows={4}
              value={formData.notes}
              onChange={(e) => handleChange('notes', e.target.value)}
              className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
              placeholder='Información adicional del conductor...'
            />
          </div>
        </div>
      </Card>

      {/* Botones de Acción */}
      <FormActions
        onCancel={onCancel}
        onSave={handleSave}
        saveLabel={isCreating ? 'Crear Conductor' : 'Guardar Cambios'}
        disabled={saving}
      />
    </div>
  )
}
