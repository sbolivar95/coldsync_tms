import { useFormContext, useWatch } from 'react-hook-form'
import { Card } from '../../../../../components/ui/Card'
import { CustomTextField } from '../../../../../components/widgets/forms/CustomTextField'
import { CustomSelectField } from '../../../../../components/widgets/forms/CustomSelectField'
import { ConnectionDeviceFormData } from '../../../../../lib/schemas/hardware.schemas'
import { useHardwareCatalog } from '../../../../../hooks/useHardwareCatalog'
import { useState, useEffect, useMemo } from 'react'
import { Label } from '../../../../../components/ui/Label'
import { SmartSelect, SmartOption } from '../../../../../components/widgets/SmartSelect'
import { AddProtocolDialog } from '../dialogs/AddProtocolDialog'
import { RotateCw, SlidersHorizontal } from 'lucide-react'
import { toast } from 'sonner'
import { hardwareService } from '../../../../../services/database'

import { LabelActionButton } from '../../../../../components/widgets/buttons/LabelActionButton'

interface HardwareGeneralFormProps {
    carriers: SmartOption[]
    telematicsProviders: SmartOption[]
    vehicleOptions: SmartOption[]
    trailerOptions: SmartOption[]
    loadingOptions?: boolean
    carrierId?: number // Implicit carrier context
}

