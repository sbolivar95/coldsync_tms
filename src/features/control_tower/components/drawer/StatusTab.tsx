import { InfoGrid } from "./InfoGrid";
import { TrackingUnit } from "../../types";
import { formatSignalAgeCompact, resolveSignalAgeSeconds } from "../../utils/signal-age";
import { TriangleAlert } from "lucide-react";

interface StatusTabProps {
  unit: TrackingUnit;
  nowMs: number;
}

const formatSignalDate = (seconds: number | null, nowMs: number): string => {
  if (seconds === null) return "Sin datos";
  const ts = new Date(nowMs - seconds * 1000);
  if (Number.isNaN(ts.getTime())) return "Sin datos";

  const MONTHS_SHORT = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];
  const day = String(ts.getDate()).padStart(2, "0");
  const month = MONTHS_SHORT[ts.getMonth()] ?? "---";
  const year = ts.getFullYear();
  const timePart = new Intl.DateTimeFormat("es-BO", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(ts);

  return `${day} ${month} ${year}, ${timePart}`;
};

const getMotionLabel = (
  status: TrackingUnit["status"],
  hasKnownMessage?: boolean
): string => {
  if (!hasKnownMessage) return "Sin datos";
  if (status === "DRIVING") return "En movimiento";
  if (status === "IDLE") return "Ralentí";
  return "Detenido";
};

const getIgnitionLabel = (
  telematics: TrackingUnit["telematics"] | null,
  status: TrackingUnit["status"],
  hasKnownMessage?: boolean
): string => {
  if (!hasKnownMessage) return "Sin datos";
  const ignitionRaw =
    telematics && typeof telematics === "object"
      ? telematics["engine.ignition.status"] ??
      telematics["ignition"] ??
      telematics["can.engine.ignition.status"]
      : null;
  if (ignitionRaw === true || ignitionRaw === 1 || ignitionRaw === "1") return "Encendido";
  if (ignitionRaw === false || ignitionRaw === 0 || ignitionRaw === "0") return "Apagado";
  if (typeof ignitionRaw === "string") {
    const normalized = ignitionRaw.trim().toLowerCase();
    if (["true", "on", "yes", "encendido"].includes(normalized)) return "Encendido";
    if (["false", "off", "no", "apagado"].includes(normalized)) return "Apagado";
  }
  if (status === "DRIVING") return "Encendido";
  if (status === "IDLE") return "Encendido";
  if (status === "STOPPED" || status === "OFFLINE" || status === "STALE") return "Apagado";
  return "-";
};

export function StatusTab({ unit, nowMs }: StatusTabProps) {
  const ignitionLabel = getIgnitionLabel(unit.telematics ?? null, unit.status, unit.hasKnownMessage);
  const temperatureValue = unit.tempMode === "MULTI" ? (
    <span className="inline-flex items-center gap-1 font-medium text-[13px] text-gray-700">
      <span className="inline-flex items-center gap-0.5">
        <span>{unit.hasKnownMessage ? (unit.temperatureChannel1 ?? "--") : "Sin datos"}</span>
        {unit.hasTemperatureChannel1Error && (
          <span title="Error en sensor de temperatura 1">
            <TriangleAlert className="w-3 h-3 text-orange-500" />
          </span>
        )}
      </span>
      <span className="text-gray-300 mx-0.5">|</span>
      <span className="inline-flex items-center gap-0.5">
        <span>{unit.hasKnownMessage ? (unit.temperatureChannel2 ?? "--") : "Sin datos"}</span>
        {unit.hasTemperatureChannel2Error && (
          <span title="Error en sensor de temperatura 2">
            <TriangleAlert className="w-3 h-3 text-orange-500" />
          </span>
        )}
      </span>
    </span>
  ) : (
    unit.hasTemperatureError ? (
      <span className="inline-flex items-center gap-1 font-medium text-[13px] text-gray-700">
        <span>{unit.hasKnownMessage ? unit.temperature : "Sin datos"}</span>
        <TriangleAlert className="w-3 h-3 text-orange-500" />
      </span>
    ) : (
      unit.hasKnownMessage ? unit.temperature : "Sin datos"
    )
  );
  const motionLabel = getMotionLabel(unit.status, unit.hasKnownMessage);
  const signalAgeSeconds = unit.hasKnownMessage ? resolveSignalAgeSeconds(unit, nowMs) : null;

  const signalAgeLabel = unit.hasKnownMessage
    ? signalAgeSeconds !== null && signalAgeSeconds < 60
      ? "Online"
      : formatSignalAgeCompact(signalAgeSeconds)
    : "Nunca";
  const signalDateLabel = unit.hasKnownMessage ? formatSignalDate(signalAgeSeconds, nowMs) : "Sin datos";

  const fields = [
    { label: "Ignición", value: ignitionLabel },
    { label: "Movimiento", value: motionLabel },
    { label: unit.tempMode === "MULTI" ? "Temp 1|2" : "Temperatura", value: temperatureValue },
    { label: "Última señal", value: signalAgeLabel },
    { label: "Fecha señal", value: signalDateLabel },
  ];

  return (
    <div className="space-y-4">
      <InfoGrid fields={fields} />
    </div>
  );
}
