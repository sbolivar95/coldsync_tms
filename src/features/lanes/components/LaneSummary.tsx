import { Card } from "../../../components/ui/Card";
import { UseFormReturn } from "react-hook-form";
import type { LaneFormData } from "../../../lib/schemas/lane.schemas";
import type { LaneStopState } from "../hooks/useLaneStops";
import { useMemo } from "react";

interface LaneSummaryProps {
    form: UseFormReturn<LaneFormData>;
    stops: LaneStopState[];
}

export function LaneSummary({ form, stops }: LaneSummaryProps) {
    const transitTime = Number(form.watch("transit_time")) || 0;
    const operationalBuffer = Number(form.watch("operational_buffer")) || 0;

    const metrics = useMemo(() => {
        // Count stop types
        const pickups = stops.filter(s => s.stop_type === "PICKUP").length;
        const dropOffs = stops.filter(s => s.stop_type === "DROP_OFF").length;
        const controls = stops.filter(s => s.stop_type === "MANDATORY_WAYPOINT").length;

        // Calculate total dwell time (all stops)
        const totalDwell = stops.reduce((sum, stop) => {
            const duration = Number(stop.estimated_duration) || 0;
            return sum + duration;
        }, 0);

        // Calculate ETA Total
        const etaTotal = transitTime + totalDwell + operationalBuffer;

        return {
            totalStops: stops.length,
            pickups,
            dropOffs,
            controls,
            totalDwell,
            etaTotal
        };
    }, [stops, transitTime, operationalBuffer]);

    return (
        <Card className="p-6 shadow-none border-gray-200">
            {/* Header with Title and ETA Total */}
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-gray-900">Resumen de Carril</h3>
                <div className="flex items-center gap-1.5">
                    <span className="text-xs text-gray-500">ETA Total (h):</span>
                    <span className="text-sm font-semibold text-gray-900">{metrics.etaTotal.toFixed(1)}</span>
                </div>
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-5 gap-6">
                {/* Total Stops */}
                <div className="flex flex-col gap-1.5">
                    <span className="text-xs text-gray-500">Ubicaciones</span>
                    <span className="text-xl font-semibold text-gray-900 tabular-nums">{metrics.totalStops}</span>
                </div>

                {/* Pickups */}
                <div className="flex flex-col gap-1.5">
                    <span className="text-xs text-gray-500">Cargas</span>
                    <span className="text-xl font-semibold text-gray-900 tabular-nums">{metrics.pickups}</span>
                </div>

                {/* Drop-offs */}
                <div className="flex flex-col gap-1.5">
                    <span className="text-xs text-gray-500">Descargas</span>
                    <span className="text-xl font-semibold text-gray-900 tabular-nums">{metrics.dropOffs}</span>
                </div>

                {/* Controls */}
                <div className="flex flex-col gap-1.5">
                    <span className="text-xs text-gray-500">Controles</span>
                    <span className="text-xl font-semibold text-gray-900 tabular-nums">{metrics.controls}</span>
                </div>

                {/* Dwell Time */}
                <div className="flex flex-col gap-1.5">
                    <span className="text-xs text-gray-500">Tiempo en Ubicaciones (h)</span>
                    <div className="flex items-baseline gap-1">
                        <span className="text-xl font-semibold text-gray-900 tabular-nums">{metrics.totalDwell.toFixed(1)}</span>
                    </div>
                </div>
            </div>
        </Card>
    );
}
