import { UnitDetailsDrawer } from "./components/UnitDetailsDrawer";
import { UnitCard } from "./components/UnitCard";
import { useControlTower } from "./hooks/useControlTower";

import { FleetMap } from "./components/FleetMap";

interface TrackingViewProps {
  controlTower: ReturnType<typeof useControlTower>;
}

export function TrackingView({ controlTower }: TrackingViewProps) {
  const { units, selectedUnit, handleUnitClick, closeDrawer } = controlTower;

  return (
    <div className="flex h-full relative">
      {/* Lista de Unidades - 32% */}
      <div className="w-[32%] bg-white border-r border-gray-200 flex flex-col overflow-hidden">
        <div className="flex-1 overflow-y-auto overflow-x-hidden">
          {units.map((unit) => (
            <UnitCard
              key={unit.id}
              unit={unit}
              isSelected={selectedUnit?.id === unit.id}
              onClick={() => handleUnitClick(unit.id)}
            />
          ))}
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
            onClose={closeDrawer}
          />
        )}
      </div>
    </div>
  );
}