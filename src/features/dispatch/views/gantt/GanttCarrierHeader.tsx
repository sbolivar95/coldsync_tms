import { UNIT_COL_WIDTH, DAY_COL_WIDTH } from '../../constants'
import type { CarrierAllocationStatus } from '@/services/database/carrierAllocation.service'
import { Badge } from '@/components/ui/Badge'

interface GanttDay {
    dayName: string
    dayNumber: number
    unassignedCount: number
    fullDate: Date
}

interface GanttCarrierHeaderProps {
    carrier: string
    allocationStatus?: CarrierAllocationStatus | null
    days: GanttDay[]
}

export function GanttCarrierHeader({
    carrier,
    allocationStatus,
    days
}: GanttCarrierHeaderProps) {
    return (
        <div className='flex h-[36px] border-b border-gray-200 bg-gray-50'>
            {/* Columna izquierda: Nombre del transportista (Sticky Left) */}
            <div
                className='sticky left-0 z-30 bg-gray-50 border-r border-gray-200 flex items-center justify-between'
                style={{
                    width: `${UNIT_COL_WIDTH}px`,
                    padding: '0 12px',
                }}
            >
                <div className="flex items-center min-w-0 pr-2">
                    <span className='text-xs font-bold text-gray-700 uppercase truncate' title={carrier}>
                        {carrier}
                    </span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                    {/* Badge de allocation status (si existe) */}
                    {allocationStatus && (
                        <Badge 
                            variant={allocationStatus.remaining_quota > 0 ? 'default' : 'secondary'}
                            className="text-[10px] px-1.5 py-0"
                        >
                            {allocationStatus.dispatched_count}/{allocationStatus.total_quota}
                        </Badge>
                    )}
                </div>
            </div>

            {/* Columna derecha: Gantt (grid continua) */}
            <div className='flex-1 relative'>
                {/* Grid de fondo para mantener continuidad visual */}
                <div className='flex h-full absolute inset-0 pointer-events-none'>
                    {days.map((_, dayIndex) => (
                        <div
                            key={dayIndex}
                            className='h-full border-r border-gray-100'
                            style={{
                                width: `${DAY_COL_WIDTH}px`,
                                minWidth: `${DAY_COL_WIDTH}px`,
                            }}
                        />
                    ))}
                </div>
            </div>
        </div>
    )
}
