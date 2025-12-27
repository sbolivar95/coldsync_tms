import { AlertItem } from "./AlertItem";

export function AlertsTab() {
  return (
    <div className="space-y-2 pt-2">
      <AlertItem
        title="Excursión térmica"
        time="14:23"
        description="Temperatura fuera de rango: -12.4°C (rango permitido: -18°C a -15°C)"
        footer="Duración: 23 min"
      />

      <AlertItem
        title="Combustible bajo"
        time="12:45"
        description="Nivel de combustible del reefer: 18% (umbral mínimo: 20%)"
      />

      <AlertItem
        title="ETA retrasado"
        time="10:12"
        description="Retraso detectado: +45 min respecto al horario planificado"
        footer="Resuelta: 11:30"
        isResolved
      />

      <AlertItem
        title="Excursión térmica"
        time="08:34"
        description="Temperatura fuera de rango: -14.8°C durante carga en origen"
        footer="Resuelta: 08:52 • Duración: 18 min"
        isResolved
      />

      <div className="pb-2">
        <div className="flex items-start justify-between mb-1">
          <span className="text-gray-400 text-[13px]">Apertura de puertas</span>
          <span className="text-gray-500 text-[11px]">07:15</span>
        </div>
        <p className="text-gray-500 text-[11px] mb-1">
          Apertura detectada en origen durante proceso de carga
        </p>
        <span className="text-gray-500 text-[11px]">
          Resuelta: 07:42 • Duración: 27 min
        </span>
      </div>
    </div>
  );
}
