import { Eye, MoreVertical, Send, Sparkles, XCircle } from 'lucide-react'
import { DataTable } from '@/components/widgets/DataTable/DataTable'
import type { DataTableAction, DataTableBulkAction, DataTableColumn } from '@/components/widgets/DataTable/types'
import type { DispatchOrderWithRelations } from '@/features/dispatch/hooks/useDispatchOrders'
import { toast } from 'sonner'
import { DispatchOrderStatusCell } from '@/features/dispatch/views/list/DispatchOrderStatusCell'
import { formatDateAndTime, getEquipmentType, isOrderHybrid } from '@/features/orders/utils/orders-helpers'
import type { CarrierOrder } from '@/services/database/orders.service'
import { Button } from '@/components/ui/Button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/DropdownMenu'
import { isCancelable } from '@/types/dispatchOrderStateMachine'

interface DispatchOrdersTableProps {
  orders: DispatchOrderWithRelations[]
  onOrderClick: (order: DispatchOrderWithRelations) => void
  onPlanifySelection: (orderIds?: string[]) => void | Promise<void>
  onQuickSend?: (orderIds: string[]) => void
  onQuickCancel?: (orderIds: string[]) => void
  onSendOrder?: (order: DispatchOrderWithRelations) => void | Promise<void>
  onCancelOrder?: (order: DispatchOrderWithRelations) => void
}

const canPlanify = (order: DispatchOrderWithRelations): boolean =>
  order.stage === 'DISPATCH' && (order.substatus === 'NEW' || order.substatus === 'UNASSIGNED')

const canSend = (order: DispatchOrderWithRelations): boolean =>
  order.stage === 'DISPATCH' && order.substatus === 'ASSIGNED'

const canCancel = (order: DispatchOrderWithRelations): boolean =>
  order.substatus !== 'CANCELED' && isCancelable(order.stage)

// Helper para convertir a CarrierOrder solo para funciones legacy (equipment, cargo)
const toCarrierOrderLike = (order: DispatchOrderWithRelations): CarrierOrder => {
  const mappedItems = (order.dispatch_order_items || []).map((item) => ({
    quantity: item.quantity,
    item_name: item.item_name,
    product: item.products ? { name: item.products.name } : undefined,
    thermal_profile: item.thermal_profile ? { name: item.thermal_profile.name } : undefined,
  }))

  const laneStops = order.lanes?.lane_stops || []
  const sortedStops = [...laneStops].sort((a, b) => a.stop_order - b.stop_order)
  const mappedLaneStops = sortedStops.map((stop) => ({
    stop_order: stop.stop_order,
    location: {
      name: stop.locations?.name || '-',
    },
  }))

  return {
    id: order.id,
    status: order.substatus || '',
    planned_start_at: order.planned_start_at,
    carrier_assigned_at: order.carrier_assigned_at,
    updated_at: order.updated_at,
    response_deadline: order.response_deadline || null,
    items: mappedItems as CarrierOrder['items'],
    lane: {
      lane_stops: mappedLaneStops as any,
      distance: order.lanes?.distance || null,
    } as CarrierOrder['lane'],
    fleet_set: {
      vehicle: {
        unit_code: order.fleet_sets?.vehicles?.unit_code || '',
      },
      trailer: {
        plate: order.fleet_sets?.trailers?.plate || order.fleet_sets?.trailers?.code || '',
      },
      driver: {
        name: order.fleet_sets?.drivers?.name || '',
      },
    } as CarrierOrder['fleet_set'],
  } as CarrierOrder
}

