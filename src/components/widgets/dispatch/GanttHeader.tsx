import { Button } from "../../ui/Button";
import { Filter } from "lucide-react";
import { cn } from "../../../lib/utils";
import type { DayInfo } from "./useDateRange";

/**
 * GANTT HEADER COMPONENT - ColdSync
 * 
 * Componente reutilizable para el header del Gantt en el layout de despacho.
 * Muestra la columna de unidades (sticky left) y las columnas de fechas.
 * 
 * @example
 * ```tsx
 * <GanttHeader
 *   unitsCount={9}
 *   days={daysArray}
 *   unitColWidth={260}
 *   dayColWidth={160}
 *   onFilterClick={() => handleFilter()}
 * />
 * ```
 */

export interface GanttHeaderProps {
  /** Número de unidades */
  unitsCount: number;
  /** Array de días a mostrar */
  days: DayInfo[];
  /** Ancho de la columna de unidades en píxeles */
  unitColWidth: number;
  /** Ancho de cada columna de día en píxeles */
  dayColWidth: number;
  /** Callback cuando se hace click en el filtro */
  onFilterClick?: () => void;
  /** Clases CSS adicionales */
  className?: string;
}

/**
 * Componente GanttHeader
 * 
 * Header sticky para el Gantt con columna de unidades y fechas.
 */
export function GanttHeader({
  unitsCount,
  days,
  unitColWidth,
  dayColWidth,
  onFilterClick,
  className,
}: GanttHeaderProps) {
  return (
    <div
      className={cn(
        "sticky top-0 z-40 bg-gray-50 border-b border-gray-300 flex h-[52px]",
        className
      )}
    >
      {/* Esquina Superior Izquierda (Sticky Left + Top) */}
      <div
        className="sticky left-0 z-50 bg-gray-50 border-r border-gray-300 flex items-center justify-between"
        style={{
          width: `${unitColWidth}px`,
          paddingLeft: "12px",
          paddingRight: "12px",
        }}
      >
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-medium text-gray-900">
            Unidades
          </h3>
          <span className="text-xs text-gray-500">
            {unitsCount}
          </span>
        </div>
        <div className="flex gap-1">
          {onFilterClick && (
            <Button
              variant="outline"
              size="sm"
              className="h-7 w-7 p-0"
              onClick={onFilterClick}
            >
              <Filter className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Días del Calendario (Se mueven horizontalmente) */}
      <div className="flex flex-1">
        {days.map((item, index) => (
          <div
            key={`${item.fullDate.getTime()}-${index}`}
            className={cn(
              "flex items-center justify-center border-r border-gray-200 bg-gray-50",
              index === 0 && "border-l"
            )}
            style={{
              width: `${dayColWidth}px`,
              minWidth: `${dayColWidth}px`,
            }}
          >
            <div className="text-center">
              <span className="text-xs font-medium text-gray-900 block">
                {item.dayName}
              </span>
              <span className="text-[10px] text-gray-500 block">
                {item.dayNumber}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
