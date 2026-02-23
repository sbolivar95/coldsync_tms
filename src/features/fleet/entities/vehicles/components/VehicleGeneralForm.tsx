import { useFormContext, useWatch } from "react-hook-form";
import { useEffect } from "react";
import { Card } from "../../../../../components/ui/Card";
import { Checkbox } from "../../../../../components/ui/Checkbox";
import { Label } from "../../../../../components/ui/Label";
import {
    FormControl,
    FormField,
    FormItem,
    FormMessage,
} from "../../../../../components/ui/Form";
import type { Vehicle, FleetSet } from "../../../../../types/database.types";
import type { VehicleFormData } from "../../../../../lib/schemas/vehicle.schemas";
import { CustomTextField } from "../../../../../components/widgets/forms/CustomTextField";
import { CustomSelectField } from "../../../../../components/widgets/forms/CustomSelectField";
import {
    operationalStatusOptions,
    vehicleTypeOptions,
    odometerUnitOptions,
} from "../constants";

interface VehicleGeneralFormProps {
    vehicle?: Vehicle | null;
    currentAssignment?: FleetSet | null;
}

export function VehicleGeneralForm({
}: VehicleGeneralFormProps) {
    const form = useFormContext<VehicleFormData>();

    // Watch vehicle type to conditionally show capacity fields
    const vehicleType = useWatch({ control: form.control, name: 'vehicle_type' });
    const isLoadCarrier = ['RIGID', 'VAN'].includes(vehicleType);

    // Watch multi-zone and compartments for conditional logic
    const supportsMultiZone = useWatch({ control: form.control, name: 'supports_multi_zone' });
    const compartments = useWatch({ control: form.control, name: 'compartments' });

    // Adjust compartments when multi-zone is toggled
    useEffect(() => {
        if (!supportsMultiZone && compartments > 1) {
            form.setValue("compartments", 1);
        } else if (supportsMultiZone && compartments < 2) {
            form.setValue("compartments", 2);
        }
    }, [supportsMultiZone, compartments, form]);

    return (
        <div className="space-y-6">
            {/* Hidden fields */}
            <input type="hidden" {...form.register("carrier_id", { valueAsNumber: true })} />

            {/* Identification */}
            <Card className="p-6">
                <div className="mb-5">
                    <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">
                        Datos del Vehículo
                    </h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
                    <CustomTextField
                        form={form}
                        name="unit_code"
                        label="Código de Unidad"
                        placeholder="UNIT-001"
                        required
                    />

                    <CustomTextField
                        form={form}
                        name="plate"
                        label="Placa/Patente"
                        placeholder="TX-9876AB"
                        required
                    />

                    <CustomSelectField
                        form={form}
                        name="operational_status"
                        label="Estado Operativo"
                        options={operationalStatusOptions}
                        placeholder="Seleccionar estado..."
                        required
                    />

                    <CustomSelectField
                        form={form}
                        name="vehicle_type"
                        label="Tipo de Vehículo"
                        options={vehicleTypeOptions}
                        placeholder="Seleccionar tipo..."
                        searchable={true}
                        required
                    />
                </div>

                {/* Second Row: Vehicle Specifications */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mt-5">
                    <CustomTextField
                        form={form}
                        name="brand"
                        label="Marca"
                        placeholder="Freightliner"
                        required
                    />

                    <CustomTextField
                        form={form}
                        name="model"
                        label="Modelo"
                        placeholder="Cascadia"
                        required
                    />

                    <CustomTextField
                        form={form}
                        name="year"
                        label="Año"
                        type="number"
                        placeholder="2022"
                        min={1900}
                        max={new Date().getFullYear() + 1}
                        required
                    />

                    <CustomTextField
                        form={form}
                        name="vin"
                        label="VIN"
                        placeholder="1FUJGLDR2NLBV1234"
                        maxLength={17}
                    />
                </div>

                {/* Third Row: Odometer and Notes */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mt-5">
                    <CustomTextField
                        form={form}
                        name="odometer_value"
                        label="Valor Odómetro"
                        type="number"
                        placeholder="125450"
                        min={0}
                        required
                    />

                    <CustomSelectField
                        form={form}
                        name="odometer_unit"
                        label="Unidad Odómetro"
                        options={odometerUnitOptions}
                        placeholder="Seleccionar unidad..."
                        required
                    />

                    <CustomTextField
                        form={form}
                        name="additional_info"
                        label="Notas Adicionales"
                        placeholder="Datos adicionales"
                        className="md:col-span-2"
                    />
                </div>
            </Card>

            {/* Capacity and Dimensions (Only for Load Carriers) */}
            {isLoadCarrier && (
                <Card className="p-6">
                    <div className="mb-5">
                        <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">
                            Capacidad y Dimensiones
                        </h3>
                    </div>

                    <div className="space-y-5">
                        {/* Multi-Zone & Load Configuration Row (Moved to Top) */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 items-start">
                            <div className="space-y-2">
                                <Label className="text-xs text-gray-600 block h-4">
                                    Configuración Multi-Zona
                                </Label>
                                <FormField
                                    control={form.control}
                                    name="supports_multi_zone"
                                    render={({ field }) => (
                                        <FormItem>
                                            <div className="flex items-center space-x-2 h-10 border border-transparent">
                                                <FormControl>
                                                    <Checkbox
                                                        checked={field.value || false}
                                                        onCheckedChange={field.onChange}
                                                    />
                                                </FormControl>
                                                <Label className="text-sm text-gray-700 cursor-pointer select-none font-normal">
                                                    Híbrido/Multi-zona
                                                </Label>
                                            </div>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            <CustomTextField
                                form={form}
                                name="compartments"
                                label="N° Compartimientos"
                                type="number"
                                min={1}
                                max={10}
                                required={supportsMultiZone}
                                disabled={!supportsMultiZone}
                                className={!supportsMultiZone ? "bg-gray-50 text-gray-500" : ""}
                                helperText={supportsMultiZone ? "Mínimo 2 para multi-zona" : "Single-zone (1 compartimiento)"}
                            />

                            <CustomSelectField
                                form={form}
                                name="load_capacity_type"
                                label="Tipo de Carga"
                                options={[
                                    { value: "PALLET", label: "Pallets" },
                                    { value: "MEAT_HOOK", label: "Ganchero" },
                                    { value: "BASKET", label: "Canastillos" },
                                    { value: "BOX", label: "Cajas" },
                                    { value: "BIN", label: "Bins" },
                                    { value: "BULK", label: "Granel" },
                                    { value: "OTHER", label: "Otro" }
                                ]}
                                placeholder="Tipo..."
                            />

                            <CustomTextField
                                form={form}
                                name="load_capacity_quantity"
                                label="Cantidad Capacidad"
                                type="number"
                                placeholder="24"
                            />
                        </div>

                        {/* Weight & Volume Row (Moved Down) */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
                            <CustomTextField
                                form={form}
                                name="transport_capacity_weight_tn"
                                label="Capacidad Peso (Tn)"
                                type="number"
                                placeholder="24"
                                helperText="Peso máximo en toneladas"
                            />

                            <CustomTextField
                                form={form}
                                name="volume_m3"
                                label="Volumen (m³)"
                                type="number"
                                placeholder="70"
                                helperText="Volumen en metros cúbicos"
                            />

                            <CustomTextField
                                form={form}
                                name="tare_weight_tn"
                                label="Peso Tara (Tn)"
                                type="number"
                                placeholder="6.5"
                                helperText="Peso del vehículo vacío"
                            />

                            <CustomTextField
                                form={form}
                                name="insulation_thickness_cm"
                                label="Espesor Aislamiento (cm)"
                                type="number"
                                placeholder="10"
                                helperText="Eficiencia térmica"
                            />
                        </div>

                        {/* Dimensions Row */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
                            <CustomTextField
                                form={form}
                                name="length_m"
                                label="Largo (m)"
                                type="number"
                                placeholder="13.6"
                            />

                            <CustomTextField
                                form={form}
                                name="width_m"
                                label="Ancho (m)"
                                type="number"
                                placeholder="2.6"
                            />

                            <CustomTextField
                                form={form}
                                name="height_m"
                                label="Alto (m)"
                                type="number"
                                placeholder="2.7"
                            />
                        </div>
                    </div>
                </Card>
            )}
        </div>
    );
}