export function DispatchOrdersTable({
  orders,
  onOrderClick,
  onPlanifySelection,
  onQuickSend,
  onQuickCancel,
  onSendOrder,
  onCancelOrder,
}: DispatchOrdersTableProps) {
  const sortedOrders = [...orders].sort((a, b) => {
    const aDate = a.planned_start_at ? new Date(a.planned_start_at).getTime() : 0
    const bDate = b.planned_start_at ? new Date(b.planned_start_at).getTime() : 0
    return aDate - bDate
  })

  const columns: DataTableColumn<DispatchOrderWithRelations>[] = [
    {
      key: 'lane',
      header: 'Pasillo Logístico (Secuencia)',
      width: '300px',
      render: (order) => {
        if (!order.lanes) {
          return (
            <div className="flex flex-col gap-0.5 py-2">
              <span className="text-sm font-semibold text-gray-500 leading-none">-</span>
            </div>
          )
        }

        const laneStops = order.lanes.lane_stops || []
        const sortedStops = [...laneStops].sort((a, b) => a.stop_order - b.stop_order)
        const stops = sortedStops.map(s => ({ name: s.locations?.name || '-' }))
        const distance = order.lanes.distance ? `${order.lanes.distance} km` : '-'

        // Si hay más de 3 stops, mostrar versión condensada
        if (stops.length > 3) {
          const first = stops[0]
          const last = stops[stops.length - 1]
          const middleCount = stops.length - 2

          return (
            <div className="flex flex-col gap-0.5 py-2">
              {/* Row 1: Origin -> Dest (Condensed) */}
              <div className="flex items-center gap-1 flex-wrap">
                <span className="text-sm font-semibold text-gray-900 leading-none">{first.name}</span>
                <span className="text-gray-500 text-sm leading-none">→</span>
                <span className="text-xs text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded-full font-medium">
                  +{middleCount} ubicaciones
                </span>
                <span className="text-gray-500 text-sm leading-none">→</span>
                <span className="text-sm font-semibold text-gray-900 leading-none">{last.name}</span>
              </div>
              {/* Row 2: Date + Distance */}
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="text-xs text-gray-500 font-medium">
                  {formatDateAndTime(order.planned_start_at)}
                </span>
                <span className="text-xs text-primary font-bold">{distance}</span>
              </div>
            </div>
          )
        }

        // Vista normal para 2-3 stops
        return (
          <div className="flex flex-col gap-0.5 py-2">
            {/* Row 1: Origin -> Destination */}
            <div className="flex items-center gap-1 flex-wrap">
              {stops.map((stop, idx) => (
                <div key={idx} className="flex items-center gap-1">
                  <span className="text-sm font-semibold text-gray-900 leading-none">
                    {stop.name}
                  </span>
                  {idx < stops.length - 1 && (
                    <span className="text-gray-500 text-sm leading-none">→</span>
                  )}
                </div>
              ))}
            </div>
            {/* Row 2: Date + Distance */}
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="text-xs text-gray-500 font-medium">
                {formatDateAndTime(order.planned_start_at)}
              </span>
              <span className="text-xs text-primary font-bold">{distance}</span>
            </div>
          </div>
        )
      },
    },
    {
      key: 'equipment',
      header: 'Equipo',
      width: '130px',
      render: (order) => {
        const orderLike = toCarrierOrderLike(order)
        const isHybrid = isOrderHybrid(orderLike)
        const thermalProfile = getEquipmentType(orderLike)

        return (
          <div className="flex flex-col gap-0.5 py-2">
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-gray-700">
                {isHybrid ? 'Híbrido' : 'Estándar'}
              </span>
              {isHybrid && (
                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold bg-blue-50 text-blue-700">
                  HYB
                </span>
              )}
            </div>
            <span className="text-xs text-gray-500">{thermalProfile}</span>
          </div>
        )
      },
    },
    {
      key: 'cargo',
      header: 'Carga',
      width: '120px',
      render: (order) => {
        // Calculate total weight from items
        let totalWeight = '0'

        if (order.dispatch_order_items && order.dispatch_order_items.length > 0) {
          const totalQ = order.dispatch_order_items.reduce((acc, curr) => acc + (curr.quantity || 0), 0)
          totalWeight = totalQ > 0 ? totalQ.toString() : '0'
        }

        let productName = '-'
        if (order.dispatch_order_items && order.dispatch_order_items.length > 0) {
          productName = order.dispatch_order_items.map(i => i.products?.name || i.item_name).join(', ')
        }

        return (
          <div className="flex flex-col gap-0.5 py-2">
            <span className="text-xs font-semibold text-gray-900">
              {totalWeight === '-' ? '-' : `${totalWeight} Tn`}
            </span>
            <span className="text-xs text-gray-500">
              {productName}
            </span>
          </div>
        )
      },
    },
    {
      key: 'vehicle',
      header: 'Vehículo',
      width: '180px',
      render: (order) => {
        const unit = order.fleet_sets?.vehicles?.unit_code || ''
        const trailer = order.fleet_sets?.trailers?.plate || ''
        const driver = order.fleet_sets?.drivers?.name || ''

        if (!unit && !trailer && !driver) {
          return (
            <span className="text-xs text-gray-500 py-2 block">
              Sin asignar
            </span>
          )
        }

        // Construir línea secundaria (remolque + conductor)
        const secondaryParts = []
        if (trailer) secondaryParts.push(trailer)
        if (driver) secondaryParts.push(driver)
        const secondaryText = secondaryParts.join(' · ')

        return (
          <div className="flex flex-col gap-0.5 py-2">
            <span className="text-xs font-semibold text-gray-900">
              {unit}
            </span>
            {secondaryText && (
              <span className="text-xs text-gray-500">
                {secondaryText}
              </span>
            )}
          </div>
        )
      },
    },
    {
      key: 'carrier',
      header: 'Transportista',
      width: '160px',
      render: (order) => {
        const carrierName = order.fleet_sets?.carriers?.commercial_name || ''

        if (!carrierName) {
          return (
            <span className="text-xs text-gray-500 py-2 block">
              Sin asignar
            </span>
          )
        }

        return (
          <div className="flex flex-col gap-0.5 py-2">
            <span className="text-xs font-semibold text-gray-900">
              {carrierName}
            </span>
          </div>
        )
      },
    },
    {
      key: 'status',
      header: 'Estado',
      width: '140px',
      render: (order) => {
        // Validación de seguridad
        if (!order) {
          return (
            <div className="flex flex-col gap-0.5 py-2">
              <span className="text-xs text-gray-500">-</span>
            </div>
          )
        }

        const tenderCreatedAt = order.carrier_assigned_at || order.created_at
        const decisionTimestamp = order.updated_at || undefined

        return (
          <DispatchOrderStatusCell
            order={order}
            tenderCreatedAt={tenderCreatedAt}
            decisionTimestamp={decisionTimestamp}
          />
        )
      },
    },
  ]

  const actions: DataTableAction<DispatchOrderWithRelations>[] = [
    {
      icon: <Eye className='w-3.5 h-3.5 text-gray-600' />,
      onClick: (order) => onOrderClick(order),
      title: 'Ver detalles',
    },
    {
      icon: (order) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant='ghost'
              size='sm'
              className='h-8 w-8 p-0 hover:bg-gray-100'
            >
              <MoreVertical className='h-4 w-4 text-gray-600' />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align='end' className='w-56'>
            {canPlanify(order) && (
              <DropdownMenuItem
                onClick={() => onPlanifySelection([order.id])}
                className='cursor-pointer'
              >
                <Sparkles className='mr-2 h-4 w-4 text-primary' />
                Planificar
              </DropdownMenuItem>
            )}
            {canSend(order) && onSendOrder && (
              <DropdownMenuItem
                onClick={() => onSendOrder(order)}
                className='cursor-pointer'
              >
                <Send className='mr-2 h-4 w-4 text-gray-700' />
                Enviar
              </DropdownMenuItem>
            )}
            {canCancel(order) && onCancelOrder && (
              <DropdownMenuItem
                onClick={() => onCancelOrder(order)}
                className='cursor-pointer group hover:bg-red-50'
              >
                <XCircle className='mr-2 h-4 w-4 text-red-600 group-hover:text-red-700' />
                <span className='text-red-700 group-hover:text-red-800 font-medium'>
                  Cancelar orden
                </span>
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      ),
      onClick: () => {},
      title: 'Más acciones',
      hidden: (order) =>
        !canPlanify(order) &&
        !(canSend(order) && !!onSendOrder) &&
        !(canCancel(order) && !!onCancelOrder),
    },
  ]

  const bulkActions: DataTableBulkAction[] = [
    {
      label: 'Planificar',
      icon: <Sparkles className='w-4 h-4' />,
      onClick: (selectedIds) => {
        const eligible = selectedIds.filter((id) => {
          const order = sortedOrders.find((item) => item.id === id)
          return Boolean(order && canPlanify(order))
        })
        if (eligible.length === 0) {
          toast.info('Selecciona órdenes en DISPATCH/NEW o DISPATCH/UNASSIGNED para planificar')
          return
        }
        onPlanifySelection(eligible)
      },
      variant: 'default',
      // Only show if at least one selected order is eligible for planning
      isVisible: (selectedIds) => {
        return selectedIds.some((id) => {
          const order = sortedOrders.find((item) => item.id === id)
          return Boolean(order && canPlanify(order))
        })
      },
    },
    {
      label: 'Enviar',
      icon: <Send className='w-4 h-4' />,
      onClick: (selectedIds) => {
        const eligible = selectedIds.filter((id) => {
          const order = sortedOrders.find((item) => item.id === id)
          return Boolean(order && canSend(order))
        })
        if (eligible.length === 0) {
          toast.info('Selecciona órdenes en DISPATCH/ASSIGNED para enviar')
          return
        }
        onQuickSend?.(eligible)
      },
      variant: 'default',
      isVisible: (selectedIds) => {
        return Boolean(onQuickSend) && selectedIds.some((id) => {
          const order = sortedOrders.find((item) => item.id === id)
          return Boolean(order && canSend(order))
        })
      },
    },
    {
      label: 'Cancelar',
      icon: <XCircle className='w-4 h-4' />,
      onClick: (selectedIds) => {
        const eligible = selectedIds.filter((id) => {
          const order = sortedOrders.find((item) => item.id === id)
          return Boolean(order && canCancel(order))
        })
        if (eligible.length === 0) {
          toast.info('No hay órdenes seleccionadas que se puedan cancelar')
          return
        }
        onQuickCancel?.(eligible)
      },
      variant: 'destructive',
      isVisible: (selectedIds) => {
        return Boolean(onQuickCancel) && selectedIds.some((id) => {
          const order = sortedOrders.find((item) => item.id === id)
          return Boolean(order && canCancel(order))
        })
      },
    },
  ]

  return (
    <DataTable
      data={sortedOrders}
      columns={columns}
      getRowId={(item) => item.id}
      onRowClick={onOrderClick}
      actions={actions}
      bulkActions={bulkActions}
      itemsPerPage={25}
      emptyMessage='No hay órdenes para mostrar'
      headerHeight='dispatch'
    />
  )
}
