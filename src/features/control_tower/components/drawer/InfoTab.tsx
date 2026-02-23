import { InfoGrid } from "./InfoGrid";

interface InfoTabProps {
  driver: string;
  driverId?: number | null;
  driverPhone?: string | null;
  driverEmail?: string | null;
  driverLicenseNumber?: string | null;
}

export function InfoTab({
  driver,
  driverId,
  driverPhone,
  driverEmail,
  driverLicenseNumber,
}: InfoTabProps) {
  const hasDriver = driver && driver !== "Sin conductor";
  const fields = [
    { label: "Conductor", value: hasDriver ? driver : "-" },
    { label: "ID Conductor", value: driverId ?? "-" },
    { label: "Teléfono", value: hasDriver ? (driverPhone ?? "-") : "-" },
    { label: "Email", value: hasDriver ? (driverEmail ?? "-") : "-" },
    { label: "Licencia", value: hasDriver ? (driverLicenseNumber ?? "-") : "-" },
  ];

  return (
    <div className="space-y-4">
      <InfoGrid fields={fields} />
    </div>
  );
}
