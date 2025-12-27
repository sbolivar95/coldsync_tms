import { Card } from '../../../../../components/ui/Card'
import {
  InputField,
  SelectField,
} from '../../../../../components/widgets/FormField'
import { FormActions } from '../../../../../components/widgets/FormActions'
import { useState, useEffect } from 'react'
import { trailerReeferSpecsService } from '../../../../../services/trailers.service'
import { useOrganization } from '@/hooks/useOrganization'
import type { TrailerReeferSpecs } from '../../../../../types/database.types'

interface TrailerReeferTabProps {
  trailer?: any | null
  onSave?: () => void
  onCancel?: () => void
}

export function TrailerReeferTab({
  trailer,
  onSave,
  onCancel,
}: TrailerReeferTabProps) {
  const { orgId } = useOrganization()
  const [saving, setSaving] = useState(false)
  const [hasSpecs, setHasSpecs] = useState(false)

  const existingSpecs = trailer?.trailer_reefer_specs?.[0]

  const [formData, setFormData] = useState({
    model: existingSpecs?.model || '',
    power_type: existingSpecs?.power_type || 'DIESEL',
    reefer_hours: existingSpecs?.reefer_hours || 0,
    diesel_capacity_l: existingSpecs?.diesel_capacity_l || 0,
    consumption_lph: existingSpecs?.consumption_lph || 0,
    temp_min_c: existingSpecs?.temp_min_c ?? -25,
    temp_max_c: existingSpecs?.temp_max_c ?? 25,
    brand: existingSpecs?.brand || '',
    year: existingSpecs?.year || new Date().getFullYear(),
  })

  useEffect(() => {
    setHasSpecs(!!existingSpecs)
  }, [existingSpecs])

  const handleChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleSave = async () => {
    if (!orgId || !trailer) {
      alert('No se pudo obtener la información necesaria')
      return
    }

    // Validate temperature range
    if (formData.temp_min_c >= formData.temp_max_c) {
      alert('La temperatura mínima debe ser menor que la máxima')
      return
    }

    try {
      setSaving(true)

      const specsData = {
        trailer_id: trailer.id,
        org_id: orgId,
        model: formData.model || null,
        power_type: formData.power_type as any,
        reefer_hours: formData.reefer_hours || null,
        diesel_capacity_l: formData.diesel_capacity_l || null,
        consumption_lph: formData.consumption_lph || null,
        temp_min_c: formData.temp_min_c,
        temp_max_c: formData.temp_max_c,
        brand: formData.brand || null,
        year: formData.year || null,
      }

      if (hasSpecs && existingSpecs) {
        // Update existing specs
        await trailerReeferSpecsService.update(
          existingSpecs.id,
          orgId,
          specsData
        )
        alert('Especificaciones de reefer actualizadas exitosamente')
      } else {
        // Create new specs
        await trailerReeferSpecsService.create(
          specsData.trailer_id,
          orgId,
          specsData
        )
        alert('Especificaciones de reefer creadas exitosamente')
        setHasSpecs(true)
      }

      if (onSave) {
        onSave()
      }
    } catch (err) {
      console.error('Error saving reefer specs:', err)
      alert('Error al guardar las especificaciones')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!orgId || !existingSpecs) return

    if (!confirm('¿Está seguro de eliminar las especificaciones del reefer?')) {
      return
    }

    try {
      await trailerReeferSpecsService.delete(existingSpecs.id, orgId)
      alert('Especificaciones eliminadas exitosamente')
      setHasSpecs(false)

      // Reset form
      setFormData({
        model: '',
        power_type: 'DIESEL',
        reefer_hours: 0,
        diesel_capacity_l: 0,
        consumption_lph: 0,
        temp_min_c: -25,
        temp_max_c: 25,
        brand: '',
        year: new Date().getFullYear(),
      })

      if (onSave) {
        onSave()
      }
    } catch (err) {
      console.error('Error deleting reefer specs:', err)
      alert('Error al eliminar las especificaciones')
    }
  }

  return (
    <div className='space-y-6'>
      {/* Equipo Reefer */}
      <Card className='p-6'>
        <div className='mb-5'>
          <h3 className='text-sm font-semibold text-gray-900 uppercase tracking-wide'>
            Equipo Reefer
          </h3>
        </div>

        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5'>
          <InputField
            label='Marca'
            id='brand'
            value={formData.brand}
            onChange={(e) => handleChange('brand', e.target.value)}
            placeholder='Ej: Thermo King, Carrier'
          />

          <InputField
            label='Modelo'
            id='model'
            value={formData.model}
            onChange={(e) => handleChange('model', e.target.value)}
            placeholder='Ej: SB-400'
          />

          <InputField
            label='Año'
            id='year'
            type='number'
            value={formData.year?.toString() || ''}
            onChange={(e) =>
              handleChange('year', parseInt(e.target.value) || null)
            }
            placeholder='2024'
          />

          <SelectField
            label='Tipo de Alimentación'
            id='power_type'
            required
            value={formData.power_type}
            onChange={(e) => handleChange('power_type', e.target.value)}
            options={[
              { value: 'DIESEL', label: 'Diésel' },
              { value: 'ELECTRIC', label: 'Eléctrico' },
              { value: 'HYBRID', label: 'Híbrido' },
            ]}
          />

          <InputField
            label='Horas de Reefer'
            id='reefer_hours'
            type='number'
            value={formData.reefer_hours?.toString() || '0'}
            onChange={(e) =>
              handleChange('reefer_hours', parseFloat(e.target.value) || 0)
            }
            placeholder='0'
            helpText='Horas de uso del equipo'
          />
        </div>
      </Card>

      {/* Combustible (solo para Diesel/Hybrid) */}
      {(formData.power_type === 'DIESEL' ||
        formData.power_type === 'HYBRID') && (
        <Card className='p-6'>
          <div className='mb-5'>
            <h3 className='text-sm font-semibold text-gray-900 uppercase tracking-wide'>
              Especificaciones de Combustible
            </h3>
          </div>

          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5'>
            <InputField
              label='Capacidad Combustible (L)'
              id='diesel_capacity_l'
              type='number'
              step='0.1'
              value={formData.diesel_capacity_l?.toString() || '0'}
              onChange={(e) =>
                handleChange(
                  'diesel_capacity_l',
                  parseFloat(e.target.value) || 0
                )
              }
              placeholder='200'
            />

            <InputField
              label='Consumo (L/h)'
              id='consumption_lph'
              type='number'
              step='0.1'
              value={formData.consumption_lph?.toString() || '0'}
              onChange={(e) =>
                handleChange('consumption_lph', parseFloat(e.target.value) || 0)
              }
              placeholder='4.5'
              helpText='Consumo promedio por hora'
            />
          </div>
        </Card>
      )}

      {/* Rango Operativo de Temperatura */}
      <Card className='p-6'>
        <div className='mb-5'>
          <h3 className='text-sm font-semibold text-gray-900 uppercase tracking-wide'>
            Rango Operativo de Temperatura
          </h3>
          <p className='text-xs text-gray-500 mt-1'>
            Utilizado para matching automático con perfiles térmicos
          </p>
        </div>

        <div className='grid grid-cols-1 md:grid-cols-2 gap-5'>
          <InputField
            label='Temperatura Mínima (°C)'
            id='temp_min_c'
            type='number'
            step='0.1'
            required
            value={formData.temp_min_c?.toString() || ''}
            onChange={(e) =>
              handleChange('temp_min_c', parseFloat(e.target.value))
            }
            placeholder='-25'
            highlight='critical'
          />

          <InputField
            label='Temperatura Máxima (°C)'
            id='temp_max_c'
            type='number'
            step='0.1'
            required
            value={formData.temp_max_c?.toString() || ''}
            onChange={(e) =>
              handleChange('temp_max_c', parseFloat(e.target.value))
            }
            placeholder='25'
            highlight='critical'
          />
        </div>

        <div className='mt-3 p-3 bg-blue-50 rounded-md'>
          <p className='text-xs text-blue-700'>
            <strong>Rango configurado:</strong> {formData.temp_min_c}°C a{' '}
            {formData.temp_max_c}°C
            {formData.temp_min_c >= formData.temp_max_c && (
              <span className='text-red-600 ml-2'>⚠️ Rango inválido</span>
            )}
          </p>
        </div>
      </Card>

      {/* Botones de Acción */}
      <div className='flex items-center justify-between'>
        <div>
          {hasSpecs && (
            <button
              type='button'
              onClick={handleDelete}
              className='px-4 py-2 text-sm font-medium text-red-600 hover:text-red-700'
            >
              Eliminar Especificaciones
            </button>
          )}
        </div>
        <FormActions
          onCancel={onCancel}
          onSave={handleSave}
          saveLabel={
            hasSpecs
              ? 'Actualizar Especificaciones'
              : 'Guardar Especificaciones'
          }
          disabled={saving}
        />
      </div>
    </div>
  )
}
