import { X, MoreVertical, XCircle } from "lucide-react";
import { Button } from "../../../../components/ui/Button";
import { DrawerClose } from "../../../../components/ui/Drawer";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../../../../components/ui/DropdownMenu";
import { DispatchOrderWithRelations } from "../../hooks/useDispatchOrders";

interface DispatchDrawerHeaderProps {
  order?: DispatchOrderWithRelations | null;
  canCancelOrder?: boolean;
  onCancelOrder?: () => void;
  statusDisplay: {
    label: string;
    timeInfo: string;
    urgency: 'normal' | 'high' | 'critical';
    dotColor: string;
  };
}

export function DispatchDrawerHeader({
  order,
  statusDisplay,
  canCancelOrder = false,
  onCancelOrder,
}: DispatchDrawerHeaderProps) {
  return (
    <div className="shrink-0 bg-white border-b border-gray-200">
      <div className="flex items-start justify-between px-6 py-3" style={{ minHeight: '60px' }}>
        <div className="flex flex-col gap-1">
          {/* Fila 1: Número de despacho */}
          <div className="flex items-center gap-2">
            <h2 className="text-md font-medium text-gray-900">
              {order?.dispatch_number || order?.id || "D #12345678"}
            </h2>
          </div>
          
          {/* Fila 2: Estado + TTL lado a lado */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <div
                className="w-2 h-2 rounded-full shrink-0"
                style={{ backgroundColor: statusDisplay.dotColor }}
              />
              <span className="text-xs font-medium text-gray-900">
                {statusDisplay.label}
              </span>
            </div>
            {statusDisplay.timeInfo && (
              <span className="text-xs text-gray-500">
                {statusDisplay.timeInfo}
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1">
          <DropdownMenu modal={false}>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 hover:bg-gray-100 rounded-md"
              >
                <MoreVertical className="w-4 h-4 text-gray-600" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48" portalled={false}>
              <DropdownMenuItem
                variant="destructive"
                disabled={!canCancelOrder}
                className="cursor-pointer"
                onClick={() => {
                  if (canCancelOrder) onCancelOrder?.();
                }}
              >
                <XCircle className="w-4 h-4" />
                <span className="text-xs">Cancelar orden</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <DrawerClose asChild>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 hover:bg-gray-100 rounded-md"
            >
              <X className="w-4 h-4 text-gray-600" />
            </Button>
          </DrawerClose>
        </div>
      </div>
    </div>
  );
}
