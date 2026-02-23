import { Circle, AlertTriangle } from "lucide-react";
import { TrackingUnit } from "../utils/mock-data";

interface UnitCardProps {
  unit: TrackingUnit;
  isSelected: boolean;
  onClick: () => void;
}

export function UnitCard({ unit, isSelected, onClick }: UnitCardProps) {
  const getStatusDotColor = (status: string, hasActiveTrip: boolean) => {
    // Si no tiene viaje activo, mostrar círculo outline gris
    if (!hasActiveTrip) {
      return "fill-none stroke-gray-400 stroke-[1.5]";
    }

    // Si tiene viaje activo, mostrar color según estado
    switch (status) {
      case "En Ruta":
        return "fill-tracking-driving text-tracking-driving";
      case "Detenido":
        return "fill-tracking-stopped text-tracking-stopped";
      case "En Planta":
        return "fill-tracking-idle text-tracking-idle";
      default:
        return "fill-tracking-offline text-tracking-offline";
    }
  };

  const getErrorSeverityColor = (severity: string) => {
    switch (severity) {
      case "critical":
        return "text-red-600";
      case "warning":
        return "text-orange-500";
      case "info":
        return "text-primary";
      default:
        return "text-gray-600";
    }
  };

  return (
    <button
      onClick={onClick}
      className={`w-full h-32 px-4 py-2.5 border-b border-gray-100 hover:bg-gray-50 transition-colors text-left flex flex-col justify-between ${isSelected ? "bg-primary-light" : ""
        }`}
    >
      {/* Línea 1: ID Vehículo/Remolque + Velocidad/Tiempo + Estado */}
      <div className="flex items-start justify-between mb-1.5">
        <div className="flex flex-col gap-0.5">
          <div className="flex items-center gap-1.5">
            <Circle
              className={`w-2 h-2 shrink-0 ${getStatusDotColor(unit.status, unit.hasActiveTrip)}`}
            />
            <span className="font-semibold text-sm text-gray-900">
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
          </div>
          {/* Línea 2: Conductor */}
          <div className="text-xs text-gray-900">{unit.driver}</div>
        </div>
        <div className="flex flex-col items-end shrink-0">
          <span className="text-sm font-semibold text-gray-900">
            {unit.speed}
          </span>
          <span className="text-[11px] text-gray-400">{unit.lastUpdate}</span>
        </div>
      </div>

      {/* Línea 3: Ubicación */}
      <div className="text-xs text-gray-500 mb-1.5 truncate">
        {unit.location}
      </div>

      {/* Línea 4: Datos del Reefer CAN - siempre mostrar para mantener altura consistente */}
      <div className="text-xs text-gray-500 pt-1.5 border-t border-gray-100 flex items-center justify-between gap-2">
        {unit.reeferMode && unit.reeferSetpoint ? (
          <>
            <div className="truncate flex-1 min-w-0 text-[12px]">
              <span className="text-gray-400 text-[12px]">Modo:</span>{" "}
              {unit.reeferMode}
              <span className="text-gray-300 mx-1.5">·</span>
              <span className="text-gray-400 text-[12px]">Setpoint:</span>{" "}
              {unit.reeferSetpoint}
              <span className="text-gray-300 mx-1.5">·</span>
              <span className="text-gray-400 text-[12px]">Temp:</span>{" "}
              {unit.temperature}
            </div>
            {unit.reeferError && (
              <div
                className={`flex items-center gap-1 ${getErrorSeverityColor(unit.reeferError.severity)} font-semibold shrink-0`}
              >
                <AlertTriangle className="w-3 h-3" />
                <span>{unit.reeferError.code}</span>
              </div>
            )}
          </>
        ) : (
          <span className="text-gray-400 italic">
            Sin datos CAN disponibles
          </span>
        )}
      </div>
    </button>
  );
}