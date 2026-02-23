import { useEffect, useCallback } from 'react'
import { useAppStore } from '../../../stores/useAppStore'
import {
  dispatchOrdersService,
  dispatchOrderItemsService,
  type DispatchOrderCarrierHistory,
} from '../../../services/database/dispatchOrders.service'
import { dispatchOrderCostsService } from '../../../services/database/dispatchOrderCosts.service'
import { getCarrierCommercialRules } from '../../../services/database/commercialRules.service'
// import { laneStopsService } from '../../../services/database/lanes.service'
import { toast } from 'sonner'
import {
  logCommercialRulesForAssignment,
  logCostCalculation,
} from '../utils/commercialRulesLogger'
import type {
  DispatchOrder,
  DispatchOrderUpdate,
} from '../../../types/dispatch.types'
import { generateDispatchNumber } from '../utils/dispatchNumber'
import type { CreateDispatchOrderFormData, CompartmentFormData, EditDispatchOrderFormData } from '../schemas/dispatchOrder.schema'

/**
 * Extended dispatch order with related data
 */
export interface DispatchOrderWithRelations extends DispatchOrder {
  // Relations
  fleet_sets?: {
    id: string
    carrier_id: number
    driver_id: number
    vehicle_id: string
    trailer_id: string
    carriers?: { id: number; commercial_name: string; contact_name?: string; contact_phone?: string } | null
    drivers?: { id: number; name: string; phone_number?: string } | null
    vehicles?: { id: string; unit_code: string; plate: string } | null
    trailers?: { id: string; code: string; plate: string } | null
  } | null
  dispatch_order_items?: {
    id: string
    product_id: number
    item_name: string
    quantity: number
    unit: string
    thermal_profile_id?: number | null
    products?: { id: number; name: string } | null
    thermal_profile?: { id: number; name: string; temp_min_c: number; temp_max_c: number } | null
  }[]
  lanes?: {
    id: string
    lane_id: string
    name: string
    distance: number | null
    lane_type_id?: number | null
    lane_types?: {
      id: number
      name: string
    } | null
    lane_stops?: {
      id: string
      lane_id: string
      stop_order: number
      stop_type: string | null
      location_id: number
      locations?: {
        id: number
        name: string
        code: string
        city: string
        address: string
      } | null
    }[]
  } | null
  dispatch_order_costs?: {
    id: string
    total_cost: number
    base_cost: number
    fuel_surcharge: number
    additional_charges: number
    status: string
  } | null
}

/**
 * Hook to manage dispatch orders data with Zustand store and intelligent caching
 * Follows the universal pattern for data hooks with shared state
 */
