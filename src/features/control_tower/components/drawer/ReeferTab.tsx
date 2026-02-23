import { ProgressBar } from "./ProgressBar";
import { InfoGrid } from "./InfoGrid";
import { TrackingUnit } from "../../types";

interface ReeferTabProps {
  unit: TrackingUnit;
}

import { toRecord, readValue, toNumber } from "../../utils/control-tower-helpers";

const formatTemperature = (value: unknown): string => {
  const numeric = toNumber(value);
  if (numeric === null) return "-";
  return `${numeric}°C`;
};

const formatVoltage = (value: unknown): string => {
  const numeric = toNumber(value);
  if (numeric === null) return "-";
  return `${numeric.toFixed(1)} V`;
};

const formatIgnition = (value: unknown): string => {
  if (typeof value === "boolean") return value ? "Encendido" : "Apagado";
  if (typeof value === "number") return value !== 0 ? "Encendido" : "Apagado";
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (["on", "true", "1", "encendido"].includes(normalized)) return "Encendido";
    if (["off", "false", "0", "apagado"].includes(normalized)) return "Apagado";
    return value;
  }
  return "-";
};

export function ReeferTab({ unit }: ReeferTabProps) {
  if (!unit.hasCan) {
    return (
      <div className="space-y-2">
        <p className="text-[13px] font-medium text-gray-700">Reefer no disponible</p>
        <p className="text-xs text-gray-500">
          Esta unidad no reporta datos CAN.
        </p>
      </div>
    );
  }

  const telematics = toRecord(unit.telematics);
  const fuelLevel = toNumber(
    readValue(telematics, [
      "fuel_level",
      "fuel.level",
      "reefer_fuel_level",
      "can_fuel_pct",
      "can.fuel.level",
    ]),
  );
  const ignition = readValue(telematics, [
    "engine.ignition.status",
    "ignition",
    "can.engine.ignition.status",
  ]);
  const returnAir = readValue(telematics, [
    "return_air",
    "return_air_temp",
    "temperature.return_air",
    "reefer.return_air",
  ]);
  const dischargeAir = readValue(telematics, [
    "discharge_air",
    "discharge_air_temp",
    "temperature.discharge_air",
    "reefer.discharge_air",
  ]);
  const battery = readValue(telematics, [
    "battery",
    "battery_voltage",
    "voltage.battery",
    "can_battery_voltage",
    "can.battery.voltage",
  ]);
  const operationStatus = readValue(telematics, [
    "reefer_status",
    "operation_status",
    "reefer_state",
    "state",
  ]);

  const fields = [
    { label: "Ignición", value: formatIgnition(ignition) },
    { label: "Return Air", value: formatTemperature(returnAir) },
    { label: "Discharge Air", value: formatTemperature(dischargeAir) },
    {
      label: "Estado",
      value:
        typeof operationStatus === "string" && operationStatus.trim() !== ""
          ? operationStatus
          : "-",
    },
    { label: "Batería", value: formatVoltage(battery) },
  ];

  return (
    <div className="space-y-4">
      <ProgressBar
        label="Nivel de Combustible"
        value={fuelLevel !== null ? `${Math.round(fuelLevel)}%` : "-"}
        percentage={fuelLevel !== null ? Math.min(100, Math.max(0, fuelLevel)) : 0}
      />
      <InfoGrid fields={fields} />
    </div>
  );
}
