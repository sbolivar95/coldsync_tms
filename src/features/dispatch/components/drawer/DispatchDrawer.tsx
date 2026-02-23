import { useState, useEffect, useMemo } from "react";
import { CheckCircle2, X, Loader2 } from "lucide-react";
import { Button } from "../../../../components/ui/Button";
import {
  Drawer,
  DrawerContent,
  DrawerTitle,
  DrawerDescription,
} from "../../../../components/ui/Drawer";
import { PrimaryButton } from "../../../../components/widgets/PrimaryButton";
import { getDispatchStateDisplay } from "../../utils/dispatch-helpers";
import { DispatchOrderWithRelations } from "../../hooks/useDispatchOrders";
import { DispatchDrawerHeader } from "./DispatchDrawerHeader";
import { DispatchDrawerTabs } from "./DispatchDrawerTabs";
import { DispatchDetailsTab } from "./DispatchDetailsTab";
import { DispatchHistoryTab } from "./DispatchHistoryTab";
import { DispatchFleetsetSelectionView } from "./DispatchFleetsetSelectionView";
import { CancelView } from "./CancelView";
import { cancellationReasonsService, CancellationReason } from "../../../../services/database/cancellationReasons.service";
import { isCancelable } from "../../../../types/dispatchOrderStateMachine";

// Types for drawer views
type DrawerView = 'details' | 'fleetset-selection' | 'cancel';

interface DispatchDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  order?: DispatchOrderWithRelations | null;
  initialView?: 'details' | 'cancel';
  tenderCreatedAt?: string;
  decisionTimestamp?: string;
  onSendToCarrier?: (orderId: string) => void;
  onCancelOrder?: (orderId: string, reasonId: string, reason: string) => void;
  onReassignFleet?: (orderId: string) => void;
  onRevertToPending?: (orderId: string) => void;
  onAssignFleetset?: (orderId: string, fleetsetId: string) => Promise<void>;
  onUpdateOrder?: (orderId: string, updates: Partial<DispatchOrderWithRelations>) => Promise<void>;
  isLoading?: boolean;
}

