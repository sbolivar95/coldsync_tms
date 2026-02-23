import { SearchX } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "../../components/ui/Button";
import { UnitDetailsDrawer } from "./components/UnitDetailsDrawer";
import { UnitCard } from "./components/UnitCard";
import { useControlTower } from "./hooks/useControlTower";

import { FleetMap } from "./components/FleetMap";

interface TrackingViewProps {
  controlTower: ReturnType<typeof useControlTower>;
  activeTab: string;
  hasFilters: boolean;
  onClearFilters: () => void;
  onGoToTracking: () => void;
}

const EMPTY_MESSAGES: Record<string, string> = {
  "live-tracking": "No hay unidades disponibles para mostrar en tracking.",
  "active-orders": "No hay órdenes en ejecución actualmente.",
  "in-transit": "No hay órdenes en tránsito actualmente.",
  "at-destination": "No hay órdenes en destino actualmente.",
  delivered: "No hay órdenes completadas para los filtros aplicados.",
};

export function TrackingView({
  controlTower,
  activeTab,
  hasFilters,
  onClearFilters,
  onGoToTracking,
}: TrackingViewProps) {
  const { units, selectedUnit, handleUnitClick, closeDrawer } = controlTower;
  const [nowMs, setNowMs] = useState(() => Date.now());
  const emptyMessage =
    EMPTY_MESSAGES[activeTab] ?? "No hay datos para mostrar con los filtros actuales.";

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setNowMs(Date.now());
    }, 60_000);

    return () => window.clearInterval(intervalId);
  }, []);

  return (
    <div className="flex h-full relative">
      {/* Lista de Unidades - 32% */}
      <div className="w-[32%] bg-white border-r border-gray-200 flex flex-col overflow-hidden">
        <div className="flex-1 overflow-y-auto overflow-x-hidden">
          {units.length > 0 ? (
            units.map((unit) => (
              <UnitCard
                key={unit.id}
                unit={unit}
                isSelected={selectedUnit?.id === unit.id}
                onClick={() => handleUnitClick(unit.id)}
                nowMs={nowMs}
              />
            ))
          ) : (
            <div className="h-full flex items-center justify-center p-6">
              <div className="max-w-sm text-center space-y-3">
                <div className="mx-auto w-10 h-10 rounded-full bg-gray-100 text-gray-500 flex items-center justify-center">
                  <SearchX className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">Sin resultados</p>
                  <p className="text-sm text-gray-500 mt-1">{emptyMessage}</p>
                </div>
                <div className="flex items-center justify-center gap-2">
                  {hasFilters && (
                    <Button variant="outline" size="sm" onClick={onClearFilters}>
                      Limpiar filtros
                    </Button>
                  )}
                  {activeTab !== "live-tracking" && (
                    <Button variant="ghost" size="sm" onClick={onGoToTracking}>
                      Ir a Tracking
                    </Button>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Mapa - 68% (ajustado de 60% para llenar el espacio) */}
      <div className="flex-1 relative">
        <FleetMap
          units={units}
          selectedUnit={selectedUnit}
          onUnitClick={handleUnitClick}
        />

        {/* Drawer de detalles de unidad */}
        {selectedUnit && (
          <UnitDetailsDrawer
            unit={selectedUnit}
            nowMs={nowMs}
            onClose={closeDrawer}
          />
        )}
      </div>
    </div>
  );
}
