import { CheckCircle2, X, Check, AlertTriangle } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../../../../components/ui/AlertDialog";

interface BulkAcceptDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orders: any[]; // Using any temporarily to avoid circular types, should be CarrierOrder[]
  onConfirm: () => void;
}

export function BulkAcceptDialog({
  open,
  onOpenChange,
  orders,
  onConfirm,
}: BulkAcceptDialogProps) {
  // Check if all orders have fleetset assigned
  const ordersWithoutFleetset = orders.filter(order => {
    // Check for fleet_set_id (DB model) or legacy props
    return !order.fleet_set_id && !order.unit && !order.vehicleId;
  });

  const hasOrdersWithoutFleetset = ordersWithoutFleetset.length > 0;
  const orderCount = orders.length;

  const handleConfirm = () => {
    if (hasOrdersWithoutFleetset) return;

    onConfirm();
    onOpenChange(false);
  };

  const handleCancel = () => {
    onOpenChange(false);
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader className="space-y-0.5">
          <div className="flex items-center gap-2">
            {hasOrdersWithoutFleetset ? (
              <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
            ) : (
              <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0" />
            )}
            <AlertDialogTitle className="text-base font-semibold flex-1">
              {orderCount === 1 ? "Aceptar Orden" : "Aceptar Órdenes"}
            </AlertDialogTitle>
          </div>
          <AlertDialogDescription className="text-xs text-gray-500">
            {hasOrdersWithoutFleetset ? (
              <div className="space-y-2">
                <p>
                  {ordersWithoutFleetset.length === 1
                    ? "1 orden no tiene flota asignada."
                    : `${ordersWithoutFleetset.length} órdenes no tienen flota asignada.`}
                </p>
                <p className="text-amber-700 font-medium">
                  Solo puedes aceptar órdenes que tengan flota declarada explícitamente.
                </p>
              </div>
            ) : (
              <p>
                {orderCount === 1
                  ? "¿Confirmas que deseas aceptar esta orden?"
                  : `¿Confirmas que deseas aceptar las ${orderCount} órdenes seleccionadas?`}
              </p>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>

        {/* Show list of orders without fleetset if any */}
        {hasOrdersWithoutFleetset && (
          <div className="space-y-2 py-2">
            <p className="text-xs font-medium text-gray-700">
              Órdenes sin flota asignada:
            </p>
            <div className="max-h-32 overflow-y-auto space-y-1">
              {ordersWithoutFleetset.map((order) => (
                <div
                  key={order.id}
                  className="text-xs text-gray-600 bg-amber-50 px-3 py-2 rounded border border-amber-200"
                >
                  {order.id}
                </div>
              ))}
            </div>
            <p className="text-xs text-gray-500">
              Asigna una flota a estas órdenes antes de aceptarlas, o acéptalas individualmente con "Aceptar con Cambios".
            </p>
          </div>
        )}

        <AlertDialogFooter className="gap-3">
          <AlertDialogCancel
            className="px-4 gap-2"
            onClick={handleCancel}
          >
            <X className="w-4 h-4" />
            {hasOrdersWithoutFleetset ? "Entendido" : "Cancelar"}
          </AlertDialogCancel>
          {!hasOrdersWithoutFleetset && (
            <AlertDialogAction
              className="px-4 gap-2"
              variant="default"
              onClick={handleConfirm}
            >
              <Check className="w-4 h-4" />
              Confirmar Aceptación
            </AlertDialogAction>
          )}
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
