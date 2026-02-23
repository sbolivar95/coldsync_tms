import { useState, useEffect, useMemo } from 'react'
import { UseFormReturn } from 'react-hook-form'
import {
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
    FormDescription,
} from '../../../../../components/ui/Form'
import { Input } from '../../../../../components/ui/Input'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '../../../../../components/ui/Select'
import { Textarea } from '../../../../../components/ui/Textarea'
import { SmartSelect } from '../../../../../components/widgets/SmartSelect'
import { ConnectionDeviceFormData } from '../../../../../lib/schemas/hardware.schemas'
import { Card } from '../../../../../components/ui/Card'
import { useHardwareCatalog } from '../../../../../hooks/useHardwareCatalog'

interface HardwareFormFieldsProps {
    form: UseFormReturn<ConnectionDeviceFormData>
    carriers: Array<{ value: string; label: string }>
    telematicsProviders: Array<{ value: string; label: string }>
    // Options for immediate assignment
    vehicleOptions?: Array<{ value: string; label: string }>
    trailerOptions?: Array<{ value: string; label: string }>

    loadingOptions?: boolean
    isSubmitting?: boolean
    watchedCarrierId?: number | undefined
    useCards?: boolean
    carrierId?: number // Implicit carrier context
}

export function HardwareFormFields({
    form,
    carriers,
    telematicsProviders,
    vehicleOptions = [],
    trailerOptions = [],
    loadingOptions = false,
    isSubmitting = false,
    watchedCarrierId,
    useCards = false,
    carrierId,
}: HardwareFormFieldsProps) {
    const Wrapper = useCards ? Card : 'div'
    const wrapperProps = useCards ? { className: 'p-6' } : { className: 'space-y-4' }
    const headerClass = useCards
        ? 'text-sm font-semibold text-gray-900 uppercase tracking-wide mb-5'
        : 'hidden'

    // Hardware Catalog Hook
    const { protocols, deviceTypes, loading: catalogLoading } = useHardwareCatalog()

    // Local State for Protocol Filter
    const [selectedProtocolId, setSelectedProtocolId] = useState<string>('')

    // Filter Device Types based on selected Protocol
    const filteredDeviceTypes = useMemo(() => {
        if (!selectedProtocolId) return []
        return deviceTypes
            .filter((dt) => dt.protocol_id === parseInt(selectedProtocolId))
            .map((dt) => ({
                value: dt.id.toString(),
                label: dt.name,
            }))
    }, [deviceTypes, selectedProtocolId])

    // Protocol Options
    const protocolOptions = useMemo(() => {
        return protocols.map((p) => ({
            value: p.id.toString(),
            label: p.name,
        }))
    }, [protocols])

    // Effect: If editing an existing device, set the protocol based on the current device type
    const currentDeviceTypeId = form.watch('flespi_device_type_id')
    useEffect(() => {
        if (currentDeviceTypeId && !selectedProtocolId && deviceTypes.length > 0) {
            const deviceType = deviceTypes.find(dt => dt.id === currentDeviceTypeId)
            if (deviceType) {
                setSelectedProtocolId(deviceType.protocol_id.toString())
            }
        }
    }, [currentDeviceTypeId, deviceTypes, selectedProtocolId])

    // Watch tracked entity type to show assignment selector
    const watchedEntityType = form.watch('tracked_entity_type')

    return (
        <div className={useCards ? 'space-y-6' : 'space-y-4'}>
            {/* Información de Dispositivo */}
            <Wrapper {...wrapperProps}>
                <div className={useCards ? 'mb-5' : 'hidden'}>
                    <h3 className={headerClass}>Información de Dispositivo</h3>
                </div>

                <div className={useCards ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5' : 'space-y-4'}>
                    {/* Only show carrier selector if not in carrier context */}
                    {!carrierId && (
                        <FormField
                            control={form.control}
                            name='carrier_id'
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Transportista *</FormLabel>
                                    <FormControl>
                                        <SmartSelect
                                            value={field.value?.toString() || ''}
                                            onChange={(value) => {
                                                field.onChange(parseInt(value as string))
                                                // Reset dependent fields if needed
                                            }}
                                            options={carriers}
                                            placeholder='Seleccionar transportista...'
                                            disabled={loadingOptions || isSubmitting}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    )}

                    <FormField
                        control={form.control}
                        name='provider'
                        render={({ field }) => (
                            <FormItem className={!useCards ? 'col-span-1' : ''}>
                                <FormLabel>Proveedor de Telemática</FormLabel>
                                <FormControl>
                                    <SmartSelect
                                        value={field.value?.toString() || ''}
                                        onChange={(value) =>
                                            field.onChange(value ? parseInt(value as string) : null)
                                        }
                                        options={telematicsProviders}
                                        placeholder='Seleccionar proveedor...'
                                        disabled={
                                            loadingOptions || isSubmitting || !watchedCarrierId
                                        }
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    {/* Protocol (System Brand) Selector - Not a form field, just a filter */}
                    <FormItem className={!useCards ? 'col-span-1' : ''}>
                        <FormLabel>Marca (Protocolo)</FormLabel>
                        <FormControl>
                            <SmartSelect
                                value={selectedProtocolId}
                                onChange={(value) => {
                                    setSelectedProtocolId(value as string)
                                    form.setValue('flespi_device_type_id', 0) // Reset
                                }}
                                options={protocolOptions}
                                placeholder='Seleccionar Marca...'
                                disabled={catalogLoading || isSubmitting || !watchedCarrierId}
                            />
                        </FormControl>
                        {catalogLoading && <FormDescription>Cargando catálogo...</FormDescription>}
                    </FormItem>

                    {/* Device Type (Model) Selector - The real field */}
                    <FormField
                        control={form.control}
                        name='flespi_device_type_id'
                        render={({ field }) => (
                            <FormItem className={!useCards ? 'col-span-1' : ''}>
                                <FormLabel>Modelo *</FormLabel>
                                <FormControl>
                                    <SmartSelect
                                        value={field.value?.toString() || ''}
                                        onChange={(value) =>
                                            field.onChange(value ? parseInt(value as string) : null)
                                        }
                                        options={filteredDeviceTypes}
                                        placeholder={selectedProtocolId ? 'Seleccionar Modelo...' : 'Seleccione Marca primero'}
                                        disabled={
                                            catalogLoading || isSubmitting || !watchedCarrierId || !selectedProtocolId
                                        }
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name='ident'
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>IMEI / Identificador *</FormLabel>
                                <FormControl>
                                    <Input
                                        {...field}
                                        placeholder='Ej. 864205040...'
                                        disabled={isSubmitting}
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name='serial'
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Número de Serie (Opcional)</FormLabel>
                                <FormControl>
                                    <Input
                                        {...field}
                                        value={field.value || ''}
                                        placeholder='Busque en la etiqueta...'
                                        disabled={isSubmitting}
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name='phone_number'
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Teléfono SIM (Opcional)</FormLabel>
                                <FormControl>
                                    <Input
                                        {...field}
                                        value={field.value || ''}
                                        placeholder='+51 999...'
                                        disabled={isSubmitting}
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    {/* Asignación Inicial (Vehicle-First Logic) */}
                    <FormField
                        control={form.control}
                        name='tracked_entity_type'
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Asignación Inicial</FormLabel>
                                <Select
                                    onValueChange={(value) => {
                                        // If value is 'INVENTORY', we send null to backend
                                        const finalValue = value === 'INVENTORY' ? null : value
                                        field.onChange(finalValue)
                                        // Reset assigned entity if type changes
                                        form.setValue('assigned_entity_id', null)
                                    }}
                                    defaultValue={field.value || 'INVENTORY'}
                                    value={field.value || 'INVENTORY'}
                                    disabled={isSubmitting}
                                >
                                    <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Seleccionar destino" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        <SelectItem value="INVENTORY">Sin asignar</SelectItem>
                                        <SelectItem value="VEHICLE">Vehículo</SelectItem>
                                        <SelectItem value="TRAILER">Remolque (Trailer)</SelectItem>
                                    </SelectContent>
                                </Select>
                                <FormDescription>
                                    Puede vincular activos despues.
                                </FormDescription>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    {/* Selector Condicional de Activos */}
                    {watchedEntityType === 'VEHICLE' && (
                        <FormField
                            control={form.control}
                            name='assigned_entity_id'
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Seleccionar Vehículo</FormLabel>
                                    <FormControl>
                                        <SmartSelect
                                            value={field.value?.toString() || ''}
                                            onChange={(value) => field.onChange(value || null)}
                                            options={vehicleOptions}
                                            placeholder="Buscar vehículo..."
                                            disabled={loadingOptions || isSubmitting}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    )}

                    {watchedEntityType === 'TRAILER' && (
                        <FormField
                            control={form.control}
                            name='assigned_entity_id'
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Seleccionar Remolque</FormLabel>
                                    <FormControl>
                                        <SmartSelect
                                            value={field.value?.toString() || ''}
                                            onChange={(value) => field.onChange(value || null)}
                                            options={trailerOptions}
                                            placeholder="Buscar remolque..."
                                            disabled={loadingOptions || isSubmitting}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    )}

                    {/* Notas - Full width */}
                    <FormField
                        control={form.control}
                        name='notes'
                        render={({ field }) => (
                            <FormItem className={useCards ? 'col-span-full' : 'w-full'}>
                                <FormLabel>Notas</FormLabel>
                                <FormControl>
                                    <Textarea
                                        {...field}
                                        value={field.value || ''}
                                        placeholder='Observaciones sobre la instalación...'
                                        disabled={isSubmitting}
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>
            </Wrapper>
        </div>
    )
}
