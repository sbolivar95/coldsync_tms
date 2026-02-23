import { TrackingUnit } from "../types";
import { ArrowUpIcon } from "./icons/ArrowUpIcon";

interface MobilityIndicatorProps {
  unit: Pick<
    TrackingUnit,
    "status" | "signalStatus" | "hasKnownMessage" | "telematics"
  >;
  size?: number;
  arrowSize?: number;
  shapeSize?: number;
}

type BaseMobility = "DRIVING" | "IDLE" | "STOPPED";

const getDirection = (telematics: TrackingUnit["telematics"]): number => {
  const candidates = [
    telematics?.direction,
    telematics?.["position.direction"],
  ];
  for (const value of candidates) {
    if (typeof value === "number" && Number.isFinite(value)) return value;
    if (typeof value === "string" && value.trim() !== "") {
      const parsed = Number(value);
      if (Number.isFinite(parsed)) return parsed;
    }
  }
  return 0;
};

const getBaseMobility = (status: TrackingUnit["status"]): BaseMobility => {
  if (status === "DRIVING") return "DRIVING";
  if (status === "IDLE") return "IDLE";
  return "STOPPED";
};

const getMobilityColor = (
  base: BaseMobility,
  signalStatus: TrackingUnit["signalStatus"],
  hasKnownMessage?: boolean
): string => {
  if (!hasKnownMessage) return "var(--color-gray-300)";
  if (signalStatus === "STALE") return "var(--color-gray-400)";
  if (signalStatus === "OFFLINE") return "var(--color-gray-300)";
  if (base === "DRIVING") return "var(--color-blue-600)";
  if (base === "IDLE") return "var(--color-gray-300)";
  return "var(--color-gray-300)";
};

export function MobilityIndicator({
  unit,
  size = 12,
  arrowSize,
  shapeSize,
}: MobilityIndicatorProps) {
  const resolvedArrowSize = arrowSize ?? size;
  const resolvedShapeSize = shapeSize ?? size;
  const directionDeg = getDirection(unit.telematics);
  const base = getBaseMobility(unit.status);
  const color = getMobilityColor(base, unit.signalStatus, unit.hasKnownMessage);

  // No signal: outline circle
  if (!unit.hasKnownMessage) {
    return (
      <span
        className="inline-block shrink-0 rounded-full border"
        style={{
          width: resolvedShapeSize,
          height: resolvedShapeSize,
          borderColor: color,
        }}
        aria-label="Sin señal"
      />
    );
  }

  // Driving: arrow with rotation
  if (base === "DRIVING") {
    return (
      <span
        className="inline-flex items-center justify-center shrink-0 transition-transform duration-300 ease-out"
        style={{
          width: resolvedArrowSize,
          height: resolvedArrowSize,
          transform: `rotate(${directionDeg}deg)`,
          transformOrigin: "center",
        }}
        aria-label="En movimiento"
      >
        <ArrowUpIcon
          width={resolvedArrowSize}
          height={resolvedArrowSize}
          color={color}
        />
      </span>
    );
  }

  // Idle or Stopped: filled rounded square
  return (
    <span
      className="inline-block shrink-0"
      style={{
        width: resolvedShapeSize,
        height: resolvedShapeSize,
        borderRadius: "2px",
        backgroundColor: color,
      }}
      aria-label={base === "IDLE" ? "Ralentí" : "Detenido"}
    />
  );
}
