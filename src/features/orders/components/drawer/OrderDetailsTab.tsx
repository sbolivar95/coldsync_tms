import { 
  isOrderHybrid,
  getEquipmentType
} from "../../utils/orders-helpers";
import { CarrierOrder } from "../../../../services/database/orders.service";
import type { Route } from "../../../../lib/mockData";
import { OrderTimelineStop } from "./OrderTimelineStop";
import { Button } from "../../../../components/ui/Button";
import { RefreshCw } from "lucide-react";

interface OrderDetailsTabProps {
  order: CarrierOrder;
  currentRoute: Route | null;
  onChangeFleetset?: () => void;
}

export function OrderDetailsTab({ order, currentRoute, onChangeFleetset }: OrderDetailsTabProps) {
  const isHybrid = isOrderHybrid(order);
  const equipmentType = getEquipmentType(order);
  
  // Calcular peso total
  let totalWeight = "0";
  if (order.items && order.items.length > 0) {
      const sum = order.items.reduce((acc, item) => acc + item.quantity, 0);
      totalWeight = sum.toString();
  }

  // Obtener producto
  let productName = "";
  if (order.items && order.items.length > 0) {
      productName = order.items.map(i => i.product?.name || i.item_name).join(", ");
  } else {
      productName = "-";
  }

  // Obtener distancia real
  const displayDistance = order.lane?.distance ? `${order.lane.distance} km` : "-";

  // Build stops array from real lane data or fallback
  let stops: { name: string, city?: string, address?: string, time?: string, type: 'pickup' | 'dropoff' }[] = [];
  
  if (order.lane && order.lane.lane_stops) {
      const sortedStops = [...order.lane.lane_stops].sort((a, b) => a.stop_order - b.stop_order);
      stops = sortedStops.map((s, idx) => ({
          name: s.location.name,
          city: s.location.city,
          type: idx === 0 ? 'pickup' : 'dropoff', // Simplificado
          time: idx === 0 ? order.planned_start_at : (idx === sortedStops.length - 1 ? (order.planned_end_at || "") : "")
      }));
  } else if (currentRoute) {
       // Fallback logic kept for safety
      stops = [
        ...(currentRoute.origins || []).map(s => ({ name: s, type: 'pickup' as const })),
        ...(currentRoute.waypoints || []).map(s => ({ name: s, type: 'dropoff' as const })),
        ...(currentRoute.destinations || []).map(s => ({ name: s, type: 'dropoff' as const }))
      ];
  }

  return (
    <div className="space-y-6">
      {/* Sección: Información de la Orden */}
      <div>
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-[10px] font-medium text-gray-500 uppercase tracking-wide mb-1"># Orden</div>
              <div className="text-xs font-semibold text-gray-900">{order.dispatch_number || order.id}</div>
            </div>
            <div>
              <div className="text-[10px] font-medium text-gray-500 uppercase tracking-wide mb-1">Configuración</div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-semibold text-gray-900">
                  {isHybrid ? "Híbrido" : "Estándar"}
                </span>
                {isHybrid && (
                  <span className="bg-blue-100 text-primary px-1 py-0.5 rounded text-[9px] font-bold">HYB</span>
                )}
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-6">
            <div>
              <div className="text-[10px] font-medium text-gray-500 uppercase tracking-wide mb-1">Producto</div>
              <div className="text-xs font-semibold text-gray-900">{productName}</div>
            </div>
            <div>
              <div className="text-[10px] font-medium text-gray-500 uppercase tracking-wide mb-1">Perfil Térmico</div>
              <div className="text-xs font-semibold text-gray-900">{equipmentType}</div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div>
              <div className="text-[10px] font-medium text-gray-500 uppercase tracking-wide mb-1">Peso</div>
              <div className="text-xs font-semibold text-gray-900">
                {totalWeight === "0" ? "-" : `${totalWeight} Tn`}
              </div>
            </div>
            <div>
              <div className="text-[10px] font-medium text-gray-500 uppercase tracking-wide mb-1">Distancia</div>
              <div className="text-xs font-semibold text-gray-900">{displayDistance}</div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-[10px] font-medium text-gray-500 uppercase tracking-wide mb-1">Tipo de Viaje</div>
              <div className="text-xs font-semibold text-gray-900">Ida / Vuelta</div>
            </div>
            <div>
              <div className="text-[10px] font-medium text-gray-500 uppercase tracking-wide mb-1">Tipo de Carril</div>
              <div className="text-xs font-semibold text-gray-900">Nacional</div>
            </div>
          </div>
        </div>
      </div>

      {/* Separador */}
      <div className="border-t border-gray-200" />

      {/* Sección: Fleetset Asignado */}
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
              Cambiar
            </Button>
          )}
        </div>
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-6">
            <div>
              <div className="text-[10px] font-medium text-gray-500 uppercase tracking-wide mb-1">Vehículo</div>
              <div className="text-xs font-semibold text-gray-900">
                {order.fleet_set?.vehicle?.unit_code || "Sin Asignar"}
              </div>
            </div>
            <div>
              <div className="text-[10px] font-medium text-gray-500 uppercase tracking-wide mb-1">Remolque</div>
              <div className="text-xs font-semibold text-gray-900">
                {order.fleet_set?.trailer?.plate || "Sin Asignar"}
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-6">
            <div>
              <div className="text-[10px] font-medium text-gray-500 uppercase tracking-wide mb-1">Conductor</div>
              <div className="text-xs font-semibold text-gray-900">{order.fleet_set?.driver?.name || "Sin Asignar"}</div>
            </div>
            <div>
              {/* Espacio vacío para mantener el grid balanceado */}
            </div>
          </div>
        </div>
      </div>

      {/* Separador */}
      {stops.length > 0 && <div className="border-t border-gray-200" />}

      {/* Sección: Timeline de Paradas */}
      {stops.length > 0 && (
        <div className="pb-6">
          {/* Timeline */}
          <div className="space-y-0">
            {stops.map((stop, index) => {
              const isFirst = index === 0;
              const isLast = index === stops.length - 1;
              
              // Mock location lookup or use real data if we had it fully enriched
              // For now assuming stop.name is the location name
              const location = { name: stop.name, city: stop.city, address: "" };

              return (
                <OrderTimelineStop
                  key={`${stop.name}-${index}`}
                  index={index}
                  stopName={stop.name}
                  location={location}
                  isFirst={isFirst}
                  isLast={isLast}
                  type={stop.type}
                  time={stop.time}
                />
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
