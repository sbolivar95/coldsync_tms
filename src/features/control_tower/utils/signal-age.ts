import type { TrackingUnit } from "../types";

export function resolveSignalAgeSeconds(
  unit: TrackingUnit,
  nowMs: number,
): number | null {
  if (typeof unit.signalAgeSec !== "number") return null;

  const capturedAtMs =
    typeof unit.signalAgeCapturedAtMs === "number"
      ? unit.signalAgeCapturedAtMs
      : nowMs;

  const elapsedSec = Math.max(0, Math.floor((nowMs - capturedAtMs) / 1000));
  return Math.max(0, unit.signalAgeSec + elapsedSec);
}

export function formatSignalAgeCompact(seconds: number | null): string {
  if (seconds === null) return "Sin señal";
  if (seconds < 60) return "Online";
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d`;
  return `${Math.floor(seconds / 604800)}w`;
}
