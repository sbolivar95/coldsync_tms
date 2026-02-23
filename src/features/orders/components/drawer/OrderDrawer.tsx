import { useState } from "react";
import { CheckCircle2, XCircle, AlertTriangle, Loader2 } from "lucide-react";
import { Button } from "../../../../components/ui/Button";
import {
  Drawer,
  DrawerContent,
  DrawerTitle,
  DrawerDescription,
} from "../../../../components/ui/Drawer";
import { PrimaryButton } from "../../../../components/widgets/PrimaryButton";
import { getOrderStatusDisplay } from "../../utils/orders-helpers";
import { CarrierOrder } from "../../../../services/database/orders.service";
import { mockRoutes } from "../../../../lib/mockData";
import { OrderDrawerHeader } from "./OrderDrawerHeader";
import { OrderDrawerTabs } from "./OrderDrawerTabs";
import { OrderDetailsTab } from "./OrderDetailsTab";
import { OrderHistoryTab } from "./OrderHistoryTab";
import { FleetsetSelectionView } from "./FleetsetSelectionView";
import { DeclineView } from "./DeclineView";
import { FailAfterAcceptView } from "./FailAfterAcceptView";

// Types for drawer views
type DrawerView = 'details' | 'fleetset-selection' | 'decline' | 'fail-after-accept';

interface OrderDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  order?: CarrierOrder | null;
  tenderCreatedAt?: string;
  decisionTimestamp?: string;
  onFailAfterAccept?: (reason: string, comments: string) => void;
  onAccept?: (orderId: string) => void;
  onAcceptWithChanges?: (orderId: string, fleetsetId: string) => void;
  onReject?: (orderId: string, reason: string) => void;
  isLoading?: boolean;
}

