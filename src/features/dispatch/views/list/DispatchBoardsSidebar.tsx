// React
import { useState } from 'react'

// UI Components
import { Button } from '@/components/ui/Button'
import { ScrollArea } from '@/components/ui/ScrollArea'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/Collapsible'

// Icons
import { ChevronLeft, ChevronRight, ChevronDown } from 'lucide-react'

// Types
import type { DispatchOrderWithRelations } from '@/features/dispatch/hooks/useDispatchOrders'

// Utils
import { isPastDate } from '@/lib/utils/date.utils'
import { hasRtaConflict } from '@/features/dispatch/utils/dispatch.utils'

// Constants
import { HEADER_HEIGHT } from '@/lib/constants/layout.constants'

export type DispatchBoardFilterKey =
  | 'ALL'
  // Stage-level (for "Todas" inside each stage)
  | 'STAGE_DISPATCH_ALL'
  | 'STAGE_TENDERS_ALL'
  | 'STAGE_SCHEDULED_ALL'
  // DISPATCH stage
  | 'DISPATCH_NEW_UNASSIGNED'
  | 'DISPATCH_ASSIGNED'
  | 'DISPATCH_OVERDUE'
  | 'DISPATCH_CANCELED'
  // TENDERS stage
  | 'TENDERS_PENDING'
  | 'TENDERS_ACCEPTED'
  | 'TENDERS_REJECTED'
  | 'TENDERS_CANCELED'
  | 'ETA_RISK_CONFIRMATION'
  // SCHEDULED stage
  | 'SCHEDULED_PROGRAMMED'
  | 'SCHEDULED_DISPATCHED'
  | 'SCHEDULED_EN_ROUTE_TO_ORIGIN'
  | 'SCHEDULED_AT_ORIGIN'
  | 'SCHEDULED_LOADING'
  | 'SCHEDULED_OBSERVED'
  | 'SCHEDULED_CANCELED'
  | 'ETA_RISK_SCHEDULED'

interface BoardItem {
  key: DispatchBoardFilterKey
  label: string
  count: number
  isException?: boolean
}

interface StageGroup {
  stage: 'DISPATCH' | 'TENDERS' | 'SCHEDULED'
  label: string
  items: BoardItem[]
  totalCount: number
}

interface DispatchBoardsSidebarProps {
  orders: DispatchOrderWithRelations[]
  activeBoard: DispatchBoardFilterKey
  onBoardChange: (board: DispatchBoardFilterKey) => void
  isCollapsed: boolean
  onToggleCollapse: () => void
}

