
import { useFormContext } from "react-hook-form";
import { FormField, FormItem, FormControl, FormDescription, FormLabel, FormMessage } from "../../../components/ui/Form";
import { Checkbox } from "../../../components/ui/Checkbox";
import { Card } from "../../../components/ui/Card";
import { Input } from "../../../components/ui/Input";
import { CustomTextField } from "../../../components/widgets/forms/CustomTextField";
import { CustomDateField } from "../../../components/widgets/forms/CustomDateField";
import type { CarrierFormData } from "../../../lib/schemas/carrier.schemas";

export function AllocationTab() {
  const form = useFormContext<CarrierFormData>();

  return (
    <div className="space-y-6">
      
      <Card className="p-6">
        <div className="mb-6">
          <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">
            Configuración de Reglas
          </h3>
          <p className="text-sm text-gray-500 mt-1">
            Define cómo se evalúa el rendimiento y se asignan las órdenes.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
           {/* Target Orders */}
           <CustomTextField
            form={form}
            name="allocation_rule.target_orders"
            label="Cuota Objetivo (Órdenes)"
            type="number"
            placeholder="0"
            helperText="Órdenes esperadas por periodo."
          />

           {/* Reset Period */}
           <CustomTextField
            form={form}
            name="allocation_rule.reset_every_days"
            label="Duración del Periodo (Días)"
            type="number"
            placeholder="30"
            helperText="Ej: 30 para mensual, 7 para semanal."
          />

           {/* Start Date */}
           <CustomDateField
            form={form}
            name="allocation_rule.starts_on"
            label="Fecha de Inicio"
            helperText="Inicio de vigencia de la regla."
          />



           {/* Reject Threshold - Handled manually for % support */}
           <FormField
              control={form.control}
              name="allocation_rule.reject_rate_threshold"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Límite de Rechazo (%)</FormLabel>
                  <FormControl>
                    <div className="relative">
                        <Input 
                            type="number" 
                            {...field} 
                            value={field.value !== undefined ? Math.round(Number(field.value) * 100) : ''}
                            onChange={e => {
                                const val = parseFloat(e.target.value);
                                if (!isNaN(val)) {
                                    field.onChange(val / 100);
                                } else {
                                    field.onChange(0);
                                }
                            }}
                            min={0}
                            max={100}
                        />
                        <span className="absolute right-3 top-2.5 text-gray-400 text-sm">%</span>
                    </div>
                  </FormControl>
                  <FormDescription>
                    Máximo porcentaje de órdenes rechazadas.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

           {/* Carryover Switch - Aligned properly */}
           <FormField
              control={form.control}
              name="allocation_rule.carryover_enabled"
              render={({ field }) => (
                <FormItem>
                   <FormLabel>Acarreo de Deuda</FormLabel>
                   <div className="flex h-9 items-center gap-2">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <span className="text-sm font-medium text-gray-700">
                        Habilitar Acarreo
                      </span>
                   </div>
                   <FormDescription>
                     Suma órdenes pendientes al siguiente periodo.
                   </FormDescription>
                   <FormMessage />
                </FormItem>
              )}
            />

        </div>
      </Card>
    </div>
  );
}
