import { useDrop } from "react-dnd";
import { Circle, AlertTriangle } from "lucide-react";
import { useRef } from "react";

interface VehicleDropZoneProps {
  unit: any;
  getStatusDotColor: (status: string, hasActiveTrip: boolean) => string;
  onDrop: (item: any, vehicleId: string, dayOffset: number) => void;
  children: React.ReactNode;
  existingTrips?: any[]; // Viajes actuales en este vehículo
  dayColWidth?: number;
}

export function VehicleDropZone({ 
  unit, 
  getStatusDotColor, 
  onDrop, 
  children,
  existingTrips = [],
  dayColWidth = 160,
}: VehicleDropZoneProps) {
  const dropZoneRef = useRef<HTMLDivElement>(null);

  // Función para calcular el primer día disponible (después del último RTA)
  const getFirstAvailableDay = () => {
    if (existingTrips.length === 0) {
      return 0; // Si no hay viajes, disponible desde el día 0
    }

    // Encontrar el viaje que termina más tarde (incluyendo RTA)
    const lastEndDay = Math.max(
      ...existingTrips.map((trip) => {
        // Calcular fin = dayOffset + duration + rtaDuration
        return trip.dayOffset + trip.duration + (trip.rtaDuration || 0);
      })
    );

    return lastEndDay;
  };

  const [{ isOver, canDropItem }, drop] = useDrop(() => ({
    accept: ["ORDER", "TRIP"],
    drop: (item: any, monitor) => {
      if (!dropZoneRef.current) return;

      const clientOffset = monitor.getClientOffset();
      if (!clientOffset) return;

      const dropZoneRect = dropZoneRef.current.getBoundingClientRect();
      const relativeX = clientOffset.x - dropZoneRect.left;
      
      // Calcular en qué día se soltó la tarjeta
      const targetDayOffset = Math.floor(relativeX / dayColWidth);
      
      // Obtener el primer día disponible
      const firstAvailableDay = getFirstAvailableDay();
      
      // Si intenta soltar antes del primer día disponible, forzar al primer día disponible
      const finalDayOffset = Math.max(targetDayOffset, firstAvailableDay);
      
      console.log(`Dropping on vehicle ${unit.id} at day ${finalDayOffset} (target: ${targetDayOffset}, min: ${firstAvailableDay})`);
      
      onDrop(item, unit.id, finalDayOffset);
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
      canDropItem: monitor.canDrop(),
    }),
  }), [existingTrips, dayColWidth]);

  const firstAvailableDay = getFirstAvailableDay();
  const isActive = isOver && canDropItem;

  // Combinar refs
  const setRefs = (el: HTMLDivElement) => {
    drop(el);
    dropZoneRef.current = el;
  };

  return (
    <div
      className={`flex h-[84px] border-b border-gray-100 relative group transition-colors ${
        isActive ? "bg-blue-50/50" : ""
      }`}
    >
      {/* Indicador visual cuando está sobre la zona de drop */}
      {isActive && (
        <div className="absolute inset-0 border-2 border-primary border-dashed rounded-md pointer-events-none z-50" />
      )}

      {/* Indicador de primer día disponible */}
      {isActive && firstAvailableDay > 0 && (
        <div 
          className="absolute top-1 z-40 pointer-events-none"
          style={{
            left: `${260 + firstAvailableDay * dayColWidth}px`,
            width: `${dayColWidth}px`,
          }}
        >
          <div className="bg-green-500 text-white text-[9px] px-1 py-0.5 rounded text-center font-medium">
            Disponible aquí
          </div>
        </div>
      )}

      {/* Columna de Unidad (Sticky Left - Fija horizontalmente) */}
      <div
        className={`sticky left-0 z-30 bg-white border-r border-gray-300 transition-all cursor-pointer flex flex-col justify-center group-hover:bg-[#e5edff]`}
        style={{
          width: "260px",
          padding: "0 12px",
        }}
      >
        {/* Indicador de hover */}
        <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary opacity-0 group-hover:opacity-100 transition-opacity" />

        {/* Info Unidad */}
        <div className="flex items-center gap-1.5 mb-1">
          <Circle
            className={`w-2 h-2 shrink-0 ${getStatusDotColor(
              unit.status,
              unit.hasActiveTrip
            )}`}
          />
          <span className="font-semibold text-xs text-gray-900">
            {unit.unit}
          </span>
          <span className="text-xs text-gray-400 flex items-center gap-1">
            {unit.trailer}
            {/* ✅ Badge HYB para remolques híbridos - inline después del ID */}
            {unit.trailerEsHibrido && (
              <span className="inline-flex items-center px-1 py-0.5 rounded text-[9px] font-bold bg-hibrido-bg text-hibrido-text">
                HYB
              </span>
            )}
          </span>
          {unit.hasIssue && (
            <AlertTriangle className="w-3 h-3 text-orange-500 ml-auto" />
          )}
        </div>
        <div className="text-xs text-gray-600 pl-3.5">{unit.driver}</div>
      </div>

      {/* Horizonte de tiempo (Se mueve horizontalmente) */}
      <div 
        ref={setRefs}
        className={`flex-1 relative group-hover:bg-[#f8faff] transition-all`}
      >
        {children}
      </div>
    </div>
  );
}

