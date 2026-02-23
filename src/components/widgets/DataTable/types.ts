import { ReactNode } from "react";

export interface DataTableColumn<T> {
  key: string;
  header: string;
  width?: string;
  align?: "left" | "center" | "right";
  render: (item: T) => ReactNode;
}

export interface DataTableAction<T> {
  icon: ReactNode | ((item: T) => ReactNode);
  onClick: (item: T) => void;
  variant?: "default" | "destructive" | ((item: T) => "default" | "destructive");
  title?: string | ((item: T) => string);
  hidden?: (item: T) => boolean; // Function to determine if action should be hidden
}

export interface DataTableBulkAction {
  label: string;
  icon?: ReactNode;
  onClick: (selectedIds: string[]) => void;
  variant?: "default" | "destructive";
  isVisible?: (selectedIds: string[]) => boolean; // Function to determine if bulk action should be visible
}

export interface DataTableProps<T> {
  data: T[];
  columns: DataTableColumn<T>[];
  getRowId: (item: T) => string;
  onRowClick?: (item: T) => void;
  actions?: DataTableAction<T>[];
  bulkActions?: DataTableBulkAction[];
  itemsPerPage?: number;
  emptyMessage?: string;
  totalLabel?: string;
  showPagination?: boolean; // Controlar si se muestra el paginador integrado
  showSelection?: boolean; // Controlar si se muestra la columna de selección
  allowOverflow?: boolean; // Permitir que el contenido desborde (útil para dropdowns en celdas)
  onReorder?: (oldIndex: number, newIndex: number) => void;
  headerHeight?: "default" | "dispatch";
}
