import type { DispatchOrderWithRelations } from "../../../hooks/useDispatchOrders";

interface DispatchCompartmentDetailsProps {
  order: DispatchOrderWithRelations;
}

export function DispatchCompartmentDetails({ order }: DispatchCompartmentDetailsProps) {
  const isHybrid = order.dispatch_order_items && order.dispatch_order_items.length > 1;

  if (!isHybrid || !order.dispatch_order_items || order.dispatch_order_items.length === 0) {
    return null;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-sm font-semibold text-gray-900">
          Detalle de Compartimientos
        </h3>
      </div>
      <div className="space-y-6">
        {order.dispatch_order_items.map((item, idx) => (
          <div key={item.id}>
            <div className="flex items-center gap-2 mb-4">
              <div className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 text-primary text-[10px] font-bold">
                {idx + 1}
              </div>
              <span className="text-xs font-semibold text-gray-900">
                {item.quantity} Tn
              </span>
            </div>
            <div className="grid grid-cols-2 gap-6">
              <div>
                <div className="text-[10px] font-medium text-gray-500 uppercase tracking-wide mb-1">
                  Producto
                </div>
                <div className="text-xs font-semibold text-gray-900">
                  {item.products?.name || item.item_name || '-'}
                </div>
              </div>
              <div>
                <div className="text-[10px] font-medium text-gray-500 uppercase tracking-wide mb-1">
                  Perfil Térmico
                </div>
                <div className="text-xs font-semibold text-gray-900">
                  {item.thermal_profile?.name || '-'}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
