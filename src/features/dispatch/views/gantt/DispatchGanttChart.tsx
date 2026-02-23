import { UNIT_COL_WIDTH, DAY_COL_WIDTH, NUM_DAYS } from '../../constants'
import { GanttHeader } from './GanttHeader'
import { GanttCarrierHeader } from './GanttCarrierHeader'
import { GanttUnitRow } from './GanttUnitRow'
import type { CarrierAllocationStatus } from '@/services/database/carrierAllocation.service'
import { FleetSetUnit, AssignedTripGantt } from '../../types'

interface GanttDay {
    dayName: string
    dayNumber: number
    unassignedCount: number
    fullDate: Date
}

interface DispatchGanttChartProps {
    isLoadingFleetSets: boolean
    isLoadingLanes: boolean
    availableUnits: number | string
    days: GanttDay[]
    groupedUnits: Record<string, FleetSetUnit[]>
    getAllocationStatus: (carrierId: number | undefined) => CarrierAllocationStatus | null
    getTripsForVehicle: (vehicleId: string) => AssignedTripGantt[]
    onTripClick: (trip: AssignedTripGantt) => void
    startDate: Date // REQUIRED: To validate against past dates
}

export function DispatchGanttChart({
    isLoadingFleetSets,
    isLoadingLanes,
    availableUnits,
    days,
    groupedUnits,
    getAllocationStatus,
    getTripsForVehicle,
    onTripClick,
    startDate
}: DispatchGanttChartProps) {
    return (
        <div className='flex-1 h-full overflow-hidden' style={{ width: '80%' }}>
            {/* Main SCROLLABLE container (Handles X and Y) */}
            <div
                className='h-full w-full overflow-auto relative bg-white'
                style={{
                    backgroundImage: `linear-gradient(to right, transparent ${Number(UNIT_COL_WIDTH) - 1}px, #e5e7eb ${Number(UNIT_COL_WIDTH) - 1}px, #e5e7eb ${Number(UNIT_COL_WIDTH)}px, transparent ${Number(UNIT_COL_WIDTH)}px)`,
                    backgroundRepeat: 'repeat-y',
                    backgroundSize: '100% 1px'
                }}
            >
                {/* Inner container with CALCULATED MINIMUM WIDTH (Forces horizontal scroll if necessary) */}
                <div
                    className='flex flex-col min-h-full'
                    style={{
                        width: `${UNIT_COL_WIDTH + NUM_DAYS * DAY_COL_WIDTH}px`,
                    }}
                >
                    <GanttHeader
                        availableUnits={availableUnits}
                        isLoadingFleetSets={isLoadingFleetSets}
                        isLoadingLanes={isLoadingLanes}
                        days={days}
                    />

                    {/* --- GANTT BODY (Unit Rows) --- */}
                    <div className='flex-1 relative'>
                        {Object.entries(groupedUnits).map(([carrier, units]) => (
                            <div key={carrier}>
                                <GanttCarrierHeader
                                    carrier={carrier}
                                    allocationStatus={getAllocationStatus(units[0]?.carrierId)}
                                    days={days}
                                />

                                {/* Filas de Vehículos del Grupo */}
                                {units.map((unit) => (
                                    <GanttUnitRow
                                        key={unit.id}
                                        unit={unit}
                                        trips={getTripsForVehicle(unit.id)}
                                        onTripClick={onTripClick}
                                        startDate={startDate}
                                    />
                                ))}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    )
}
