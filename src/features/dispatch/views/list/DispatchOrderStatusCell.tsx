import { useState, useEffect } from 'react'
import type { DispatchOrderWithRelations } from '../../hooks/useDispatchOrders'
import { getDispatchOrderStatusDisplay } from '../../utils/dispatch-status-helpers'

interface DispatchOrderStatusCellProps {
  order: DispatchOrderWithRelations
  tenderCreatedAt?: string
  decisionTimestamp?: string
}

export function DispatchOrderStatusCell({
  order,
  tenderCreatedAt,
  decisionTimestamp,
}: DispatchOrderStatusCellProps) {
  const [displayState, setDisplayState] = useState(() =>
    getDispatchOrderStatusDisplay(order, tenderCreatedAt, decisionTimestamp)
  )

  useEffect(() => {
    // Solo actualizar en vivo para estados PENDING
    if (order.substatus !== 'PENDING') {
      return
    }

    const updateState = () => {
      const newState = getDispatchOrderStatusDisplay(order, tenderCreatedAt, decisionTimestamp)
      setDisplayState(newState)
    }

    updateState() // Actualización inmediata
    const timer = setInterval(updateState, 60000) // Actualizar cada minuto

    return () => clearInterval(timer)
  }, [order, tenderCreatedAt, decisionTimestamp])

  return (
    <div className="flex flex-col gap-0.5 py-1">
      {/* Row 1: Dot + Label */}
      <div className="flex items-center gap-1.5">
        <div
          className="w-2 h-2 rounded-full shrink-0 transition-colors duration-500"
          style={{ backgroundColor: displayState.dotColor }}
        />
        <span className="text-xs font-semibold text-gray-900">{displayState.label}</span>
      </div>

      {/* Row 2: Timer (Gray) */}
      {displayState.timeInfo && (
        <span className="text-xs text-gray-500 ml-3.5">{displayState.timeInfo}</span>
      )}

      {/* Row 3: Badge (If Critical) */}
      {displayState.urgency === 'critical' && (
        <div className="ml-3.5 mt-0.5">
          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-red-100 text-red-700 uppercase tracking-wide">
            CRÍTICA
          </span>
        </div>
      )}
    </div>
  )
}