function getStageGroups(orders: DispatchOrderWithRelations[]): StageGroup[] {
  // DISPATCH stage
  const dispatchNewUnassigned = orders.filter(
    (order) => order.stage === 'DISPATCH' && (order.substatus === 'NEW' || order.substatus === 'UNASSIGNED')
  )
  const dispatchAssigned = orders.filter(
    (order) => order.stage === 'DISPATCH' && order.substatus === 'ASSIGNED'
  )
  const dispatchOverdue = dispatchNewUnassigned.filter((order) => isPastDate(order.planned_start_at))
  const dispatchCanceled = orders.filter((order) => order.stage === 'DISPATCH' && order.substatus === 'CANCELED')

  // TENDERS stage
  const tendersPending = orders.filter((order) => order.stage === 'TENDERS' && order.substatus === 'PENDING')
  const tendersAccepted = orders.filter((order) => order.stage === 'TENDERS' && order.substatus === 'ACCEPTED')
  const tendersRejected = orders.filter((order) => order.stage === 'TENDERS' && order.substatus === 'REJECTED')
  const tendersCanceled = orders.filter((order) => order.stage === 'TENDERS' && order.substatus === 'CANCELED')
  const etaRiskConfirmation = orders.filter((order) => order.stage === 'TENDERS' && hasRtaConflict(order))

  // SCHEDULED stage
  const scheduledProgrammed = orders.filter((order) => order.stage === 'SCHEDULED' && order.substatus === 'PROGRAMMED')
  const scheduledDispatched = orders.filter((order) => order.stage === 'SCHEDULED' && order.substatus === 'DISPATCHED')
  const scheduledEnRouteToOrigin = orders.filter((order) => order.stage === 'SCHEDULED' && order.substatus === 'EN_ROUTE_TO_ORIGIN')
  const scheduledAtOrigin = orders.filter((order) => order.stage === 'SCHEDULED' && order.substatus === 'AT_ORIGIN')
  const scheduledLoading = orders.filter((order) => order.stage === 'SCHEDULED' && order.substatus === 'LOADING')
  const scheduledObserved = orders.filter((order) => order.stage === 'SCHEDULED' && order.substatus === 'OBSERVED')
  const scheduledCanceled = orders.filter((order) => order.stage === 'SCHEDULED' && order.substatus === 'CANCELED')
  const etaRiskScheduled = orders.filter((order) => order.stage === 'SCHEDULED' && hasRtaConflict(order))

  return [
    {
      stage: 'DISPATCH',
      label: 'Planificadas',
      totalCount: dispatchNewUnassigned.length + dispatchAssigned.length + dispatchCanceled.length,
      items: [
        { key: 'STAGE_DISPATCH_ALL', label: 'Todas', count: dispatchNewUnassigned.length + dispatchAssigned.length + dispatchCanceled.length },
        { key: 'DISPATCH_NEW_UNASSIGNED', label: 'Sin asignar', count: dispatchNewUnassigned.length },
        { key: 'DISPATCH_ASSIGNED', label: 'Asignadas', count: dispatchAssigned.length },
        { key: 'DISPATCH_OVERDUE', label: 'Vencidas', count: dispatchOverdue.length, isException: true },
        { key: 'DISPATCH_CANCELED', label: 'Canceladas', count: dispatchCanceled.length },
      ],
    },
    {
      stage: 'TENDERS',
      label: 'Enviadas',
      totalCount: tendersPending.length + tendersAccepted.length + tendersRejected.length + tendersCanceled.length,
      items: [
        { key: 'STAGE_TENDERS_ALL', label: 'Todas', count: tendersPending.length + tendersAccepted.length + tendersRejected.length + tendersCanceled.length },
        { key: 'TENDERS_PENDING', label: 'Pendientes', count: tendersPending.length },
        { key: 'TENDERS_ACCEPTED', label: 'Aceptadas', count: tendersAccepted.length },
        { key: 'TENDERS_REJECTED', label: 'Rechazadas', count: tendersRejected.length, isException: true },
        { key: 'TENDERS_CANCELED', label: 'Canceladas', count: tendersCanceled.length },
        { key: 'ETA_RISK_CONFIRMATION', label: 'Por vencer', count: etaRiskConfirmation.length, isException: true },
      ],
    },
    {
      stage: 'SCHEDULED',
      label: 'Programadas',
      totalCount: scheduledProgrammed.length + scheduledDispatched.length + scheduledEnRouteToOrigin.length + scheduledAtOrigin.length + scheduledLoading.length + scheduledObserved.length + scheduledCanceled.length,
      items: [
        { key: 'STAGE_SCHEDULED_ALL', label: 'Todas', count: scheduledProgrammed.length + scheduledDispatched.length + scheduledEnRouteToOrigin.length + scheduledAtOrigin.length + scheduledLoading.length + scheduledObserved.length + scheduledCanceled.length },
        { key: 'SCHEDULED_PROGRAMMED', label: 'Programadas', count: scheduledProgrammed.length },
        { key: 'SCHEDULED_DISPATCHED', label: 'Despachadas', count: scheduledDispatched.length },
        { key: 'SCHEDULED_EN_ROUTE_TO_ORIGIN', label: 'En ruta a origen', count: scheduledEnRouteToOrigin.length },
        { key: 'SCHEDULED_AT_ORIGIN', label: 'En origen', count: scheduledAtOrigin.length },
        { key: 'SCHEDULED_LOADING', label: 'Cargando', count: scheduledLoading.length },
        { key: 'SCHEDULED_OBSERVED', label: 'Observadas', count: scheduledObserved.length, isException: true },
        { key: 'SCHEDULED_CANCELED', label: 'Canceladas', count: scheduledCanceled.length },
        { key: 'ETA_RISK_SCHEDULED', label: 'Riesgo ETA', count: etaRiskScheduled.length, isException: true },
      ],
    },
  ]
}

