import { DraggableOrder } from "../../../features/dispatch/views/gantt/DraggableOrder";
import { getSubstatusDisplay } from "../../../types/dispatchOrderStateMachine";

/**
 * UNASSIGNED ORDERS LIST COMPONENT - ColdSync
 * 
 * Componente que renderiza la lista de órdenes agrupadas por día.
 */

export interface UnassignedOrder {
    id: string;
    day: string;
    count: number;
    orders: any[];
}

export interface UnassignedOrdersListProps {
    /** Órdenes agrupadas por día */
    groups: any[];
    /** IDs de órdenes seleccionadas */
    selectedIds: Set<string>;
    /** Callback cuando se selecciona/deselecciona una orden */
    onSelectOrder: (id: string, checked: boolean) => void;
    /** Callback cuando se hace click en una orden para ver detalle */
    onOrderClick: (order: any) => void;
}

export function UnassignedOrdersList({
    groups,
    selectedIds,
    onSelectOrder,
    onOrderClick,
}: UnassignedOrdersListProps) {
    return (
        <div className="flex-1 overflow-y-auto">
            {groups.map((group) => (
                <div key={group.day} className="mb-4">
                    <div className="px-3 py-2 bg-gray-50 border-b border-gray-200 sticky top-0 z-10">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-medium text-gray-600 uppercase">
                                {group.day}
                            </span>
                            <span className="text-xs text-gray-500">
                                ({group.count})
                            </span>
                        </div>
                    </div>
                    <div className="px-3 py-2 space-y-1.5">
                        {group.orders.map((order: any) => (
                            <DraggableOrder
                                key={order.id}
                                order={order}
                                isSelected={selectedIds.has(order.id)}
                                onSelect={onSelectOrder}
                                onClick={() => onOrderClick(order)}
                            />
                        ))}
                    </div>
                </div>
            ))}

            {groups.length === 0 && (
                <div className="p-8 text-center text-sm text-gray-400 font-medium">
                    No hay órdenes disponibles
                </div>
            )}
        </div>
    );
}
