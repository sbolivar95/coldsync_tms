import { useFormContext } from "react-hook-form";
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
import { CustomTextField } from "../../../../../components/widgets/forms/CustomTextField";
import { CustomSelectField } from "../../../../../components/widgets/forms/CustomSelectField";
import type { TrailerCompleteFormData } from "../../../../../lib/schemas/trailer.schemas";

const operationalStatusOptions = [
    { value: "ACTIVE", label: "Activo" },
    { value: "IN_SERVICE", label: "En Servicio" },
    { value: "IN_MAINTENANCE", label: "En Mantenimiento" },
    { value: "OUT_OF_SERVICE", label: "Fuera de Servicio" },
    { value: "RETIRED", label: "Retirado" },
    { value: "IN_TRANSIT", label: "En Tránsito" },
];

export function TrailerGeneralForm() {
    // Use form context from parent FormProvider
    const form = useFormContext<TrailerCompleteFormData>();

    const supportsMultiZone = form.watch("supports_multi_zone");
    const compartments = form.watch("compartments");

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
            {/* Identificación */}
            <Card className="p-6">
                <div className="mb-5">
                    <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">
                        Datos del Remolque
                    </h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
                    {/* Row 1: Basic Identifiers + Brand */}
                    <CustomTextField
                        form={form}
                        name="code"
                        label="Código Remolque"
                        placeholder="TR-001"
                        required
                    />

                    <CustomTextField
                        form={form}
                        name="plate"
                        label="Placa/Patente"
                        placeholder="TX-TR-1234"
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

                    <CustomTextField
                        form={form}
                        name="brand"
                        label="Marca"
                        placeholder="Great Dane"
                    />
                </div>

                {/* Row 2: Specifications + Notes */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mt-5">
                    <CustomTextField
                        form={form}
                        name="model"
                        label="Modelo"
                        placeholder="Everest"
                    />

                    <CustomTextField
                        form={form}
                        name="year"
                        label="Año"
                        type="number"
                        placeholder="2023"
                        min={1900}
                        max={new Date().getFullYear() + 1}
                    />

                    <CustomTextField
                        form={form}
                        name="vin"
                        label="VIN"
                        placeholder="1graa06..."
                        maxLength={17}
                    />

                    <CustomTextField
                        form={form}
                        name="notes"
                        label="Notas Adicionales"
                        placeholder="Datos adicionales"
                    />
                </div>
            </Card>

            {/* Capacidad y Dimensiones */}
            <Card className="p-6">
                <div className="mb-5">
                    <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">
                        Capacidad y Dimensiones
                    </h3>
                </div>

                <div className="space-y-5">
                    {/* Row 1: Configuration (Multi-Zone & Load) - Moved to TOP matching Vehicle */}
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
                                                    checked={field.value}
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

                    {/* Row 2: Weight & Volume */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
                        <CustomTextField
                            form={form}
                            name="transport_capacity_weight_tn"
                            label="Capacidad Peso (Tn)"
                            type="number"
                            placeholder="24"
                            required
                            helperText="Peso máximo en toneladas"
                        />

                        <CustomTextField
                            form={form}
                            name="volume_m3"
                            label="Volumen (m³)"
                            type="number"
                            placeholder="70"
                            required
                            helperText="Volumen en metros cúbicos"
                        />

                        <CustomTextField
                            form={form}
                            name="tare_weight_tn"
                            label="Peso Tara (Tn)"
                            type="number"
                            placeholder="6.5"
                            helperText="Peso del remolque vacío"
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

                    {/* Row 3: Dimensions */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
                        <CustomTextField
                            form={form}
                            name="length_m"
                            label="Largo (m)"
                            type="number"
                            placeholder="13.6"
                            required
                        />

                        <CustomTextField
                            form={form}
                            name="width_m"
                            label="Ancho (m)"
                            type="number"
                            placeholder="2.6"
                            required
                        />

                        <CustomTextField
                            form={form}
                            name="height_m"
                            label="Alto (m)"
                            type="number"
                            placeholder="2.7"
                            required
                        />
                    </div>
                </div>
            </Card>
        </div>
    );
}
