import { VehicleDropZone } from './VehicleDropZone'
import { DraggableTripCard } from './DraggableTripCard'
import { DAY_COL_WIDTH } from '../../constants'

import { FleetSetUnit, AssignedTripGantt } from '../../types'

interface GanttUnitRowProps {
    unit: FleetSetUnit
    trips: AssignedTripGantt[]
    onTripClick: (trip: AssignedTripGantt) => void
    startDate: Date // REQUIRED: To validate against past dates
}

export function GanttUnitRow({
    unit,
    trips,
    onTripClick,
    startDate
}: GanttUnitRowProps) {
    return (
        <VehicleDropZone
            unit={unit}
            existingTrips={trips}
            dayColWidth={DAY_COL_WIDTH}
            startDate={startDate}
        >
            {/* Tarjetas de Viaje (Posicionamiento Absoluto en Píxeles) */}
            <div className='absolute inset-0 w-full h-full'>
                {trips.map((trip) => {
                    // Cálculos basados en PIXELES fijos, no porcentajes
                    const leftPx = trip.dayOffset * DAY_COL_WIDTH + 8 // +8px padding
                    const tripDurationPx = trip.duration * DAY_COL_WIDTH
                    const rtaDurationPx = trip.hasRTA
                        ? trip.rtaDuration * DAY_COL_WIDTH
                        : 0
                    const totalWidthPx = tripDurationPx + rtaDurationPx - 16 // -16px padding

                    // Porcentajes internos del bloque
                    const totalPx = tripDurationPx + rtaDurationPx
                    const tripPercent = (tripDurationPx / totalPx) * 100
                    const rtaPercent = (rtaDurationPx / totalPx) * 100

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
                            onClick={() => onTripClick(trip)}
                        />
                    )
                })}
            </div>
        </VehicleDropZone>
    )
}
