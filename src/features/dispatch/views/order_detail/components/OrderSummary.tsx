import { Card } from "@/components/ui/Card";
import { UseFormReturn } from "react-hook-form";
import type { CreateDispatchOrderFormData } from "../../schemas/dispatchOrder.schema";
import type { CompartmentState } from "../hooks/useOrderCompartments";
import { useMemo } from "react";

interface OrderSummaryProps {
    form: UseFormReturn<CreateDispatchOrderFormData>;
    compartments: CompartmentState[];
}

export function OrderSummary({ form, compartments }: OrderSummaryProps) {
    const configuration = form.watch("configuration");
    const quantity = form.watch("quantity") || 1;

    const metrics = useMemo(() => {
        // compartments[] es la única fuente de datos para ambas configuraciones
        const totalWeight = compartments.reduce((sum, comp) => {
            return sum + (Number(comp.weight_tn) || 0);
        }, 0);
        const compartmentCount = compartments.length;

        const totalOrders = quantity;
        const totalWeightAllOrders = totalWeight * totalOrders;

        return {
            totalOrders,
            compartmentCount,
            weightPerOrder: totalWeight,
            totalWeight: totalWeightAllOrders
        };
    }, [compartments, quantity]);

    return (
        <Card className="p-6 shadow-none border-gray-200">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-gray-900">Resumen de Orden</h3>
                <div className="flex items-center gap-1.5">
                    <span className="text-xs text-gray-500">Peso Total (TN):</span>
                    <span className="text-sm font-semibold text-gray-900">{metrics.totalWeight.toFixed(2)}</span>
                </div>
            </div>

            <div className="grid grid-cols-4 gap-6">
                <div className="flex flex-col gap-1.5">
                    <span className="text-xs text-gray-500">Órdenes</span>
                    <span className="text-xl font-semibold text-gray-900 tabular-nums">{metrics.totalOrders}</span>
                </div>

                <div className="flex flex-col gap-1.5">
                    <span className="text-xs text-gray-500">Configuración</span>
                    <span className="text-xl font-semibold text-gray-900">{configuration === 'standard' ? 'Standard' : 'Híbrido'}</span>
                </div>

                <div className="flex flex-col gap-1.5">
                    <span className="text-xs text-gray-500">Compartimientos</span>
                    <span className="text-xl font-semibold text-gray-900 tabular-nums">{metrics.compartmentCount}</span>
                </div>

                <div className="flex flex-col gap-1.5">
                    <span className="text-xs text-gray-500">Peso por Orden (TN)</span>
                    <span className="text-xl font-semibold text-gray-900 tabular-nums">{metrics.weightPerOrder.toFixed(2)}</span>
                </div>
            </div>
        </Card>
    );
}
