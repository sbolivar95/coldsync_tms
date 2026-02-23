import { useFormContext } from 'react-hook-form'
import { Card } from '../../../../../components/ui/Card'
import type { TrailerCompleteFormData } from '../../../../../lib/schemas/trailer.schemas'
import { CustomTextField } from '../../../../../components/widgets/forms/CustomTextField'
import { CustomSelectField } from '../../../../../components/widgets/forms/CustomSelectField'

const powerTypeOptions = [
  { value: 'DIESEL', label: 'Diésel' },
  { value: 'ELECTRIC', label: 'Eléctrico' },
  { value: 'HYBRID', label: 'Híbrido' },
]

export function TrailerSpecificationsTab() {
  // Use form context from parent FormProvider
  const form = useFormContext<TrailerCompleteFormData>()

  return (
    <div className='space-y-6'>
      {/* Información del Equipo */}
      <Card className='p-6'>
        <div className='mb-5'>
          <h3 className='text-sm font-semibold text-gray-900 uppercase tracking-wide'>
            Equipo de Refrigeración
          </h3>
        </div>

        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5'>
          <CustomTextField
            form={form}
            name='brand'
            label='Marca Refrigeración'
            placeholder='Thermo King, Carrier'
          />

          <CustomTextField
            form={form}
            name='model'
            label='Modelo'
            placeholder='SB-410'
          />

          <CustomTextField
            form={form}
            name='year'
            label='Año'
            type='number'
            placeholder='2021'
            min={1900}
            max={new Date().getFullYear() + 1}
          />
        </div>
      </Card>

      {/* Rendimiento Motor de Frío */}
      <Card className='p-6'>
        <div className='mb-5'>
          <h3 className='text-sm font-semibold text-gray-900 uppercase tracking-wide'>
            Rendimiento Motor de Frío
          </h3>
        </div>

        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5'>
          <CustomTextField
            form={form}
            name='temp_min_c'
            label='Temp. Mínima (°C)'
            type='number'
            placeholder='-20'
            required
          />

          <CustomTextField
            form={form}
            name='temp_max_c'
            label='Temp. Máxima (°C)'
            type='number'
            placeholder='20'
            required
          />

          <CustomSelectField
            form={form}
            name='power_type'
            label='Tipo de Alimentación'
            options={powerTypeOptions}
            placeholder='Seleccionar tipo...'
            searchable={false}
          />

          <CustomTextField
            form={form}
            name='reefer_hours'
            label='Horas de Reefer'
            type='number'
            placeholder='5000'
          />

          <CustomTextField
            form={form}
            name='diesel_capacity_l'
            label='Capacidad Combustible (L)'
            type='number'
            placeholder='100'
          />

          <CustomTextField
            form={form}
            name='consumption_lph'
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
