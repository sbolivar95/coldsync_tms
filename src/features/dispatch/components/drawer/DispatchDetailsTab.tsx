import { DispatchOrderWithRelations } from "../../hooks/useDispatchOrders";
import { 
  DispatchSchedulingEditor,
  DispatchCompartmentDetails,
  DispatchFleetSection,
  DispatchTimelineSection
} from "./sections";

interface DispatchDetailsTabProps {
  order: DispatchOrderWithRelations;
  onChangeFleetset?: () => void;
  onUpdateOrder?: (orderId: string, updates: Partial<DispatchOrderWithRelations>) => Promise<void>;
}

export function DispatchDetailsTab({ order, onChangeFleetset, onUpdateOrder }: DispatchDetailsTabProps) {
  // Determinar si es híbrido basado en items
  const isHybrid = order.dispatch_order_items && order.dispatch_order_items.length > 1;
  
  // Calcular peso total
  let totalWeight = "0";
  if (order.dispatch_order_items && order.dispatch_order_items.length > 0) {
    const sum = order.dispatch_order_items.reduce((acc, item) => acc + item.quantity, 0);
    totalWeight = sum.toString();
  }

  // Obtener producto(s)
  let productName = "";
  if (order.dispatch_order_items && order.dispatch_order_items.length > 0) {
    productName = order.dispatch_order_items.map(i => i.products?.name || i.item_name).join(", ");
  } else {
    productName = "-";
  }

  // Obtener perfil térmico
  let thermalProfile = "-";
  if (order.dispatch_order_items && order.dispatch_order_items.length > 0) {
    const profiles = order.dispatch_order_items
      .map(i => i.thermal_profile?.name)
      .filter(Boolean);
    thermalProfile = profiles.length > 0 ? profiles.join(", ") : "-";
  }

  // Obtener distancia real
  const displayDistance = order.lanes?.distance ? `${order.lanes.distance} km` : "-";

  return (
    <div className="space-y-6">
      {/* Sección: Información de la Orden */}
      <div>
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-[10px] font-medium text-gray-500 uppercase tracking-wide mb-1"># Despacho</div>
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
              <div className="text-xs font-semibold text-gray-900">{thermalProfile}</div>
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
              <div className="text-[10px] font-medium text-gray-500 uppercase tracking-wide mb-1">Carril</div>
              <div className="text-xs font-semibold text-gray-900">
                {order.lanes?.name || order.lanes?.lane_id || "-"}
              </div>
            </div>
            <div>
              <div className="text-[10px] font-medium text-gray-500 uppercase tracking-wide mb-1">Tipo de Carril</div>
              <div className="text-xs font-semibold text-gray-900">
                {order.lanes?.lane_types?.name || "-"}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Separador */}
      <div className="border-t border-gray-200" />

      {/* Sección: Programación */}
      <DispatchSchedulingEditor order={order} onUpdateOrder={onUpdateOrder} />

      {/* Separador y Sección: Detalle de Compartimientos (solo para Híbrido) */}
      {isHybrid && (
        <>
          <div className="border-t border-gray-200" />
          <DispatchCompartmentDetails order={order} />
        </>
      )}

      {/* Separador */}
      <div className="border-t border-gray-200" />

      {/* Sección: Fleetset Asignado */}
      <DispatchFleetSection order={order} onChangeFleetset={onChangeFleetset} />

      {/* Separador */}
      {order.lanes && order.lanes.lane_stops && order.lanes.lane_stops.length > 0 && (
        <div className="border-t border-gray-200" />
      )}

      {/* Sección: Timeline de Paradas */}
      <DispatchTimelineSection order={order} />
    </div>
  );
}
