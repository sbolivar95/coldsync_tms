import { Badge } from '../../../components/ui/Badge'
import { Checkbox } from '../../../components/ui/Checkbox'
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '../../../components/ui/Form'
import { Input } from '../../../components/ui/Input'
import { Textarea } from '../../../components/ui/Textarea'
import { useFormContext } from 'react-hook-form'
import { z } from 'zod'
import { type StopType, locationTypeSchema } from './locationType.types'

export type LocationTypeFormData = z.infer<typeof locationTypeSchema>

interface LocationTypeFormFieldsProps {
    allowedStopTypes: StopType[]
}

export function LocationTypeFormFields({ allowedStopTypes }: LocationTypeFormFieldsProps) {
    const form = useFormContext<LocationTypeFormData>()

    // Stop type labels and descriptions
    const stopTypeLabels: Record<StopType, { name: string; desc: string }> = {
        PICKUP: { name: 'Recogida', desc: 'Para puntos de recogida de mercancía' },
        DROP_OFF: { name: 'Entrega', desc: 'Para puntos de entrega de mercancía' },
        MANDATORY_WAYPOINT: { name: 'Punto Obligatorio', desc: 'Para paradas obligatorias en la ruta' },
        OPTIONAL_WAYPOINT: { name: 'Punto Opcional', desc: 'Para paradas opcionales en la ruta' }
    }

    const handleStopTypeToggle = (stopType: StopType) => {
        const currentTypes = form.getValues('allowedStopTypes')
        const newTypes = currentTypes.includes(stopType)
            ? currentTypes.filter((type) => type !== stopType)
            : [...currentTypes, stopType]

        form.setValue('allowedStopTypes', newTypes, { shouldValidate: true, shouldDirty: true })
    }

    const watchedStopTypes = form.watch('allowedStopTypes')

    return (
        <div className="space-y-4">
            <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel className="text-xs font-medium text-gray-700">
                            Nombre del Tipo <span className="text-red-500">*</span>
                        </FormLabel>
                        <FormControl>
                            <Input placeholder="Ej: Aeropuerto Internacional" {...field} />
                        </FormControl>
                        <FormMessage className="text-xs" />
                    </FormItem>
                )}
            />

            <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel className="text-xs font-medium text-gray-700">
                            Descripción <span className="text-red-500">*</span>
                        </FormLabel>
                        <FormControl>
                            <Textarea
                                {...field}
                                placeholder="Describe las características del tipo de ubicación..."
                                className="min-h-[70px] resize-none"
                            />
                        </FormControl>
                        <FormMessage className="text-xs" />
                    </FormItem>
                )}
            />

            <FormField
                control={form.control}
                name="allowedStopTypes"
                render={() => (
                    <FormItem>
                        <FormLabel className="text-xs font-medium text-gray-700">
                            Roles Operativos <span className="text-red-500">*</span>
                        </FormLabel>
                        <FormControl>
                            <div className="border border-gray-300 rounded-md max-h-[200px] overflow-y-auto">
                                {allowedStopTypes.length > 0 ? (
                                    <div className="divide-y divide-gray-200">
                                        {allowedStopTypes.map((stopType) => {
                                            const checkboxId = `stop-type-${stopType}`
                                            const label = stopTypeLabels[stopType]
                                            return (
                                                <label
                                                    key={stopType}
                                                    htmlFor={checkboxId}
                                                    className="flex items-start gap-3 p-3 hover:bg-gray-50 cursor-pointer transition-colors"
                                                >
                                                    <Checkbox
                                                        id={checkboxId}
                                                        checked={watchedStopTypes.includes(stopType)}
                                                        onCheckedChange={() => handleStopTypeToggle(stopType)}
                                                        className="mt-0.5 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                                                    />
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-2 mb-0.5">
                                                            <span className="text-sm font-medium text-gray-900">
                                                                {label.name}
                                                            </span>
                                                            <Badge
                                                                variant="secondary"
                                                                className="bg-primary-light text-primary hover:bg-primary-light text-xs"
                                                            >
                                                                {stopType}
                                                            </Badge>
                                                        </div>
                                                        <p className="text-xs text-gray-500 line-clamp-1">
                                                            {label.desc}
                                                        </p>
                                                    </div>
                                                </label>
                                            )
                                        })}
                                    </div>
                                ) : (
                                    <div className="p-4 text-center">
                                        <p className="text-xs text-gray-400 italic">
                                            No hay roles operativos disponibles.
                                        </p>
                                    </div>
                                )}
                            </div>
                        </FormControl>
                        <p className="text-xs text-gray-500 mt-1.5">
                            Selecciona uno o más roles operativos compatibles con este tipo de ubicación
                        </p>
                        <FormMessage className="text-xs" />
                    </FormItem>
                )}
            />
        </div>
    )
}