export function filterOrdersByBoard(
  orders: DispatchOrderWithRelations[],
  board: DispatchBoardFilterKey
): DispatchOrderWithRelations[] {
  switch (board) {
    case 'STAGE_DISPATCH_ALL':
      return orders.filter((order) => order.stage === 'DISPATCH')
    case 'STAGE_TENDERS_ALL':
      return orders.filter((order) => order.stage === 'TENDERS')
    case 'STAGE_SCHEDULED_ALL':
      return orders.filter((order) => order.stage === 'SCHEDULED')
    // DISPATCH
    case 'DISPATCH_NEW_UNASSIGNED':
      return orders.filter(
        (order) => order.stage === 'DISPATCH' && (order.substatus === 'NEW' || order.substatus === 'UNASSIGNED')
      )
    case 'DISPATCH_ASSIGNED':
      return orders.filter((order) => order.stage === 'DISPATCH' && order.substatus === 'ASSIGNED')
    case 'DISPATCH_OVERDUE':
      return orders.filter(
        (order) =>
          order.stage === 'DISPATCH' &&
          (order.substatus === 'NEW' || order.substatus === 'UNASSIGNED') &&
          isPastDate(order.planned_start_at)
      )
    case 'DISPATCH_CANCELED':
      return orders.filter((order) => order.stage === 'DISPATCH' && order.substatus === 'CANCELED')
    // TENDERS
    case 'TENDERS_PENDING':
      return orders.filter((order) => order.stage === 'TENDERS' && order.substatus === 'PENDING')
    case 'TENDERS_ACCEPTED':
      return orders.filter((order) => order.stage === 'TENDERS' && order.substatus === 'ACCEPTED')
    case 'TENDERS_REJECTED':
      return orders.filter((order) => order.stage === 'TENDERS' && order.substatus === 'REJECTED')
    case 'TENDERS_CANCELED':
      return orders.filter((order) => order.stage === 'TENDERS' && order.substatus === 'CANCELED')
    case 'ETA_RISK_CONFIRMATION':
      return orders.filter((order) => order.stage === 'TENDERS' && hasRtaConflict(order))
    // SCHEDULED
    case 'SCHEDULED_PROGRAMMED':
      return orders.filter((order) => order.stage === 'SCHEDULED' && order.substatus === 'PROGRAMMED')
    case 'SCHEDULED_DISPATCHED':
      return orders.filter((order) => order.stage === 'SCHEDULED' && order.substatus === 'DISPATCHED')
    case 'SCHEDULED_EN_ROUTE_TO_ORIGIN':
      return orders.filter((order) => order.stage === 'SCHEDULED' && order.substatus === 'EN_ROUTE_TO_ORIGIN')
    case 'SCHEDULED_AT_ORIGIN':
      return orders.filter((order) => order.stage === 'SCHEDULED' && order.substatus === 'AT_ORIGIN')
    case 'SCHEDULED_LOADING':
      return orders.filter((order) => order.stage === 'SCHEDULED' && order.substatus === 'LOADING')
    case 'SCHEDULED_OBSERVED':
      return orders.filter((order) => order.stage === 'SCHEDULED' && order.substatus === 'OBSERVED')
    case 'SCHEDULED_CANCELED':
      return orders.filter((order) => order.stage === 'SCHEDULED' && order.substatus === 'CANCELED')
    case 'ETA_RISK_SCHEDULED':
      return orders.filter((order) => order.stage === 'SCHEDULED' && hasRtaConflict(order))
    case 'ALL':
    default:
      return orders
  }
}

