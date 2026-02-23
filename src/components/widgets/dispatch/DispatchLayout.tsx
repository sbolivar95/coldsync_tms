import { PageHeader } from "../../../layouts/PageHeader";
import { Button } from "../../ui/Button";
import { ChevronLeft, ChevronRight, Filter, Send } from "lucide-react";
import { UnassignedSidebar } from "./UnassignedSidebar";
import { GanttHeader } from "./GanttHeader";
import { useDateRange } from "./useDateRange";
import { cn } from "../../../lib/utils";
import React from "react";

/**
 * DISPATCH LAYOUT COMPONENT - ColdSync
 * 
 * Layout reutilizable para tableros de despacho con estructura Gantt.
 * Estructura:
 * - PageHeader con tabs, search, filters y navegación de fechas
 * - Sidebar izquierdo: Órdenes sin asignar
 * - Área principal: Gantt con unidades y fechas
 * 
 * @example
 * ```tsx
 * <DispatchLayout
 *   unassignedCount={11}
 *   unitsCount={9}
 *   tabLabel="Tablero de Despacho"
 *   onSendDispatch={() => handleSend()}
 * >
 *   <UnassignedOrdersList />
 *   <DispatchGantt />
 * </DispatchLayout>
 * ```
 */

// Constantes de diseño configurables
export interface DispatchLayoutConfig {
  /** Ancho de la columna de unidades en píxeles */
  unitColWidth?: number;
  /** Ancho de cada columna de día en píxeles */
  dayColWidth?: number;
  /** Número de días a renderizar */
  numDays?: number;
  /** Ancho del sidebar en porcentaje */
  sidebarWidth?: string;
}

const DEFAULT_CONFIG: Required<DispatchLayoutConfig> = {
  unitColWidth: 260,
  dayColWidth: 160,
  numDays: 15,
  sidebarWidth: "20%",
};

export interface DispatchLayoutProps {
  /** Número de viajes sin asignar */
  unassignedCount?: number;
  /** Número de unidades disponibles */
  unitsCount?: number;
  /** Fecha inicial para el timeline */
  startDate?: Date;
  /** Callback cuando cambia la fecha */
  onDateChange?: (date: Date) => void;
  /** Label del tab principal */
  tabLabel?: string;
  /** Badge del tab */
  tabBadge?: number;
  /** Callback cuando se hace click en "Enviar al transportista" */
  onSendDispatch?: () => void;
  /** Callback cuando se hace click en filtros del header */
  onHeaderFilterClick?: () => void;
  /** Callback cuando se hace click en filtros del sidebar */
  onSidebarFilterClick?: () => void;
  /** Callback cuando se hace click en filtros del Gantt */
  onGanttFilterClick?: () => void;
  /** Si todas las órdenes están seleccionadas */
  allSelected?: boolean;
  /** Si algunas órdenes están seleccionadas */
  someSelected?: boolean;
  /** Callback cuando cambia la selección de todas */
  onSelectAll?: (checked: boolean | "indeterminate") => void;
  /** Configuración del layout */
  config?: DispatchLayoutConfig;
  /** Contenido del sidebar (órdenes sin asignar) */
  unassignedContent?: React.ReactNode;
  /** Contenido del área principal (grid de despacho) */
  dispatchContent?: React.ReactNode;
  /** Acciones adicionales para el header */
  extraActions?: React.ReactNode;
  /** Placeholder de búsqueda */
  searchPlaceholder?: string;
  /** Clases CSS adicionales */
  className?: string;
}

/**
 * Componente DispatchLayout
 * 
 * Layout reutilizable para tableros de despacho siguiendo mejores prácticas.
 */
export function DispatchLayout({
  unassignedCount = 0,
  unitsCount = 0,
  startDate = new Date(2025, 11, 2),
  onDateChange,
  tabLabel = "Tablero de Despacho",
  tabBadge,
  onSendDispatch,
  onHeaderFilterClick,
  onSidebarFilterClick,
  onGanttFilterClick,
  allSelected = false,
  someSelected = false,
  onSelectAll,
  config = {},
  unassignedContent,
  dispatchContent,
  extraActions,
  searchPlaceholder = "Buscar por nombre de servicio",
  className,
}: DispatchLayoutProps) {
  const layoutConfig = { ...DEFAULT_CONFIG, ...config };
  const { days, goToPrevious, goToNext } = useDateRange({
    startDate,
    numDays: layoutConfig.numDays,
    onDateChange,
  });

  const ganttWidth = layoutConfig.unitColWidth + layoutConfig.numDays * layoutConfig.dayColWidth;

  return (
    <div className={cn("flex flex-col h-full", className)}>
      {/* PageHeader */}
      <PageHeader
        tabs={[
          {
            id: "tablero-despacho",
            label: tabLabel,
            active: true,
            onClick: () => { },
            badge: tabBadge,
          },
        ]}
        showSearch
        searchPlaceholder={searchPlaceholder}
        filters={
          <Button
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={onHeaderFilterClick}
          >
            <Filter className="w-4 h-4" />
            Filtros
          </Button>
        }
        actions={
          <>
            {extraActions}
            {onSendDispatch && (
              <Button
                variant="outline"
                size="sm"
                className="gap-2 text-sm text-gray-700"
                onClick={onSendDispatch}
              >
                <Send className="h-4 w-4" />
                Solcitar confirmación
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              className="h-9 w-9 p-0"
              onClick={goToPrevious}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-9 w-9 p-0"
              onClick={goToNext}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </>
        }
      />

      {/* Layout Principal */}
      <div className="flex-1 overflow-hidden">
        <div className="h-full flex">
          {/* Sidebar: Órdenes Sin Asignar */}
          <UnassignedSidebar
            count={unassignedCount}
            allSelected={allSelected}
            someSelected={someSelected}
            onSelectAll={onSelectAll}
            onFilterClick={onSidebarFilterClick}
            width={layoutConfig.sidebarWidth}
          >
            {unassignedContent}
          </UnassignedSidebar>

          {/* Área Principal: Gantt */}
          <div
            className="flex-1 h-full overflow-hidden"
            style={{ width: `calc(100% - ${layoutConfig.sidebarWidth})` }}
          >
            <div className="h-full w-full overflow-auto relative">
              <div
                className="flex flex-col min-h-full"
                style={{ width: `${ganttWidth}px` }}
              >
                {/* Header del Gantt */}
                <GanttHeader
                  unitsCount={unitsCount}
                  days={days}
                  unitColWidth={layoutConfig.unitColWidth}
                  dayColWidth={layoutConfig.dayColWidth}
                  onFilterClick={onGanttFilterClick}
                />

                {/* Cuerpo del Gantt */}
                <div className="flex-1 bg-white">
                  {dispatchContent ? (
                    // Si el contenido es un elemento de React, intentamos pasarle los anchos 
                    // (esto solo funciona si es DispatchGantt, pero es una buena práctica de "atadura suave")
                    typeof dispatchContent === "object" && React.isValidElement(dispatchContent)
                      ? React.cloneElement(dispatchContent as React.ReactElement<any>, {
                        dayColWidth: layoutConfig.dayColWidth,
                        unitColWidth: layoutConfig.unitColWidth,
                        numDays: layoutConfig.numDays,
                      })
                      : dispatchContent
                  ) : (
                    <div className="p-8 text-center text-sm text-gray-500">
                      <p>Área de despacho - Contenido en desarrollo</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
