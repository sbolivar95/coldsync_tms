import { UseFormReturn } from 'react-hook-form'
import { Card } from '../../../../../components/ui/Card'
import { SmartOption } from '../../../../../components/widgets/SmartSelect'
import { CustomTextField } from '../../../../../components/widgets/forms/CustomTextField'
import { CustomSelectField } from '../../../../../components/widgets/forms/CustomSelectField'
import { CustomDateField } from '../../../../../components/widgets/forms/CustomDateField'
import { DriverFormData } from '../../../../../lib/schemas/driver.schemas'
import { Driver } from '../../../../../types/database.types'

interface DriverGeneralFormProps {
    form: UseFormReturn<DriverFormData>
    driver?: Driver | null // Kept for 'disabled' logic on ID
    countries: Array<{ value: string; label: string }>
    loadingCountries: boolean
    currentAssignment?: any
}

const driverStatusOptions: SmartOption[] = [
    { value: 'AVAILABLE', label: 'Disponible' },
    { value: 'INACTIVE', label: 'Inactivo' },
    { value: 'DRIVING', label: 'En Ruta' },
]

export function DriverGeneralForm({
    form,
    driver,
    countries,
    loadingCountries,
}: DriverGeneralFormProps) {
    return (
        <div className='space-y-6'>
            {/* Datos del Conductor */}
            <Card className='p-6'>
                <div className='mb-5'>
                    <h3 className='text-sm font-semibold text-gray-900 uppercase tracking-wide'>
                        Datos del Conductor
                    </h3>
                </div>

                <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5'>
                    {/* Row 1: Identity & Status */}
                    <CustomTextField
                        form={form}
                        name="name"
                        label="Nombre Completo"
                        placeholder="Juan Pérez"
                        required
                    />

                    <CustomTextField
                        form={form}
                        name="license_number"
                        label="Número de Licencia"
                        placeholder="CDL-123456"
                        required
                    />

                    <CustomTextField
                        form={form}
                        name="driver_id"
                        label="ID Conductor"
                        placeholder="DRV-001"
                        required
                        disabled={!!driver}
                    />

                    <CustomSelectField
                        form={form}
                        name="status"
                        label="Estado"
                        options={driverStatusOptions}
                        placeholder="Seleccionar estado..."
                        required
                    />

                    {/* Row 2: Location */}
                    <CustomTextField
                        form={form}
                        name="address"
                        label="Dirección"
                        placeholder="Av. Principal 123"
                        required
                        className="md:col-span-2"
                    />

                    <CustomTextField
                        form={form}
                        name="city"
                        label="Ciudad"
                        placeholder="Santiago"
                        required
                    />

                    <CustomSelectField
                        form={form}
                        name="nationality"
                        label="Nacionalidad"
                        options={countries}
                        placeholder={loadingCountries ? 'Cargando países...' : 'Seleccionar país...'}
                        searchable={true}
                        disabled={loadingCountries}
                        required
                    />

                    {/* Row 3: Contact & Personal */}
                    <CustomTextField
                        form={form}
                        name="phone_number"
                        label="Teléfono"
                        type="tel"
                        placeholder="+56 9 1234 5678"
                        required
                    />

                    <CustomTextField
                        form={form}
                        name="email"
                        label="Email"
                        type="email"
                        placeholder="conductor@example.com"
                    />

                    <CustomDateField
                        form={form}
                        name="contract_date"
                        label="Fecha de Contrato"
                        required
                    />

                    <CustomDateField
                        form={form}
                        name="birth_date"
                        label="Fecha de Nacimiento"
                        required
                    />

                    {/* Row 4: Notes (Full width) */}
                    <div className="col-span-1 md:col-span-2 lg:col-span-4">
                        <CustomTextField
                            form={form}
                            name="notes"
                            label="Notas Adicionales"
                            placeholder="Información adicional..."
                        />
                    </div>
                </div>
            </Card>


        </div>
    )
}
