import {
  useState,
  forwardRef,
  useImperativeHandle,
  useEffect,
} from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAppStore } from '@/stores/useAppStore'
import { DispatchDrawer } from '@/features/dispatch/components/drawer'
import { useDispatchOrders } from '@/features/dispatch/hooks/useDispatchOrders'
import { useFleetSetsWithOrders } from '@/features/dispatch/hooks/useFleetSetsWithOrders'
import { useUnassignedOrders } from '@/features/dispatch/hooks/useUnassignedOrders'
import { useDispatchGantt } from '@/features/dispatch/hooks/useDispatchGantt'
import { useDispatchNavigation } from '@/features/dispatch/hooks/useDispatchNavigation'
import { useDispatchValidation } from '@/features/dispatch/hooks/useDispatchValidation'
import { useDispatchBatchActions } from '@/features/dispatch/hooks/useDispatchBatchActions'
import { useDispatchBoardState } from '@/features/dispatch/hooks/useDispatchBoardState'
import { useCarrierAllocations } from '@/features/dispatch/hooks/useCarrierAllocations'
import { lanesService } from '@/services/database/lanes.service'
import { BatchAssignmentResultsDialog } from '@/components/widgets/BatchAssignmentResultsDialog'
import { DispatchBoard } from '@/features/dispatch/DispatchBoard'
import type { ViewDensityMode } from '@/features/dispatch/components/DispatchViewControls'
import type { LaneWithStops } from '@/features/dispatch/utils/laneMatcher'
import { DispatchSendDialog } from '@/features/dispatch/components/dialogs/DispatchSendDialog'
import { DispatchCancelDialog } from '@/features/dispatch/components/dialogs/DispatchCancelDialog'
import { cancellationReasonsService, type CancellationReason } from '@/services/database/cancellationReasons.service'

export interface DispatchRef {
  // Interface kept for backward compatibility but no longer used
  // Navigation to /dispatch/new is now handled by React Router
}

