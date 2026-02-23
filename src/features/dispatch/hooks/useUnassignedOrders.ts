import { useMemo } from 'react'
import type { DispatchOrderWithRelations } from './useDispatchOrders'
import { DAY_NAMES, MONTH_NAMES } from '../constants'

export function useUnassignedOrders(dispatchOrders: DispatchOrderWithRelations[]) {
    const unassignedOrders = useMemo(() => {
        if (!dispatchOrders || dispatchOrders.length === 0) {
            return []
        }

        // Separate unassigned and rejected orders
        const unassigned = dispatchOrders.filter(
            (order) => order.substatus === 'UNASSIGNED'
        )
        const rejected = dispatchOrders.filter(
            (order) => order.substatus === 'REJECTED'
        )

        // Group orders by date
        const groupedByDate: {
            [key: string]: DispatchOrderWithRelations[]
        } = {}

        const today = new Date()
        today.setHours(0, 0, 0, 0)
        const tomorrow = new Date(today)
        tomorrow.setDate(tomorrow.getDate() + 1)

        // Process unassigned orders by date
        unassigned.forEach((order) => {
            if (!order.planned_start_at) return
            const orderDate = new Date(order.planned_start_at)

            // Normalize dates to midnight for comparison
            const dateOnly = new Date(orderDate)
            dateOnly.setHours(0, 0, 0, 0)

            let dayLabel = ''
            if (dateOnly.getTime() < today.getTime()) {
                // Overdue orders (past dates)
                dayLabel = 'Vencidas'
            } else if (dateOnly.getTime() === today.getTime()) {
                dayLabel = 'Hoy'
            } else if (dateOnly.getTime() === tomorrow.getTime()) {
                dayLabel = 'Mañana'
            } else {
                dayLabel = `${DAY_NAMES[orderDate.getDay()]} ${orderDate.getDate()} ${MONTH_NAMES[orderDate.getMonth()]}`
            }

            if (!groupedByDate[dayLabel]) {
                groupedByDate[dayLabel] = []
            }
            groupedByDate[dayLabel].push(order)
        })

        // Add rejected orders as separate group (all rejected regardless of date)
        if (rejected.length > 0) {
            groupedByDate['Rechazadas'] = rejected
        }

        // Convert to UI format and SORT
        return Object.entries(groupedByDate)
            .map(([day, orders]) => ({
                day,
                count: orders.length,
                orders: orders.map((order) => ({
                    ...order,
                    configuration:
                        (order.dispatch_order_items?.length || 0) > 1
                            ? 'Hybrid'
                            : 'Standard',
                    isHybrid: (order.dispatch_order_items?.length || 0) > 1,
                    lane:
                        order.lanes?.lane_stops && order.lanes.lane_stops.length > 0
                            ? order.lanes.lane_stops
                                .map(
                                    (stop) => stop.locations?.name || stop.locations?.code || ''
                                )
                                .filter(Boolean)
                                .join(' → ') || order.lanes?.name || 'No lane'
                            : order.lanes?.name || 'No lane',
                    pickupTime: order.pickup_window_start || '',
                    temperature: '', // TODO: Get from thermal profiles
                    weight:
                        order.dispatch_order_items && order.dispatch_order_items.length > 0
                            ? order.dispatch_order_items
                                .reduce((sum, item) => sum + (item.quantity || 0), 0)
                            : 0,
                    product: order.dispatch_order_items?.[0]?.product_id?.toString() || '',
                    profile: '', // TODO: Get from product thermal profiles
                    scheduledDate: order.planned_start_at
                        ? new Date(order.planned_start_at).toISOString().split('T')[0]
                        : '',
                    scheduledTime: order.pickup_window_start || '',
                    timeWindow: order.pickup_window_start
                        ? order.pickup_window_start === order.pickup_window_end
                            ? 'specific-time'
                            : 'range-time'
                        : 'no-preference',
                    compartments:
                        (order.dispatch_order_items?.length || 0) > 1
                            ? order.dispatch_order_items?.map((item, idx) => ({
                                id: `comp-${idx + 1}`,
                                product: item.product_id.toString(),
                                profile: '', // TODO: Get from product thermal profiles
                                weight: item.quantity.toString(),
                            }))
                            : undefined,
                    cost: order.dispatch_order_costs?.total_cost || null,
                })),
            }))
            .sort((a, b) => {
                // Priority order per business rules (docs/business/dispatch.md):
                // 1. Vencidas (overdue - critical alert)
                // 2. Rechazadas (rejected - review queue)
                // 3. Hoy (today - current operations)
                // 4. Mañana (tomorrow - immediate planning)
                // 5. Future dates (chronological planning)
                const orderPriority: Record<string, number> = {
                    'Vencidas': 0,
                    'Rechazadas': 1,
                    'Hoy': 2,
                    'Mañana': 3
                }

                if (orderPriority[a.day] !== undefined && orderPriority[b.day] !== undefined) {
                    return orderPriority[a.day] - orderPriority[b.day]
                }
                if (orderPriority[a.day] !== undefined) return -1
                if (orderPriority[b.day] !== undefined) return 1

                // For other dates, sort by their actual date
                const dateA = new Date(a.orders[0].planned_start_at!).getTime()
                const dateB = new Date(b.orders[0].planned_start_at!).getTime()
                return dateA - dateB
            })
    }, [dispatchOrders])

    const totalUnassigned = useMemo(() =>
        unassignedOrders.reduce((acc, group) => acc + group.count, 0),
        [unassignedOrders]
    )

    const allOrderIds = useMemo(() =>
        unassignedOrders.flatMap((group) => group.orders.map((order) => order.id)),
        [unassignedOrders]
    )

    return {
        unassignedOrders,
        totalUnassigned,
        allOrderIds
    }
}