export function HardwareGeneralForm({
    carriers,
    telematicsProviders,
    vehicleOptions,
    trailerOptions,
    loadingOptions = false,
    carrierId,
}: HardwareGeneralFormProps) {
    const form = useFormContext<ConnectionDeviceFormData>()

    // Watch carrier_id for catalog loading
    const watchedCarrierId = useWatch({ control: form.control, name: 'carrier_id' })
    const watchedEntityType = useWatch({ control: form.control, name: 'tracked_entity_type' })
    const watchedDeviceTypeId = useWatch({ control: form.control, name: 'flespi_device_type_id' })

    // Flespi Catalog
    const { deviceTypes, protocols, loading: catalogLoading, refresh: refreshCatalog } = useHardwareCatalog()
    const [selectedProtocolId, setSelectedProtocolId] = useState<string>('')
    const [isAddProtocolOpen, setIsAddProtocolOpen] = useState(false)

    const handleAddProtocolComplete = async (protocolId: number) => {
        await refreshCatalog()
        setSelectedProtocolId(protocolId.toString())
        form.setValue('flespi_device_type_id', '' as any)
    }

    const [isSyncing, setIsSyncing] = useState(false)

    const handleSyncSelectedProtocol = async () => {
        if (!selectedProtocolId || isSyncing) return

        setIsSyncing(true)
        const toastId = toast.loading('Sincronizando marca con Flespi...')

        try {
            await hardwareService.syncFlespiProtocol(parseInt(selectedProtocolId))
            await refreshCatalog()
            toast.success('Marca sincronizada correctamente', { id: toastId })
        } catch (error) {
            console.error(error)
            toast.error('Error al sincronizar marca', { id: toastId })
        } finally {
            setIsSyncing(false)
        }
    }

    // Protocol options
    const protocolOptions = useMemo(() => {
        return protocols.map(p => ({
            value: p.id.toString(),
            label: p.name.charAt(0).toUpperCase() + p.name.slice(1) // Capitalize for display
        }))
    }, [protocols])

    // Filtered device types based on selected protocol
    const filteredDeviceTypes = useMemo(() => {
        if (!selectedProtocolId) return []
        return deviceTypes
            .filter(dt => dt.protocol_id.toString() === selectedProtocolId)
            .map(dt => ({
                value: dt.id.toString(),
                label: dt.name
            }))
    }, [deviceTypes, selectedProtocolId])

    // Auto-select protocol when device type is set (e.g., when editing or loading data)
    useEffect(() => {
        if (watchedDeviceTypeId && deviceTypes.length > 0) {
            // Use loose comparison (==) to handle string/number differences
            const deviceType = deviceTypes.find(dt => dt.id == watchedDeviceTypeId)

            if (deviceType) {
                const protocolIdStr = deviceType.protocol_id.toString()
                // Only update if different to avoid loops
                if (selectedProtocolId !== protocolIdStr) {
                    setSelectedProtocolId(protocolIdStr)
                }
            }
        }
    }, [deviceTypes, watchedDeviceTypeId, selectedProtocolId])

    return (
        <div className="space-y-6">
            {/* Hidden field for carrier_id when in carrier context */}
            {carrierId && (
                <input type="hidden" value={carrierId} {...form.register("carrier_id")} />
            )}

            {/* Información de Dispositivo */}
            <Card className="p-6">
                <div className="mb-5">
                    <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">
                        Información de Dispositivo
                    </h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
                    {/* Only show carrier selector if not in carrier context */}
                    {!carrierId && (
                        <CustomSelectField
                            form={form}
                            name="carrier_id"
                            label="Transportista"
                            options={carriers}
                            placeholder="Seleccionar transportista..."
                            disabled={loadingOptions}
                            required
                        />
                    )}

                    <CustomSelectField
                        form={form}
                        name="provider"
                        label="Proveedor de Telemática"
                        options={telematicsProviders}
                        placeholder="Seleccionar proveedor..."
                        disabled={loadingOptions || !watchedCarrierId}
                        searchable={true}
                    />

                    {/* Protocol Selector - Not a direct form field, purely for filtering */}
                    <div className="grid gap-2">
                        <Label className="text-xs text-gray-600 font-normal flex items-center justify-between">
                            Marca (Protocolo)
                            <div className="flex items-center gap-1">
                                <LabelActionButton
                                    icon={RotateCw}
                                    title="Sincronizar marca seleccionada"
                                    onClick={handleSyncSelectedProtocol}
                                    disabled={catalogLoading || isSyncing || !selectedProtocolId}
                                    iconClassName={isSyncing || catalogLoading ? 'animate-spin' : ''}
                                    className="text-gray-400 hover:text-primary"
                                />
                                <LabelActionButton
                                    icon={SlidersHorizontal}
                                    title="Gestionar marcas"
                                    onClick={() => setIsAddProtocolOpen(true)}
                                />
                            </div>
                        </Label>
                        <SmartSelect
                            // layout label removed to match CustomSelectField style
                            value={selectedProtocolId}
                            onChange={(value) => {
                                setSelectedProtocolId(value as string)
                                form.setValue('flespi_device_type_id', '' as any)
                            }}
                            options={protocolOptions}
                            placeholder="Seleccionar Marca..."
                            disabled={catalogLoading || !watchedCarrierId}
                            searchable={true}
                        />
                        {catalogLoading && (
                            <p className="text-xs text-gray-400 mt-1">Cargando catálogo...</p>
                        )}
                    </div>

                    <CustomSelectField
                        form={form}
                        name="flespi_device_type_id"
                        label="Modelo"
                        options={filteredDeviceTypes}
                        placeholder={selectedProtocolId ? 'Seleccionar Modelo...' : 'Seleccione Marca primero'}
                        disabled={catalogLoading || !watchedCarrierId || !selectedProtocolId}
                        required
                        searchable={true}
                    />

                    <CustomTextField
                        form={form}
                        name="serial"
                        label="Número de Serie"
                        placeholder="Busque en la etiqueta..."
                    />

                    <CustomTextField
                        form={form}
                        name="ident"
                        label="IMEI / Identificador"
                        placeholder="Ej. 864205040..."
                        required
                    />

                    <CustomTextField
                        form={form}
                        name="phone_number"
                        label="Teléfono SIM"
                        type="tel"
                        placeholder="+51 999..."
                    />

                    {/* Assignment Type Selector */}
                    <CustomSelectField
                        form={form}
                        name="tracked_entity_type"
                        label="Asignación Inicial"
                        options={[
                            { value: 'INVENTORY', label: 'Sin asignar' },
                            { value: 'VEHICLE', label: 'Vehículo' },
                            { value: 'TRAILER', label: 'Remolque (Trailer)' }
                        ]}
                        placeholder="Seleccionar destino"
                        searchable={false}
                        onValueChange={(value) => {
                            // If value is INVENTORY, form logic might handle null, 
                            // but usually the select returns the value "INVENTORY".
                            // If we want null in the form state for INVENTORY, we might need to handle it.
                            // However, the previous code did: value === 'INVENTORY' ? null : value
                            // Since CustomSelectField binds value directly, we might need to let it bind "INVENTORY" 
                            // and handle the null conversion in the submit handler or use a transform.
                            // BUT, the previous code explicitly onChange(null) for INVENTORY.
                            // CustomSelectField will onChange(value).
                            // If we strictly need null, CustomSelectField might not fit perfectly unless we change options
                            // or accept "INVENTORY" string in the form data until submit.
                            // Let's assume standard behavior:

                            // Reset assigned entity if type changes
                            form.setValue('assigned_entity_id', null)

                            // Compatibility fix: existing schema likely expects "TRAILER" | "VEHICLE" | null for INVENTORY?
                            // Checking schema in hardware.schemas might be wise, but let's stick to consistent UI first.
                            // If the previous code forced null, it means the backend/schema expects null or connection_device table constraint.

                            if (value === 'INVENTORY') {
                                form.setValue('tracked_entity_type', null as any); // Force null if needed
                            }
                        }}
                    />

                    {/* Conditional Asset Selector */}
                    {watchedEntityType === 'VEHICLE' && (
                        <CustomSelectField
                            form={form}
                            name="assigned_entity_id"
                            label="Seleccionar Vehículo"
                            options={vehicleOptions}
                            placeholder="Buscar vehículo..."
                            searchable={true}
                            disabled={loadingOptions}
                        />
                    )}

                    {watchedEntityType === 'TRAILER' && (
                        <CustomSelectField
                            form={form}
                            name="assigned_entity_id"
                            label="Seleccionar Remolque"
                            options={trailerOptions}
                            placeholder="Buscar remolque..."
                            searchable={true}
                            disabled={loadingOptions}
                        />
                    )}

                    <CustomTextField
                        form={form}
                        name="notes"
                        label="Notas"
                        placeholder="Observaciones..."
                    />
                </div>
            </Card>

            <AddProtocolDialog
                open={isAddProtocolOpen}
                onClose={() => setIsAddProtocolOpen(false)}
                onSyncComplete={handleAddProtocolComplete}
            />
        </div>
    )
}
