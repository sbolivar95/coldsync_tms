import { useFormContext } from 'react-hook-form'
import { Card } from '../../../../../components/ui/Card'
import type { VehicleFormData } from '../../../../../lib/schemas/vehicle.schemas'
import { CustomTextField } from '../../../../../components/widgets/forms/CustomTextField'
import { CustomSelectField } from '../../../../../components/widgets/forms/CustomSelectField'

const powerTypeOptions = [
  { value: 'DIESEL', label: 'Diésel' },
  { value: 'ELECTRIC', label: 'Eléctrico' },
  { value: 'HYBRID', label: 'Híbrido' },
]

export function VehicleSpecificationsTab() {
  // Use form context from parent FormProvider
  const form = useFormContext<VehicleFormData>()

  // Note: Using 'as any' for nested field paths is necessary because
  // the schema uses z.record(z.any()) for reefer_equipment, which doesn't
  // provide type inference for nested paths. React Hook Form supports
  // dot notation for nested fields at runtime.
  return (
    <div className='space-y-6'>
      {/* Equipment Information */}
      <Card className='p-6'>
        <div className='mb-5'>
          <h3 className='text-sm font-semibold text-gray-900 uppercase tracking-wide'>
            Equipo de Refrigeración
          </h3>
        </div>

        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5'>
          <CustomTextField
            form={form}
            name={'reefer_equipment.brand' as any}
            label='Marca Refrigeración'
            placeholder='Thermo King, Carrier'
          />

          <CustomTextField
            form={form}
            name={'reefer_equipment.model' as any}
            label='Modelo'
            placeholder='SB-410'
          />

          <CustomTextField
            form={form}
            name={'reefer_equipment.year' as any}
            label='Año'
            type='number'
            placeholder='2021'
            min={1900}
            max={new Date().getFullYear() + 1}
          />
        </div>
      </Card>

      {/* Refrigeration Engine Performance */}
      <Card className='p-6'>
        <div className='mb-5'>
          <h3 className='text-sm font-semibold text-gray-900 uppercase tracking-wide'>
            Rendimiento Motor de Frío
          </h3>
        </div>

        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5'>
          <CustomTextField
            form={form}
            name={'reefer_equipment.temp_min_c' as any}
            label='Temp. Mínima (°C)'
            type='number'
            placeholder='-20'
            required
          />

          <CustomTextField
            form={form}
            name={'reefer_equipment.temp_max_c' as any}
            label='Temp. Máxima (°C)'
            type='number'
            placeholder='20'
            required
          />

          <CustomSelectField
            form={form}
            name={'reefer_equipment.power_type' as any}
            label='Tipo de Alimentación'
            options={powerTypeOptions}
            placeholder='Seleccionar tipo...'
            searchable={false}
          />

          <CustomTextField
            form={form}
            name={'reefer_equipment.reefer_hours' as any}
            label='Horas de Reefer'
            type='number'
            placeholder='5000'
          />

          <CustomTextField
            form={form}
            name={'reefer_equipment.diesel_capacity_l' as any}
            label='Capacidad Combustible (L)'
            type='number'
            placeholder='100'
          />

          <CustomTextField
            form={form}
            name={'reefer_equipment.consumption_lph' as any}
            label='Consumo (L/h)'
            type='number'
            placeholder='3.5'
          />
        </div>

        <div className='mt-4 p-4 bg-primary-light rounded-md'>
          <p className='text-xs text-primary'>
            <strong>Rango Operativo:</strong> Temp. Min/Max se utilizan para
            matching automático con perfiles térmicos definidos en
            configuración.
          </p>
        </div>
      </Card>
    </div>
  )
}
