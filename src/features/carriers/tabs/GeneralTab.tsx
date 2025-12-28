import { Card } from '../../../components/ui/Card'
import { InputField, SelectField } from '../../../components/widgets/FormField'
import { FormActions } from '../../../components/widgets/FormActions'
import { useState, useEffect } from 'react'
import { carriersService } from '../../../services/carriers.service'
import { useOrganization } from '../../../hooks/useOrganization'
import type {
  Carrier,
  CarrierInsert,
  CarrierUpdate,
} from '../../../types/database.types'

interface GeneralTabProps {
  carrier?: Carrier | null
  isCreating?: boolean
  onSave?: () => void
  onCancel?: () => void
}

export function GeneralTab({
  carrier,
  isCreating = false,
  onSave,
  onCancel,
}: GeneralTabProps) {
  // Use the hook that supports platform admin selected org
  const { orgId, loading: orgLoading } = useOrganization()

  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({
    carrier_id: carrier?.carrier_id || '',
    carrier_type: carrier?.carrier_type || 'THIRD PARTY',
    is_active: carrier?.is_active ?? true,
    commercial_name: carrier?.commercial_name || '',
    legal_name: carrier?.legal_name || '',
    tax_id: carrier?.tax_id || '',
    legal_representative: carrier?.legal_representative || '',
    country: carrier?.country || 'Bolivia',
    city: carrier?.city || '',
    fiscal_address: carrier?.fiscal_address || '',
    contact_name: carrier?.contact_name || '',
    contact_phone: carrier?.contact_phone || '',
    contact_email: carrier?.contact_email || '',
    ops_phone_24_7: carrier?.ops_phone_24_7 || '',
    finance_email: carrier?.finance_email || '',
  })

  // Generate carrier_id if creating
  useEffect(() => {
    if (isCreating && !formData.carrier_id) {
      // Generate a simple ID like CAR-001
      const timestamp = Date.now().toString().slice(-6)
      setFormData((prev) => ({
        ...prev,
        carrier_id: `CAR-${timestamp}`,
      }))
    }
  }, [isCreating, formData.carrier_id])

  const handleChange = (field: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  const handleSave = async () => {
    if (!orgId) {
      alert(
        'No se pudo obtener la organización. Por favor, selecciona una organización primero.'
      )
      return
    }

    // Validate required fields
    const requiredFields = [
      'carrier_id',
      'commercial_name',
      'legal_name',
      'tax_id',
      'legal_representative',
      'country',
      'city',
      'fiscal_address',
      'contact_name',
      'contact_phone',
      'contact_email',
      'ops_phone_24_7',
    ]

    for (const field of requiredFields) {
      if (!formData[field as keyof typeof formData]) {
        alert(`El campo es requerido: ${field}`)
        return
      }
    }

    try {
      setSaving(true)

      if (isCreating) {
        // Create new carrier
        const newCarrier: CarrierInsert = {
          org_id: orgId,
          carrier_id: formData.carrier_id,
          carrier_type: formData.carrier_type as 'OWNER' | 'THIRD PARTY',
          commercial_name: formData.commercial_name,
          legal_name: formData.legal_name,
          tax_id: formData.tax_id,
          legal_representative: formData.legal_representative,
          country: formData.country,
          city: formData.city,
          fiscal_address: formData.fiscal_address,
          is_active: formData.is_active,
          contact_name: formData.contact_name,
          contact_phone: formData.contact_phone,
          contact_email: formData.contact_email,
          ops_phone_24_7: formData.ops_phone_24_7,
          finance_email: formData.finance_email || '',
          payment_terms: 30, // Default value
        }

        await carriersService.create(newCarrier)
        alert('Transportista creado exitosamente')
      } else if (carrier) {
        // Update existing carrier
        const updates: CarrierUpdate = {
          carrier_id: formData.carrier_id,
          carrier_type: formData.carrier_type as 'OWNER' | 'THIRD PARTY',
          commercial_name: formData.commercial_name,
          legal_name: formData.legal_name,
          tax_id: formData.tax_id,
          legal_representative: formData.legal_representative,
          country: formData.country,
          city: formData.city,
          fiscal_address: formData.fiscal_address,
          is_active: formData.is_active,
          contact_name: formData.contact_name,
          contact_phone: formData.contact_phone,
          contact_email: formData.contact_email,
          ops_phone_24_7: formData.ops_phone_24_7,
          finance_email: formData.finance_email,
        }

        await carriersService.update(carrier.id, orgId, updates)
        alert('Transportista actualizado exitosamente')
      }

      if (onSave) {
        onSave()
      }
    } catch (err) {
      console.error('Error saving carrier:', err)
      alert('Error al guardar el transportista')
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = () => {
    if (onCancel) {
      onCancel()
    }
  }

  // Show loading state while org is loading
  if (orgLoading) {
    return (
      <div className='flex items-center justify-center py-12'>
        <div className='inline-block h-6 w-6 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent'></div>
        <span className='ml-2 text-sm text-gray-600'>Cargando...</span>
      </div>
    )
  }

  // Show message if no org selected
  if (!orgId) {
    return (
      <div className='flex items-center justify-center py-12'>
        <div className='text-center'>
          <p className='text-gray-500 mb-2'>No hay organización seleccionada</p>
          <p className='text-sm text-gray-400'>
            Selecciona una organización en Configuración para continuar
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className='space-y-6'>
      {/* Información de Identificación */}
      <Card className='p-6'>
        <div className='mb-5'>
          <h3 className='text-sm font-semibold text-gray-900 uppercase tracking-wide'>
            Información de Identificación
          </h3>
        </div>

        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5'>
          <InputField
            label='ID'
            id='carrier_id'
            value={formData.carrier_id}
            onChange={(e) => handleChange('carrier_id', e.target.value)}
            disabled={!isCreating}
            placeholder='Ej: CAR-001'
          />

          <SelectField
            label='Tipo de Transportista'
            id='carrier_type'
            required
            value={formData.carrier_type}
            onChange={(e) => handleChange('carrier_type', e.target.value)}
            options={[
              { value: 'OWNER', label: 'Flota Propia' },
              { value: 'THIRD PARTY', label: 'Tercero' },
            ]}
            helpText='Seleccione si es flota propia de la empresa o transportista externo'
          />

          <SelectField
            label='Estado'
            id='is_active'
            required
            value={formData.is_active ? 'true' : 'false'}
            onChange={(e) =>
              handleChange('is_active', e.target.value === 'true')
            }
            options={[
              { value: 'true', label: 'Activo' },
              { value: 'false', label: 'Inactivo' },
            ]}
          />
        </div>
      </Card>

      {/* Información Comercial */}
      <Card className='p-6'>
        <div className='mb-5'>
          <h3 className='text-sm font-semibold text-gray-900 uppercase tracking-wide'>
            Información Comercial
          </h3>
        </div>

        <div className='grid grid-cols-1 md:grid-cols-2 gap-5'>
          <InputField
            label='Nombre Comercial'
            id='commercial_name'
            required
            value={formData.commercial_name}
            onChange={(e) => handleChange('commercial_name', e.target.value)}
            placeholder='Ej: ColdChain Express'
          />

          <InputField
            label='Razón Social'
            id='legal_name'
            required
            value={formData.legal_name}
            onChange={(e) => handleChange('legal_name', e.target.value)}
            placeholder='Ej: ColdChain Express S.A.'
          />

          <InputField
            label='NIT/RUC'
            id='tax_id'
            required
            value={formData.tax_id}
            onChange={(e) => handleChange('tax_id', e.target.value)}
            placeholder='Ej: 123456789'
          />

          <InputField
            label='Representante Legal'
            id='legal_representative'
            required
            value={formData.legal_representative}
            onChange={(e) =>
              handleChange('legal_representative', e.target.value)
            }
            placeholder='Ej: Juan Pérez'
          />
        </div>
      </Card>

      {/* Ubicación */}
      <Card className='p-6'>
        <div className='mb-5'>
          <h3 className='text-sm font-semibold text-gray-900 uppercase tracking-wide'>
            Ubicación
          </h3>
        </div>

        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5'>
          <InputField
            label='País'
            id='country'
            required
            value={formData.country}
            onChange={(e) => handleChange('country', e.target.value)}
            placeholder='Ej: Bolivia'
          />

          <InputField
            label='Ciudad'
            id='city'
            required
            value={formData.city}
            onChange={(e) => handleChange('city', e.target.value)}
            placeholder='Ej: Santa Cruz'
          />

          <div className='md:col-span-2 lg:col-span-1'>
            <InputField
              label='Dirección Fiscal'
              id='fiscal_address'
              required
              value={formData.fiscal_address}
              onChange={(e) => handleChange('fiscal_address', e.target.value)}
              placeholder='Ej: Av. Principal #123'
            />
          </div>
        </div>
      </Card>

      {/* Contacto */}
      <Card className='p-6'>
        <div className='mb-5'>
          <h3 className='text-sm font-semibold text-gray-900 uppercase tracking-wide'>
            Información de Contacto
          </h3>
        </div>

        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5'>
          <InputField
            label='Nombre de Contacto'
            id='contact_name'
            required
            value={formData.contact_name}
            onChange={(e) => handleChange('contact_name', e.target.value)}
            placeholder='Ej: María López'
          />

          <InputField
            label='Teléfono de Contacto'
            id='contact_phone'
            required
            value={formData.contact_phone}
            onChange={(e) => handleChange('contact_phone', e.target.value)}
            placeholder='Ej: +591 70000000'
          />

          <InputField
            label='Email de Contacto'
            id='contact_email'
            required
            type='email'
            value={formData.contact_email}
            onChange={(e) => handleChange('contact_email', e.target.value)}
            placeholder='Ej: contacto@empresa.com'
          />

          <InputField
            label='Teléfono Operaciones 24/7'
            id='ops_phone_24_7'
            required
            value={formData.ops_phone_24_7}
            onChange={(e) => handleChange('ops_phone_24_7', e.target.value)}
            placeholder='Ej: +591 70000001'
          />

          <InputField
            label='Email Finanzas'
            id='finance_email'
            type='email'
            value={formData.finance_email}
            onChange={(e) => handleChange('finance_email', e.target.value)}
            placeholder='Ej: finanzas@empresa.com'
          />
        </div>
      </Card>

      {/* Actions */}
      <FormActions
        onCancel={handleCancel}
        onSave={handleSave}
        saving={saving}
        saveLabel={isCreating ? 'Crear Transportista' : 'Guardar Cambios'}
      />
    </div>
  )
}
