import { ReactNode } from "react";

export interface DataTableColumn<T> {
  key: string;
  header: string;
  width?: string;
  align?: "left" | "center" | "right";
  render: (item: T) => ReactNode;
}

export interface DataTableAction<T> {
  icon: ReactNode;
  onClick: (item: T) => void;
  variant?: "default" | "destructive";
  title?: string;
}

export interface DataTableBulkAction {
  label: string;
  icon?: ReactNode;
  onClick: (selectedIds: string[]) => void;
  variant?: "default" | "destructive";
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
}