import { InfoGrid } from "./InfoGrid";

interface InfoTabProps {
  driver: string;
}

export function InfoTab({ driver }: InfoTabProps) {
  const fields = [
    { label: "Conductor", value: driver },
    { label: "Teléfono", value: "+1 (555) 123-4567" },
    { label: "Email", value: "driver@coldchain.com" },
    { label: "Licencia", value: "CDL-A-12345" },
    { label: "Vencimiento Licencia", value: "15/08/2026" },
  ];

  return (
    <div className="space-y-4">
      <InfoGrid fields={fields} />
    </div>
  );
}
