import { useState, useEffect } from 'react'
import type { DispatchOrderWithRelations } from './useDispatchOrders'
import type { FleetSetUnit } from '../types'
import { canAssignOrderToFleet } from '../utils/validation'

interface UseDispatchValidationProps {
    dispatchOrders: DispatchOrderWithRelations[]
    fleetSetUnits: FleetSetUnit[]
}

export function useDispatchValidation({
    dispatchOrders,
    fleetSetUnits,
}: UseDispatchValidationProps) {
    const [assignmentErrors, setAssignmentErrors] = useState<Map<string, string[]>>(new Map())

    useEffect(() => {
        if (!dispatchOrders.length || !fleetSetUnits.length) return

        const newErrors = new Map<string, string[]>()

        dispatchOrders.forEach((order) => {
            if (
                !order.fleet_set_id ||
                ['UNASSIGNED', 'REJECTED', 'CANCELED'].includes(order.substatus || '')
            )
                return

            const fleetUnit = fleetSetUnits.find(
                (u) => u.fleetSetId === order.fleet_set_id
            )
            if (!fleetUnit) return

            const validation = canAssignOrderToFleet(order, fleetUnit)
            const allErrors = [...validation.errors]

            if (order.substatus === 'ASSIGNED' && order.planned_start_at) {
                const orderDate = new Date(order.planned_start_at)
                const now = new Date()
                if (orderDate < now) {
                    allErrors.push(
                        'La fecha programada ha expirado. Actualice la fecha antes de enviar.'
                    )
                }
            }

            if (allErrors.length > 0) {
                newErrors.set(order.id, allErrors)
            }
        })

        setAssignmentErrors((prev) => {
            if (prev.size === 0 && newErrors.size === 0) return prev
            return newErrors
        })
    }, [dispatchOrders, fleetSetUnits])

    return {
        assignmentErrors,
        setAssignmentErrors,
    }
}
