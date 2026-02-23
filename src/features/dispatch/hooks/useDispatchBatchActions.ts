import { useState } from 'react'
import { toast } from 'sonner'
import type { DispatchOrderWithRelations } from '@/features/dispatch/hooks/useDispatchOrders'
import type { FleetSetUnit } from '@/features/dispatch/types'
import { canAssignOrderToFleet } from '@/features/dispatch/utils/validation'
import type { DispatchOrder } from '@/types/dispatch.types'

interface UseDispatchBatchActionsProps {
    user: { id: string } | null | undefined
    dispatchOrders: DispatchOrderWithRelations[]
    fleetSetUnits: FleetSetUnit[]
    loadDispatchOrders: (force?: boolean) => Promise<void>
    loadFleetSets: (force?: boolean) => Promise<void>
    batchAutoAssignFleet: (orderIds: string[], userId: string) => Promise<{
        success: boolean
        message: string
        total: number
        success_count: number
        fail_count: number
        results: {
            successful: Array<{
                dispatch_order_id: string
                dispatch_number: string
                success: boolean
                message: string
                fleet_set_id?: string
                dispatch_order?: DispatchOrder
            }>
            failed: Array<{
                dispatch_order_id: string
                dispatch_number: string | null
                success: boolean
                message: string
            }>
        }
    }>
    batchSendToCarrier: (userId: string, orderIds?: string[]) => Promise<{
        success: number
        failed: number
        results: {
            successful: Array<{
                dispatch_order_id: string
                dispatch_number: string | null
                success: boolean
                message: string
            }>
            failed: Array<{
                dispatch_order_id: string
                dispatch_number: string | null
                success: boolean
                message: string
            }>
        }
    }>
    orgCancelDispatchOrder: (dispatchOrderId: string, userId: string, reason: string, cancellationReasonId: string) => Promise<DispatchOrder>
    setAssignmentErrors: React.Dispatch<React.SetStateAction<Map<string, string[]>>>
    reloadAllocations: () => Promise<void>
}

