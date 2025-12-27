import { Card } from '../../../../../components/ui/Card'
import {
  InputField,
  SelectField,
} from '../../../../../components/widgets/FormField'
import { FormActions } from '../../../../../components/widgets/FormActions'
import { useState, useEffect } from 'react'
import { trailersService } from '../../../../../services/trailers.service'
import { useOrganization } from '@/hooks/useOrganization'
import type {
  Trailer,
  TrailerInsert,
  TrailerUpdate,
} from '../../../../../types/database.types'

interface TrailerGeneralTabProps {
  trailer?: any | null
  isCreating?: boolean
  onSave?: () => void
  onCancel?: () => void
}

export function TrailerGeneralTab({
  trailer,
  isCreating = false,
  onSave,
  onCancel,
}: TrailerGeneralTabProps) {
  const { orgId } = useOrganization()
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({
    code: trailer?.code || '',
    plate: trailer?.plate || '',
    operational_status: trailer?.operational_status || 'ACTIVE',
    transport_capacity_weight_tn: trailer?.transport_capacity_weight_tn || 0,
    volume_m3: trailer?.volume_m3 || 0,
    tare_weight_tn: trailer?.tare_weight_tn || 0,
    length_m: trailer?.length_m || 0,
    width_m: trailer?.width_m || 0,
    height_m: trailer?.height_m || 0,
    insulation_thickness_cm: trailer?.insulation_thickness_cm || 0,
    supports_multi_zone: trailer?.supports_multi_zone || false,
    compartments: trailer?.compartments || 1,
    notes: trailer?.notes || '',
  })

  // Auto-generate code if creating
  useEffect(() => {
    if (isCreating && !formData.code) {
      const timestamp = Date.now().toString().slice(-6)
      setFormData((prev) => ({
        ...prev,
        code: `TRL-${timestamp}`,
      }))
    }
  }, [isCreating, formData.code])

  // Enforce compartments = 1 if not multi-zone
  useEffect(() => {
    if (!formData.supports_multi_zone && formData.compartments !== 1) {
      setFormData((prev) => ({ ...prev, compartments: 1 }))
    }
  }, [formData.supports_multi_zone])

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
      'code',
      'plate',
      'transport_capacity_weight_tn',
      'volume_m3',
    ]
    for (const field of requiredFields) {
      if (!formData[field as keyof typeof formData]) {
        alert(`El campo es requerido: ${field}`)
        return
      }
    }

    // Validate multi-zone configuration
    if (formData.supports_multi_zone && formData.compartments < 2) {
      alert('Un remolque multi-zona debe tener al menos 2 compartimentos')
      return
    }

    try {
      setSaving(true)

      if (isCreating) {
        const newTrailer: TrailerInsert = {
          id: crypto.randomUUID(),
          org_id: orgId,
          code: formData.code,
          plate: formData.plate,
          operational_status: formData.operational_status as any,
          transport_capacity_weight_tn: formData.transport_capacity_weight_tn,
          volume_m3: formData.volume_m3,
          tare_weight_tn: formData.tare_weight_tn,
          length_m: formData.length_m,
          width_m: formData.width_m,
          height_m: formData.height_m,
          insulation_thickness_cm: formData.insulation_thickness_cm,
          supports_multi_zone: formData.supports_multi_zone,
          compartments: formData.compartments,
          notes: formData.notes || null,
        }

        await trailersService.create(newTrailer)
        alert('Remolque creado exitosamente')
      } else if (trailer) {
        const updates: TrailerUpdate = {
          code: formData.code,
          plate: formData.plate,
          operational_status: formData.operational_status as any,
          transport_capacity_weight_tn: formData.transport_capacity_weight_tn,
          volume_m3: formData.volume_m3,
          tare_weight_tn: formData.tare_weight_tn,
          length_m: formData.length_m,
          width_m: formData.width_m,
          height_m: formData.height_m,
          insulation_thickness_cm: formData.insulation_thickness_cm,
          supports_multi_zone: formData.supports_multi_zone,
          compartments: formData.compartments,
          notes: formData.notes || null,
        }

        await trailersService.update(trailer.id, orgId, updates)
        alert('Remolque actualizado exitosamente')
      }

      if (onSave) {
        onSave()
      }
    } catch (err) {
      console.error('Error saving trailer:', err)
      alert('Error al guardar el remolque')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className='space-y-6'>
      {/* Identificación */}
      <Card className='p-6'>
        <div className='mb-5'>
          <h3 className='text-sm font-semibold text-gray-900 uppercase tracking-wide'>
            Identificación
          </h3>
        </div>

        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5'>
          <InputField
            label='Código Remolque'
            id='code'
            required
            value={formData.code}
            onChange={(e) => handleChange('code', e.target.value)}
            disabled={!isCreating}
            placeholder='Ej: TRL-001'
          />

          <InputField
            label='Placa'
            id='plate'
            required
            value={formData.plate}
            onChange={(e) => handleChange('plate', e.target.value)}
            placeholder='ABC-1234'
          />

          <SelectField
            label='Estado Operativo'
            id='operational_status'
            required
            value={formData.operational_status}
            onChange={(e) => handleChange('operational_status', e.target.value)}
            options={[
              { value: 'ACTIVE', label: 'Activo' },
              { value: 'IN_SERVICE', label: 'En Servicio' },
              { value: 'IN_MAINTENANCE', label: 'En Mantenimiento' },
              { value: 'OUT_OF_SERVICE', label: 'Fuera de Servicio' },
              { value: 'RETIRED', label: 'Retirado' },
            ]}
          />
        </div>
      </Card>

      {/* Configuración */}
      <Card className='p-6'>
        <div className='mb-5'>
          <h3 className='text-sm font-semibold text-gray-900 uppercase tracking-wide'>
            Configuración
          </h3>
        </div>

        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5'>
          <div className='flex items-center gap-2'>
            <input
              type='checkbox'
              id='supports_multi_zone'
              checked={formData.supports_multi_zone}
              onChange={(e) =>
                handleChange('supports_multi_zone', e.target.checked)
              }
              className='rounded border-gray-300 text-blue-600 focus:ring-blue-500'
            />
            <label
              htmlFor='supports_multi_zone'
              className='text-sm font-medium text-gray-700'
            >
              Remolque Multi-zona (Híbrido)
            </label>
          </div>

          <InputField
            label='Número de Compartimentos'
            id='compartments'
            type='number'
            required
            value={formData.compartments.toString()}
            onChange={(e) =>
              handleChange('compartments', parseInt(e.target.value) || 1)
            }
            disabled={!formData.supports_multi_zone}
            min='1'
            helpText={
              formData.supports_multi_zone
                ? 'Mínimo 2 para multi-zona'
                : 'Configuración simple = 1 compartimento'
            }
          />
        </div>
      </Card>

      {/* Capacidad */}
      <Card className='p-6'>
        <div className='mb-5'>
          <h3 className='text-sm font-semibold text-gray-900 uppercase tracking-wide'>
            Capacidad
          </h3>
        </div>

        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5'>
          <InputField
            label='Capacidad de Peso (Tn)'
            id='transport_capacity_weight_tn'
            type='number'
            step='0.1'
            required
            value={formData.transport_capacity_weight_tn.toString()}
            onChange={(e) =>
              handleChange(
                'transport_capacity_weight_tn',
                parseFloat(e.target.value) || 0
              )
            }
            placeholder='25.0'
          />

          <InputField
            label='Volumen (m³)'
            id='volume_m3'
            type='number'
            step='0.1'
            required
            value={formData.volume_m3.toString()}
            onChange={(e) =>
              handleChange('volume_m3', parseFloat(e.target.value) || 0)
            }
            placeholder='80.0'
          />

          <InputField
            label='Peso Tara (Tn)'
            id='tare_weight_tn'
            type='number'
            step='0.1'
            value={formData.tare_weight_tn.toString()}
            onChange={(e) =>
              handleChange('tare_weight_tn', parseFloat(e.target.value) || 0)
            }
            placeholder='8.0'
          />
        </div>
      </Card>

      {/* Dimensiones */}
      <Card className='p-6'>
        <div className='mb-5'>
          <h3 className='text-sm font-semibold text-gray-900 uppercase tracking-wide'>
            Dimensiones Internas
          </h3>
        </div>

        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5'>
          <InputField
            label='Largo (m)'
            id='length_m'
            type='number'
            step='0.01'
            value={formData.length_m.toString()}
            onChange={(e) =>
              handleChange('length_m', parseFloat(e.target.value) || 0)
            }
            placeholder='13.6'
          />

          <InputField
            label='Ancho (m)'
            id='width_m'
            type='number'
            step='0.01'
            value={formData.width_m.toString()}
            onChange={(e) =>
              handleChange('width_m', parseFloat(e.target.value) || 0)
            }
            placeholder='2.5'
          />

          <InputField
            label='Alto (m)'
            id='height_m'
            type='number'
            step='0.01'
            value={formData.height_m.toString()}
            onChange={(e) =>
              handleChange('height_m', parseFloat(e.target.value) || 0)
            }
            placeholder='2.7'
          />

          <InputField
            label='Espesor Aislamiento (cm)'
            id='insulation_thickness_cm'
            type='number'
            step='0.1'
            value={formData.insulation_thickness_cm.toString()}
            onChange={(e) =>
              handleChange(
                'insulation_thickness_cm',
                parseFloat(e.target.value) || 0
              )
            }
            placeholder='10'
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
              placeholder='Información adicional del remolque...'
            />
          </div>
        </div>
      </Card>

      {/* Botones de Acción */}
      <FormActions
        onCancel={onCancel}
        onSave={handleSave}
        saveLabel={isCreating ? 'Crear Remolque' : 'Guardar Cambios'}
        disabled={saving}
      />
    </div>
  )
}
