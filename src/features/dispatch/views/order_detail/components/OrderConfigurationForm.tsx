import { Card } from "@/components/ui/Card";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/Form";
import { Label } from "@/components/ui/Label";
import { Input } from "@/components/ui/Input";
import { SmartSelect, type SmartOption } from "@/components/widgets/SmartSelect";
import { DatePicker } from "@/components/widgets/DatePicker";
import { Textarea } from "@/components/ui/Textarea";
import { TimePicker } from "@/components/widgets/TimePicker";
import { UseFormReturn } from "react-hook-form";
import type { CreateDispatchOrderFormData } from "../../schemas/dispatchOrder.schema";
import type { Lane } from "@/types/database.types";
import { useState } from "react";

interface OrderConfigurationFormProps {
    form: UseFormReturn<CreateDispatchOrderFormData>;
    lanes: Lane[];
}

// Time preference options
const timePreferenceOptions: SmartOption[] = [
    { value: 'no-preference', label: 'Sin preferencia' },
    { value: 'specific-time', label: 'Hora específica' },
    { value: 'time-window', label: 'Rango horario' },
];

export function OrderConfigurationForm({
    form,
    lanes,
}: OrderConfigurationFormProps) {
    const [timePreference, setTimePreference] = useState<'no-preference' | 'specific-time' | 'time-window'>('no-preference');
    const [specificTime, setSpecificTime] = useState('');

    const laneOptions: SmartOption[] = lanes.map(lane => ({
        value: lane.id,
        label: lane.name
    }));

    const handleTimePreferenceChange = (value: string | string[]) => {
        const preference = (Array.isArray(value) ? value[0] : value) as 'no-preference' | 'specific-time' | 'time-window';
        setTimePreference(preference);

        if (preference === 'no-preference') {
            form.setValue('pickup_window_start', null);
            form.setValue('pickup_window_end', null);
            setSpecificTime('');
        } else if (preference === 'specific-time') {
            form.setValue('pickup_window_start', null);
            form.setValue('pickup_window_end', null);
        } else {
            setSpecificTime('');
        }
    };

    const handleSpecificTimeChange = (time: string) => {
        setSpecificTime(time);
        if (time) {
            form.setValue('pickup_window_start', time);
            form.setValue('pickup_window_end', time);
        } else {
            form.setValue('pickup_window_start', null);
            form.setValue('pickup_window_end', null);
        }
    };

    return (
        <Card className="p-6 shadow-none">
            <h3 className="text-sm font-semibold text-gray-900 mb-4">Detalles y Configuración</h3>

            {/* Fila 1: Configuración + Carril (2 cols) + Cantidad */}
            <div className="grid gap-4 mb-4" style={{ gridTemplateColumns: '1fr 2fr 1fr' }}>
                <FormField
                    control={form.control}
                    name="configuration"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel className="text-xs text-gray-500">
                                Configuración <span className="text-red-500">*</span>
                            </FormLabel>
                            <FormControl>
                                <SmartSelect
                                    name={field.name}
                                    value={field.value}
                                    onChange={(value) => {
                                        const stringValue = Array.isArray(value) ? value[0] : value;
                                        field.onChange(stringValue);
                                    }}
                                    options={[
                                        { value: "standard", label: "Standard" },
                                        { value: "hybrid", label: "Híbrido" }
                                    ]}
                                    placeholder="Seleccionar configuración..."
                                    searchable={false}
                                />
                            </FormControl>
                            <FormMessage className="text-xs" />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="lane_id"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel className="text-xs text-gray-500">
                                Carril <span className="text-red-500">*</span>
                            </FormLabel>
                            <FormControl>
                                <SmartSelect
                                    name={field.name}
                                    value={field.value}
                                    onChange={(value) => {
                                        const stringValue = Array.isArray(value) ? value[0] : value;
                                        field.onChange(stringValue);
                                    }}
                                    options={laneOptions}
                                    placeholder="Seleccionar carril..."
                                    searchable={true}
                                />
                            </FormControl>
                            <FormMessage className="text-xs" />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="quantity"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel className="text-xs text-gray-500">
                                Cantidad <span className="text-red-500">*</span>
                            </FormLabel>
                            <FormControl>
                                <Input
                                    type="number"
                                    min="1"
                                    max="50"
                                    placeholder="1"
                                    {...field}
                                    className="border-gray-200 shadow-none"
                                    onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
                                    value={field.value || 1}
                                />
                            </FormControl>
                            <FormMessage className="text-xs" />
                        </FormItem>
                    )}
                />
            </div>

            {/* Fila 2: Fecha Prevista + Ventana de Tiempo + Opciones condicionales */}
            <div className="grid grid-cols-4 gap-4 mb-4">
                <FormField
                    control={form.control}
                    name="planned_date"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel className="text-xs text-gray-500">
                                Fecha Prevista <span className="text-red-500">*</span>
                            </FormLabel>
                            <FormControl>
                                <DatePicker
                                    value={field.value ? field.value.toISOString().split('T')[0] : ''}
                                    onChange={(dateStr) => field.onChange(dateStr ? new Date(dateStr) : new Date())}
                                    placeholder="Seleccionar fecha..."
                                />
                            </FormControl>
                            <FormMessage className="text-xs" />
                        </FormItem>
                    )}
                />

                <div>
                    <Label className="text-xs text-gray-500 mb-1.5 block">
                        Ventana de Tiempo
                    </Label>
                    <SmartSelect
                        value={timePreference}
                        onChange={handleTimePreferenceChange}
                        options={timePreferenceOptions}
                        placeholder="Seleccionar..."
                        searchable={false}
                    />
                </div>

                {timePreference === 'specific-time' && (
                    <div>
                        <Label className="text-xs text-gray-500 mb-1.5 block">
                            Hora <span className="text-red-500">*</span>
                        </Label>
                        <TimePicker
                            value={specificTime}
                            onChange={handleSpecificTimeChange}
                            className="border-gray-200 shadow-none"
                        />
                    </div>
                )}

                {timePreference === 'time-window' && (
                    <>
                        <FormField
                            control={form.control}
                            name="pickup_window_start"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="text-xs text-gray-500">
                                        Inicio <span className="text-red-500">*</span>
                                    </FormLabel>
                                    <FormControl>
                                        <TimePicker
                                            value={field.value || ''}
                                            onChange={field.onChange}
                                            className="border-gray-200 shadow-none"
                                        />
                                    </FormControl>
                                    <FormMessage className="text-xs" />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="pickup_window_end"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="text-xs text-gray-500">
                                        Fin <span className="text-red-500">*</span>
                                    </FormLabel>
                                    <FormControl>
                                        <TimePicker
                                            value={field.value || ''}
                                            onChange={field.onChange}
                                            className="border-gray-200 shadow-none"
                                        />
                                    </FormControl>
                                    <FormMessage className="text-xs" />
                                </FormItem>
                            )}
                        />
                    </>
                )}
            </div>

            {/* Fila 3: Notas */}
            <div>
                <FormField
                    control={form.control}
                    name="notes"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel className="text-xs text-gray-500">
                                Notas
                            </FormLabel>
                            <FormControl>
                                <Textarea
                                    {...field}
                                    placeholder="Notas adicionales..."
                                    className="border-gray-200 shadow-none resize-none"
                                    rows={3}
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