export function useDispatchOrders(orgId: string | null | undefined) {
  // 1. Use Zustand store (shared state and persistent)
  const dispatchOrders = useAppStore((state) => state.dispatchOrders)
  const isLoading = useAppStore((state) => state.dispatchOrdersLoading)
  const dispatchOrdersLoadedOrgId = useAppStore((state) => state.dispatchOrdersLoadedOrgId)
  const setDispatchOrders = useAppStore((state) => state.setDispatchOrders)
  const setDispatchOrdersLoading = useAppStore((state) => state.setDispatchOrdersLoading)
  const setDispatchOrdersLoadedOrgId = useAppStore((state) => state.setDispatchOrdersLoadedOrgId)
  const addDispatchOrder = useAppStore((state) => state.addDispatchOrder)
  const updateDispatchOrderInStore = useAppStore((state) => state.updateDispatchOrderInStore)
  const removeDispatchOrder = useAppStore((state) => state.removeDispatchOrder)

  // 2. Load function with intelligent caching
  const loadDispatchOrders = useCallback(
    async (force = false) => {
      if (!orgId) {
        setDispatchOrders([])
        setDispatchOrdersLoadedOrgId(null)
        return
      }

      // CACHING: Only reload if orgId changed or forced
      if (!force && dispatchOrdersLoadedOrgId === orgId && dispatchOrders.length > 0) {
        return // Already loaded for this orgId, don't reload
      }

      try {
        setDispatchOrdersLoading(true)
        const result = await dispatchOrdersService.getAll(orgId)
        // Filter orders for Dispatch module: DISPATCH, TENDERS, and SCHEDULED stages
        // Orders transfer to Control Tower only when they reach EXECUTION stage
        const dispatchModuleOrders = result.filter((order: any) =>
          order.stage === 'DISPATCH' || order.stage === 'TENDERS' || order.stage === 'SCHEDULED'
        )
        setDispatchOrders(dispatchModuleOrders as DispatchOrder[])
        setDispatchOrdersLoadedOrgId(orgId)
      } catch (error) {
        if (import.meta.env.DEV) {
          // eslint-disable-next-line no-console
          console.error('Error loading dispatch orders:', error)
        }
        toast.error('Error al cargar órdenes de despacho')
        setDispatchOrders([])
        setDispatchOrdersLoadedOrgId(null)
      } finally {
        setDispatchOrdersLoading(false)
      }
    },
    [
      orgId,
      dispatchOrdersLoadedOrgId,
      dispatchOrders.length,
      setDispatchOrders,
      setDispatchOrdersLoading,
      setDispatchOrdersLoadedOrgId,
    ]
  )

  // 3. Create a new dispatch order
  const createDispatchOrder = useCallback(
    async (
      formData: CreateDispatchOrderFormData,
      userId: string,
      orgName: string
    ): Promise<DispatchOrder[]> => {
      if (!orgId) throw new Error('Organization ID is required')

      const createdOrders: DispatchOrder[] = []
      const quantity = formData.quantity || 1

      try {
        // Create 'quantity' number of orders
        for (let i = 0; i < quantity; i++) {
          // Generate unique dispatch number
          const dispatchNumber = await generateDispatchNumber(orgId, orgName)

          // Calculate planned_end_at (for now, same day end of business)
          const plannedDate = formData.planned_date
          const plannedStartAt = new Date(plannedDate)

          // If pickup window is specified, set the start time
          if (formData.pickup_window_start) {
            const [hours, minutes] = formData.pickup_window_start.split(':').map(Number)
            plannedStartAt.setHours(hours, minutes, 0, 0)
          } else {
            // Default to 6:00 AM
            plannedStartAt.setHours(6, 0, 0, 0)
          }

          // Planned end is same day at 23:59 (can be refined with route duration)
          const plannedEndAt = new Date(plannedDate)
          plannedEndAt.setHours(23, 59, 59, 0)

          // Build the order insert object
          const orderInsert: any = {
            id: crypto.randomUUID(),
            org_id: orgId,
            dispatch_number: dispatchNumber,
            stage: 'DISPATCH',
            substatus: 'UNASSIGNED',
            lane_id: formData.lane_id, // Links to lane_stops
            planned_start_at: plannedStartAt.toISOString(),
            planned_end_at: plannedEndAt.toISOString(),
            pickup_window_start: formData.pickup_window_start,
            pickup_window_end: formData.pickup_window_end,
            notes: formData.notes || null,
            created_by: userId,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            carrier_id: null,
            driver_id: null,
            vehicle_id: null,
            trailer_id: null,
            fleet_set_id: null,
            carrier_assigned_at: null,
            updated_by: null,
          }

          // Build items from compartments (single source of truth)
          // Standard = 1 compartment, Hybrid = 2+
          const items: { product_id: number; item_name: string; quantity: number; unit: string; thermal_profile_id: number | null; created_by: string }[] = []

          if (formData.compartments) {
            formData.compartments.forEach((comp: CompartmentFormData, index: number) => {
              items.push({
                product_id: comp.product_id,
                item_name: formData.configuration === 'standard'
                  ? `Item 1`
                  : `Compartimiento ${index + 1}`,
                quantity: comp.weight_tn,
                unit: 'TN',
                thermal_profile_id: comp.thermal_profile_id || null,
                created_by: userId,
              })
            })
          }

          // Create order with items
          // Note: Stops are now derived from lane_stops via lane_id (set in orderInsert)
          const newOrder = await dispatchOrdersService.createWithDetails(
            orderInsert,
            items
          )

          if (newOrder) {
            createdOrders.push(newOrder as DispatchOrder)
            addDispatchOrder(newOrder as DispatchOrder)
          }
        }

        toast.success(
          quantity === 1
            ? 'Orden de despacho creada exitosamente'
            : `${quantity} órdenes de despacho creadas exitosamente`
        )

        return createdOrders
      } catch (error) {
        if (import.meta.env.DEV) {
          // eslint-disable-next-line no-console
          console.error('Error creating dispatch order:', error)
        }
        toast.error('Error al crear orden de despacho')
        throw error
      }
    },
    [orgId, addDispatchOrder]
  )

  // 4. Update an existing dispatch order (with items/compartments support)
  const updateDispatchOrder = useCallback(
    async (
      id: string,
      formData: EditDispatchOrderFormData,
      userId: string
    ): Promise<DispatchOrder> => {
      if (!orgId) throw new Error('Organization ID is required')

      try {
        // Calculate planned_start_at and planned_end_at from date and time window
        const plannedDate = formData.planned_date
        const plannedStartAt = new Date(plannedDate)

        // If pickup window is specified, set the start time
        if (formData.pickup_window_start) {
          const [hours, minutes] = formData.pickup_window_start.split(':').map(Number)
          plannedStartAt.setHours(hours, minutes, 0, 0)
        } else {
          // Default to 6:00 AM
          plannedStartAt.setHours(6, 0, 0, 0)
        }

        // Planned end is same day at 23:59
        const plannedEndAt = new Date(plannedDate)
        plannedEndAt.setHours(23, 59, 59, 0)

        // Build the order update object
        const orderUpdates: DispatchOrderUpdate = {
          planned_start_at: plannedStartAt.toISOString(),
          planned_end_at: plannedEndAt.toISOString(),
          pickup_window_start: formData.pickup_window_start,
          pickup_window_end: formData.pickup_window_end,
          notes: formData.notes || null,
          updated_by: userId,
        }

        // Update the main order
        const updatedOrder = await dispatchOrdersService.update(id, orgId, orderUpdates)

        // Update items from compartments (single source of truth)
        if (formData.compartments) {
          const items: { product_id: number; item_name: string; quantity: number; unit: string; thermal_profile_id: number | null; created_by: string }[] =
            formData.compartments.map((comp: CompartmentFormData, index: number) => ({
              product_id: comp.product_id,
              item_name: formData.configuration === 'standard'
                ? 'Item 1'
                : `Compartimiento ${index + 1}`,
              quantity: comp.weight_tn,
              unit: 'TN',
              thermal_profile_id: comp.thermal_profile_id || null,
              created_by: userId,
            }))
          await dispatchOrderItemsService.replaceForOrder(id, orgId, items)
        }

        // Reload the order with all details
        const fullOrder = await dispatchOrdersService.getById(id, orgId)
        if (fullOrder) {
          updateDispatchOrderInStore(id, fullOrder as DispatchOrder)
          toast.success('Orden de despacho actualizada')
          return fullOrder as DispatchOrder
        }

        return updatedOrder
      } catch (error) {
        if (import.meta.env.DEV) {
          // eslint-disable-next-line no-console
          console.error('Error updating dispatch order:', error)
        }
        toast.error('Error al actualizar orden de despacho')
        throw error
      }
    },
    [orgId, updateDispatchOrderInStore]
  )


  // 6. Delete a dispatch order
  const deleteDispatchOrder = useCallback(
    async (id: string): Promise<void> => {
      if (!orgId) throw new Error('Organization ID is required')

      try {
        await dispatchOrdersService.hardDelete(id, orgId)
        removeDispatchOrder(id)
        toast.success('Orden de despacho eliminada')
      } catch (error) {
        if (import.meta.env.DEV) {
          // eslint-disable-next-line no-console
          console.error('Error deleting dispatch order:', error)
        }
        toast.error('Error al eliminar orden de despacho')
        throw error
      }
    },
    [orgId, removeDispatchOrder]
  )

  // 7. Get a single dispatch order by ID with full details
  const getDispatchOrderById = useCallback(
    async (id: string): Promise<DispatchOrderWithRelations | null> => {
      if (!orgId) throw new Error('Organization ID is required')

      try {
        const order = await dispatchOrdersService.getById(id, orgId)
        return order as DispatchOrderWithRelations | null
      } catch (error) {
        if (import.meta.env.DEV) {
          // eslint-disable-next-line no-console
          console.error('Error fetching dispatch order:', error)
        }
        toast.error('Error al cargar detalles de la orden')
        throw error
      }
    },
    [orgId]
  )

  // 8. Update items for an order
  const updateOrderItems = useCallback(
    async (
      orderId: string,
      items: { product_id: number; item_name: string; quantity: number; unit: string; thermal_profile_id: number | null; created_by: string }[],
    ): Promise<void> => {
      if (!orgId) throw new Error('Organization ID is required')

      try {
        await dispatchOrderItemsService.replaceForOrder(orderId, orgId, items)
        // Reload the order to get updated items
        await loadDispatchOrders(true)
        toast.success('Items actualizados')
      } catch (error) {
        if (import.meta.env.DEV) {
          // eslint-disable-next-line no-console
          console.error('Error updating order items:', error)
        }
        toast.error('Error al actualizar items')
        throw error
      }
    },
    [orgId, loadDispatchOrders]
  )

  // 9. Get fleet candidates for an order
  const getFleetCandidates = useCallback(
    async (dispatchOrderId: string) => {
      try {
        return await dispatchOrdersService.getFleetCandidates(dispatchOrderId)
      } catch (error) {
        if (import.meta.env.DEV) {
          // eslint-disable-next-line no-console
          console.error('Error fetching fleet candidates:', error)
        }
        toast.error('Error al cargar candidatos de flota')
        throw error
      }
    },
    []
  )

  // 10. Assign fleet set to an order (Optimistic)
  const assignFleetSet = useCallback(
    async (dispatchOrderId: string, fleetSetId: string, userId: string): Promise<DispatchOrder> => {
      // 1. Get current state for rollback
      const currentOrders = useAppStore.getState().dispatchOrders
      const originalOrder = currentOrders.find(o => o.id === dispatchOrderId)

      // 2. Perform optimistic update
      const fleetSets = useAppStore.getState().fleetSets
      const fleetSet = fleetSets.find(fs => fs.id === fleetSetId)

      if (originalOrder) {
        updateDispatchOrderInStore(dispatchOrderId, {
          fleet_set_id: fleetSetId,
          carrier_id: fleetSet?.carrier_id,
          driver_id: fleetSet?.driver_id,
          vehicle_id: fleetSet?.vehicle_id,
          trailer_id: fleetSet?.trailer_id,
          substatus: 'ASSIGNED',
          // Mimic the relation structure expected by UI components
          fleet_sets: fleetSet ? {
            id: fleetSet.id,
            carrier_id: fleetSet.carrier_id,
            driver_id: fleetSet.driver_id,
            vehicle_id: fleetSet.vehicle_id,
            trailer_id: fleetSet.trailer_id,
            carriers: fleetSet.carriers,
            drivers: fleetSet.drivers,
            vehicles: fleetSet.vehicles,
            trailers: fleetSet.trailers
          } : null
        } as any)
      }

      try {
        const updatedOrder = await dispatchOrdersService.assignFleetSet(dispatchOrderId, fleetSetId, userId)

        if (!updatedOrder) {
          throw new Error('RPC function did not return updated order')
        }

        // Final update with actual server data to ensure consistency
        updateDispatchOrderInStore(dispatchOrderId, {
          fleet_set_id: updatedOrder.fleet_set_id,
          carrier_id: updatedOrder.carrier_id,
          driver_id: updatedOrder.driver_id,
          vehicle_id: updatedOrder.vehicle_id,
          trailer_id: updatedOrder.trailer_id,
          stage: updatedOrder.stage,
          substatus: updatedOrder.substatus,
        })

        // Background tasks (non-blocking for UI)
        if (orgId) {
          dispatchOrdersService.getById(dispatchOrderId, orgId).then(orderWithDetails => {
            if (orderWithDetails) {
              const fullOrder = orderWithDetails as DispatchOrderWithRelations
              updateDispatchOrderInStore(dispatchOrderId, fullOrder)

              // Log rules/cost in background
              const carrierId = updatedOrder.carrier_id
              const laneId = updatedOrder.lane_id

              if (carrierId) {
                getCarrierCommercialRules(orgId, carrierId).then(rules => {
                  const carrierName = fullOrder.fleet_sets?.carriers?.commercial_name
                  rules.carrierName = carrierName ?? rules.carrierName
                  logCommercialRulesForAssignment(rules, {
                    dispatchOrderId,
                    fleetSetId,
                    carrierName: carrierName ?? undefined,
                  })
                }).catch(() => { })
              }

              if (carrierId && laneId && fullOrder.dispatch_order_items) {
                const trailer = fullOrder.fleet_sets?.trailers as { transport_capacity_weight_tn?: number } | undefined
                const vehicle = fullOrder.fleet_sets?.vehicles as { transport_capacity_weight_tn?: number } | undefined
                const billableWeightTn =
                  (trailer?.transport_capacity_weight_tn ?? vehicle?.transport_capacity_weight_tn) ?? undefined

                dispatchOrderCostsService.calculateCost({
                  dispatchOrderId,
                  carrierId,
                  laneId,
                  items: fullOrder.dispatch_order_items.map((item) => ({
                    quantity: item.quantity,
                    thermal_profile_id: item.thermal_profile_id ?? null,
                  })),
                  userId,
                  billableWeightTn,
                }).then(cost => {
                  const carrierName = fullOrder.fleet_sets?.carriers?.commercial_name
                  logCostCalculation(cost, {
                    dispatchOrderId,
                    carrierId,
                    carrierName: carrierName ?? undefined,
                  })
                }).catch(() => { })
              }
            }
          }).catch(() => { })
        }

        toast.success('Unidad asignada exitosamente')
        return updatedOrder as DispatchOrder
      } catch (error) {
        // Rollback
        if (originalOrder) {
          updateDispatchOrderInStore(dispatchOrderId, originalOrder)
        }
        toast.error('Error al asignar unidad')
        throw error
      }
    },
    [updateDispatchOrderInStore, orgId]
  )

  // 11. Send dispatch order to carrier (ASSIGNED → PENDING)
  const sendToCarrier = useCallback(
    async (dispatchOrderId: string, userId: string): Promise<DispatchOrder> => {
      try {
        const updatedOrder = await dispatchOrdersService.sendToCarrier(dispatchOrderId, userId)

        if (!updatedOrder) {
          throw new Error('RPC function did not return updated order')
        }

        // Update local state
        updateDispatchOrderInStore(dispatchOrderId, {
          stage: updatedOrder.stage,
          substatus: updatedOrder.substatus,
          carrier_assigned_at: updatedOrder.carrier_assigned_at,
          response_deadline: updatedOrder.response_deadline,
        })

        toast.success('Orden enviada al transportista')
        return updatedOrder
      } catch (error) {
        if (import.meta.env.DEV) {
          // eslint-disable-next-line no-console
          console.error('Error sending to carrier:', error)
        }
        toast.error('Error al enviar orden al transportista')
        throw error
      }
    },
    [updateDispatchOrderInStore]
  )

  // 12. Carrier accepts dispatch order (PENDING → SCHEDULED)
  const carrierAccept = useCallback(
    async (dispatchOrderId: string, userId: string): Promise<DispatchOrder> => {
      try {
        const updatedOrder = await dispatchOrdersService.carrierAccept(dispatchOrderId, userId)

        if (!updatedOrder) {
          throw new Error('RPC function did not return updated order')
        }

        // Update local state
        updateDispatchOrderInStore(dispatchOrderId, {
          stage: updatedOrder.stage,
          substatus: updatedOrder.substatus,
        })

        toast.success('Orden aceptada')
        return updatedOrder
      } catch (error) {
        if (import.meta.env.DEV) {
          // eslint-disable-next-line no-console
          console.error('Error accepting order:', error)
        }
        toast.error('Error al aceptar orden')
        throw error
      }
    },
    [updateDispatchOrderInStore]
  )

  // 13. Carrier rejects dispatch order (→ REJECTED)
  const carrierReject = useCallback(
    async (dispatchOrderId: string, userId: string, reason: string): Promise<DispatchOrder> => {
      try {
        const updatedOrder = await dispatchOrdersService.carrierReject(dispatchOrderId, userId, reason)

        if (!updatedOrder) {
          throw new Error('RPC function did not return updated order')
        }

        // Update local state
        updateDispatchOrderInStore(dispatchOrderId, {
          stage: updatedOrder.stage,
          substatus: updatedOrder.substatus,
        })

        toast.success('Orden rechazada')
        return updatedOrder
      } catch (error) {
        if (import.meta.env.DEV) {
          // eslint-disable-next-line no-console
          console.error('Error rejecting order:', error)
        }
        toast.error('Error al rechazar orden')
        throw error
      }
    },
    [updateDispatchOrderInStore]
  )

  // 14. Revert dispatch order (PENDING → ASSIGNED)
  // Needed for "Bring back to assigned" functionality (correction)
  const revertToAssigned = useCallback(
    async (dispatchOrderId: string): Promise<DispatchOrder | null> => {
      if (!orgId) throw new Error('Organization ID is required')

      try {
        // We only need to update the substatus and clear carrier_assigned_at
        // Using standard update method is sufficient for this simple state change
        const updates: DispatchOrderUpdate = {
          substatus: 'ASSIGNED',
          carrier_assigned_at: null
        }

        const updatedOrder = await dispatchOrdersService.update(dispatchOrderId, orgId, updates)

        // Update local state
        updateDispatchOrderInStore(dispatchOrderId, {
          substatus: 'ASSIGNED',
          carrier_assigned_at: null
        })

        toast.success('Orden retornada a estado Asignada')
        return updatedOrder
      } catch (error) {
        if (import.meta.env.DEV) {
          // eslint-disable-next-line no-console
          console.error('Error reverting order:', error)
        }
        toast.error('Error al revertir estado de orden')
        throw error
      }
    },
    [updateDispatchOrderInStore, orgId]
  )

  // 14. Get carrier history for a dispatch order
  const getCarrierHistory = useCallback(
    async (dispatchOrderId: string): Promise<DispatchOrderCarrierHistory[]> => {
      try {
        return await dispatchOrdersService.getCarrierHistory(dispatchOrderId)
      } catch (error) {
        if (import.meta.env.DEV) {
          // eslint-disable-next-line no-console
          console.error('Error getting carrier history:', error)
        }
        toast.error('Error al obtener historial de transportista')
        throw error
      }
    },
    []
  )

  // 15. Unassign fleet from a dispatch order (Optimistic)
  const unassignFleetSet = useCallback(
    async (dispatchOrderId: string, userId: string): Promise<DispatchOrder> => {
      if (!orgId) throw new Error('Organization ID is required')

      // 1. Get current state for rollback
      const currentOrders = useAppStore.getState().dispatchOrders
      const originalOrder = currentOrders.find(o => o.id === dispatchOrderId)

      // 2. Perform optimistic update
      if (originalOrder) {
        updateDispatchOrderInStore(dispatchOrderId, {
          fleet_set_id: null,
          carrier_id: null,
          driver_id: null,
          vehicle_id: null,
          trailer_id: null,
          substatus: 'UNASSIGNED',
        })
      }

      try {
        const updatedOrder = await dispatchOrdersService.unassignFleetSet(
          dispatchOrderId,
          orgId,
          userId
        )

        // Final sync - just update the core fields, relations will be null
        updateDispatchOrderInStore(dispatchOrderId, updatedOrder)

        toast.success('Unidad desasignada exitosamente')
        return updatedOrder
      } catch (error) {
        // Rollback
        if (originalOrder) {
          updateDispatchOrderInStore(dispatchOrderId, originalOrder)
        }
        if (import.meta.env.DEV) {
          // eslint-disable-next-line no-console
          console.error('Error unassigning fleet set:', error)
        }
        toast.error('Error al desasignar unidad')
        throw error
      }
    },
    [orgId, updateDispatchOrderInStore]
  )

  // 16. Auto-assign fleet to a dispatch order
  const autoAssignFleet = useCallback(
    async (dispatchOrderId: string, userId: string): Promise<DispatchOrder | null> => {
      if (!orgId) throw new Error('Organization ID is required')

      try {
        const result = await dispatchOrdersService.autoAssignFleet(dispatchOrderId, userId)

        if (!result.success) {
          throw new Error(result.message || 'Auto-assignment failed')
        }

        if (result.dispatch_order) {
          // Update local state with the assigned order
          updateDispatchOrderInStore(dispatchOrderId, result.dispatch_order)
          return result.dispatch_order
        }

        return null
      } catch (error) {
        if (import.meta.env.DEV) {
          // eslint-disable-next-line no-console
          console.error('Error auto-assigning fleet:', error)
        }
        throw error
      }
    },
    [orgId, updateDispatchOrderInStore]
  )

  // 16. Batch auto-assign fleet to multiple dispatch orders
  const batchAutoAssignFleet = useCallback(
    async (
      dispatchOrderIds: string[],
      userId: string
    ): Promise<{
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
    }> => {
      if (!orgId) throw new Error('Organization ID is required')

      try {
        const result = await dispatchOrdersService.batchAutoAssignFleet(dispatchOrderIds, userId)

        // Update local state for successful assignments
        if (result.results.successful) {
          result.results.successful.forEach((item) => {
            if (item.dispatch_order) {
              updateDispatchOrderInStore(item.dispatch_order_id, item.dispatch_order)
            }
          })
        }

        return result
      } catch (error) {
        if (import.meta.env.DEV) {
          // eslint-disable-next-line no-console
          console.error('Error batch auto-assigning fleet:', error)
        }
        throw error
      }
    },
    [orgId, updateDispatchOrderInStore]
  )

  // 17. Organization cancels dispatch order
  const orgCancelDispatchOrder = useCallback(
    async (
      dispatchOrderId: string,
      userId: string,
      reason: string,
      cancellationReasonId: string
    ): Promise<DispatchOrder> => {
      try {
        const updatedOrder = await dispatchOrdersService.orgCancelDispatchOrder(
          dispatchOrderId,
          userId,
          reason,
          cancellationReasonId
        )

        // Update local state
        updateDispatchOrderInStore(dispatchOrderId, {
          stage: updatedOrder.stage,
          substatus: updatedOrder.substatus,
        })

        toast.success('Orden cancelada por la organización')
        return updatedOrder
      } catch (error) {
        if (import.meta.env.DEV) {
          // eslint-disable-next-line no-console
          console.error('Error canceling order:', error)
        }
        toast.error('Error al cancelar la orden')
        throw error
      }
    },
    [updateDispatchOrderInStore]
  )

  // 18. Batch send dispatch orders to carrier
  const batchSendToCarrier = useCallback(
    async (
      userId: string,
      orderIds?: string[]
    ): Promise<{
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
    }> => {
      // Get all orders that are currently ASSIGNED (ready to send)
      let assignedOrders = (dispatchOrders as DispatchOrderWithRelations[]).filter(
        (o) => o.substatus === 'ASSIGNED' && (o.dispatch_order_items?.length || 0) !== 0
      )

      // Filter by IDs if provided
      if (orderIds && orderIds.length > 0) {
        assignedOrders = assignedOrders.filter((o) => orderIds.includes(o.id))
      }

      if (assignedOrders.length === 0) {
        toast.info('No hay órdenes asignadas para enviar')
        return {
          success: 0,
          failed: 0,
          results: { successful: [], failed: [] }
        }
      }

      // Check if any order is missing carrier/vehicle
      // Note: Stricter validation is handled in the UI before calling this
      const invalidOrders = assignedOrders.filter(
        (o) => !o.fleet_set_id && !o.carrier_id
      )

      if (invalidOrders.length > 0) {
        toast.error(`Hay ${invalidOrders.length} órdenes sin transportista asignado correctamente.`)
        // We could return these as failures instead of throwing
        const preValidationFailures = invalidOrders.map((o) => ({
          dispatch_order_id: o.id,
          dispatch_number: o.dispatch_number || null,
          success: false,
          message: 'Falta asignar transportista o unidad',
        }))

        // Remove invalid from processing list
        assignedOrders = assignedOrders.filter(o => !!o.fleet_set_id || !!o.carrier_id)

        if (assignedOrders.length === 0) {
          return {
            success: 0,
            failed: invalidOrders.length,
            results: { successful: [], failed: preValidationFailures }
          }
        }
        // Proceed with valid ones, but include failures in result? 
        // For now, keeping the throw behavior to be safe if desired, OR return mixed. 
        // User asked to "gather ALL orders with errors". So better to return them.
      }

      const successful: Array<{
        dispatch_order_id: string
        dispatch_number: string | null
        success: boolean
        message: string
      }> = []
      const failed: Array<{
        dispatch_order_id: string
        dispatch_number: string | null
        success: boolean
        message: string
      }> = []

      // Add pre-validation failures if any (from the check above if we didn't throw)
      // For now I removed the throw above logic to support mixed results
      invalidOrders.forEach(o => {
        failed.push({
          dispatch_order_id: o.id,
          dispatch_number: o.dispatch_number || null,
          success: false,
          message: 'Falta asignar transportista o unidad',
        })
      })

      // Execute assignments in parallel for valid ones
      const promises = assignedOrders.map(async (order) => {
        try {
          await sendToCarrier(order.id, userId)
          successful.push({
            dispatch_order_id: order.id,
            dispatch_number: order.dispatch_number || null,
            success: true,
            message: 'Enviado a transportista'
          })
        } catch (error) {
          console.error(`Failed to send order ${order.dispatch_number || order.id}`, error)
          failed.push({
            dispatch_order_id: order.id,
            dispatch_number: order.dispatch_number || null,
            success: false,
            message: (error as Error).message || 'Error al enviar'
          })
        }
      })

      await Promise.all(promises)

      const successCount = successful.length
      const failedCount = failed.length

      if (failedCount > 0) {
        toast.warning(`Se enviaron ${successCount} órdenes. Fallaron ${failedCount}.`)
      } else {
        toast.success(`Se enviaron ${successCount} órdenes exitosamente.`)
      }

      return { success: successCount, failed: failedCount, results: { successful, failed } }
    },
    [dispatchOrders, sendToCarrier]
  )

  // Auto-load on mount or when orgId changes
  useEffect(() => {
    if (orgId && (dispatchOrdersLoadedOrgId !== orgId || dispatchOrders.length === 0)) {
      loadDispatchOrders()
    } else if (!orgId) {
      setDispatchOrders([])
      setDispatchOrdersLoadedOrgId(null)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orgId, dispatchOrdersLoadedOrgId, dispatchOrders.length])

  return {
    dispatchOrders: dispatchOrders as DispatchOrderWithRelations[],
    isLoading,
    loadDispatchOrders,
    createDispatchOrder,
    updateDispatchOrder,
    deleteDispatchOrder,
    getDispatchOrderById,
    updateOrderItems,
    getFleetCandidates,
    assignFleetSet,
    sendToCarrier,
    carrierAccept,
    carrierReject,
    revertToAssigned,
    getCarrierHistory,
    unassignFleetSet,
    autoAssignFleet,
    batchAutoAssignFleet,
    orgCancelDispatchOrder,
    batchSendToCarrier,
  }
}
