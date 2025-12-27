import { useState } from "react";
import { X, Save, Calendar, Ban, AlertCircle, Clock, XCircle, CheckCircle2, Send, Package, MoreVertical, ClipboardCheck } from "lucide-react";
import { Button } from "../../../components/ui/Button";
import { Badge } from "../../../components/ui/Badge";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../../../components/ui/DropdownMenu";
import { ConfirmDialog } from "../../../components/widgets/ConfirmDialog";
import { DetailsTab } from "../drawer/DetailsTab";
import { HistoryTab } from "../drawer/HistoryTab";
import { ReassignView, mockCandidates } from "../drawer/ReassignView";
import { type Order, type OrderStatus, mapStatusToEnglish } from "../../../lib/mockData";

interface OrderDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  orderData: Order | null;
  onEdit?: (data: any) => void;
  onCancel?: (orderId: string) => void;
  onReassign?: (orderId: string) => void;
  onReschedule?: (orderId: string, newDate: string) => void;
}

// Helper para convertir status en español a inglés
const getStatus = (status?: string | OrderStatus): OrderStatus => {
  if (!status) return "unassigned";
  
  // Si es string, intentar mapear
  if (typeof status === "string") {
    // Si contiene guión, probablemente es español
    if (status.includes("-")) {
      return mapStatusToEnglish(status);
    }
    // Si ya es un OrderStatus válido, devolverlo
    const validStatuses: OrderStatus[] = ["unassigned", "assigned", "pending", "scheduled", "rejected", "observed", "dispatched", "cancelled", "at-destination"];
    if (validStatuses.includes(status as OrderStatus)) {
      return status as OrderStatus;
    }
    // Si no es válido, intentar mapear de todas formas
    return mapStatusToEnglish(status);
  }
  
  // Si ya es OrderStatus, validar que sea válido
  const validStatuses: OrderStatus[] = ["unassigned", "assigned", "pending", "scheduled", "rejected", "observed", "dispatched", "cancelled", "at-destination"];
  if (validStatuses.includes(status)) {
    return status;
  }
  
  // Fallback
  return "unassigned";
};

// Configuración de estados (usando valores en inglés)
const statusConfig: Record<OrderStatus, { 
  label: string; 
  color: string; 
  bgColor: string;
  icon: any;
  canEdit: boolean;
  canCancel: boolean;
  canReassign: boolean;
}> = {
  "unassigned": { 
    label: "Sin Asignar", 
    color: "text-gray-700", 
    bgColor: "bg-gray-200",
    icon: Package,
    canEdit: true,
    canCancel: true,
    canReassign: false,
  },
  "assigned": { 
    label: "Asignada", 
    color: "text-gray-600", 
    bgColor: "bg-gray-100",
    icon: CheckCircle2,
    canEdit: true,
    canCancel: true,
    canReassign: true,
  },
  "pending": { 
    label: "Pendiente", 
    color: "text-amber-700", 
    bgColor: "bg-amber-50",
    icon: Clock,
    canEdit: true,
    canCancel: true,
    canReassign: true,
  },
  "rejected": { 
    label: "Rechazada", 
    color: "text-red-700", 
    bgColor: "bg-red-50",
    icon: XCircle,
    canEdit: true,
    canCancel: true,
    canReassign: true,
  },
  "scheduled": { 
    label: "Programada", 
    color: "text-blue-700", 
    bgColor: "bg-blue-50",
    icon: CheckCircle2,
    canEdit: true,
    canCancel: true,
    canReassign: true,
  },
  "at-destination": { 
    label: "En Destino", 
    color: "text-[#091E42]", 
    bgColor: "bg-gray-100",
    icon: ClipboardCheck,
    canEdit: true,
    canCancel: true,
    canReassign: true,
  },
  "observed": { 
    label: "Observada", 
    color: "text-orange-700", 
    bgColor: "bg-orange-50",
    icon: AlertCircle,
    canEdit: true,
    canCancel: true,
    canReassign: true,
  },
  "dispatched": { 
    label: "Despachada", 
    color: "text-emerald-700", 
    bgColor: "bg-emerald-50",
    icon: Send,
    canEdit: false,
    canCancel: false,
    canReassign: false,
  },
  "cancelled": { 
    label: "Cancelada", 
    color: "text-slate-700", 
    bgColor: "bg-slate-100",
    icon: Ban,
    canEdit: false,
    canCancel: false,
    canReassign: false,
  },
};