export function DispatchBoardsSidebar({
  orders,
  activeBoard,
  onBoardChange,
  isCollapsed,
  onToggleCollapse,
}: DispatchBoardsSidebarProps) {
  const stageGroups = getStageGroups(orders)

  // Track which stages are expanded (all expanded by default)
  const [expandedStages, setExpandedStages] = useState<Set<string>>(
    new Set(['DISPATCH', 'TENDERS', 'SCHEDULED'])
  )

  const toggleStage = (stage: string) => {
    setExpandedStages((prev) => {
      const next = new Set(prev)
      if (next.has(stage)) {
        next.delete(stage)
      } else {
        next.add(stage)
      }
      return next
    })
  }

  const visibleStageGroups = stageGroups
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => item.count > 0 || item.key === activeBoard),
    }))
    .filter((group) => group.items.length > 0)

  return (
    <div
      className={`h-full border-r border-gray-300 bg-white z-20 overflow-hidden transition-all duration-200 ${isCollapsed ? 'w-12' : 'w-[20%] min-w-[260px] max-w-[320px]'
        }`}
    >
      <div
        className={`border-b border-[#dde9fb] flex items-center shrink-0 ${isCollapsed ? 'justify-center px-0' : 'justify-between px-4 gap-3'
          }`}
        style={{ backgroundColor: '#eff5fd', height: `${HEADER_HEIGHT}px`, minHeight: `${HEADER_HEIGHT}px`, maxHeight: `${HEADER_HEIGHT}px` }}
      >
        {!isCollapsed && (
          <div className='flex items-center gap-2 min-w-0 flex-1'>
            <h3 className='text-sm font-medium text-gray-900 whitespace-nowrap truncate leading-none'>
              Colas de despacho
            </h3>
          </div>
        )}
        <Button
          variant='ghost'
          size='sm'
          className='h-7 w-7 p-0 shrink-0'
          onClick={onToggleCollapse}
          title={isCollapsed ? 'Expandir boards' : 'Colapsar boards'}
        >
          {isCollapsed ? <ChevronRight className='h-4 w-4' /> : <ChevronLeft className='h-4 w-4' />}
        </Button>
      </div>

      {!isCollapsed && (
        <ScrollArea className='h-[calc(100%-53px)]'>
          <div className='p-3 space-y-2'>
            {/* All shipments */}
            <button
              type='button'
              onClick={() => onBoardChange('ALL')}
              className={`w-full h-9 rounded-md px-2 text-left flex items-center justify-between transition-colors ${activeBoard === 'ALL' ? 'bg-gray-100 text-gray-900' : 'text-gray-700 hover:bg-gray-50'
                }`}
            >
              <span className='text-[13px] font-medium'>Todas las órdenes</span>
              <span className='min-w-8 text-right shrink-0 text-xs font-medium'>{orders.length}</span>
            </button>

            {/* Stage groups (Stage > Substatus) */}
            {visibleStageGroups.map((group) => {
              const isExpanded = expandedStages.has(group.stage)

              return (
                <Collapsible
                  key={group.stage}
                  open={isExpanded}
                  onOpenChange={() => toggleStage(group.stage)}
                >
                  <CollapsibleTrigger asChild>
                    <button
                      type='button'
                      className='w-full h-8 px-2 text-left flex items-center justify-between hover:bg-gray-50 transition-colors'
                    >
                      <div className='flex items-center gap-2'>
                        {isExpanded ? (
                          <ChevronDown className='h-4 w-4 text-gray-500' />
                        ) : (
                          <ChevronRight className='h-4 w-4 text-gray-500' />
                        )}
                        <span className='text-[13px] font-medium text-gray-900'>{group.label}</span>
                      </div>
                    </button>
                  </CollapsibleTrigger>

                  <CollapsibleContent>
                    <div className='mt-1 space-y-0.5 pl-8'>
                      {group.items.map((item) => {
                        const isActive = activeBoard === item.key

                        return (
                          <button
                            key={item.key}
                            type='button'
                            onClick={() => onBoardChange(item.key)}
                            className={`w-full h-8 rounded-md px-2 text-left flex items-center justify-between transition-colors ${isActive
                                ? 'bg-gray-100 text-gray-900'
                                : 'text-gray-600 hover:bg-gray-50'
                              }`}
                          >
                            <span className='text-xs font-normal'>{item.label}</span>
                            <span className='min-w-8 text-right shrink-0 text-[11px] font-mono text-gray-500'>
                              {item.count}
                            </span>
                          </button>
                        )
                      })}
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              )
            })}
          </div>
        </ScrollArea>
      )}
    </div>
  )
}
