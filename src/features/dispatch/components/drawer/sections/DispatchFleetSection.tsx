import { Button } from "../../../../../components/ui/Button";
import { RefreshCw } from "lucide-react";
import type { DispatchOrderWithRelations } from "../../../hooks/useDispatchOrders";

interface DispatchFleetSectionProps {
  order: DispatchOrderWithRelations;
  onChangeFleetset?: () => void;
}

export function DispatchFleetSection({ order, onChangeFleetset }: DispatchFleetSectionProps) {
  const hasFleetset = !!order.fleet_set_id;
  
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-sm font-semibold text-gray-900">
          Flota Asignada
        </h3>
        {onChangeFleetset && (
          <Button 
            variant="ghost" 
            size="sm" 
            className="text-xs text-primary hover:text-primary-focus gap-1.5 h-6 px-2"
            onClick={onChangeFleetset}
          >
            <RefreshCw className="w-3 h-3" />
            {hasFleetset ? "Cambiar" : "Asignar"}
          </Button>
        )}
      </div>
      <div className="space-y-6">
        <div className="grid grid-cols-2 gap-6">
          <div>
            <div className="text-[10px] font-medium text-gray-500 uppercase tracking-wide mb-1">Vehículo</div>
            <div className="text-xs font-semibold text-gray-900">
              {order.fleet_sets?.vehicles?.unit_code || "Sin Asignar"}
            </div>
          </div>
          <div>
            <div className="text-[10px] font-medium text-gray-500 uppercase tracking-wide mb-1">Remolque</div>
            <div className="text-xs font-semibold text-gray-900">
              {order.fleet_sets 
                ? (order.fleet_sets.trailers?.plate || "Sin Remolque")
                : "Sin Asignar"}
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-6">
          <div>
            <div className="text-[10px] font-medium text-gray-500 uppercase tracking-wide mb-1">Conductor</div>
            <div className="text-xs font-semibold text-gray-900">{order.fleet_sets?.drivers?.name || "Sin Asignar"}</div>
          </div>
          <div>
            {/* Espacio vacío para mantener el grid balanceado */}
          </div>
        </div>
      </div>
    </div>
  );
}
