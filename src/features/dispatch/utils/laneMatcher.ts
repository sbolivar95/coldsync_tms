import type { DispatchOrderWithRelations } from '../hooks/useDispatchOrders'
import type { Lane } from '../../../types/database.types'
import type { LaneStop } from '../../../types/database.types'

/**
 * Extended lane type with stops
 */
export interface LaneWithStops extends Lane {
    lane_stops?: Array<LaneStop & { locations?: { id: number } }>
}

/**
 * Gets the lane for a dispatch order.
 * 
 * Since dispatch orders now have lane_id, we can directly get the lane.
 * This function is kept for backward compatibility and to handle cases where
 * lane_id might be null (legacy orders).
 * 
 * @param dispatchOrder - The dispatch order (should have lane_id or lanes relation)
 * @param lanes - Array of lanes with their stops (optional, for fallback matching)
 * @returns The matched lane, or null if no match found
 * 
 * @example
 * ```typescript
 * const matchedLane = matchDispatchOrderToLane(order, lanes)
 * if (matchedLane) {
 *   // Use matchedLane.transit_time for RTA calculation
 * }
 * ```
 */
export function matchDispatchOrderToLane(
    dispatchOrder: DispatchOrderWithRelations,
    lanes?: LaneWithStops[]
): LaneWithStops | null {
    // First, try to get lane directly from lane_id
    if (dispatchOrder.lane_id && dispatchOrder.lanes) {
        return dispatchOrder.lanes as LaneWithStops
    }

    // Fallback: if lane_id is not set (legacy orders), try to match by stops
    // This should only happen for old orders created before the migration
    if (!dispatchOrder.lane_id && lanes) {
        const laneStops = dispatchOrder.lanes?.lane_stops || []

        if (laneStops.length === 0) {
            return null
        }

        // Get location IDs from lane stops, sorted by stop_order
        const orderLocationIds = laneStops
            .sort((a, b) => a.stop_order - b.stop_order)
            .map(stop => stop.location_id)

        // Try to match with each lane
        for (const lane of lanes) {
            const laneStops = lane.lane_stops || []

            if (laneStops.length === 0) {
                continue
            }

            // Get location IDs from lane stops, sorted by stop_order
            const laneLocationIds = laneStops
                .sort((a, b) => a.stop_order - b.stop_order)
                .map(stop => stop.location_id)

            // Check if the sequences match exactly
            if (arraysEqual(orderLocationIds, laneLocationIds)) {
                return lane
            }
        }
    }

    return null
}

/**
 * Helper function to compare two arrays for equality
 */
function arraysEqual<T>(a: T[], b: T[]): boolean {
    if (a.length !== b.length) {
        return false
    }
    return a.every((val, index) => val === b[index])
}
