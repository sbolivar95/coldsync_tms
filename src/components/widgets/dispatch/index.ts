export { DispatchLayout, type DispatchLayoutProps, type DispatchLayoutConfig } from "./DispatchLayout";
export { UnassignedSidebar, type UnassignedSidebarProps } from "./UnassignedSidebar";
export { GanttHeader, type GanttHeaderProps } from "./GanttHeader";
export { UnassignedOrdersList, type UnassignedOrdersListProps } from "./UnassignedOrdersList";
export { DispatchGantt, type DispatchGanttProps } from "./DispatchGantt";
export { DispatchActions, type DispatchActionsProps } from "./DispatchActions";
export { UnitCard, type UnitCardUnit, type UnitCardProps } from "./UnitCard";
export { UnitsList, type UnitsListProps, type Unit } from "./UnitsList";
export { useDateRange, type DayInfo, type UseDateRangeOptions } from "./useDateRange";
export { StatusCard, type StatusCardProps, type StatusConfig } from "./StatusCard";
export { DispatchSideDrawer, type DispatchSideDrawerProps, type SideDrawerTab, type SideDrawerAction } from "./DispatchSideDrawer";
export { DispatchDialog, type DispatchDialogProps } from "./DispatchDialog";

// Re-exportar piezas atómicas de despacho
export { DraggableOrder } from "../../../features/dispatch/views/gantt/DraggableOrder";
export { DraggableTripCard } from "../../../features/dispatch/views/gantt/DraggableTripCard";
export { TripCard } from "../../../features/dispatch/views/gantt/TripCard";
export { VehicleDropZone } from "../../../features/dispatch/views/gantt/VehicleDropZone";

// Nota: Para DispatchOrderDrawer con lógica de negocio, 
// se recomienda usar los componentes de "features" o bien construir versiones 
// específicas usando DispatchSideDrawer.
