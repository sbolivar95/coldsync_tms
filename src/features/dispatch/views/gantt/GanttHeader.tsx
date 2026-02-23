import { Button } from '../../../../components/ui/Button'
import { Filter, Loader2 } from 'lucide-react'
import { UNIT_COL_WIDTH, DAY_COL_WIDTH } from '../../constants'

interface GanttHeaderProps {
    availableUnits: number | string
    isLoadingFleetSets: boolean
    isLoadingLanes: boolean
    days: { dayName: string; dayNumber: number; unassignedCount: number; fullDate: Date }[]
}

export function GanttHeader({
    availableUnits,
    isLoadingFleetSets,
    isLoadingLanes,
    days
}: GanttHeaderProps) {
    // Calculate today for comparison
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    return (
        <div className='sticky top-0 z-40 border-b border-[#dde9fb] flex h-[52px]' style={{ backgroundColor: '#eff5fd' }}>
            {/* Esquina Superior Izquierda (Sticky Left + Top) */}
            <div
                className='sticky left-0 z-50 border-r border-[#dde9fb] flex items-center justify-between'
                style={{
                    backgroundColor: '#eff5fd',
                    width: `${UNIT_COL_WIDTH}px`,
                    paddingLeft: '12px',
                    paddingRight: '12px',
                }}
            >
                <div className='flex items-center gap-2'>
                    <h3 className='text-sm font-medium text-gray-900'>
                        Unidades
                    </h3>
                    <span className='text-xs text-gray-500'>
                        {isLoadingFleetSets ? '...' : availableUnits}
                    </span>
                    {isLoadingLanes && (
                        <span className='flex items-center gap-1 text-xs text-gray-500' title='Cargando rutas...'>
                            <Loader2 className='w-3 h-3 animate-spin' />
                        </span>
                    )}
                </div>
                <div className='flex gap-1'>
                    <Button variant='outline' size='sm' className='h-7 w-7 p-0' type='button'>
                        <Filter className='w-4 h-4' />
                    </Button>
                </div>
            </div>

            {/* Días del Calendario (Se mueven horizontalmente) */}
            <div className='flex flex-1'>
                {days.map((item, index) => {
                    const dayDate = new Date(item.fullDate)
                    dayDate.setHours(0, 0, 0, 0)
                    const isPast = dayDate < today

                    return (
                        <div
                            key={`${item.dayNumber}-${index}`}
                            className={`flex items-center justify-center border-r border-[#dde9fb] ${isPast ? 'bg-[#e7edf8]' : ''
                                }`}
                            style={{
                                width: `${DAY_COL_WIDTH}px`,
                                minWidth: `${DAY_COL_WIDTH}px`,
                                backgroundColor: isPast ? undefined : '#eff5fd',
                            }}
                        >
                            <div className='flex flex-col items-center gap-0.5'>
                                <span className={`text-xs font-medium block ${isPast ? 'text-gray-500' : 'text-gray-900'
                                    }`}>
                                    {item.dayName}
                                </span>
                                <span className={`text-[10px] block leading-none ${isPast ? 'text-gray-500' : 'text-gray-500'
                                    }`}>
                                    {item.dayNumber}
                                </span>
                            </div>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}
