import { Circle, AlertTriangle } from "lucide-react";
import { cn } from "../../../lib/utils";

/**
 * UNIT CARD COMPONENT - ColdSync
 * 
 * Componente reutilizable que replica exactamente la columna izquierda del VehicleDropZone.
 * Muestra la información de una unidad (vehículo) con su estado, ID, trailer, conductor, etc.
 * 
 * Características:
 * - Indicador de estado (círculo)
 * - ID de unidad y trailer
 * - Badge HYB para remolques híbridos
 * - Icono de advertencia para problemas
 * - Nombre del conductor
 * - Hover effects y selección
 * 
 * @example
 * ```tsx
 * <UnitCard
 *   unit={unitData}
 *   getStatusDotColor={(status, hasActiveTrip) => "fill-green-500"}
 *   isSelected={true}
 *   onClick={() => handleClick()}
 * />
 * ```
 */

export interface UnitCardUnit {
  id: string;
  unit: string; // ID de la unidad (ej: TRK-1024)
  trailer?: string; // ID del remolque (ej: RMQ-456)
  driver: string;
  status: string;
  hasActiveTrip?: boolean;
  trailerEsHibrido?: boolean;
  hasIssue?: boolean;
}

export interface UnitCardProps {
  /** Datos de la unidad */
  unit: UnitCardUnit;
  /** Función para obtener el color del indicador de estado */
  getStatusDotColor: (status: string, hasActiveTrip: boolean) => string;
  /** Si la unidad está seleccionada */
  isSelected?: boolean;
  /** Callback cuando se hace click en la tarjeta */
  onClick?: () => void;
  /** Ancho de la tarjeta (default: 260px como en VehicleDropZone) */
  width?: string | number;
  /** Clases CSS adicionales */
  className?: string;
  /** Si muestra el hover effect (default: true) */
  showHover?: boolean;
}

/**
 * Componente UnitCard
 * 
 * Réplica exacta de la columna izquierda del VehicleDropZone como componente reutilizable.
 */
export function UnitCard({
  unit,
  getStatusDotColor,
  isSelected = false,
  onClick,
  width = "260px",
  className,
  showHover = true,
}: UnitCardProps) {
  return (
    <div
      className={cn(
        "bg-white border-r border-gray-300 transition-all flex flex-col justify-center cursor-pointer",
        showHover && "group",
        showHover && !isSelected && "hover:bg-[#e5edff]",
        isSelected && "bg-blue-50 border-l-4 border-l-blue-500",
        className
      )}
      style={{
        width: typeof width === "number" ? `${width}px` : width,
        padding: "0 12px",
        minHeight: "84px", // Misma altura que VehicleDropZone
      }}
      onClick={onClick}
    >
      {/* Indicador de hover (igual que VehicleDropZone) */}
      {showHover && (
        <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary opacity-0 group-hover:opacity-100 transition-opacity" />
      )}

      {/* Info Unidad - Réplica exacta del VehicleDropZone */}
      <div className="flex items-center gap-1.5 mb-1">
        <Circle
          className={cn(
            "w-2 h-2 shrink-0",
            getStatusDotColor(unit.status, unit.hasActiveTrip || false)
          )}
        />
        <span className="font-semibold text-xs text-gray-900">
          {unit.unit}
        </span>
        {unit.trailer && (
          <span className="text-xs text-gray-400 flex items-center gap-1">
            {unit.trailer}
            {/* Badge HYB para remolques híbridos - inline después del ID */}
            {unit.trailerEsHibrido && (
              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold bg-hibrido-bg text-hibrido-text">
                HYB
              </span>
            )}
          </span>
        )}
        {unit.hasIssue && (
          <AlertTriangle className="w-3 h-3 text-orange-500 ml-auto" />
        )}
      </div>
      <div className="text-xs text-gray-600 pl-3.5">{unit.driver}</div>
    </div>
  );
}
