import { Checkbox } from '../../../../components/ui/Checkbox'
import { Button } from '../../../../components/ui/Button'
import { ChevronLeft, Filter, XCircle } from 'lucide-react'
import { ScrollArea } from '../../../../components/ui/ScrollArea'
import { UnassignedOrdersDropZone } from './UnassignedOrdersDropZone'
import { DraggableOrder } from './DraggableOrder'
import type { DispatchOrderWithRelations } from '../../hooks/useDispatchOrders'

import { UnassignedOrderUI } from '../../types'

interface UnassignedGroup {
    day: string
    count: number
    orders: UnassignedOrderUI[]
}

interface UnassignedOrdersSidebarProps {
    unassignedGroups: UnassignedGroup[]
    selectedOrders: Set<string>
    totalUnassigned: number
    allSelected: boolean | 'indeterminate'
    onSelectAll: (checked: boolean) => void
    onSelectOrder: (orderId: string, checked: boolean) => void
    onCancelSelected: () => void
    onOrderClick: (order: DispatchOrderWithRelations) => void
    assignmentErrors: Map<string, string[]>
    dispatchOrders: DispatchOrderWithRelations[]
    onCollapse?: () => void
}

export function UnassignedOrdersSidebar({
    unassignedGroups,
    selectedOrders,
    totalUnassigned,
    allSelected,
    onSelectAll,
    onSelectOrder,
    onCancelSelected,
    onOrderClick,
    assignmentErrors,
    dispatchOrders,
    onCollapse
}: UnassignedOrdersSidebarProps) {
    return (
        <div className='flex flex-col h-full border-r border-gray-300 overflow-hidden w-[20%] bg-white z-20'>
            {/* Header Columna 1 */}
            <div className='px-4 py-3 border-b border-[#dde9fb] h-[52px] flex items-center justify-between gap-3' style={{ backgroundColor: '#eff5fd' }}>
                <div className='flex items-center gap-2'>
                    <Checkbox
                        checked={allSelected}
                        onCheckedChange={onSelectAll}
                        className='data-[state=indeterminate]:bg-primary data-[state=indeterminate]:border-primary'
                    />
                    <h3 className='text-sm font-medium text-gray-900'>
                        Sin Asignar
                    </h3>
                    <span className='text-xs text-gray-500'>
                        {selectedOrders.size > 0
                            ? `${selectedOrders.size} de ${totalUnassigned}`
                            : totalUnassigned}
                    </span>
                </div>
                <div className='flex items-center gap-1'>
                    {onCollapse && (
                        <Button
                            variant='ghost'
                            size='sm'
                            className='h-7 w-7 p-0'
                            onClick={onCollapse}
                            title='Colapsar cola'
                        >
                            <ChevronLeft className='w-4 h-4' />
                        </Button>
                    )}
                    {/* Botón de cancelar - solo aparece cuando hay selecciones */}
                    {selectedOrders.size > 0 && (
                        <Button
                            variant='outline'
                            size='sm'
                            className='h-7 w-7 p-0 text-destructive hover:text-destructive'
                            onClick={onCancelSelected}
                            title='Cancelar órdenes seleccionadas'
                        >
                            <XCircle className='w-4 h-4' />
                        </Button>
                    )}
                    <Button
                        variant='outline'
                        size='sm'
                        className='h-7 w-7 p-0'
                    >
                        <Filter className='w-4 h-4' />
                    </Button>
                </div>
            </div>

            {/* Contenido Columna 1 - Drop Zone para desasignar órdenes */}
            <UnassignedOrdersDropZone>
                <div className='flex-1 min-h-0 overflow-hidden flex flex-col'>
                    <ScrollArea className='h-full'>
                        <div className='bg-input-background'>
                            {unassignedGroups.map((group) => (
                                <div key={group.day} className='mb-4'>
                                    <div className='h-[36px] px-4 bg-gray-50 border-b border-gray-200 flex items-center gap-2'>
                                        <h4 className={`text-xs font-semibold ${
                                            group.day === 'Vencidas' ? 'text-red-600' : 
                                            group.day === 'Rechazadas' ? 'text-orange-600' : 
                                            'text-gray-700'
                                        }`}>
                                            {group.day.charAt(0).toUpperCase() + group.day.slice(1).toLowerCase()}
                                        </h4>
                                        <span className={`text-xs ${
                                            group.day === 'Vencidas' ? 'text-red-400' : 
                                            group.day === 'Rechazadas' ? 'text-orange-400' : 
                                            'text-gray-400'
                                        }`}>
                                            {group.count}
                                        </span>
                                    </div>
                                    <div className='px-3 py-2 space-y-1.5'>
                                        {group.orders.map((order: UnassignedOrderUI) => (
                                            <DraggableOrder
                                                key={order.id}
                                                order={order}
                                                isSelected={selectedOrders.has(order.id)}
                                                onSelect={onSelectOrder}
                                                assignmentError={assignmentErrors.get(order.id)?.join(', ')}
                                                onClick={() => {
                                                    const realOrder = dispatchOrders.find((o) => o.id === order.id)
                                                    if (realOrder) {
                                                        onOrderClick(realOrder)
                                                    }
                                                }}
                                            />
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </ScrollArea>
                </div>
            </UnassignedOrdersDropZone>
        </div>
    )
}
