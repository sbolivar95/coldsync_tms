import { useDrag } from "react-dnd";
import { TripCard } from "./TripCard";
import { Checkbox } from "../../../components/ui/Checkbox";
import { getRouteNameById, mapStatusToEnglish } from "../../../lib/mockData";

interface DraggableOrderProps {
  order: any;
  isSelected: boolean;
  onSelect: (orderId: string, checked: boolean) => void;
  onClick: () => void;
}

export function DraggableOrder({ order, isSelected, onSelect, onClick }: DraggableOrderProps) {
  const isCancelled = order.estado === "cancelada" || order.status === "cancelled";
  
  const [{ isDragging }, drag] = useDrag(() => ({
    type: "ORDER",
    item: { orderId: order.id, order },
    canDrag: !isCancelled, // ❌ No permitir arrastrar órdenes canceladas
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  }));

  // Ref condicional para drag
  const dragRef = !isCancelled ? drag : undefined;

  return (
    <div 
      className={`flex items-center gap-2 ${isCancelled ? 'pointer-events-none' : ''}`}
      style={{
        opacity: isDragging ? 0.5 : 1,
        cursor: isCancelled ? 'not-allowed' : (isDragging ? "grabbing" : "grab"),
      }}
    >
      {/* Checkbox fuera del card - NO mostrar para canceladas */}
      {!isCancelled && (
        <Checkbox
          checked={isSelected}
          onCheckedChange={(checked) => onSelect(order.id, checked === true)}
        />
      )}
      {/* Espaciador para alinear órdenes canceladas sin checkbox */}
      {isCancelled && <div className="w-4" />}
      
      {/* Card arrastrable */}
      <div ref={dragRef as any} className="flex-1">
        <TripCard
          configuration={order.configuracion || order.configuration}
          route={getRouteNameById(order.ruta || order.routeId)}
          weight={`${order.peso || order.weight} Tn`}
          status={mapStatusToEnglish(order.estado || order.status || "sin-asignar")}
          isHybrid={order.esHibrida || order.isHybrid} // ✅ Pasar prop isHybrid
          onClick={!isCancelled ? onClick : undefined}
        />
      </div>
    </div>
  );
}

