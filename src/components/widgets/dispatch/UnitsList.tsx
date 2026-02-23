import { Filter } from "lucide-react";
import { Button } from "../../ui/Button";
import { UnitCard, type UnitCardUnit } from "./UnitCard";
import { cn } from "../../../lib/utils";

/**
 * UNITS LIST COMPONENT - ColdSync
 * 
 * Reusable component to display a list of units grouped by logistics company (carrier).
 * 
 * Features:
 * - Grouping by logistics company
 * - Status indicators (green/red/hollow dot)
 * - HYB badge for hybrid units
 * - Warning icons for issues
 * - Unit selection
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
  carrier: string; // Carrier company name
  // Field mapping for compatibility
  trackingId?: string; // TRK-XXXX (alias for unit)
  code?: string; // RMQ-XXX (alias for trailer)
  isHybrid?: boolean; // Alias for isHybridTrailer
  hasWarning?: boolean; // Alias for hasIssue
}

export interface UnitsListProps {
  /** List of units to display */
  units: Unit[];
  /** ID of the selected unit */
  selectedUnitId?: string;
  /** Callback when a unit is selected */
  onSelectUnit?: (unitId: string) => void;
  /** Callback when filter button is clicked */
  onFilterClick?: () => void;
  /** Function to get status dot color (replicates VehicleDropZone behavior) */
  getStatusDotColor: (status: string, hasActiveTrip: boolean) => string;
  /** Additional CSS classes */
  className?: string;
}

/**
 * UnitsList Component
 * 
 * Renders a list of units grouped by logistics company.
 */
export function UnitsList({
  units,
  selectedUnitId,
  onSelectUnit,
  onFilterClick,
  getStatusDotColor,
  className,
}: UnitsListProps) {
  // Group units by carrier
  const groupedByCarrier = units.reduce((acc, unit) => {
    if (!acc[unit.carrier]) {
      acc[unit.carrier] = [];
    }
    acc[unit.carrier].push(unit);
    return acc;
  }, {} as Record<string, Unit[]>);

  // Calculate total unit count
  const totalUnits = units.length;

  // Convert Unit to UnitCardUnit (field mapping)
  const toUnitCardUnit = (unit: Unit): UnitCardUnit => ({
    id: unit.id,
    unit: unit.trackingId || unit.unit,
    trailer: unit.code || unit.trailer,
    driver: unit.driver,
    status: unit.status,
    hasActiveTrip: unit.hasActiveTrip,
    isHybridTrailer: unit.isHybrid || unit.isHybridTrailer,
    hasIssue: unit.hasWarning || unit.hasIssue,
  });

  return (
    <div className={cn("flex flex-col h-full bg-white", className)}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold text-gray-900">
            Units {totalUnits}
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

      {/* Grouped units list */}
      <div className="flex-1 overflow-y-auto">
        {Object.entries(groupedByCarrier).map(([carrier, carrierUnits]) => {
          const activeCount = carrierUnits.filter(
            (u) => u.status === "active" || u.status === "selected"
          ).length;
          const totalCount = carrierUnits.length;

          return (
            <div key={carrier} className="border-b border-gray-100 last:border-b-0">
              {/* Carrier Header */}
              <div className="px-4 py-2 bg-gray-50 border-b border-gray-100">
                <h4 className="text-xs font-bold text-gray-900">
                  {carrier} {activeCount}/{totalCount}
                </h4>
              </div>

              {/* Carrier units - Using UnitCard (exact replica) */}
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