export const DispatchListPage = forwardRef<DispatchRef, {}>((_, ref) => {
  const organization = useAppStore((state) => state.organization)
  const user = useAppStore((state) => state.user)
  const orgId = organization?.id
  const navigate = useNavigate()
  const location = useLocation()

  // Determine display mode from URL
  const displayMode: 'list' | 'gantt' = location.pathname.includes('/dispatch/list') ? 'list' : 'gantt'

  // Persist user preference in Zustand store
  const setDispatchViewPreference = useAppStore((state) => state.setDispatchViewPreference)

  useEffect(() => {
    // Save preference when display mode changes
    setDispatchViewPreference(displayMode)
  }, [displayMode, setDispatchViewPreference])

  // 1. Data Hooks
  const {
    dispatchOrders,
    loadDispatchOrders,
    deleteDispatchOrder,
    assignFleetSet,
    unassignFleetSet,
    batchAutoAssignFleet,
    batchSendToCarrier,
    orgCancelDispatchOrder,
    sendToCarrier,
  } = useDispatchOrders(orgId)

  const {
    units: fleetSetUnits,
    groupedUnits,
    isLoading: isLoadingFleetSets,
    loadFleetSets,
  } = useFleetSetsWithOrders(orgId)

  const { getAllocationStatus, reloadAllocations } = useCarrierAllocations(orgId)

  const [lanesWithStops, setLanesWithStops] = useState<LaneWithStops[]>([])
  const [isLoadingLanes] = useState(false)
  const [viewMode, setViewMode] = useState<ViewDensityMode>('normal')
  const [drawerInitialView, setDrawerInitialView] = useState<'details' | 'cancel'>('details')
  const [sendDialogOpen, setSendDialogOpen] = useState(false)
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false)
  const [orderIdsToSend, setOrderIdsToSend] = useState<string[]>([])
  const [orderIdsToCancel, setOrderIdsToCancel] = useState<string[]>([])
  const [cancellationReasons, setCancellationReasons] = useState<CancellationReason[]>([])

  // Handle display mode change via navigation
  const handleDisplayModeChange = (mode: 'list' | 'gantt') => {
    navigate(`/dispatch/${mode}`)
  }

  // 2. Logic Hooks
  const {
    startDate,
    setStartDate,
    handlePreviousDay,
    handleNextDay,
  } = useDispatchNavigation()

  const {
    assignmentErrors,
    setAssignmentErrors,
  } = useDispatchValidation({ dispatchOrders, fleetSetUnits })

  const batchActions = useDispatchBatchActions({
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
  })

  const {
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
  } = batchActions

  const {
    drawerOpen,
    setDrawerOpen,
    selectedOrder,
    setSelectedOrder,
    searchTerm,
    configurationFilter,
    setConfigurationFilter,
    handleSearch,
  } = useDispatchBoardState({
    dispatchOrders,
    loadDispatchOrders,
    loadFleetSets,
    deleteDispatchOrder,
  })

  // 3. UI Hooks & Data
  const {
    unassignedOrders: unassignedGroups,
    totalUnassigned,
    allOrderIds,
  } = useUnassignedOrders(dispatchOrders)

  const {
    days,
    calendarRangeLabel,
    getTripsForVehicle,
  } = useDispatchGantt({
    dispatchOrders,
    fleetSetUnits,
    startDate,
    lanesWithStops,
    assignmentErrors,
  })

  // 4. Initial Load
  useEffect(() => {
    if (orgId) {
      const loadData = async () => {
        try {
          const [, loadedLanes, loadedReasons] = await Promise.all([
            loadDispatchOrders(),
            lanesService.getAllWithStops(orgId).catch((error) => {
              if (import.meta.env.DEV) console.error('Error loading lanes:', error)
              return []
            }),
            cancellationReasonsService.getActiveReasons(orgId).catch((error) => {
              if (import.meta.env.DEV) console.error('Error loading cancellation reasons:', error)
              return []
            })
          ])
          setLanesWithStops((loadedLanes as LaneWithStops[]) || [])
          setCancellationReasons(loadedReasons)
        } catch (error) {
          if (import.meta.env.DEV) console.error('Error in parallel data load:', error)
        }
      }
      loadData()
    }
  }, [orgId, loadDispatchOrders])

  // 5. Calendar Window Auto-adjustment
  // NOTA: Comentado temporalmente - estaba interfiriendo con la selección manual de fechas
  // Este efecto automáticamente ajustaba la ventana de calendario para mostrar órdenes asignadas
  // pero impedía al usuario navegar libremente a otras fechas
  /*
  useEffect(() => {
    if (!dispatchOrders?.length) return
    const assigned = dispatchOrders.filter(
      (o) =>
        o.fleet_set_id &&
        ['ASSIGNED', 'PENDING', 'ACCEPTED', 'SCHEDULED'].includes(o.substatus)
    )
    if (assigned.length === 0) return
    const startDateOnly = new Date(startDate)
    startDateOnly.setHours(0, 0, 0, 0)
    let earliest = new Date(assigned[0].planned_start_at!)
    earliest.setHours(0, 0, 0, 0)
    assigned.forEach(order => {
      const d = new Date(order.planned_start_at!)
      d.setHours(0, 0, 0, 0)
      if (d.getTime() < earliest.getTime()) earliest = d
    })
    const dayOffset = Math.floor((earliest.getTime() - startDateOnly.getTime()) / (1000 * 60 * 60 * 24))
    if (dayOffset < 0 || dayOffset >= NUM_DAYS) setStartDate(earliest)
  }, [dispatchOrders, startDate, setStartDate])
  */

  // 6. NO auto-update selectedOrder - let it remain stable while drawer is open
  // This prevents unnecessary re-renders and visual jumps in the drawer
  // The drawer will show the order state from when it was opened

  // 7. External Handlers (removed - now using React Router navigation)
  // The "Crear Orden" button in AppLayout now navigates to /dispatch/new
  useImperativeHandle(ref, () => ({}), [])

  const ordersToSend = dispatchOrders.filter((order) => orderIdsToSend.includes(order.id))

  return (
    <>
      <DispatchBoard
        dispatchOrders={dispatchOrders}
        fleetSetUnits={fleetSetUnits}
        groupedUnits={groupedUnits}
        unassignedGroups={unassignedGroups}
        totalUnassigned={totalUnassigned}
        allOrderIds={allOrderIds}
        days={days}
        calendarRangeLabel={calendarRangeLabel}
        assignmentErrors={assignmentErrors}
        isLoadingFleetSets={isLoadingFleetSets}
        isLoadingLanes={isLoadingLanes}
        isSendingDispatch={isSendingDispatch}
        startDate={startDate}
        setStartDate={setStartDate}
        viewMode={viewMode}
        setViewMode={setViewMode}
        displayMode={displayMode}
        setDisplayMode={handleDisplayModeChange}
        selectedOrders={selectedOrders}
        setSelectedOrders={setSelectedOrders}
        searchTerm={searchTerm}
        configurationFilter={configurationFilter}
        setConfigurationFilter={setConfigurationFilter}
        handleSearch={handleSearch}
        handleSchedule={handleSchedule}
        handleBatchSend={handleBatchSend}
        handleQuickSendFromList={(orderIds) => {
          setOrderIdsToSend(orderIds)
          setSendDialogOpen(true)
        }}
        handleQuickCancelFromList={(orderIds) => {
          setOrderIdsToCancel(orderIds)
          setCancelDialogOpen(true)
        }}
        handleSendSingleOrder={async (order) => {
          setOrderIdsToSend([order.id])
          setSendDialogOpen(true)
        }}
        handleCancelFromList={(order) => {
          setOrderIdsToCancel([order.id])
          setCancelDialogOpen(true)
        }}
        handlePreviousDay={handlePreviousDay}
        handleNextDay={handleNextDay}
        handleSelectOrder={handleSelectOrder}
        handleCancelSelectedOrders={handleCancelSelectedOrders}
        handleOrderClick={(order) => {
          setSelectedOrder(order)
          setDrawerInitialView('details')
          setDrawerOpen(true)
        }}
        handleTripClick={(trip) => {
          const realOrder = dispatchOrders.find((o) => o.id === trip.orderId)
          if (realOrder) {
            setSelectedOrder(realOrder)
            setDrawerInitialView('details')
            setDrawerOpen(true)
          }
        }}
        assignFleetSet={assignFleetSet}
        unassignFleetSet={unassignFleetSet}
        loadDispatchOrders={loadDispatchOrders}
        loadFleetSets={loadFleetSets}
        getAllocationStatus={getAllocationStatus}
        getTripsForVehicle={getTripsForVehicle}
        user={user}
        orgId={orgId}
      />

      {drawerOpen && selectedOrder && (
        <DispatchDrawer
          open={drawerOpen}
          onOpenChange={setDrawerOpen}
          order={selectedOrder}
          initialView={drawerInitialView}
          tenderCreatedAt={selectedOrder?.carrier_assigned_at || undefined}
          onAssignFleetset={async (orderId, fleetsetId) => {
            if (!user?.id) return;
            try {
              await assignFleetSet(orderId, fleetsetId, user.id);
            } catch (error) {
              console.error('Error assigning fleetset from drawer:', error);
              throw error;
            }
          }}
          onSendToCarrier={async (orderId) => {
            if (!user?.id) return;
            try {
              await sendToCarrier(orderId, user.id);
              await loadDispatchOrders(true);
              setDrawerOpen(false);
            } catch (error) {
              console.error('Error sending to carrier:', error);
            }
          }}
          onCancelOrder={async (orderId, reasonId, reason) => {
            if (!user?.id) return;
            try {
              await orgCancelDispatchOrder(orderId, user.id, reason, reasonId);
              await loadDispatchOrders(true);
              setDrawerOpen(false);
            } catch (error) {
              console.error('Error canceling order:', error);
            }
          }}
          onUpdateOrder={async (orderId, updates) => {
            if (!user?.id) return;
            try {
              // Actualización silenciosa para inline editing
              // Usamos el servicio directamente para evitar toasts del hook
              const { dispatchOrdersService } = await import('@/services/database/dispatchOrders.service');

              if (!orgId) return;

              // Construir el update object
              const orderUpdates: any = {};

              if (updates.planned_start_at) {
                orderUpdates.planned_start_at = updates.planned_start_at;
                // Mantener planned_end_at en el mismo día
                const endDate = new Date(updates.planned_start_at);
                endDate.setHours(23, 59, 59, 0);
                orderUpdates.planned_end_at = endDate.toISOString();
              }

              if (updates.pickup_window_start !== undefined) {
                orderUpdates.pickup_window_start = updates.pickup_window_start;
              }

              if (updates.pickup_window_end !== undefined) {
                orderUpdates.pickup_window_end = updates.pickup_window_end;
              }

              orderUpdates.updated_by = user.id;

              // Actualizar sin toast
              await dispatchOrdersService.update(orderId, orgId, orderUpdates);

              // Recargar silenciosamente
              await loadDispatchOrders(true);
            } catch (error) {
              console.error('Error updating order:', error);
              throw error;
            }
          }}
        />
      )}
      <DispatchSendDialog
        open={sendDialogOpen}
        onOpenChange={(open) => {
          setSendDialogOpen(open)
          if (!open) setOrderIdsToSend([])
        }}
        orders={ordersToSend}
        onConfirm={async () => {
          if (!user?.id || orderIdsToSend.length === 0) return
          try {
            await batchSendToCarrier(user.id, orderIdsToSend)
            await loadDispatchOrders(true)
            await loadFleetSets()
            await reloadAllocations()
          } catch (error) {
            console.error('Error sending dispatch orders from dialog:', error)
          } finally {
            setOrderIdsToSend([])
            setSendDialogOpen(false)
          }
        }}
      />
      <DispatchCancelDialog
        open={cancelDialogOpen}
        onOpenChange={(open) => {
          setCancelDialogOpen(open)
          if (!open) setOrderIdsToCancel([])
        }}
        reasons={cancellationReasons}
        orderCount={orderIdsToCancel.length}
        onConfirm={async (reasonId, comment) => {
          if (!user?.id || orderIdsToCancel.length === 0) return
          try {
            for (const orderId of orderIdsToCancel) {
              await orgCancelDispatchOrder(orderId, user.id, comment || 'Cancelación operativa', reasonId)
            }
            await loadDispatchOrders(true)
            await reloadAllocations()
          } catch (error) {
            console.error('Error canceling dispatch orders from dialog:', error)
          } finally {
            setOrderIdsToCancel([])
            setCancelDialogOpen(false)
          }
        }}
      />
      {batchResults && (
        <BatchAssignmentResultsDialog
          open={showResultsDialog}
          onOpenChange={setShowResultsDialog}
          total={batchResults.total}
          successCount={batchResults.successCount}
          failCount={batchResults.failCount}
          successful={batchResults.successful}
          failed={batchResults.failed}
        />
      )}
    </>
  )
})

DispatchListPage.displayName = 'DispatchListPage'
