import { ProgressBar } from "./ProgressBar";
import { InfoGrid } from "./InfoGrid";

export function ReeferTab() {
  const fields = [
    { label: "Ignición", value: "Encendido" },
    { label: "Return Air", value: "1.2°C" },
    { label: "Discharge Air", value: "-1.1°C" },
    { label: "Estado", value: "En Movimiento" },
    { label: "Batería", value: "13.6 V" },
  ];

  return (
    <div className="space-y-4">
      <ProgressBar
        label="Nivel de Combustible"
        value="81%"
        percentage={81}
      />
      <InfoGrid fields={fields} />
    </div>
  );
}
