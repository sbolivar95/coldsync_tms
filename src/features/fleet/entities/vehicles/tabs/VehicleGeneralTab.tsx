import { Card } from '../../../../../components/ui/Card'
import {
  InputField,
  SelectField,
} from '../../../../../components/widgets/FormField'
import { FormActions } from '../../../../../components/widgets/FormActions'
import { useState, useEffect } from 'react'
import { vehiclesService } from '../../../../../services/vehicles.service'
import type {
  Vehicle,
  VehicleInsert,
  VehicleUpdate,
} from '../../../../../types/database.types'
import { useOrganization } from '@/hooks/useOrganization'

interface VehicleGeneralTabProps {
  vehicle?: Vehicle | null
  isCreating?: boolean
  onSave?: () => void
  onCancel?: () => void
}

export function VehicleGeneralTab({
  vehicle,
  isCreating = false,
  onSave,
  onCancel,
}: VehicleGeneralTabProps) {
  const { orgId } = useOrganization()
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({
    vehicle_code: vehicle?.vehicle_code || '',
    unit_code: vehicle?.unit_code || '',
    vehicle_type: vehicle?.vehicle_type || '',
    plate: vehicle?.plate || '',
    brand: vehicle?.brand || '',
    model: vehicle?.model || '',
    year: vehicle?.year || new Date().getFullYear(),
    vin: vehicle?.vin || '',
    odometer_value: vehicle?.odometer_value || 0,
    odometer_unit: vehicle?.odometer_unit || 'km',
    operational_status: vehicle?.operational_status || 'ACTIVE',
    additional_info: vehicle?.additional_info || '',
  })

  // Auto-generate codes if creating
  useEffect(() => {
    if (isCreating && !formData.vehicle_code) {
      const timestamp = Date.now().toString().slice(-6)
      setFormData((prev) => ({
        ...prev,
        vehicle_code: `VEH-${timestamp}`,
        unit_code: `UNIT-${timestamp}`,
      }))
    }
  }, [isCreating, formData.vehicle_code])

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
      'vehicle_code',
      'unit_code',
      'vehicle_type',
      'plate',
      'brand',
      'model',
      'year',
      'vin',
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
        const newVehicle: VehicleInsert = {
          id: crypto.randomUUID(),
          org_id: orgId,
          vehicle_code: formData.vehicle_code,
          unit_code: formData.unit_code,
          vehicle_type: formData.vehicle_type,
          plate: formData.plate,
          brand: formData.brand,
          model: formData.model,
          year: formData.year,
          vin: formData.vin,
          odometer_value: formData.odometer_value,
          odometer_unit: formData.odometer_unit,
          operational_status: formData.operational_status as any,
          additional_info: formData.additional_info,
        }

        await vehiclesService.create(newVehicle)
        alert('Vehículo creado exitosamente')
      } else if (vehicle) {
        const updates: VehicleUpdate = {
          vehicle_code: formData.vehicle_code,
          unit_code: formData.unit_code,
          vehicle_type: formData.vehicle_type,
          plate: formData.plate,
          brand: formData.brand,
          model: formData.model,
          year: formData.year,
          vin: formData.vin,
          odometer_value: formData.odometer_value,
          odometer_unit: formData.odometer_unit,
          operational_status: formData.operational_status as any,
          additional_info: formData.additional_info,
        }

        await vehiclesService.update(vehicle.id, orgId, updates)
        alert('Vehículo actualizado exitosamente')
      }

      if (onSave) {
        onSave()
      }
    } catch (err) {
      console.error('Error saving vehicle:', err)
      alert('Error al guardar el vehículo')
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
            label='Código Vehículo'
            id='vehicle_code'
            required
            value={formData.vehicle_code}
            onChange={(e) => handleChange('vehicle_code', e.target.value)}
            disabled={!isCreating}
            placeholder='Ej: VEH-001'
          />

          <InputField
            label='Código Unidad'
            id='unit_code'
            required
            value={formData.unit_code}
            onChange={(e) => handleChange('unit_code', e.target.value)}
            placeholder='Ej: UNIT-001'
          />

          <InputField
            label='Tipo de Vehículo'
            id='vehicle_type'
            required
            value={formData.vehicle_type}
            onChange={(e) => handleChange('vehicle_type', e.target.value)}
            placeholder='Ej: Tractocamión'
          />

          <InputField
            label='Placa'
            id='plate'
            required
            value={formData.plate}
            onChange={(e) => handleChange('plate', e.target.value)}
            placeholder='ABC-1234'
          />

          <InputField
            label='VIN'
            id='vin'
            required
            value={formData.vin}
            onChange={(e) => handleChange('vin', e.target.value)}
            placeholder='Número de identificación vehicular'
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

      {/* Especificaciones */}
      <Card className='p-6'>
        <div className='mb-5'>
          <h3 className='text-sm font-semibold text-gray-900 uppercase tracking-wide'>
            Especificaciones
          </h3>
        </div>

        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5'>
          <InputField
            label='Marca'
            id='brand'
            required
            value={formData.brand}
            onChange={(e) => handleChange('brand', e.target.value)}
            placeholder='Ej: Freightliner'
          />

          <InputField
            label='Modelo'
            id='model'
            required
            value={formData.model}
            onChange={(e) => handleChange('model', e.target.value)}
            placeholder='Ej: Cascadia'
          />

          <InputField
            label='Año'
            id='year'
            type='number'
            required
            value={formData.year.toString()}
            onChange={(e) =>
              handleChange(
                'year',
                parseInt(e.target.value) || new Date().getFullYear()
              )
            }
            placeholder='2024'
          />

          <InputField
            label='Odómetro'
            id='odometer_value'
            type='number'
            value={formData.odometer_value.toString()}
            onChange={(e) =>
              handleChange('odometer_value', parseFloat(e.target.value) || 0)
            }
            placeholder='0'
          />

          <SelectField
            label='Unidad Odómetro'
            id='odometer_unit'
            value={formData.odometer_unit}
            onChange={(e) => handleChange('odometer_unit', e.target.value)}
            options={[
              { value: 'km', label: 'Kilómetros' },
              { value: 'mi', label: 'Millas' },
            ]}
          />
        </div>
      </Card>

      {/* Información Adicional */}
      <Card className='p-6'>
        <div className='mb-5'>
          <h3 className='text-sm font-semibold text-gray-900 uppercase tracking-wide'>
            Información Adicional
          </h3>
        </div>

        <div className='grid grid-cols-1 gap-5'>
          <div>
            <label
              htmlFor='additional_info'
              className='block text-sm font-medium text-gray-700 mb-1'
            >
              Notas
            </label>
            <textarea
              id='additional_info'
              rows={4}
              value={formData.additional_info}
              onChange={(e) => handleChange('additional_info', e.target.value)}
              className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
              placeholder='Información adicional del vehículo...'
            />
          </div>
        </div>
      </Card>

      {/* Botones de Acción */}
      <FormActions
        onCancel={onCancel}
        onSave={handleSave}
        saveLabel={isCreating ? 'Crear Vehículo' : 'Guardar Cambios'}
        disabled={saving}
      />
    </div>
  )
}
