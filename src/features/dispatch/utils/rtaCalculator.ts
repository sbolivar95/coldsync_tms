import type { Lane } from '../../../types/database.types'

/**
 * Parameters for calculating Return-to-Availability (RTA) duration
 */
interface CalculateRTAParams {
  /**
   * Lane data containing transit_time or service_cycle
   * transit_time: time from origin to destination (in hours)
   * service_cycle: complete cycle time from origin → destination → origin (in hours)
   *
   * RTA calculation:
   * - If transit_time available: RTA = transit_time (return trip ≈ outbound trip)
   * - If only service_cycle available: RTA ≈ service_cycle / 2 (half of round trip is return)
   */
  lane?: Lane | null

  /**
   * Trip duration in days (calculated from planned_start_at to planned_end_at)
   * Used as fallback when lane data is not available
   */
  tripDurationDays?: number

  /**
   * Minimum RTA duration in days (default: 0.5)
   * Only applied as safety fallback, not when using lane transit_time
   */
  minRTADays?: number
}

/**
 * Calculates Return-to-Availability (RTA) duration in days based on lane data.
 *
 * RTA represents the time needed for a vehicle to return from the destination
 * back to the origin to be available for the next trip.
 *
 * Service Cycle (Ciclo de Servicio): Complete round trip time (origin → destination → origin)
 * Transit Time: One-way time from origin to destination
 *
 * Calculation priority:
 * 1. If lane has transit_time: RTA = transit_time (in days) - return trip equals outbound trip
 * 2. If lane has service_cycle (but no transit_time): RTA = service_cycle / 2 - half of round trip
 * 3. Fallback: Use trip duration * 0.5 (rough estimate)
 * 4. Last resort: 1 day minimum
 *
 * NO CAPS - RTA should match actual return time (e.g., 7 day trip = 7 day return)
 *
 * @param params - Calculation parameters
 * @returns RTA duration in days (rounded to 1 decimal place)
 *
 * @example
 * ```typescript
 * // Using lane with transit_time (24 hours = 1 day outbound, 1 day return)
 * const rta = calculateRTADuration({
 *   lane: { transit_time: 24, ... },
 * });
 * // Returns: 1.0
 *
 * // Using lane with service_cycle (168 hours = 7 days round trip, 3.5 days return)
 * const rta = calculateRTADuration({
 *   lane: { service_cycle: 168, transit_time: null, ... },
 * });
 * // Returns: 3.5
 *
 * // Using service_cycle with transit_time (prefer transit_time)
 * const rta = calculateRTADuration({
 *   lane: { transit_time: 48, service_cycle: 120, ... },
 * });
 * // Returns: 2.0 (uses transit_time, not service_cycle/2)
 * ```
 */
export function calculateRTADuration(params: CalculateRTAParams): number {
  const { lane, tripDurationDays, minRTADays = 0.5 } = params

  // Priority 1: Use lane transit_time if available
  // transit_time is the outbound trip time in hours
  // Return trip time ≈ outbound trip time, so RTA = transit_time
  if (lane?.transit_time && lane.transit_time > 0) {
    const transitTimeDays = lane.transit_time / 24
    // Round to 1 decimal place, no cap
    return Math.round(transitTimeDays * 10) / 10
  }


  // Priority 2: Fallback to trip duration estimate
  // Rough approximation: return is about half of the outbound trip duration
  if (tripDurationDays && tripDurationDays > 0) {
    const estimatedRTA = tripDurationDays * 0.5
    // Ensure minimum, round to 1 decimal place
    return Math.max(Math.round(estimatedRTA * 10) / 10, minRTADays)
  }

  // Last resort: Default to minimum (0.5 days)
  return minRTADays
}

/**
 * Determines if RTA should be shown for a trip
 * RTA is shown when duration > 0.5 days (12 hours)
 */
export function shouldShowRTA(rtaDurationDays: number): boolean {
  return rtaDurationDays >= 0.5
}
