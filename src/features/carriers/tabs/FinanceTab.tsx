import { Card } from '../../../components/ui/Card'
import { InputField, SelectField } from '../../../components/widgets/FormField'
import { FormActions } from '../../../components/widgets/FormActions'
import { useState, useEffect } from 'react'
import { carriersService } from '../../../services/carriers.service'
import { useOrganization } from '../../../hooks/useOrganization'
import type { Carrier, CarrierUpdate } from '../../../types/database.types'

interface FinanceTabProps {
  carrier?: Carrier | null
  onSave?: () => void
  onCancel?: () => void
}

export function FinanceTab({ carrier, onSave, onCancel }: FinanceTabProps) {
  // Use the hook that supports platform admin selected org
  const { orgId, loading: orgLoading } = useOrganization()

  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({
    contract_number: carrier?.contract_number || '',
    contract_expires_at: carrier?.contract_expires_at || '',
    payment_terms: carrier?.payment_terms || 30,
    currency: carrier?.currency || 'USD',
    bank_name: carrier?.bank_name || '',
    bank_account_number: carrier?.bank_account_number || '',
    bank_cci_swift: carrier?.bank_cci_swift || '',
  })

  // Update form when carrier changes
  useEffect(() => {
    if (carrier) {
      setFormData({
        contract_number: carrier.contract_number || '',
        contract_expires_at: carrier.contract_expires_at || '',
        payment_terms: carrier.payment_terms || 30,
        currency: carrier.currency || 'USD',
        bank_name: carrier.bank_name || '',
        bank_account_number: carrier.bank_account_number || '',
        bank_cci_swift: carrier.bank_cci_swift || '',
      })
    }
  }, [carrier])

  const handleChange = (field: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  const handleSave = async () => {
    if (!orgId || !carrier) {
      alert('No se pudo obtener la información necesaria')
      return
    }

    try {
      setSaving(true)

      const updates: CarrierUpdate = {
        contract_number: formData.contract_number || null,
        contract_expires_at: formData.contract_expires_at || null,
        payment_terms: formData.payment_terms,
        currency: formData.currency || null,
        bank_name: formData.bank_name || null,
        bank_account_number: formData.bank_account_number || null,
        bank_cci_swift: formData.bank_cci_swift || null,
      }

      await carriersService.update(carrier.id, orgId, updates)
      alert('Información financiera actualizada exitosamente')

      if (onSave) {
        onSave()
      }
    } catch (err) {
      console.error('Error saving finance data:', err)
      alert('Error al guardar la información financiera')
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

  // Show message if no carrier selected (editing finance requires existing carrier)
  if (!carrier) {
    return (
      <div className='flex items-center justify-center py-12'>
        <div className='text-center'>
          <p className='text-gray-500 mb-2'>
            No hay transportista seleccionado
          </p>
          <p className='text-sm text-gray-400'>
            La información financiera solo puede editarse para transportistas
            existentes
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className='space-y-6'>
      {/* Información de Contrato */}
      <Card className='p-6'>
        <div className='mb-5'>
          <h3 className='text-sm font-semibold text-gray-900 uppercase tracking-wide'>
            Información de Contrato
          </h3>
        </div>

        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5'>
          <InputField
            label='Número de Contrato'
            id='contract_number'
            value={formData.contract_number}
            onChange={(e) => handleChange('contract_number', e.target.value)}
            placeholder='Ej: CONT-2024-001'
          />

          <InputField
            label='Fecha de Vencimiento'
            id='contract_expires_at'
            type='date'
            value={
              formData.contract_expires_at
                ? formData.contract_expires_at.split('T')[0]
                : ''
            }
            onChange={(e) =>
              handleChange('contract_expires_at', e.target.value)
            }
          />

          <SelectField
            label='Términos de Pago (días)'
            id='payment_terms'
            value={String(formData.payment_terms)}
            onChange={(e) =>
              handleChange('payment_terms', parseInt(e.target.value))
            }
            options={[
              { value: '0', label: 'Contado' },
              { value: '15', label: '15 días' },
              { value: '30', label: '30 días' },
              { value: '45', label: '45 días' },
              { value: '60', label: '60 días' },
              { value: '90', label: '90 días' },
            ]}
          />
        </div>
      </Card>

      {/* Información Bancaria */}
      <Card className='p-6'>
        <div className='mb-5'>
          <h3 className='text-sm font-semibold text-gray-900 uppercase tracking-wide'>
            Información Bancaria
          </h3>
        </div>

        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5'>
          <SelectField
            label='Moneda'
            id='currency'
            value={formData.currency}
            onChange={(e) => handleChange('currency', e.target.value)}
            options={[
              { value: 'USD', label: 'USD - Dólar Estadounidense' },
              { value: 'BOB', label: 'BOB - Boliviano' },
              { value: 'PEN', label: 'PEN - Sol Peruano' },
              { value: 'CLP', label: 'CLP - Peso Chileno' },
              { value: 'ARS', label: 'ARS - Peso Argentino' },
              { value: 'BRL', label: 'BRL - Real Brasileño' },
            ]}
          />

          <InputField
            label='Nombre del Banco'
            id='bank_name'
            value={formData.bank_name}
            onChange={(e) => handleChange('bank_name', e.target.value)}
            placeholder='Ej: Banco Nacional'
          />

          <InputField
            label='Número de Cuenta'
            id='bank_account_number'
            value={formData.bank_account_number}
            onChange={(e) =>
              handleChange('bank_account_number', e.target.value)
            }
            placeholder='Ej: 1234567890'
          />

          <InputField
            label='CCI / SWIFT'
            id='bank_cci_swift'
            value={formData.bank_cci_swift}
            onChange={(e) => handleChange('bank_cci_swift', e.target.value)}
            placeholder='Ej: BNBOBOBS'
            helpText='Código Interbancario o código SWIFT para transferencias internacionales'
          />
        </div>
      </Card>

      {/* Actions */}
      <FormActions
        onCancel={handleCancel}
        onSave={handleSave}
        saving={saving}
        saveLabel='Guardar Cambios'
      />
    </div>
  )
}
