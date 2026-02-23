import { TriangleAlert } from "lucide-react";
import { TrackingUnit } from "../types";
import { formatSignalAgeCompact, resolveSignalAgeSeconds } from "../utils/signal-age";
import { MobilityIndicator } from "./MobilityIndicator";

interface UnitCardProps {
  unit: TrackingUnit;
  isSelected: boolean;
  onClick: () => void;
  nowMs: number;
}

export function UnitCard({ unit, isSelected, onClick, nowMs }: UnitCardProps) {
  const liveAgeSec = resolveSignalAgeSeconds(unit, nowMs);
  const connectionAgeLabel = unit.hasKnownMessage
    ? formatSignalAgeCompact(liveAgeSec)
    : "Nunca";

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
      {/* Line 1: Vehicle/Trailer ID + Speed/Time + Status */}
      <div className="flex items-start justify-between mb-1.5">
        <div className="flex flex-col gap-0.5">
          <div className="flex items-center gap-1.5">
            <MobilityIndicator unit={unit} arrowSize={13} shapeSize={10} />
            <span className="text-sm font-semibold text-gray-900 leading-none">
              {unit.unit}
            </span>
            {unit.isHybridTrailer && (
              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold bg-blue-50 text-primary">
                HYB
              </span>
            )}
          </div>
          {/* Line 2: Trailer + Driver (or just Driver for rigid/van) */}
          <div className="text-xs text-gray-500 truncate">
            {unit.trailer
              ? [unit.trailer, unit.driver].filter(Boolean).join(" · ")
              : unit.driver}
          </div>
        </div>
        <div className="flex flex-col items-end shrink-0">
          <span className="text-sm font-semibold text-gray-900">
            {unit.speed}
          </span>
          <span className="text-[11px] text-gray-400">{connectionAgeLabel}</span>
        </div>
      </div>

      {/* Line 3: Location */}
      <div className="text-xs text-gray-500 mb-1.5 truncate">
        {unit.location}
      </div>

      {/* Line 4: Reefer CAN data - always show to maintain consistent height */}
      <div className="text-xs text-gray-500 pt-1.5 border-t border-gray-100 flex items-center justify-between gap-2">
        <div className="truncate flex-1 min-w-0 text-[12px]">
          {unit.hasCan && (
            <>
              <span className="text-gray-400 text-[12px]">Modo:</span>{" "}
              {unit.reeferMode}
              <span className="text-gray-300 mx-1.5">·</span>
              <span className="text-gray-400 text-[12px]">Setpoint:</span>{" "}
              {unit.reeferSetpoint}
              <span className="text-gray-300 mx-1.5">·</span>
            </>
          )}
          <span className="text-gray-400 text-xs">
            {unit.tempMode === "MULTI" ? "Temp 1|2:" : "Temp:"}
          </span>{" "}
          {unit.tempMode === "MULTI" ? (
            <span className="inline-flex items-center gap-1 text-gray-600 font-semibold text-[11px]">
              <span className="inline-flex items-center gap-0.5">
                <span>{unit.temperatureChannel1 ?? "--"}</span>
                {unit.hasTemperatureChannel1Error && (
                  <span title="Error en sensor de temperatura 1">
                    <TriangleAlert className="w-3 h-3 text-orange-500 align-middle" />
                  </span>
                )}
              </span>
              <span className="text-gray-300 mx-0.5">|</span>
              <span className="inline-flex items-center gap-0.5">
                <span>{unit.temperatureChannel2 ?? "--"}</span>
                {unit.hasTemperatureChannel2Error && (
                  <span title="Error en sensor de temperatura 2">
                    <TriangleAlert className="w-3 h-3 text-orange-500 align-middle" />
                  </span>
                )}
              </span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-0.5 text-gray-600 font-semibold text-[11px]">
              <span>{unit.temperature}</span>
              {unit.hasTemperatureError && (
                <span title="Error de sensor de temperatura">
                  <TriangleAlert className="w-3 h-3 text-orange-500 align-middle" />
                </span>
              )}
            </span>
          )}
        </div>
        {unit.reeferError && (
          <div
            className={`flex items-center gap-1 ${getErrorSeverityColor(unit.reeferError.severity)} font-semibold shrink-0`}
          >
            <TriangleAlert className="w-3 h-3" />
            <span>{unit.reeferError.code}</span>
          </div>
        )}
      </div>
    </button>
  );
}
