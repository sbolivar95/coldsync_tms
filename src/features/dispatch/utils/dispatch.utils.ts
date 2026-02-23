import type { DispatchOrderWithRelations } from '../hooks/useDispatchOrders'

/**
 * Checks if a dispatch order has an RTA (Real Time Arrival) conflict
 * @param order - Dispatch order to check
 * @returns true if there's an RTA conflict, false otherwise
 */
export function hasRtaConflict(order: DispatchOrderWithRelations): boolean {
  const value = String((order as any).rta_status || '').toLowerCase()
  if (!value) return false
  return ['conflict', 'conflicto', 'error', 'violation', 'blocked', 'falla', 'fail'].some((token) =>
    value.includes(token)
  )
}
