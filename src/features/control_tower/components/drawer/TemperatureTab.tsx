import { InfoGrid } from "./InfoGrid";
import { TrackingUnit } from "../../types";

interface TemperatureTabProps {
  unit: TrackingUnit;
}

import { toRecord, readValue, toNumber } from "../../utils/control-tower-helpers";

const formatTemp = (value: unknown): string => {
  const numeric = toNumber(value);
  if (numeric === null) return "-";
  return `${numeric}°C`;
};

const formatMinutesWithPercent = (minutes: number | null, percent: number | null): string => {
  if (minutes === null) return "-";
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  const timeLabel =
    hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  if (percent === null) return timeLabel;
  return `${timeLabel} (${percent.toFixed(1)}%)`;
};

export function TemperatureTab({ unit }: TemperatureTabProps) {
  const telematics = toRecord(unit.telematics);
  const inRangePct = toNumber(
    readValue(telematics, [
      "temp_in_range_pct",
      "temperature_in_range_pct",
      "in_range_pct",
      "temperature.in_range_pct",
    ]),
  );
  const avgTemp = readValue(telematics, [
    "temperature_avg",
    "avg_temperature",
    "temperature.average",
    "temp_avg",
  ]);
  const totalDeviationMin = toNumber(
    readValue(telematics, [
      "temp_dev_total_min",
      "temp_deviation_total_min",
      "temperature_deviation_total_min",
    ]),
  );
  const totalDeviationPct = toNumber(
    readValue(telematics, [
      "temp_dev_total_pct",
      "temp_deviation_total_pct",
      "temperature_deviation_total_pct",
    ]),
  );
  const mildDeviationMin = toNumber(
    readValue(telematics, [
      "temp_dev_mild_min",
      "temp_deviation_mild_min",
      "temperature_deviation_mild_min",
    ]),
  );
  const mildDeviationPct = toNumber(
    readValue(telematics, [
      "temp_dev_mild_pct",
      "temp_deviation_mild_pct",
      "temperature_deviation_mild_pct",
    ]),
  );
  const moderateDeviationMin = toNumber(
    readValue(telematics, [
      "temp_dev_moderate_min",
      "temp_deviation_moderate_min",
      "temperature_deviation_moderate_min",
    ]),
  );
  const moderateDeviationPct = toNumber(
    readValue(telematics, [
      "temp_dev_moderate_pct",
      "temp_deviation_moderate_pct",
      "temperature_deviation_moderate_pct",
    ]),
  );
  const severeDeviationMin = toNumber(
    readValue(telematics, [
      "temp_dev_severe_min",
      "temp_deviation_severe_min",
      "temperature_deviation_severe_min",
    ]),
  );
  const severeDeviationPct = toNumber(
    readValue(telematics, [
      "temp_dev_severe_pct",
      "temp_deviation_severe_pct",
      "temperature_deviation_severe_pct",
    ]),
  );

  const fields = [
    { label: "Temperatura Promedio", value: formatTemp(avgTemp) },
    {
      label: "Total Tiempo de Desvíos",
      value: formatMinutesWithPercent(totalDeviationMin, totalDeviationPct),
    },
    {
      label: "Leve",
      value: formatMinutesWithPercent(mildDeviationMin, mildDeviationPct),
    },
    {
      label: "Moderado",
      value: formatMinutesWithPercent(moderateDeviationMin, moderateDeviationPct),
    },
    {
      label: "Severo",
      value: formatMinutesWithPercent(severeDeviationMin, severeDeviationPct),
    },
  ];

  return (
    <div className="space-y-4">
      <div>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="text-gray-400 text-[11px] leading-none">Refrigerado</span>
          </div>
          <span className="text-gray-700 text-[13px] font-medium">
            {inRangePct !== null ? `${Math.round(inRangePct)}%` : "-"}{" "}
            <span className="text-gray-500 text-[11px] font-normal">(en rango)</span>
          </span>
        </div>
        <div className="relative w-full bg-gray-200 rounded-full h-1">
          <div
            className="h-1 rounded-full transition-all"
            style={{
              width: `${Math.min(100, Math.max(0, inRangePct ?? 0))}%`,
              backgroundColor: "var(--primary)",
            }}
          />
        </div>
      </div>
      <InfoGrid fields={fields} />
    </div>
  );
}