export function useDispatchBatchActions({
    user,
    dispatchOrders,
    fleetSetUnits,
    loadDispatchOrders,
    loadFleetSets,
    batchAutoAssignFleet,
    batchSendToCarrier,
    orgCancelDispatchOrder,
    setAssignmentErrors,
    reloadAllocations,
}: UseDispatchBatchActionsProps) {
    const [selectedOrders, setSelectedOrders] = useState<Set<string>>(new Set())
    const [isSendingDispatch, setIsSendingDispatch] = useState(false)
    const [showResultsDialog, setShowResultsDialog] = useState(false)
    const [batchResults, setBatchResults] = useState<{
        total: number
        successCount: number
        failCount: number
        successful: Array<{ dispatch_order_id: string; dispatch_number: string | null; success: boolean; message: string }>
        failed: Array<{ dispatch_order_id: string; dispatch_number: string | null; success: boolean; message: string }>
    } | null>(null)

    const handleSelectOrder = (orderId: string, checked: boolean) => {
        const newSelected = new Set(selectedOrders)
        if (checked) {
            newSelected.add(orderId)
        } else {
            newSelected.delete(orderId)
        }
        setSelectedOrders(newSelected)
    }

    const handleCancelSelectedOrders = async () => {
        if (!user?.id || selectedOrders.size === 0) return
        const orderIds = Array.from(selectedOrders)
        let successCount = 0
        let failCount = 0

        try {
            // Get the first available cancellation reason as a default for bulk cancellation
            // In a more complete implementation, we might want to show a dialog first
            const { cancellationReasonsService } = await import('@/services/database/cancellationReasons.service')
            const reasons = await cancellationReasonsService.getActiveReasons(dispatchOrders[0]?.org_id || '')
            const defaultReasonId = reasons.find(r => r.code === 'OTHER')?.id || reasons[0]?.id

            if (!defaultReasonId) {
                toast.error('No se encontraron motivos de cancelación configurados')
                return
            }

            for (const orderId of orderIds) {
                try {
                    await orgCancelDispatchOrder(orderId, user.id, 'Cancelado por el usuario (lote)', defaultReasonId)
                    successCount++
                } catch (error) {
                    console.error(`Error canceling order ${orderId}:`, error)
                    failCount++
                }
            }
        } catch (error) {
            console.error('Error fetching reasons for batch cancel:', error)
            toast.error('Error al preparar la cancelación en lote')
            return
        }

        setSelectedOrders(new Set())
        await loadDispatchOrders(true)
        if (successCount > 0 && failCount === 0) {
            toast.success(`${successCount} ${successCount === 1 ? 'orden cancelada' : 'órdenes canceladas'} exitosamente`)
        } else if (successCount > 0 && failCount > 0) {
            toast.warning(`${successCount} ${successCount === 1 ? 'orden cancelada' : 'órdenes canceladas'}, ${failCount} ${failCount === 1 ? 'falló' : 'fallaron'}`)
        } else if (failCount > 0) {
            toast.error(`Error al cancelar ${failCount === 1 ? 'la orden' : 'las órdenes'}`)
        }
    }

    const handleSchedule = async (orderIdsInput?: string[]) => {
        if (!user?.id) return
        const workingOrderIds = orderIdsInput && orderIdsInput.length > 0
            ? orderIdsInput
            : Array.from(selectedOrders)
        if (workingOrderIds.length === 0) return

        // VALIDATION: Filter orders with past dates
        // Use local date for "today" comparison
        const today = new Date()
        const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`

        const validOrderIds: string[] = []
        const invalidOrders: Array<{ id: string; number: string; reason: string }> = []

        workingOrderIds.forEach(orderId => {
            const order = dispatchOrders.find(o => o.id === orderId)
            if (!order) return

            // planned_start_at is the correct DB field
            const plannedDateStr = order.planned_start_at?.split('T')[0]

            if (plannedDateStr && plannedDateStr < todayStr) {
                // Convert to local readable format
                const [y, m, d] = plannedDateStr.split('-').map(Number)
                const displayDate = new Date(y, m - 1, d).toLocaleDateString('es-MX')

                invalidOrders.push({
                    id: order.id,
                    number: order.dispatch_number || 'N/A',
                    reason: `Fecha prevista expirada: ${displayDate}`
                })
                return
            }

            validOrderIds.push(orderId)
        })

        // If there are invalid orders, show error
        if (invalidOrders.length > 0) {
            const errorMessages = invalidOrders.map(o => `${o.number}: ${o.reason}`).join('\n')
            toast.error(
                `No se pueden planificar ${invalidOrders.length} ${invalidOrders.length === 1 ? 'orden' : 'órdenes'} con fechas pasadas`,
                {
                    description: invalidOrders.length <= 3 ? errorMessages : `${invalidOrders.length} órdenes con fechas expiradas`,
                    duration: 5000
                }
            )

            // Update assignment errors
            setAssignmentErrors(prevErrors => {
                const newErrors = new Map(prevErrors)
                invalidOrders.forEach(o => {
                    newErrors.set(o.id, [o.reason])
                })
                return newErrors
            })
        }

        // Exit if no valid orders
        if (validOrderIds.length === 0) {
            return
        }

        // Proceed with auto-assignment for valid orders only
        try {
            const result = await batchAutoAssignFleet(validOrderIds, user.id)
            setBatchResults({
                total: result.total,
                successCount: result.success_count,
                failCount: result.fail_count,
                successful: result.results.successful,
                failed: result.results.failed,
            })
            setAssignmentErrors((_prevValue) => {
                const newErrors = new Map<string, string[]>()
                result.results.failed.forEach((failure) => {
                    newErrors.set(failure.dispatch_order_id, [failure.message])
                })
                return newErrors
            })
            if (result.success_count > 0) {
                await loadDispatchOrders(true)
                await loadFleetSets()
            }
            if (!orderIdsInput || orderIdsInput.length === 0) {
                setSelectedOrders(new Set())
            }
            if (result.success_count > 0 && result.fail_count === 0) {
                toast.success(`✓ ${result.success_count} ${result.success_count === 1 ? 'orden asignada' : 'órdenes asignadas'} exitosamente`)
            } else {
                setShowResultsDialog(true)
            }
        } catch (error) {
            toast.error(`Error al enviar órdenes: ${(error as Error).message}`)
        }
    }

    const handleBatchSend = async () => {
        if (!user?.id) return
        const candidates = dispatchOrders.filter(
            (o) => o.substatus === 'ASSIGNED' && (o.dispatch_order_items?.length || 0) !== 0
        )
        if (candidates.length === 0) {
            toast.info('No hay órdenes asignadas listas para enviar')
            return
        }
        setIsSendingDispatch(true)
        const validIds: string[] = []
        const validationFailures: Array<{ dispatch_order_id: string; dispatch_number: string | null; success: boolean; message: string }> = []
        candidates.forEach((order) => {
            const fleetSetUnit = fleetSetUnits.find((u) => u.fleetSetId === order.fleet_set_id)
            if (!fleetSetUnit) {
                validationFailures.push({
                    dispatch_order_id: order.id,
                    dispatch_number: order.dispatch_number || null,
                    success: false,
                    message: 'No se encontró la unidad asignada para validación'
                })
                return
            }
            const validation = canAssignOrderToFleet(order, fleetSetUnit)
            if (!validation.isValid) {
                validationFailures.push({
                    dispatch_order_id: order.id,
                    dispatch_number: order.dispatch_number || null,
                    success: false,
                    message: validation.errors.join('. ')
                })
            } else {
                validIds.push(order.id)
            }
        })
        if (validIds.length === 0) {
            setIsSendingDispatch(false)
            toast.error(`${validationFailures.length} ${validationFailures.length === 1 ? 'orden falló' : 'órdenes fallaron'} la validación`)
            return
        }
        try {
            const result = await batchSendToCarrier(user.id, validIds)
            const allFailures = [...validationFailures, ...result.results.failed]
            const allSuccesses = result.results.successful
            if (allSuccesses.length > 0 && allFailures.length === 0) {
                toast.success(`${allSuccesses.length} ${allSuccesses.length === 1 ? 'orden enviada' : 'órdenes enviadas'} exitosamente`)
            } else if (allSuccesses.length > 0 && allFailures.length > 0) {
                toast.warning(`${allSuccesses.length} ${allSuccesses.length === 1 ? 'orden enviada' : 'órdenes enviadas'}, ${allFailures.length} ${allFailures.length === 1 ? 'falló' : 'fallaron'}`)
            } else if (allFailures.length > 0) {
                toast.error(`${allFailures.length} ${allFailures.length === 1 ? 'orden falló' : 'órdenes fallaron'}`)
            }
            if (result.success > 0) {
                await loadDispatchOrders(true)
                await loadFleetSets()
                await reloadAllocations()
            }
        } catch (error) {
            toast.error('Error al enviar órdenes')
        } finally {
            setIsSendingDispatch(false)
        }
    }

    return {
        selectedOrders,
        setSelectedOrders,
        handleSelectOrder,
        handleCancelSelectedOrders,
        handleSchedule,
        handleBatchSend,
        isSendingDispatch,
        showResultsDialog,
        setShowResultsDialog,
        batchResults,
    }
}
