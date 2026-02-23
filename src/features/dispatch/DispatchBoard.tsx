import { useMemo, useState } from 'react'
import {
    DndContext,
    PointerSensor,
    TouchSensor,
    useSensor,
    useSensors,
    DragOverlay,
    type DragEndEvent,
} from '@dnd-kit/core'
import type { DispatchDropItem, UnassignedOrderUI, AssignedTripGantt } from './types'
import { toast } from 'sonner'
import { UnassignedOrdersSidebar } from './views/gantt/UnassignedOrdersSidebar'
import { DispatchGanttChart } from './views/gantt/DispatchGanttChart'
import { DispatchOrdersTable } from './views/list/DispatchOrdersTable'
import { DispatchBoardsSidebar, filterOrdersByBoard, type DispatchBoardFilterKey } from './views/list/DispatchBoardsSidebar'
import { PageHeader } from '@/layouts/PageHeader'
import { Button } from '@/components/ui/Button'
import { EntityStatusFilter } from '@/components/ui/EntityStatusFilter'
import { ChevronRight, Sparkles, Loader2, Send } from 'lucide-react'
import { DispatchViewControls, type ViewDensityMode, type DisplayMode } from './components/DispatchViewControls'
import { TripCard } from './views/gantt/TripCard'
import type { DispatchOrderWithRelations } from './hooks/useDispatchOrders'
import type { FleetSetUnit } from './types'
import type { CarrierAllocationStatus } from '@/services/database/carrierAllocation.service'
import { isOrderHybrid } from '@/features/orders/utils/orders-helpers'
import type { CarrierOrder } from '@/services/database/orders.service'

interface DispatchBoardProps {
    // Data
    dispatchOrders: DispatchOrderWithRelations[]
    fleetSetUnits: FleetSetUnit[]
    groupedUnits: Record<string, FleetSetUnit[]>
    unassignedGroups: any[]
    totalUnassigned: number
    allOrderIds: string[]
    days: any[]
    calendarRangeLabel: string
    assignmentErrors: Map<string, string[]>
    isLoadingFleetSets: boolean
    isLoadingLanes: boolean
    isSendingDispatch: boolean

    // State & Handlers
    startDate: Date
    setStartDate: (date: Date) => void
    viewMode: ViewDensityMode
    setViewMode: (mode: ViewDensityMode) => void
    displayMode?: DisplayMode
    setDisplayMode?: (mode: DisplayMode) => void
    selectedOrders: Set<string>
    setSelectedOrders: (orders: Set<string>) => void
    searchTerm: string
    configurationFilter: 'all' | 'Standard' | 'Hybrid'
    setConfigurationFilter: (filter: 'all' | 'Standard' | 'Hybrid') => void
    handleSearch: (query: string) => void
    handleSchedule: (orderIds?: string[]) => void | Promise<void>
    handleBatchSend: () => void
    handleQuickSendFromList: (orderIds: string[]) => void
    handleQuickCancelFromList: (orderIds: string[]) => void
    handleSendSingleOrder: (order: DispatchOrderWithRelations) => void | Promise<void>
    handleCancelFromList: (order: DispatchOrderWithRelations) => void
    handlePreviousDay: () => void
    handleNextDay: () => void
    handleSelectOrder: (orderId: string, checked: boolean) => void
    handleCancelSelectedOrders: () => void
    handleOrderClick: (order: DispatchOrderWithRelations) => void
    handleTripClick: (trip: AssignedTripGantt) => void

    // Actions
    assignFleetSet: (orderId: string, fleetSetId: string, userId: string) => Promise<any>
    unassignFleetSet: (orderId: string, userId: string) => Promise<any>
    loadDispatchOrders: (force?: boolean) => Promise<void>
    loadFleetSets: () => Promise<void>
    getAllocationStatus: (carrierId: number | undefined) => CarrierAllocationStatus | null
    getTripsForVehicle: (vehicleId: string) => AssignedTripGantt[]
    user: any
    orgId: string | undefined
}

