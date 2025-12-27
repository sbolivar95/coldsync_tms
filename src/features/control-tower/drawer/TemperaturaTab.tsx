import { ProgressBar } from "./ProgressBar";
import { InfoGrid } from "./InfoGrid";

export function TemperaturaTab() {
  const fields = [
    { label: "Temperatura Promedio", value: "-18.2°C" },
    {
      label: "Total Tiempo de Desvíos",
      value: (
        <>
          2h 15m<span className="text-gray-500 ml-1">(9.4%)</span>
        </>
      ),
    },
    {
      label: "Leve",
      value: (
        <>
          45m<span className="text-gray-500 ml-1">(3.1%)</span>
        </>
      ),
    },
    {
      label: "Moderado",
      value: (
        <>
          1h 20m<span className="text-gray-500 ml-1">(5.5%)</span>
        </>
      ),
    },
    {
      label: "Severo",
      value: (
        <>
          10m<span className="text-gray-500 ml-1">(0.8%)</span>
        </>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <div>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="text-gray-400 text-[11px]">Refrigerado</span>
          </div>
          <span className="text-gray-900 text-[13px] font-normal">
            90% <span className="text-gray-500">(en rango)</span>
          </span>
        </div>
        <div className="relative w-full bg-gray-200 rounded-full h-1">
          <div
            className="h-1 rounded-full transition-all"
            style={{
              width: "90%",
              backgroundColor: "#004ef0",
            }}
          />
        </div>
      </div>
      <InfoGrid fields={fields} />
    </div>
  );
}
