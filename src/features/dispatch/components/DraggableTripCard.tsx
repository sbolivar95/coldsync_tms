import { useDrag } from "react-dnd";
import { TripCard } from "./TripCard";
import { mapStatusToEnglish } from "../../../lib/mockData";

interface DraggableTripCardProps {
  trip: any;
  style: React.CSSProperties;
  onClick: () => void;
  tripPercent: number;
  rtaPercent: number;
}

export function DraggableTripCard({ 
  trip, 
  style, 
  onClick, 
  tripPercent, 
  rtaPercent 
}: DraggableTripCardProps) {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: "TRIP",
    item: { tripId: trip.orderId, vehicleId: trip.vehicleId, trip },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  }));

  return (
    <div
      ref={drag as any}
      className="absolute top-[7px] h-[70px] flex shadow-sm rounded-md overflow-hidden transition-transform hover:scale-[1.02] cursor-move z-10"
      style={{
        ...style,
        opacity: isDragging ? 0.5 : 1,
      }}
    >
      {/* Parte del Viaje */}
      <div
        style={{
          width: `${tripPercent}%`,
        }}
      >
        <TripCard
          configuration={trip.configuracion || trip.configuration}
          route={trip.route}
          weight="12 Tn"
          status={mapStatusToEnglish(trip.estado || trip.status || "sin-asignar")}
          isHybrid={trip.esHibrida || trip.isHybrid} // ✅ Pasar prop isHybrid
          className="h-full"
          onClick={onClick}
        />
      </div>

      {/* Parte del RTA */}
      {trip.hasRTA && (
        <div
          className="rounded-r h-full bg-gray-100 flex items-center justify-center shrink-0 border-l border-white/50"
          style={{
            width: `${rtaPercent}%`,
            backgroundImage:
              "repeating-linear-gradient(45deg, transparent, transparent 2px, rgba(0,0,0,0.03) 2px, rgba(0,0,0,0.03) 4px)",
          }}
          title="Return to Availability"
        >
          <span className="text-[8px] text-gray-400 font-bold -rotate-90">
            RTA
          </span>
        </div>
      )}
    </div>
  );
}

