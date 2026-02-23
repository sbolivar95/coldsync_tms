import { Card } from "../../../components/ui/Card";
import { SlidersHorizontal } from "lucide-react";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "../../../components/ui/Form";
import { Input } from "../../../components/ui/Input";
import { SmartSelect, type SmartOption } from "../../../components/widgets/SmartSelect";
import { UseFormReturn } from "react-hook-form";
import type { LaneFormData } from "../../../lib/schemas/lane.schemas";
import { LabelActionButton } from "../../../components/widgets/buttons/LabelActionButton";

interface LaneConfigurationFormProps {
    form: UseFormReturn<LaneFormData>;
    laneTypes: SmartOption[];
    loadingLaneTypes: boolean;
    onManageLaneTypes: () => void;
}

export function LaneConfigurationForm({
    form,
    laneTypes,
    loadingLaneTypes,
    onManageLaneTypes
}: LaneConfigurationFormProps) {
    return (
        <Card className="p-6 shadow-none">
            <h3 className="text-sm font-semibold text-gray-900 mb-4">Detalles y Configuración</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <FormField
                    control={form.control}
                    name="lane_id"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel className="text-xs text-gray-500">
                                Código de Carril <span className="text-red-500">*</span>
                            </FormLabel>
                            <FormControl>
                                <Input {...field} placeholder="LA-001" className="border-gray-200 shadow-none" />
                            </FormControl>
                            <FormMessage className="text-xs" />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel className="text-xs text-gray-500">
                                Nombre de Carril <span className="text-red-500">*</span>
                            </FormLabel>
                            <FormControl>
                                <Input {...field} placeholder="Carril Principal" className="border-gray-200 shadow-none" />
                            </FormControl>
                            <FormMessage className="text-xs" />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="lane_type_id"
                    render={({ field }) => (
                        <FormItem>
                            <div className="flex items-center justify-between">
                                <FormLabel className="text-xs text-gray-500">
                                    Tipo de Carril <span className="text-red-500">*</span>
                                </FormLabel>
                                <LabelActionButton
                                    icon={SlidersHorizontal}
                                    title="Gestionar tipos de carril"
                                    onClick={onManageLaneTypes}
                                />
                            </div>
                            <FormControl>
                                <SmartSelect
                                    name={field.name}
                                    value={field.value?.toString() || ""}
                                    onChange={(value) => {
                                        const stringValue = Array.isArray(value) ? value[0] : value;
                                        field.onChange(stringValue ? parseInt(stringValue) : null);
                                    }}
                                    options={laneTypes}
                                    placeholder={loadingLaneTypes ? "Cargando tipos..." : "Seleccionar tipo..."}
                                    searchable={true}
                                    disabled={false}
                                />
                            </FormControl>
                            <FormMessage className="text-xs" />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="is_active"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel className="text-xs text-gray-500">
                                Estado <span className="text-red-500">*</span>
                            </FormLabel>
                            <FormControl>
                                <SmartSelect
                                    name={field.name}
                                    value={field.value === undefined || field.value === null ? "" : field.value ? "true" : "false"}
                                    onChange={(value) => {
                                        const stringValue = Array.isArray(value) ? value[0] : value;
                                        field.onChange(stringValue === "true");
                                    }}
                                    options={[
                                        { value: "true", label: "Activo" },
                                        { value: "false", label: "Inactivo" }
                                    ]}
                                    placeholder="Seleccionar estado..."
                                    searchable={false}
                                    disabled={false}
                                />
                            </FormControl>
                            <FormMessage className="text-xs" />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="distance"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel className="text-xs text-gray-500">
                                Distancia (km) <span className="text-red-500">*</span>
                            </FormLabel>
                            <FormControl>
                                <Input
                                    type="number"
                                    step="any"
                                    placeholder="380.5"
                                    {...field}
                                    className="border-gray-200 shadow-none"
                                    onChange={(e) => field.onChange(e.target.value)}
                                    value={field.value || ""}
                                />
                            </FormControl>
                            <FormMessage className="text-xs" />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="transit_time"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel className="text-xs text-gray-500">
                                Tránsito (h)
                            </FormLabel>
                            <FormControl>
                                <Input
                                    type="number"
                                    step="any"
                                    placeholder="8.5"
                                    {...field}
                                    className="border-gray-200 shadow-none"
                                    onChange={(e) => field.onChange(e.target.value)}
                                    value={field.value || ""}
                                />
                            </FormControl>
                            <FormMessage className="text-xs" />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="operational_buffer"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel className="text-xs text-gray-500">
                                Buffer Operacional (h)
                            </FormLabel>
                            <FormControl>
                                <Input
                                    type="number"
                                    step="any"
                                    placeholder="2.0"
                                    {...field}
                                    className="border-gray-200 shadow-none"
                                    onChange={(e) => field.onChange(e.target.value)}
                                    value={field.value || ""}
                                />
                            </FormControl>
                            <FormMessage className="text-xs" />
                        </FormItem>
                    )}
                />
            </div>
        </Card>
    );
}
