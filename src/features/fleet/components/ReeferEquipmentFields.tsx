import { UseFormReturn, FieldValues } from 'react-hook-form'
import { CustomTextField } from '@/components/widgets/forms/CustomTextField'
import { CustomSelectField } from '@/components/widgets/forms/CustomSelectField'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Separator } from '@/components/ui/Separator'

interface ReeferEquipmentFieldsProps<T extends FieldValues = FieldValues> {
    form: UseFormReturn<T>
    prefix?: string // e.g. "reefer_equipment." if nested
    readOnly?: boolean
}

export function ReeferEquipmentFields<T extends FieldValues = FieldValues>({ 
    form, 
    prefix = '', 
    readOnly = false 
}: ReeferEquipmentFieldsProps<T>) {
    // Helper function to build nested field paths
    // Note: Using 'as any' is necessary because TypeScript cannot infer
    // dynamic nested paths when using a prefix. React Hook Form supports
    // dot notation for nested fields at runtime.
    const p = (name: string): any => `${prefix}${name}`

    return (
        <Card className="border-dashed">
            <CardHeader className="pb-2">
                <CardTitle className="text-base font-medium flex items-center gap-2">
                    ❄️ Especificaciones de Equipo de Frío
                </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-6 pt-2">
                {/* Identification */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <CustomTextField
                        form={form}
                        name={p('brand')}
                        label="Marca Equipo"
                        placeholder="e.g. Thermo King"
                        disabled={readOnly}
                    />
                    <CustomTextField
                        form={form}
                        name={p('model')}
                        label="Modelo"
                        placeholder="e.g. V-500"
                        disabled={readOnly}
                    />
                    <CustomTextField
                        form={form}
                        name={p('year')}
                        label="Año Modelo"
                        type="number"
                        disabled={readOnly}
                    />
                    <CustomTextField
                        form={form}
                        name={p('serial_number')}
                        label="Número de Serie"
                        disabled={readOnly}
                    />
                </div>

                <Separator />

                {/* Thermal and Operational Capacity */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <CustomTextField
                        form={form}
                        name={p('reefer_hours')}
                        label="Horas de Motor"
                        type="number"
                        disabled={readOnly}
                    />
                    <CustomSelectField
                        form={form}
                        name={p('power_type')}
                        label="Fuente de Energía"
                        options={[
                            { value: 'DIESEL', label: 'Diesel Autónomo' },
                            { value: 'ELECTRIC', label: 'Eléctrico' },
                            { value: 'HYBRID', label: 'Híbrido' },
                        ]}
                        disabled={readOnly}
                    />
                    <CustomTextField
                        form={form}
                        name={p('consumption_lph')}
                        label="Consumo (L/h)"
                        type="number"
                        disabled={readOnly}
                    />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <CustomTextField
                        form={form}
                        name={p('temp_min_c')}
                        label="Temp. Mínima (°C)"
                        type="number"
                        placeholder="-20"
                        disabled={readOnly}
                    />
                    <CustomTextField
                        form={form}
                        name={p('temp_max_c')}
                        label="Temp. Máxima (°C)"
                        type="number"
                        placeholder="20"
                        disabled={readOnly}
                    />
                </div>
            </CardContent>
        </Card>
    )
}