export function OrderDrawer({ 
  isOpen, 
  onClose, 
  orderData,
  onEdit,
  onCancel,
  onReassign: _onReassign,
  onReschedule
}: OrderDrawerProps) {
  const [activeTab, setActiveTab] = useState<"detalles" | "historial">("detalles");
  const [editedData, setEditedData] = useState(orderData);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [view, setView] = useState<"tabs" | "reassign" | "success">("tabs");
  const [successData, setSuccessData] = useState<{unit: string; orderId: string} | null>(null);
  const [selectedVehicleId, setSelectedVehicleId] = useState<string | undefined>();

  // Si orderData cambia (ej: clic en otra orden), actualizar el estado local
  if (orderData && orderData.id !== editedData?.id) {
    setEditedData(orderData);
    setView("tabs"); // Reset view when order changes
    setActiveTab("detalles");
  }

  if (!isOpen || !orderData) return null;

  const status = getStatus(orderData.status || orderData.estado);
  const config = statusConfig[status] || statusConfig["unassigned"]; // Fallback a unassigned si no existe

  if (!config) {
    console.error("Invalid status config for status:", status);
    return null;
  }

  const handleUpdate = (updatedData: any) => {
    setEditedData(updatedData);
  };

  const handleSave = () => {
    onEdit?.(editedData);
    onClose();
  };

  const handleCancelClick = () => {
    setShowCancelDialog(true);
  };

  const handleConfirmCancel = () => {
    if (orderData.id) {
      onCancel?.(orderData.id);
    }
    setShowCancelDialog(false);
    onClose();
  };

  const handleReassign = () => {
    setView("reassign");
  };

  const handleConfirmReassign = (vehicleIdInput?: string) => {
    const vId = vehicleIdInput || selectedVehicleId;
    if (!vId || !editedData) return;
    
    const vehicle = mockCandidates.find(v => v.id === vId);
    if (vehicle) {
        const newData = {
            ...editedData,
            vehicleId: vehicle.id, // Correct ID: VEH-XXX
            unit: vehicle.unitId,
            trailer: vehicle.plate, 
            carrier: vehicle.carrier,
            driver: vehicle.driver,
            status: "asignada" as OrderStatus
        };
        setEditedData(newData);
        onEdit?.(newData);
      
        // Show success view inside drawer
        setSuccessData({
            unit: vehicle.unitId,
            orderId: orderData.id || ""
        });
        setView("success");
    }
  };

  const handleCancelReassign = () => {
      setView("tabs");
      setSelectedVehicleId(undefined);
  };

  const Icon = config.icon;
  const hasActions = (config.canReassign || status === "observed" || config.canCancel) && view === "tabs";

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/20 z-40 transition-opacity"
        onClick={onClose}
      />

      {/* Drawer desde la derecha */}
      <div className="fixed right-0 top-0 bottom-0 w-[520px] bg-white shadow-2xl z-50 flex flex-col">
        {/* Header */}
        <div className="h-14 flex items-center justify-between px-6 shrink-0 bg-white border-b border-gray-200">
          <div className="flex items-center gap-3">
            {view === "reassign" ? (
              <h2 className="text-base font-medium text-gray-900">
                Reasignar Orden {orderData.id}
              </h2>
            ) : view === "success" ? (
              <h2 className="text-base font-medium text-gray-900">
                Orden Actualizada
              </h2>
            ) : (
              <>
                <h2 className="text-base font-medium text-gray-900">
                  {orderData.id}
                </h2>
                <Badge className={`${config.bgColor} ${config.color} text-[10px] font-semibold px-2.5 py-0.5 rounded-full flex items-center gap-1`}>
                  <Icon className="w-3.5 h-3.5" />
                  {config.label}
                </Badge>
              </>
            )}
          </div>

          <div className="flex items-center gap-2">
            {/* Menú de acciones */}
            {hasActions && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    <MoreVertical className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  {status === "observed" && (
                    <DropdownMenuItem onClick={() => onReschedule?.(orderData.id || "", "")}>
                      <Calendar className="w-3.5 h-3.5 mr-2" />
                      <span className="text-xs">Reprogramar</span>
                    </DropdownMenuItem>
                  )}
                  {status === "observed" && config.canCancel && (
                    <DropdownMenuSeparator />
                  )}
                  {config.canCancel && (
                    <DropdownMenuItem 
                      onClick={handleCancelClick}
                      className="text-red-600 focus:text-red-600 focus:bg-red-50"
                    >
                      <Ban className="w-3.5 h-3.5 mr-2" />
                      <span className="text-xs">Cancelar Orden</span>
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            )}

            {/* Botón cerrar */}
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onClose();
              }}
              className="h-8 w-8 p-0"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Tabs - Solo visible en modo tabs */}
        {view === "tabs" && (
          <div className="border-b border-gray-200 bg-white">
            <nav className="flex px-6">
              {[
                { id: "detalles", label: "Detalles" },
                { id: "historial", label: "Historial" },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as typeof activeTab)}
                  className={`relative text-xs px-4 py-3 transition-colors ${
                    activeTab === tab.id
                      ? "text-[#004ef0]"
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  {tab.label}
                  {activeTab === tab.id && (
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#004ef0]" />
                  )}
                </button>
              ))}
            </nav>
          </div>
        )}

        {/* Content */}
        <div className={`flex-1 ${view === "reassign" ? "overflow-hidden" : "overflow-y-auto p-6"}`}>
          {view === "reassign" ? (
            <ReassignView 
              onSelect={(id) => handleConfirmReassign(id)} 
              selectedVehicleId={selectedVehicleId} 
            />
          ) : view === "success" ? (
            <div className="flex flex-col items-center justify-center h-full text-center space-y-6">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto animate-in zoom-in duration-300">
                <CheckCircle2 className="w-8 h-8 text-green-600" />
              </div>
              
              <div className="space-y-2 max-w-xs mx-auto">
                <h3 className="text-lg font-semibold text-gray-900">
                  Asignación Exitosa
                </h3>
                <p className="text-sm text-gray-500 leading-relaxed">
                  La unidad <span className="font-semibold text-gray-900">{successData?.unit}</span> ha sido asignada correctamente a la orden <span className="font-semibold text-gray-900">{successData?.orderId}</span>.
                </p>
              </div>

              <div className="w-full max-w-xs space-y-3 pt-4">
                  <Button 
                    className="w-full bg-[#004ef0] hover:bg-[#003bc4]"
                    onClick={() => setView("tabs")}
                  >
                    Volver al detalle
                  </Button>
                  
                  <Button 
                    variant="ghost"
                    className="w-full text-gray-500 hover:text-gray-900"
                    onClick={onClose}
                  >
                    Cerrar
                  </Button>
              </div>
            </div>
          ) : (
            <>
              {activeTab === "detalles" && (
                <DetailsTab 
                  orderData={editedData || orderData} 
                  onUpdate={handleUpdate}
                  onAssign={handleReassign}
                  isEditable={config.canEdit}
                />
              )}

              {activeTab === "historial" && (
                <HistoryTab orderData={orderData} />
              )}
            </>
          )}
        </div>

        {/* Footer con acciones - Solo visible en modo tabs o reassign (para cancelar) */}
        {view !== "success" && (
            <div className="border-t border-gray-200 px-6 py-4 bg-white flex gap-3">
            {view === "reassign" ? (
                <>
                <Button 
                    variant="outline" 
                    className="flex-1 text-xs"
                    onClick={handleCancelReassign}
                >
                    Cancelar
                </Button>
                </>
            ) : (
                <>
                <Button 
                    variant="outline" 
                    className="flex-1 text-xs"
                    onClick={onClose}
                >
                    Cerrar
                </Button>
                
                {config.canEdit && (
                    <Button 
                    className="flex-1 text-xs" 
                    style={{ backgroundColor: '#004ef0' }}
                    onClick={handleSave}
                    >
                    <Save className="w-3.5 h-3.5 mr-1.5" />
                    Guardar Cambios
                    </Button>
                )}
                </>
            )}
            </div>
        )}
      </div>

      {/* Diálogo de confirmación para cancelar */}
      <ConfirmDialog
        open={showCancelDialog}
        onOpenChange={setShowCancelDialog}
        title="¿Cancelar esta orden?"
        description={
          <>
            ¿Estás seguro de que deseas cancelar la orden <strong>{orderData.id}</strong>? Esta acción no se puede deshacer y la orden se moverá al estado "Cancelada".
          </>
        }
        confirmText="Sí, cancelar orden"
        cancelText="No, mantener"
        variant="destructive"
        onConfirm={handleConfirmCancel}
      />
    </>
  );
}