export function DispatchDrawer({
  open,
  onOpenChange,
  order,
  initialView = 'details',
  tenderCreatedAt,
  decisionTimestamp,
  isLoading = false,
  onSendToCarrier,
  onCancelOrder,
  onReassignFleet,
  onRevertToPending,
  onAssignFleetset,
  onUpdateOrder
}: DispatchDrawerProps) {
  const [activeTab, setActiveTab] = useState<'detalles' | 'historial'>('detalles');

  // View swapping state
  const [drawerView, setDrawerView] = useState<DrawerView>('details');
  const [selectedFleetsetId, setSelectedFleetsetId] = useState<string | null>(null);
  const [originalFleetsetId, setOriginalFleetsetId] = useState<string | null>(null);
  const [cancellationReasons, setCancellationReasons] = useState<CancellationReason[]>([]);

  const canCancelOrder =
    !!order &&
    order.substatus !== 'CANCELED' &&
    isCancelable(order.stage);
  const [isAssigningFleetset, setIsAssigningFleetset] = useState(false);

  // Initialize state when drawer opens (only once per open)
  useEffect(() => {
    if (open && order) {
      // Reset to initial view
      setDrawerView(initialView);
      setActiveTab('detalles');
      
      // Set fleetset IDs
      setOriginalFleetsetId(order.fleet_set_id ?? null);
      setSelectedFleetsetId(order.fleet_set_id ?? null);

      // Load cancellation reasons if needed
      if (order.org_id && cancellationReasons.length === 0) {
        const loadReasons = async () => {
          try {
            const reasons = await cancellationReasonsService.getActiveReasons(order.org_id);
            setCancellationReasons(reasons);
          } catch (error) {
            console.error("Failed to load cancellation reasons", error);
          }
        };
        loadReasons();
      }
    }
  }, [open]); // Only depend on 'open' to avoid re-renders

  // Get complete status information
  const statusDisplay = useMemo(
    () =>
      order
        ? getDispatchStateDisplay(order, tenderCreatedAt, decisionTimestamp)
        : {
            label: "Sin Asignar",
            timeInfo: "",
            urgency: 'normal' as 'normal' | 'high' | 'critical',
            dotColor: '#3b82f6',
          },
    [order, tenderCreatedAt, decisionTimestamp]
  );

  // Handle fleetset selection
  const handleFleetsetSelect = async (fleetsetId: string) => {
    if (!order?.id) return;

    if (fleetsetId === order.fleet_set_id) {
      setSelectedFleetsetId(fleetsetId);
      setDrawerView('details');
      return;
    }

    if (!onAssignFleetset) {
      setSelectedFleetsetId(fleetsetId);
      setDrawerView('details');
      return;
    }

    try {
      setIsAssigningFleetset(true);
      await onAssignFleetset(order.id, fleetsetId);
      setSelectedFleetsetId(fleetsetId);
      setDrawerView('details');
    } catch (error) {
      throw error;
    } finally {
      setIsAssigningFleetset(false);
    }
  };

  // Handle change fleetset action (reassign)
  const handleChangeFleetset = () => {
    setDrawerView('fleetset-selection');
  };

  // Handle reassign fleet (from parent)
  const handleReassignFleet = () => {
    if (!order?.id || !onReassignFleet) return;
    onReassignFleet(order.id);
  };

  // Handle revert to assigned (from PENDING back to ASSIGNED)
  const handleRevertToPending = () => {
    if (!order?.id || !onRevertToPending) return;
    onRevertToPending(order.id);
    onOpenChange(false);
  };

  // Handle send to carrier (emit tender)
  const handleSendToCarrier = () => {
    if (!order?.id || !onSendToCarrier) return;

    onSendToCarrier(order.id);

    // Close drawer
    onOpenChange(false);
  };

  // Handle cancel order - Now opens CancelView instead of directly calling onCancelOrder
  const handleCancelOrder = () => {
    if (!order?.id || !onCancelOrder) return;
    setDrawerView('cancel');
  };

  // Handle confirm cancellation from CancelView
  const handleConfirmCancel = (reasonId: string, reason?: string) => {
    if (!order?.id || !onCancelOrder) return;
    onCancelOrder(order.id, reasonId, reason || 'Cancelación sin comentarios extra');
  };

  const hasAssignedFleet = !!order?.fleet_set_id;
  const canSendToCarrier = !!order && (
    order.substatus === 'ASSIGNED' ||
    (hasAssignedFleet && (order.substatus === 'UNASSIGNED' || order.substatus === 'NEW'))
  );

  const renderContent = () => {
    // Handle view swapping
    if (drawerView === 'fleetset-selection') {
      if (!order) return null;
      
      return (
        <DispatchFleetsetSelectionView
          order={order}
          selectedFleetsetId={selectedFleetsetId || originalFleetsetId}
          onBack={() => setDrawerView('details')}
          onSelect={handleFleetsetSelect}
          isApplying={isAssigningFleetset}
        />
      );
    }

    if (drawerView === 'cancel') {
      if (!order) return null;
      
      return (
        <CancelView
          reasons={cancellationReasons}
          onBack={() => setDrawerView('details')}
          onConfirm={handleConfirmCancel}
        />
      );
    }

    // Regular tab content
    switch (activeTab) {
      case 'detalles':
        if (!order) {
          return (
            <div className="flex items-center justify-center h-64">
              <p className="text-sm text-gray-500">No hay información disponible</p>
            </div>
          );
        }

        return <DispatchDetailsTab
          order={order}
          onChangeFleetset={handleChangeFleetset}
          onUpdateOrder={onUpdateOrder}
        />;
        
      case 'historial':
        if (!order) {
          return (
            <div className="flex items-center justify-center h-64">
              <p className="text-sm text-gray-500">No hay información disponible</p>
            </div>
          );
        }
        
        return <DispatchHistoryTab order={order} />;
      default:
        return null;
    }
  };

  return (
    <Drawer
      open={open}
      onOpenChange={onOpenChange}
      direction="right"
    >
      <DrawerContent className="h-screen bg-white">
        {/* Hidden accessibility elements */}
        <DrawerTitle className="sr-only">
          Detalles de la orden de despacho {order?.dispatch_number || order?.id || ""}
        </DrawerTitle>
        <DrawerDescription className="sr-only">
          Información detallada de la orden de despacho incluyendo ruta, asignación de flota y detalles operativos
        </DrawerDescription>

        <div
          className="flex flex-col h-full overflow-hidden"
          style={{
            userSelect: 'text',
            WebkitUserSelect: 'text'
          }}
        >
          {/* Header */}
          <DispatchDrawerHeader
            order={order}
            statusDisplay={statusDisplay}
            canCancelOrder={canCancelOrder}
            onCancelOrder={handleCancelOrder}
          />

          {/* Tabs - Solo mostrar en vista de detalles */}
          {drawerView === 'details' && (
            <DispatchDrawerTabs activeTab={activeTab} onTabChange={setActiveTab} />
          )}

          {/* Content */}
          <div
            className={`flex-1 min-h-0 overflow-y-auto overflow-x-hidden ${
              drawerView === 'fleetset-selection' || drawerView === 'cancel' ? '' : 'px-6 py-4'
            }`}
            style={{
              userSelect: 'text',
              WebkitUserSelect: 'text',
              MozUserSelect: 'text',
              msUserSelect: 'text'
            }}
          >
            <div
              className="h-full w-full"
              onPointerDownCapture={(e) => {
                // Allow text selection by stopping propagation to vaul
                e.stopPropagation();
              }}
              onTouchStartCapture={(e) => {
                // Allow text gestures on mobile
                e.stopPropagation();
              }}
            >
              {renderContent()}
            </div>
          </div>

          {/* Footer - Solo mostrar en vista de detalles */}
          {drawerView === 'details' && (
            <div
              className="shrink-0 border-t border-gray-200 px-6 py-3 bg-white flex gap-3 items-center"
              style={{ minHeight: '60px' }}
            >
              {/* Show different actions based on order substatus */}
              {(order?.substatus === 'UNASSIGNED' || order?.substatus === 'NEW') && !canSendToCarrier ? (
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full gap-2 select-none"
                  onClick={() => onOpenChange(false)}
                  disabled={isLoading}
                >
                  <X className="w-4 h-4" />
                  Cerrar
                </Button>
              ) : canSendToCarrier ? (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 gap-2 select-none"
                    onClick={() => onOpenChange(false)}
                    disabled={isLoading}
                  >
                    <X className="w-4 h-4" />
                    Cerrar
                  </Button>
                  <PrimaryButton
                    size="sm"
                    className="flex-1 select-none"
                    onClick={handleSendToCarrier}
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <CheckCircle2 className="w-4 h-4" />
                    )}
                    Enviar al Transportista
                  </PrimaryButton>
                </>
              ) : order?.substatus === 'PENDING' ? (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 gap-2 select-none"
                    onClick={handleRevertToPending}
                    disabled={isLoading}
                  >
                    Revertir
                  </Button>
                  <span className="flex-1 text-center text-sm text-gray-500 flex items-center justify-center">
                    Esperando respuesta del transportista
                  </span>
                </>
              ) : order?.substatus === 'REJECTED' ? (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 gap-2 select-none"
                    onClick={() => onOpenChange(false)}
                    disabled={isLoading}
                  >
                    <X className="w-4 h-4" />
                    Cerrar
                  </Button>
                  <PrimaryButton
                    size="sm"
                    className="flex-1 select-none"
                    onClick={handleReassignFleet}
                    disabled={isLoading}
                  >
                    Reasignar Flota
                  </PrimaryButton>
                </>
              ) : order?.substatus === 'PROGRAMMED' || order?.substatus === 'DISPATCHED' || order?.substatus === 'AT_ORIGIN' || order?.substatus === 'LOADING' || order?.substatus === 'IN_TRANSIT' || order?.substatus === 'AT_DESTINATION' || order?.substatus === 'DELIVERED' ? (
                <span className="w-full text-center text-sm text-gray-500 flex items-center justify-center">
                  Orden en ejecución
                </span>
              ) : order?.substatus === 'OBSERVED' ? (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 gap-2 select-none"
                    onClick={() => onOpenChange(false)}
                    disabled={isLoading}
                  >
                    <X className="w-4 h-4" />
                    Cerrar
                  </Button>
                  <PrimaryButton
                    size="sm"
                    className="flex-1 select-none"
                    onClick={handleReassignFleet}
                    disabled={isLoading}
                  >
                    Reasignar Flota
                  </PrimaryButton>
                </>
              ) : null}
            </div>
          )}
        </div>
      </DrawerContent>
    </Drawer>
  );
}
