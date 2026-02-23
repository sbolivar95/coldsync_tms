import { X, MoreVertical } from "lucide-react";
import { Button } from "../../../../components/ui/Button";
import { DrawerClose } from "../../../../components/ui/Drawer";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../../../../components/ui/DropdownMenu";
import { CarrierOrder } from "../../../../services/database/orders.service";

interface OrderDrawerHeaderProps {
  order?: CarrierOrder | null;
  statusDisplay: {
    label: string;
    timeInfo: string;
    urgency: 'normal' | 'high' | 'critical';
    dotColor: string;
  };
}

export function OrderDrawerHeader({ order, statusDisplay }: OrderDrawerHeaderProps) {
  return (
    <div className="shrink-0 bg-white border-b border-gray-200">
      <div className="flex items-start justify-between px-6 py-3" style={{ minHeight: '60px' }}>
        <div className="flex flex-col gap-1">
          {/* Fila 1: ID de la orden + Prioridad */}
          <div className="flex items-center gap-2">
            <h2 className="text-md font-medium text-gray-900">
              {order?.id || "ME #12345678"}
            </h2>
            {/* Priority handling omitted or needs update for CarrierOrder */}
            {/* 
            {order?.priority && order.priority !== 'normal' && (
              <Badge 
                variant="secondary"
                className={`text-[9px] font-bold px-1.5 py-0.5 ${
                  order.priority === 'critical' 
                    ? 'bg-red-100 text-red-700 hover:bg-red-100' 
                    : 'bg-amber-100 text-amber-700 hover:bg-amber-100'
                }`}
              >
                {order.priority === 'critical' ? 'CRÍTICA' : 'ALTA'}
              </Badge>
            )}
            */}
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

        <div className="flex items-center gap-1 -mt-1">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 hover:bg-gray-100 rounded-md"
              >
                <MoreVertical className="w-4 h-4 text-gray-600" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem>
                <span className="text-xs">Acción 1</span>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <span className="text-xs">Acción 2</span>
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
