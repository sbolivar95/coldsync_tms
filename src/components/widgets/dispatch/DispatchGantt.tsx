import { useMemo } from "react";
import { VehicleDropZone } from "../../../features/dispatch/views/gantt/VehicleDropZone";
import { DraggableTripCard } from "../../../features/dispatch/views/gantt/DraggableTripCard";

/**
 * DISPATCH GANTT COMPONENT - ColdSync
 * 
 * Componente que renderiza el cuerpo del Gantt con unidades agrupadas por transportista.
 */

export interface DispatchGanttProps {
    /** Unidades disponibles */
    units: any[];
    /** Viajes asignados */
    assignedTrips: any[];
    /** Ancho de cada columna de día (default: 160) */
    dayColWidth?: number;
    /** Ancho de la columna de unidades (default: 260) */
    unitColWidth?: number;
    /** Número de días a renderizar en el fondo (default: 15) */
    numDays?: number;
    /** Callback cuando se suelta una orden/viaje sobre un vehículo */
    onDrop: (item: any, vehicleId: string, dayOffset: number) => void;
    /** Callback cuando se hace click en un viaje */
    onTripClick: (trip: any) => void;
    /** Función opcional para obtener el color del punto de estado */
    getStatusDotColor?: (status: string, hasActiveTrip: boolean) => string;
}

import { getStatusDotClasses } from "./dispatchUtils";

export function DispatchGantt({
    units,
    assignedTrips,
    dayColWidth = 160,
    unitColWidth = 260,
    numDays = 15,
    onDrop,
    onTripClick,
    getStatusDotColor = getStatusDotClasses,
}: DispatchGanttProps) {

    // Agrupar unidades por transportista
    const groupedUnits = useMemo(() => {
        const groups: { [key: string]: any[] } = {};
        units.forEach((unit) => {
            if (!groups[unit.carrier]) {
                groups[unit.carrier] = [];
            }
            groups[unit.carrier].push(unit);
        });
        return groups;
    }, [units]);

    // Filtrar viajes por vehículo
    const getTripsForVehicle = (vehicleId: string) => {
        return assignedTrips.filter(trip => {
            const tripStatus = trip.status || trip.estado || "";
            const isUnassigned = tripStatus === "sin-asignar" || tripStatus === "unassigned";
            return trip.vehicleId === vehicleId && !isUnassigned;
        });
    };

    return (
        <div className="flex-1 bg-white">
            {Object.entries(groupedUnits).map(([carrier, carrierUnits]) => (
                <div key={carrier}>
                    {/* Header de Transportista */}
                    <div className="flex h-[36px] border-b border-gray-200 bg-gray-50">
                        <div
                            className="sticky left-0 z-30 bg-gray-50 border-r border-gray-300 flex items-center justify-between"
                            style={{
                                width: `${unitColWidth}px`,
                                padding: "0 12px",
                            }}
                        >
                            <span className="text-xs font-bold text-gray-700 uppercase">
                                {carrier}
                            </span>
                            <span className="text-xs text-gray-600">
                                {getCarrierQuota(carrier)}
                            </span>
                        </div>

                        <div className="flex-1 relative">
                            {/* Grid de fondo (líneas verticales de los días) */}
                            <div className="flex h-full absolute inset-0 pointer-events-none">
                                {Array.from({ length: numDays }).map((_, i) => (
                                    <div
                                        key={i}
                                        className="h-full border-r border-gray-100"
                                        style={{
                                            width: `${dayColWidth}px`,
                                            minWidth: `${dayColWidth}px`,
                                        }}
                                    />
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Filas de Vehículos */}
                    {carrierUnits.map((unit) => {
                        const trips = getTripsForVehicle(unit.id);

                        return (
                            <VehicleDropZone
                                key={unit.id}
                                unit={unit}
                                getStatusDotColor={getStatusDotColor}
                                onDrop={onDrop}
                                existingTrips={trips}
                                dayColWidth={dayColWidth}
                            >
                                <div className="absolute inset-0 w-full h-full">
                                    {trips.map((trip) => {
                                        const leftPx = trip.dayOffset * dayColWidth + 8;
                                        const tripDurationPx = trip.duration * dayColWidth;
                                        const rtaDurationPx = trip.hasRTA ? (trip.rtaDuration || 0) * dayColWidth : 0;
                                        const totalWidthPx = tripDurationPx + rtaDurationPx - 16;

                                        const totalPx = tripDurationPx + rtaDurationPx;
                                        const tripPercent = (tripDurationPx / totalPx) * 100;
                                        const rtaPercent = (rtaDurationPx / totalPx) * 100;

                                        return (
                                            <DraggableTripCard
                                                key={trip.orderId}
                                                trip={trip}
                                                style={{
                                                    left: `${leftPx}px`,
                                                    width: `${totalWidthPx}px`,
                                                }}
                                                tripPercent={tripPercent}
                                                rtaPercent={rtaPercent}
                                                onClick={() => {
                                                    onTripClick({
                                                        ...trip,
                                                        id: trip.orderId,
                                                        unit: unit.unit,
                                                        trailer: unit.trailer,
                                                        driver: unit.driver,
                                                        carrier: unit.carrier,
                                                    });
                                                }}
                                            />
                                        );
                                    })}
                                </div>
                            </VehicleDropZone>
                        );
                    })}
                </div>
            ))}

            {units.length === 0 && (
                <div className="p-8 text-center text-sm text-gray-400 font-medium">
                    No hay unidades configuradas
                </div>
            )}
        </div>
    );
}
