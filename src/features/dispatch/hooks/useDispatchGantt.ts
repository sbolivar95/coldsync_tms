import { useMemo } from 'react'
import type { DispatchOrderWithRelations } from './useDispatchOrders'
import type { AssignedTripGantt, FleetSetUnit } from '../types'
import { calculateRTADuration, shouldShowRTA } from '../utils/rtaCalculator'
import { matchDispatchOrderToLane, type LaneWithStops } from '@/features/dispatch/utils/laneMatcher'
import { DAY_NAMES, MONTH_NAMES, MONTH_NAMES_LOWER, NUM_DAYS } from '../constants'

interface UseDispatchGanttProps {
    dispatchOrders: DispatchOrderWithRelations[]
    fleetSetUnits: FleetSetUnit[]
    startDate: Date
    lanesWithStops: LaneWithStops[]
    assignmentErrors: Map<string, string[]>
}

export function useDispatchGantt({
    dispatchOrders,
    fleetSetUnits,
    startDate,
    lanesWithStops,
    assignmentErrors
}: UseDispatchGanttProps) {
    const days = useMemo(() => {
        const daysArr: { dayName: string; dayNumber: number; month: string; fullDate: Date; unassignedCount: number }[] = []
        for (let i = 0; i < NUM_DAYS; i++) {
            const date = new Date(startDate)
            date.setDate(startDate.getDate() + i)

            // Calculate unassigned orders for this specific date
            const count = dispatchOrders.filter(o => {
                if (o.substatus !== 'UNASSIGNED' && o.substatus !== 'REJECTED') return false
                if (!o.planned_start_at) return false
                const orderDate = new Date(o.planned_start_at)
                return orderDate.toDateString() === date.toDateString()
            }).length

            daysArr.push({
                dayName: DAY_NAMES[date.getDay()],
                dayNumber: date.getDate(),
                month: MONTH_NAMES[date.getMonth()],
                fullDate: date,
                unassignedCount: count
            })
        }
        return daysArr
    }, [startDate, dispatchOrders])

    const calendarRangeLabel = useMemo(() => {
        const first = new Date(startDate)
        first.setHours(0, 0, 0, 0)
        const last = new Date(startDate)
        last.setDate(last.getDate() + NUM_DAYS - 1)
        last.setHours(0, 0, 0, 0)
        const sameYear = first.getFullYear() === last.getFullYear()
        const sameMonth = first.getMonth() === last.getMonth()
        if (sameMonth && sameYear) {
            return `${first.getDate()} – ${last.getDate()} ${MONTH_NAMES_LOWER[first.getMonth()]} ${first.getFullYear()}`
        }
        if (sameYear) {
            return `${first.getDate()} ${MONTH_NAMES_LOWER[first.getMonth()]} – ${last.getDate()} ${MONTH_NAMES_LOWER[last.getMonth()]} ${first.getFullYear()}`
        }
        return `${first.getDate()} ${MONTH_NAMES_LOWER[first.getMonth()]} ${first.getFullYear()} – ${last.getDate()} ${MONTH_NAMES_LOWER[last.getMonth()]} ${last.getFullYear()}`
    }, [startDate])

    const assignedTrips = useMemo((): AssignedTripGantt[] => {
        if (
            !dispatchOrders ||
            dispatchOrders.length === 0 ||
            !fleetSetUnits.length
        ) {
            return []
        }

        // OPTIMIZATION: Create fleet set lookup map for O(1) access
        const fleetSetMap = new Map(
            fleetSetUnits.map(unit => [unit.fleetSetId, unit])
        )

        // Get orders that are assigned to a fleet set
        const assignedOrders = dispatchOrders.filter(
            (order) =>
                order.fleet_set_id &&
                (order.substatus === 'ASSIGNED' ||
                    order.substatus === 'PENDING' ||
                    order.substatus === 'ACCEPTED' ||
                    order.substatus === 'PROGRAMMED' ||
                    order.substatus === 'DISPATCHED' ||
                    order.substatus === 'AT_DESTINATION' ||
                    order.substatus === 'OBSERVED')
        )

        return assignedOrders
            .map((order) => {
                // OPTIMIZATION: Use map lookup instead of find (O(1) vs O(n))
                const fleetSetUnit = fleetSetMap.get(order.fleet_set_id!)

                if (!fleetSetUnit) {
                    return null // Skip if fleet set unit not found
                }

                // Calculate day offset based on planned_start_at relative to startDate
                if (!order.planned_start_at) return null
                const orderDate = new Date(order.planned_start_at)
                const startDateOnly = new Date(startDate)
                startDateOnly.setHours(0, 0, 0, 0)
                const orderDateOnly = new Date(orderDate)
                orderDateOnly.setHours(0, 0, 0, 0)

                const dayOffset = Math.floor(
                    (orderDateOnly.getTime() - startDateOnly.getTime()) /
                    (1000 * 60 * 60 * 24)
                )

                // Skip if order is outside the visible range
                if (dayOffset < 0 || dayOffset >= NUM_DAYS) {
                    return null
                }

                // Get lane string from lane stops
                const lane =
                    order.lanes?.lane_stops && order.lanes.lane_stops.length > 0
                        ? order.lanes.lane_stops
                            .map(
                                (stop) => stop.locations?.name || stop.locations?.code || ''
                            )
                            .filter(Boolean)
                            .join(' → ') || order.lanes?.name || 'Sin ruta'
                        : order.lanes?.name || 'Sin ruta'

                // Determine configuration and color
                const isHybrid = (order.dispatch_order_items?.length || 0) > 1
                let configuration = 'Standard'
                if (isHybrid && order.dispatch_order_items) {
                    configuration = order.dispatch_order_items
                        .map((item) => item.products?.name || 'Product')
                        .join('/')
                } else if (order.dispatch_order_items?.[0]) {
                    configuration =
                        order.dispatch_order_items[0].products?.name || 'Standard'
                }

                const getColorByConfig = (config: string) => {
                    const colors: Record<string, string> = {
                        Congelado: '#dc2626',
                        Refrigerado: '#22c55e',
                        Seco: '#ec4899',
                    }
                    // Try to match any color keyword in the config string
                    for (const [key, color] of Object.entries(colors)) {
                        if (config.toLowerCase().includes(key.toLowerCase())) {
                            return color
                        }
                    }
                    return '#3b82f6'
                }

                // Calculate duration (in days) from planned_start_at to planned_end_at
                if (!order.planned_end_at) return null
                const startDateObj = new Date(order.planned_start_at)
                const endDateObj = new Date(order.planned_end_at)
                const durationMs = endDateObj.getTime() - startDateObj.getTime()
                const duration = Math.max(
                    1,
                    Math.ceil(durationMs / (1000 * 60 * 60 * 24))
                )

                // OPTIMIZATION: Lazy load RTA calculation - only if lanes are loaded
                // This avoids blocking initial render waiting for lanes
                let rtaDuration = 0
                let hasRTA = false

                if (lanesWithStops.length > 0) {
                    const matchedLane = matchDispatchOrderToLane(order, lanesWithStops)
                    rtaDuration = calculateRTADuration({
                        lane: matchedLane || null,
                        tripDurationDays: duration,
                    })
                    hasRTA = shouldShowRTA(rtaDuration)
                }

                // Map status

                return {
                    vehicleId: fleetSetUnit.id,
                    fleetSetId: order.fleet_set_id!,
                    dayOffset: dayOffset,
                    orderId: order.id,
                    client: order.dispatch_number || 'Client',
                    lane: lane,
                    configuration: configuration,
                    isHybrid: isHybrid,
                    color: getColorByConfig(configuration),
                    duration: duration,
                    hasRTA: hasRTA,
                    rtaDuration: rtaDuration,
                    status: (order.substatus || 'UNASSIGNED').toLowerCase(),
                    product:
                        order.dispatch_order_items?.[0]?.product_id?.toString() || '',
                    profile: '',
                    weight:
                        order.dispatch_order_items
                            ?.reduce((sum, item) => sum + Number(item.quantity), 0)
                            .toString() || '0',
                    compartments:
                        isHybrid && order.dispatch_order_items
                            ? order.dispatch_order_items.map((item, idx) => ({
                                id: `comp-${idx + 1}`,
                                product: item.product_id.toString(),
                                profile: '',
                                weight: item.quantity.toString(),
                            }))
                            : undefined,
                    scheduledDate: order.planned_start_at
                        ? new Date(order.planned_start_at).toISOString().split('T')[0]
                        : '',
                    scheduledTime: order.pickup_window_start || '',
                    timeWindow: order.pickup_window_start
                        ? order.pickup_window_start === order.pickup_window_end
                            ? 'specific-time'
                            : 'range-time'
                        : 'no-preference',
                    assignmentError: assignmentErrors.get(order.id),
                }
            })
            .filter((trip): trip is NonNullable<typeof trip> => trip !== null)
    }, [dispatchOrders, fleetSetUnits, startDate, lanesWithStops, assignmentErrors])

    const getTripsForVehicle = (vehicleId: string) => {
        return assignedTrips.filter((trip) => {
            const tripStatus = trip.status || ''
            const isUnassigned =
                tripStatus === 'sin-asignar' ||
                tripStatus === 'unassigned' ||
                tripStatus === 'UNASSIGNED'
            return trip.vehicleId === vehicleId && !isUnassigned
        })
    }

    return {
        days,
        calendarRangeLabel,
        assignedTrips,
        getTripsForVehicle
    }
}
