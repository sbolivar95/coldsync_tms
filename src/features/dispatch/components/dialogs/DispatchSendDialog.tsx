import { CheckCircle2, Check, X, XCircle } from "lucide-react";
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
import type { DispatchOrderWithRelations } from "../../hooks/useDispatchOrders";

/**
 * DispatchSendDialog
 * 
 * Diálogo de confirmación para enviar órdenes al transportista.
 * 
 * CONSISTENCIA CON ORDERS (BulkAcceptDialog):
 * - Misma estructura de AlertDialog
 * - Mismo patrón de header con icono + título
 * - Mismo estilo visual y tamaños
 * - Mismo patrón de botones en footer
 * 
 * DIFERENCIAS:
 * - No valida fleetset asignado (Orders sí lo hace en BulkAcceptDialog)
 * - Más simple: solo confirmación sin validaciones adicionales
 */

interface DispatchSendDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orders: DispatchOrderWithRelations[];
  onConfirm: () => void;
}

export function DispatchSendDialog({
  open,
  onOpenChange,
  orders,
  onConfirm,
}: DispatchSendDialogProps) {
  const orderCount = orders.length;

  // Check if all orders have fleetset assigned (similar to BulkAcceptDialog)
  const ordersWithoutFleetset = orders.filter(order => !order.fleet_set_id);
  const hasOrdersWithoutFleetset = ordersWithoutFleetset.length > 0;

  const handleConfirm = () => {
    // Don't allow confirmation if there are orders without fleetset
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
              <XCircle className="w-5 h-5 text-amber-600 shrink-0" />
            ) : (
              <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0" />
            )}
            <AlertDialogTitle className="text-base font-semibold flex-1">
              {orderCount === 1 ? "Enviar Orden" : "Enviar Órdenes"}
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
                  Solo puedes enviar órdenes que tengan flota asignada.
                </p>
              </div>
            ) : (
              <p>
                {orderCount === 1
                  ? "¿Confirmas que deseas enviar esta orden al transportista?"
                  : `¿Confirmas que deseas enviar las ${orderCount} órdenes seleccionadas al transportista?`}
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
                  {order.dispatch_number || order.id}
                </div>
              ))}
            </div>
            <p className="text-xs text-gray-500">
              Asigna una flota a estas órdenes antes de enviarlas al transportista.
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
              Confirmar Envío
            </AlertDialogAction>
          )}
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
