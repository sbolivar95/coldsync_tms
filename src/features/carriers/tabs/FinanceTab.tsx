import { Card } from '../../../components/ui/Card'
import { InputField, SelectField } from '../../../components/widgets/FormField'
import { FormActions } from '../../../components/widgets/FormActions'
import { useState, useEffect } from 'react'
import { carriersService } from '../../../services/carriers.service'
import { supabase } from '../../../lib/supabase'
import type { Carrier, CarrierUpdate } from '../../../types/database.types'

interface FinanceTabProps {
  carrier?: Carrier | null
  onSave?: () => void
  onCancel?: () => void
}

export function FinanceTab({ carrier, onSave, onCancel }: FinanceTabProps) {
  const [orgId, setOrgId] = useState<string | null>(null)
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

  // Get organization ID
  useEffect(() => {
    async function getOrgId() {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser()
        if (!user) return

        const { data: member } = await supabase
          .from('organization_members')
          .select('org_id')
          .eq('user_id', user.id)
          .single()

        if (member) {
          setOrgId(member.org_id)
        }
      } catch (err) {
        console.error('Error getting organization:', err)
      }
    }

    getOrgId()
  }, [])

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
            value={formData.contract_expires_at}
            onChange={(e) =>
              handleChange('contract_expires_at', e.target.value)
            }
          />

          <InputField
            label='Términos de Pago (días)'
            id='payment_terms'
            type='number'
            required
            value={formData.payment_terms.toString()}
            onChange={(e) =>
              handleChange('payment_terms', parseInt(e.target.value) || 30)
            }
            placeholder='30'
            helpText='Días para pago después de facturación'
          />

          <SelectField
            label='Moneda'
            id='currency'
            value={formData.currency}
            onChange={(e) => handleChange('currency', e.target.value)}
            options={[
              { value: 'USD', label: 'Dólares (USD)' },
              { value: 'BOB', label: 'Bolivianos (BOB)' },
              { value: 'PEN', label: 'Soles (PEN)' },
              { value: 'CLP', label: 'Pesos Chilenos (CLP)' },
              { value: 'ARS', label: 'Pesos Argentinos (ARS)' },
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
          <InputField
            label='Banco'
            id='bank_name'
            value={formData.bank_name}
            onChange={(e) => handleChange('bank_name', e.target.value)}
            placeholder='Nombre del banco'
          />

          <InputField
            label='Número de Cuenta'
            id='bank_account_number'
            value={formData.bank_account_number}
            onChange={(e) =>
              handleChange('bank_account_number', e.target.value)
            }
            placeholder='Número de cuenta bancaria'
          />

          <InputField
            label='CCI / SWIFT'
            id='bank_cci_swift'
            value={formData.bank_cci_swift}
            onChange={(e) => handleChange('bank_cci_swift', e.target.value)}
            placeholder='Código interbancario o SWIFT'
          />
        </div>
      </Card>

      {/* Botones de Acción */}
      <FormActions
        onCancel={handleCancel}
        onSave={handleSave}
        saveLabel='Guardar Cambios'
        disabled={saving}
      />
    </div>
  )
}
