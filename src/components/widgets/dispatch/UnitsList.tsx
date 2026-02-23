import { Filter } from "lucide-react";
import { Button } from "../../ui/Button";
import { UnitCard, type UnitCardUnit } from "./UnitCard";
import { cn } from "../../../lib/utils";

/**
 * UNITS LIST COMPONENT - ColdSync
 * 
 * Componente reutilizable para mostrar una lista de unidades agrupadas por compañía de logística.
 * 
 * Características:
 * - Agrupación por compañía de logística
 * - Indicadores de estado (círculo verde/rojo/hueco)
 * - Badge HYB para unidades híbridas
 * - Iconos de advertencia para problemas
 * - Selección de unidades
 * 
 * @example
 * ```tsx
 * <UnitsList
 *   units={unitsData}
 *   selectedUnitId="TRK-9201"
 *   onSelectUnit={(id) => handleSelect(id)}
 *   onFilterClick={() => handleFilter()}
 * />
 * ```
 */

export type UnitStatus = "active" | "inactive" | "warning" | "hollow" | "selected";

export interface Unit extends UnitCardUnit {
  carrier: string; // Nombre de la compañía
  // Mapeo de campos para compatibilidad
  trackingId?: string; // TRK-XXXX (alias de unit)
  code?: string; // RMQ-XXX (alias de trailer)
  isHybrid?: boolean; // Alias de trailerEsHibrido
  hasWarning?: boolean; // Alias de hasIssue
}

export interface UnitsListProps {
  /** Lista de unidades a mostrar */
  units: Unit[];
  /** ID de la unidad seleccionada */
  selectedUnitId?: string;
  /** Callback cuando se selecciona una unidad */
  onSelectUnit?: (unitId: string) => void;
  /** Callback cuando se hace click en el filtro */
  onFilterClick?: () => void;
  /** Función para obtener el color del indicador de estado (igual que VehicleDropZone) */
  getStatusDotColor: (status: string, hasActiveTrip: boolean) => string;
  /** Clases CSS adicionales */
  className?: string;
}

/**
 * Componente UnitsList
 * 
 * Renderiza una lista de unidades agrupadas por compañía de logística.
 */
export function UnitsList({
  units,
  selectedUnitId,
  onSelectUnit,
  onFilterClick,
  getStatusDotColor,
  className,
}: UnitsListProps) {
  // Agrupar unidades por compañía
  const groupedByCarrier = units.reduce((acc, unit) => {
    if (!acc[unit.carrier]) {
      acc[unit.carrier] = [];
    }
    acc[unit.carrier].push(unit);
    return acc;
  }, {} as Record<string, Unit[]>);

  // Calcular total de unidades
  const totalUnits = units.length;

  // Convertir Unit a UnitCardUnit (mapear campos)
  const toUnitCardUnit = (unit: Unit): UnitCardUnit => ({
    id: unit.id,
    unit: unit.trackingId || unit.unit,
    trailer: unit.code || unit.trailer,
    driver: unit.driver,
    status: unit.status,
    hasActiveTrip: unit.hasActiveTrip,
    trailerEsHibrido: unit.isHybrid || unit.trailerEsHibrido,
    hasIssue: unit.hasWarning || unit.hasIssue,
  });

  return (
    <div className={cn("flex flex-col h-full bg-white", className)}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold text-gray-900">
            Unidades {totalUnits}
          </h3>
        </div>
        {onFilterClick && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onFilterClick}
            className="h-8 w-8 p-0"
          >
            <Filter className="w-4 h-4 text-gray-500" />
          </Button>
        )}
      </div>

      {/* Lista de unidades agrupadas */}
      <div className="flex-1 overflow-y-auto">
        {Object.entries(groupedByCarrier).map(([carrier, carrierUnits]) => {
          const activeCount = carrierUnits.filter(
            (u) => u.status === "active" || u.status === "selected"
          ).length;
          const totalCount = carrierUnits.length;

          return (
            <div key={carrier} className="border-b border-gray-100 last:border-b-0">
              {/* Header de compañía */}
              <div className="px-4 py-2 bg-gray-50 border-b border-gray-100">
                <h4 className="text-xs font-bold text-gray-900">
                  {carrier} {activeCount}/{totalCount}
                </h4>
              </div>

              {/* Unidades de la compañía - Usando UnitCard (réplica exacta) */}
              <div className="divide-y divide-gray-100">
                {carrierUnits.map((unit) => {
                  const isSelected = selectedUnitId === unit.id;
                  const unitCardData = toUnitCardUnit(unit);

                  return (
                    <div key={unit.id} className="relative">
                      <UnitCard
                        unit={unitCardData}
                        getStatusDotColor={getStatusDotColor}
                        isSelected={isSelected}
                        onClick={() => onSelectUnit?.(unit.id)}
                        width="100%"
                        showHover={true}
                        className="border-r-0 border-l-0 border-t-0 border-b border-gray-100 last:border-b-0"
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