export function DispatchBoard({
    dispatchOrders,
    fleetSetUnits,
    groupedUnits,
    unassignedGroups,
    totalUnassigned,
    allOrderIds,
    days,
    calendarRangeLabel,
    assignmentErrors,
    isLoadingFleetSets,
    isLoadingLanes,
    isSendingDispatch,
    startDate,
    setStartDate,
    viewMode,
    setViewMode,
    displayMode,
    setDisplayMode,
    selectedOrders,
    setSelectedOrders,
    searchTerm,
    configurationFilter,
    setConfigurationFilter,
    handleSearch,
    handleSchedule,
    handleBatchSend,
    handleQuickSendFromList,
    handleQuickCancelFromList,
    handleSendSingleOrder,
    handleCancelFromList,
    handlePreviousDay,
    handleNextDay,
    handleSelectOrder,
    handleCancelSelectedOrders,
    handleOrderClick,
    handleTripClick,
    assignFleetSet,
    unassignFleetSet,
    getAllocationStatus,
    getTripsForVehicle,
    user,
    orgId,
}: DispatchBoardProps) {
    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8,
            },
        }),
        useSensor(TouchSensor, {
            activationConstraint: {
                delay: 250,
                tolerance: 5,
            },
        })
    )

    const [activeDragItem, setActiveDragItem] = useState<DispatchDropItem | null>(null)
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)
    const [activeBoard, setActiveBoard] = useState<DispatchBoardFilterKey>('ALL')

    // Helper to convert DispatchOrderWithRelations to CarrierOrder for isOrderHybrid function
    const toCarrierOrderLike = (order: DispatchOrderWithRelations): CarrierOrder => {
        const mappedItems = (order.dispatch_order_items || []).map((item) => ({
            quantity: item.quantity,
            item_name: item.item_name,
            product: item.products ? { name: item.products.name } : undefined,
            thermal_profile: item.thermal_profile ? { name: item.thermal_profile.name } : undefined,
        }))

        return {
            id: order.id,
            items: mappedItems as CarrierOrder['items'],
        } as CarrierOrder
    }

    // Filter orders by board
    const boardFilteredOrders = useMemo(
        () => filterOrdersByBoard(dispatchOrders, activeBoard),
        [dispatchOrders, activeBoard]
    )

    // Filter orders by search term and configuration
    const listOrders = useMemo(() => {
        let result = boardFilteredOrders

        // Apply configuration filter
        if (configurationFilter !== 'all') {
            result = result.filter((order) => {
                const orderLike = toCarrierOrderLike(order)
                const isHybrid = isOrderHybrid(orderLike)
                
                if (configurationFilter === 'Hybrid') {
                    return isHybrid
                } else if (configurationFilter === 'Standard') {
                    return !isHybrid
                }
                return true
            })
        }

        // Apply search filter
        if (!searchTerm.trim()) return result

        const term = searchTerm.toLowerCase().trim()
        return result.filter((order) => {
            // Search in dispatch number
            const matchesDispatchNumber = order.dispatch_number?.toLowerCase().includes(term)
            
            // Search in carrier name (from fleet_sets relation)
            const matchesCarrier = order.fleet_sets?.carriers?.commercial_name?.toLowerCase().includes(term)
            
            // Search in lane
            const matchesLane = order.lanes?.name?.toLowerCase().includes(term)
            
            // Search in lane stops (origin/destination)
            const matchesLaneStops = order.lanes?.lane_stops?.some(stop => 
                stop.locations?.name?.toLowerCase().includes(term) ||
                stop.locations?.city?.toLowerCase().includes(term) ||
                stop.locations?.code?.toLowerCase().includes(term)
            )
            
            // Search in fleet set (vehicle code/plate)
            const matchesVehicle = order.fleet_sets?.vehicles?.unit_code?.toLowerCase().includes(term) ||
                                  order.fleet_sets?.vehicles?.plate?.toLowerCase().includes(term)
            
            // Search in trailer
            const matchesTrailer = order.fleet_sets?.trailers?.code?.toLowerCase().includes(term) ||
                                  order.fleet_sets?.trailers?.plate?.toLowerCase().includes(term)
            
            // Search in driver
            const matchesDriver = order.fleet_sets?.drivers?.name?.toLowerCase().includes(term)
            
            // Search in substatus
            const matchesSubstatus = order.substatus?.toLowerCase().includes(term)
            
            // Search in stage
            const matchesStage = order.stage?.toLowerCase().includes(term)

            // Search in products (item_name or product name)
            const matchesProduct = order.dispatch_order_items?.some(item => {
                const itemName = item.item_name?.toLowerCase() || ''
                const productName = item.products?.name?.toLowerCase() || ''
                return itemName.includes(term) || productName.includes(term)
            })

            // Search in thermal profiles
            const matchesThermalProfile = order.dispatch_order_items?.some(item => {
                const profileName = item.thermal_profile?.name?.toLowerCase() || ''
                return profileName.includes(term)
            })

            // Search in weight/quantity (carga) - more flexible matching
            const matchesWeight = order.dispatch_order_items?.some(item => {
                const quantity = item.quantity?.toString() || ''
                const unit = item.unit?.toLowerCase() || ''
                
                // Combine quantity + unit for flexible matching (e.g., "12tn", "12 tn", "12")
                const combined = `${quantity}${unit}`.replace(/\s+/g, '')
                const combinedWithSpace = `${quantity} ${unit}`
                
                return combined.includes(term.replace(/\s+/g, '')) || 
                       combinedWithSpace.toLowerCase().includes(term) ||
                       quantity.includes(term) ||
                       unit.includes(term)
            })

            return matchesDispatchNumber || 
                   matchesCarrier || 
                   matchesLane || 
                   matchesLaneStops ||
                   matchesVehicle || 
                   matchesTrailer ||
                   matchesDriver ||
                   matchesSubstatus ||
                   matchesStage ||
                   matchesProduct ||
                   matchesThermalProfile ||
                   matchesWeight
        })
    }, [boardFilteredOrders, searchTerm, configurationFilter])

    const handleDragStart = (event: { active: { data: { current: any } } }) => {
        setActiveDragItem(event.active.data.current as DispatchDropItem)
    }

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event

        if (!over || !orgId || !user?.id) {
            setActiveDragItem(null)
            return
        }

        const item = active.data.current as DispatchDropItem
        const overData = over.data.current as { type: string; unitId: string } | undefined

        // Case 1: Drop onto a Vehicle Drop Zone (assign)
        if (overData?.type === 'VEHICLE_ZONE') {
            const vehicleId = overData.unitId
            const fleetSetUnit = fleetSetUnits.find((u) => u.id === vehicleId)
            const fleetSetId = fleetSetUnit?.fleetSetId

            if (!fleetSetId) {
                toast.error('Error: No se encontró la unidad')
                setActiveDragItem(null)
                return
            }

            const id = 'order' in item ? item.order?.id : ('trip' in item ? item.tripId : null)
            if (id) {
                // assignFleetSet is now truly optimistic (updates store sync inside)
                assignFleetSet(id, fleetSetId, user.id).catch(() => { })
            }
        }

        // Case 2: Drop onto Unassign zone (unassign)
        else if (over.id === 'unassigned-orders-drop-zone') {
            const id = 'order' in item ? item.order?.id : ('trip' in item ? item.tripId : null)
            if (id) {
                // unassignFleetSet is now truly optimistic
                unassignFleetSet(id, user.id).catch(() => { })
            }
        }

        // Clear active item after starting the optimistic update
        setActiveDragItem(null)
    }

    return (
        <DndContext
            sensors={sensors}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
        >
            <div className='flex flex-col h-full bg-white'>
                <PageHeader
                    showSearch
                    searchPlaceholder="Buscar orden, carrier, origen, destino, producto, perfil térmico, unidad…"
                    searchValue={searchTerm}
                    onSearch={handleSearch}
                    filters={
                        <EntityStatusFilter
                            value={configurationFilter}
                            onChange={(value) => setConfigurationFilter(value as 'all' | 'Standard' | 'Hybrid')}
                            options={[
                                { value: 'Standard', label: 'Estándar' },
                                { value: 'Hybrid', label: 'Híbrido' },
                            ]}
                            label="Configuración"
                            allLabel="Todas"
                        />
                    }
                    actions={
                        <div className='flex items-center gap-2'>
                            {displayMode !== 'list' && selectedOrders.size > 0 && (() => {
                                // Check if any selected order is eligible for planning (NEW or UNASSIGNED)
                                const eligibleForPlanning = Array.from(selectedOrders).some(orderId => {
                                    const order = dispatchOrders.find(o => o.id === orderId)
                                    return order && order.stage === 'DISPATCH' && (order.substatus === 'NEW' || order.substatus === 'UNASSIGNED')
                                })
                                
                                return eligibleForPlanning ? (
                                    <Button variant='outline' size='sm' className='gap-2 text-sm font-medium text-gray-700' onClick={() => handleSchedule()}>
                                        <Sparkles className='h-4 w-4 text-primary' />Planificar ({selectedOrders.size})
                                    </Button>
                                ) : null
                            })()}
                            {(() => {
                                // Check if any selected order is eligible for sending (ASSIGNED)
                                const eligibleForSending = Array.from(selectedOrders).some(orderId => {
                                    const order = dispatchOrders.find(o => o.id === orderId)
                                    return order && order.stage === 'DISPATCH' && order.substatus === 'ASSIGNED'
                                })
                                
                                return eligibleForSending ? (
                                    <Button variant='outline' size='sm' className='gap-2 text-sm text-gray-700' onClick={handleBatchSend} disabled={isSendingDispatch}>
                                        {isSendingDispatch ? <Loader2 className='h-4 w-4 animate-spin' /> : <Send className='h-4 w-4' />}
                                        {isSendingDispatch ? 'Enviando...' : 'Enviar'}
                                    </Button>
                                ) : null
                            })()}
                            <DispatchViewControls
                                densityMode={viewMode}
                                onDensityModeChange={setViewMode}
                                displayMode={displayMode}
                                onDisplayModeChange={setDisplayMode}
                                calendarRangeLabel={calendarRangeLabel}
                                onPreviousClick={handlePreviousDay}
                                onNextClick={handleNextDay}
                                onDateSelect={(date) => {
                                    if (date) {
                                        const normalized = new Date(date)
                                        normalized.setHours(0, 0, 0, 0)
                                        setStartDate(normalized)
                                    }
                                }}
                                selectedDate={startDate}
                                showDensityControls={displayMode === 'gantt'}
                            />
                        </div>
                    }
                />

                <div className='flex-1 overflow-hidden'>
                    <div className='h-full flex'>
                        {displayMode === 'list' && (
                            <DispatchBoardsSidebar
                                orders={dispatchOrders}
                                activeBoard={activeBoard}
                                onBoardChange={setActiveBoard}
                                isCollapsed={isSidebarCollapsed}
                                onToggleCollapse={() => setIsSidebarCollapsed((prev) => !prev)}
                            />
                        )}
                        {displayMode !== 'list' && (
                            <>
                                {!isSidebarCollapsed && (
                                    <UnassignedOrdersSidebar
                                        unassignedGroups={unassignedGroups}
                                        selectedOrders={selectedOrders}
                                        totalUnassigned={totalUnassigned}
                                        allSelected={selectedOrders.size > 0 && selectedOrders.size === allOrderIds.length ? true : selectedOrders.size > 0 ? 'indeterminate' : false}
                                        onSelectAll={(checked) => setSelectedOrders(checked ? new Set(allOrderIds) : new Set())}
                                        onSelectOrder={handleSelectOrder}
                                        onCancelSelected={handleCancelSelectedOrders}
                                        onOrderClick={handleOrderClick}
                                        assignmentErrors={assignmentErrors}
                                        dispatchOrders={dispatchOrders}
                                        onCollapse={() => setIsSidebarCollapsed(true)}
                                    />
                                )}
                                {isSidebarCollapsed && (
                                    <div className='h-full w-12 border-r border-gray-300 bg-white z-20'>
                                        <div className='h-[52px] border-b border-[#dde9fb] flex items-center justify-center' style={{ backgroundColor: '#eff5fd' }}>
                                        <Button
                                            variant='ghost'
                                            size='sm'
                                            className='h-7 w-7 p-0'
                                            onClick={() => setIsSidebarCollapsed(false)}
                                            title='Expandir cola'
                                        >
                                            <ChevronRight className='h-4 w-4' />
                                        </Button>
                                        </div>
                                    </div>
                                )}
                            </>
                        )}

                        {displayMode === 'list' && (
                            <DispatchOrdersTable
                                orders={listOrders}
                                onOrderClick={handleOrderClick}
                                onPlanifySelection={handleSchedule}
                                onQuickSend={handleQuickSendFromList}
                                onQuickCancel={handleQuickCancelFromList}
                                onSendOrder={handleSendSingleOrder}
                                onCancelOrder={handleCancelFromList}
                            />
                        )}
                        {displayMode !== 'list' && (
                            <DispatchGanttChart
                                isLoadingFleetSets={isLoadingFleetSets}
                                isLoadingLanes={isLoadingLanes}
                                availableUnits={fleetSetUnits.length}
                                days={days}
                                groupedUnits={groupedUnits}
                                getAllocationStatus={getAllocationStatus}
                                getTripsForVehicle={getTripsForVehicle}
                                startDate={startDate}
                                onTripClick={handleTripClick}
                            />
                        )}
                    </div>
                </div>
            </div>

            <DragOverlay dropAnimation={null}>
                {activeDragItem ? (
                    activeDragItem.type === 'ORDER' ? (() => {
                        const order = activeDragItem.order as UnassignedOrderUI
                        const route = order.lane || order.route
                        const routeStr = typeof route === 'string' && route ? route : 'No route'
                        const status = (order.status || 'unassigned').toLowerCase() as import('./views/gantt/TripCard').UIStatus
                        return (
                            <div className="w-[300px] pointer-events-none cursor-grabbing">
                                <TripCard
                                    configuration={order.configuration || 'Standard'}
                                    route={routeStr}
                                    weight={`${order.weight || 0} Tn`}
                                    status={status}
                                    isHybrid={order.isHybrid}
                                    cost={order.cost as number}
                                />
                            </div>
                        )
                    })() : (() => {
                        const trip = activeDragItem.trip as AssignedTripGantt
                        const tripStatus = (trip.status || 'assigned').toLowerCase()
                        const displayStatus = (
                            tripStatus === 'unassigned' || tripStatus === 'sin-asignar' ? 'assigned' :
                                tripStatus === 'at-destination' ? 'dispatched' :
                                    tripStatus
                        ) as import('./views/gantt/TripCard').UIStatus
                        return (
                            <div className="w-[200px] pointer-events-none cursor-grabbing">
                                <TripCard
                                    configuration={trip.configuration || 'Standard'}
                                    route={trip.lane || 'No route'}
                                    weight={`${trip.weight || 0} Tn`}
                                    status={displayStatus}
                                    isHybrid={trip.isHybrid}
                                    assignmentError={trip.assignmentError}
                                />
                            </div>
                        )
                    })()
                ) : null}
            </DragOverlay>
        </DndContext>
    )
}
