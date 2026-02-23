import { Checkbox } from "../../ui/Checkbox";
import { Button } from "../../ui/Button";
import { Filter } from "lucide-react";

/**
 * UNSASSIGNED SIDEBAR COMPONENT - ColdSync
 * 
 * Componente reutilizable para el sidebar de órdenes sin asignar en el layout de despacho.
 * 
 * @example
 * ```tsx
 * <UnassignedSidebar
 *   count={11}
 *   allSelected={false}
 *   onSelectAll={(checked) => handleSelectAll(checked)}
 *   onFilterClick={() => handleFilter()}
 * >
 *   <OrdersList />
 * </UnassignedSidebar>
 * ```
 */

export interface UnassignedSidebarProps {
  /** Número de órdenes sin asignar */
  count: number;
  /** Si todas las órdenes están seleccionadas */
  allSelected?: boolean;
  /** Si algunas (pero no todas) están seleccionadas */
  someSelected?: boolean;
  /** Callback cuando cambia la selección de todas */
  onSelectAll?: (checked: boolean | "indeterminate") => void;
  /** Callback cuando se hace click en el filtro */
  onFilterClick?: () => void;
  /** Contenido del sidebar */
  children?: React.ReactNode;
  /** Ancho del sidebar (default: 20%) */
  width?: string;
  /** Clases CSS adicionales */
  className?: string;
}

/**
 * Componente UnassignedSidebar
 * 
 * Sidebar reutilizable para mostrar órdenes sin asignar.
 */
export function UnassignedSidebar({
  count,
  allSelected = false,
  someSelected = false,
  onSelectAll,
  onFilterClick,
  children,
  width = "20%",
  className,
}: UnassignedSidebarProps) {
  return (
    <div
      className={`flex flex-col h-full border-r border-gray-200 overflow-hidden bg-white z-20 ${className || ""}`}
      style={{ width }}
    >
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-300 bg-gray-50 h-[52px] flex items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-2">
          <Checkbox
            checked={allSelected}
            onCheckedChange={onSelectAll}
            className="data-[state=indeterminate]:bg-primary data-[state=indeterminate]:border-primary"
            {...(someSelected && !allSelected
              ? {
                  "data-state": "indeterminate" as any,
                }
              : {})}
          />
          <h3 className="text-sm font-medium text-gray-900">
            Sin Asignar
          </h3>
          <span className="text-xs text-gray-500">
            {count}
          </span>
        </div>
        <div className="flex items-center gap-1">
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

      {/* Contenido */}
      <div className="flex-1 overflow-y-auto bg-input-background">
        {children || (
          <div className="p-4 text-center text-sm text-gray-500">
            <p>No hay viajes sin asignar</p>
          </div>
        )}
      </div>
    </div>
  );
}
