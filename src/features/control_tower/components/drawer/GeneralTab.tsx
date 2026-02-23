import { ProgressBar } from "./ProgressBar";
import { InfoGrid } from "./InfoGrid";

interface GeneralTabProps {
  carrier: string;
}

export function GeneralTab({ carrier }: GeneralTabProps) {
  const fields = [
    { label: "ID Viaje", value: "TI-2024-001" },
    {
      label: "Ruta",
      value: (
        <>
          <span className="text-gray-900 text-[13px] h-6 flex items-center">
            Chicago
          </span>
          <span className="mx-1.5 text-primary font-semibold">
            →
          </span>
          <span className="text-gray-900 text-[13px] h-6 flex items-center">
            Dallas
          </span>
        </>
      ),
    },
    { label: "ETA restante", value: "≈ 7h 37min" },
    { label: "Perfil Térmico", value: "Refrigerado" },
    { label: "Transportista", value: carrier },
  ];

  return (
    <div className="space-y-4">
      <ProgressBar
        label="Progreso del viaje"
        value="780 km / 1,200 km"
        percentage={65}
        showMarkers
      />
      <InfoGrid fields={fields} />
    </div>
  );
}