export function OrderDrawer({ 
  open, 
  onOpenChange, 
  order, 
  tenderCreatedAt, 
  decisionTimestamp,
  isLoading = false,
  onFailAfterAccept,
  onAccept,
  onAcceptWithChanges,
  onReject
}: OrderDrawerProps) {
  const [activeTab, setActiveTab] = useState<'detalles' | 'historial'>('detalles');
  
  // View swapping state
  const [drawerView, setDrawerView] = useState<DrawerView>('details');
  const [selectedFleetsetId, setSelectedFleetsetId] = useState<string | null>(null);
  const [originalFleetsetId, setOriginalFleetsetId] = useState<string | null>(null);
  
  // Set original fleetset when order loads
  if (order?.fleet_set_id && originalFleetsetId !== order.fleet_set_id) {
    setOriginalFleetsetId(order.fleet_set_id);
    if (!selectedFleetsetId) {
      setSelectedFleetsetId(order.fleet_set_id);
    }
  }
  
  // Check if fleetset has changed
  const hasFleetsetChanged = selectedFleetsetId && selectedFleetsetId !== originalFleetsetId;
  
  // Get route/lane from mockRoutes
  // @ts-ignore - Temporary mapping while migrating to real data
  const currentRoute = order?.lane_id ? mockRoutes.find((r) => r.id === order.lane_id) : null;

  // Get complete status information (same as in table)
  const statusDisplay = order 
    ? getOrderStatusDisplay(order, tenderCreatedAt, decisionTimestamp)
    : {
        label: "Pendiente",
        timeInfo: "",
        urgency: 'normal' as 'normal' | 'high' | 'critical',
        dotColor: '#3b82f6'
      };

  // Handle fleetset selection
  const handleFleetsetSelect = (fleetsetId: string) => {
    setSelectedFleetsetId(fleetsetId);
    setDrawerView('details'); // Go back to details view
  };

  // Handle change fleetset action
  const handleChangeFleetset = () => {
    setDrawerView('fleetset-selection');
  };

  // Handle decline action
  const handleDecline = () => {
    setDrawerView('decline');
  };

  // Handle fail after accept action
  const handleFailAfterAccept = () => {
    setDrawerView('fail-after-accept');
  };

  // Handle decline confirmation
  const handleDeclineConfirm = (reason: string, comments: string) => {
    if (!order?.id) return;
    
    // Combine reason and comments
    const fullReason = comments ? `${reason}: ${comments}` : reason;
    
    if (onReject) {
      onReject(order.id, fullReason);
    }
    
    // Close drawer
    onOpenChange(false);
    
    // Reset view state
    setDrawerView('details');
  };

  // Handle fail after accept confirmation
  const handleFailAfterAcceptConfirm = (reason: string, comments: string) => {
    if (!order?.id) return;
    
    // Call the handler from parent to update order state
    if (onFailAfterAccept) {
      onFailAfterAccept(reason, comments);
    }
    
    // Close drawer
    onOpenChange(false);
    
    // Reset view state
    setDrawerView('details');
  };

  // Handle accept order
  const handleAccept = () => {
    if (!order?.id) return;
    
    if (hasFleetsetChanged && selectedFleetsetId) {
      if (onAcceptWithChanges) {
        onAcceptWithChanges(order.id, selectedFleetsetId);
      }
    } else {
      if (onAccept) {
        onAccept(order.id);
      }
    }
    
    // Close drawer
    onOpenChange(false);
    
    // Reset view state
    setDrawerView('details');
    setSelectedFleetsetId(null);
  };

  const renderContent = () => {
    // Handle view swapping
    if (drawerView === 'fleetset-selection') {
      if (!order) return null;
      
      return (
        <FleetsetSelectionView
          order={order}
          selectedFleetsetId={selectedFleetsetId || originalFleetsetId}
          onBack={() => setDrawerView('details')}
          onSelect={handleFleetsetSelect}
        />
      );
    }

    if (drawerView === 'decline') {
      if (!order) return null;
      
      return (
        <DeclineView
          order={order}
          onBack={() => setDrawerView('details')}
          onConfirm={handleDeclineConfirm}
        />
      );
    }

    if (drawerView === 'fail-after-accept') {
      if (!order) return null;
      
      return (
        <FailAfterAcceptView
          order={order}
          onBack={() => setDrawerView('details')}
          onConfirm={handleFailAfterAcceptConfirm}
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

        return <OrderDetailsTab 
          order={order} 
          currentRoute={currentRoute || null} 
          onChangeFleetset={handleChangeFleetset}
        />;
        
      case 'historial':
        if (!order) {
          return (
            <div className="flex items-center justify-center h-64">
              <p className="text-sm text-gray-500">No hay información disponible</p>
            </div>
          );
        }
        
        return <OrderHistoryTab order={order} />;
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
          Detalles de la orden {order?.id || ""}
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
          <OrderDrawerHeader order={order} statusDisplay={statusDisplay} />

          {/* Tabs - Solo mostrar en vista de detalles */}
          {drawerView === 'details' && (
            <OrderDrawerTabs activeTab={activeTab} onTabChange={setActiveTab} />
          )}

          {/* Content */}
          <div 
            className={`flex-1 min-h-0 overflow-y-auto overflow-x-hidden ${
              drawerView === 'fleetset-selection' || drawerView === 'decline' || drawerView === 'fail-after-accept' ? '' : 'px-6 py-4'
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
              {/* Show different actions based on order status */}
              {order?.status === 'PENDING' || order?.status === 'SOLICITUD' ? (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 gap-2 text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200 select-none"
                    onClick={handleDecline}
                    disabled={isLoading}
                  >
                    <XCircle className="w-4 h-4" />
                    Rechazar
                  </Button>
                  <PrimaryButton 
                    size="sm" 
                    className="flex-1 select-none" 
                    onClick={handleAccept}
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <CheckCircle2 className="w-4 h-4" />
                    )}
                    {hasFleetsetChanged ? "Aceptar con Cambios" : "Aceptar"}
                  </PrimaryButton>
                </>
              ) : (order?.status === 'ACCEPTED' || order?.status === 'SCHEDULED' || order?.status === 'COMPLETED') ? (
                <Button
                  variant="destructive"
                  size="sm"
                  className="w-full gap-2 select-none"
                  onClick={handleFailAfterAccept}
                >
                  <AlertTriangle className="w-4 h-4" />
                  Declarar Falla Post-Aceptación
                </Button>
              ) : null}
            </div>
          )}
        </div>
      </DrawerContent>
    </Drawer>
  );
}
