import { useState, ReactNode } from "react";
import { Checkbox } from "../ui/Checkbox";
import { Button } from "../ui/Button";
import { Badge } from "../ui/Badge";
import { ChevronLeft, ChevronRight, Pencil, Trash2, MoreVertical } from "lucide-react";

/**
 * ESTÁNDAR DE TABLAS - ColdSync
 * 
 * Componente estandarizado para mantener consistencia visual en todas las tablas.
 * 
 * Características:
 * - Multiselección con checkboxes
 * - Paginación automática
 * - Action bar cuando hay elementos seleccionados
 * - Hover states consistentes
 * - Headers sticky
 * - Acciones por fila (editar, eliminar)
 * - Badges de estado estandarizados
 */

export interface Column<T> {
  key: string;
  label: string;
  render?: (item: T) => ReactNode;
  sortable?: boolean;
  width?: string; // Ej: "200px", "w-32", etc.
  align?: "left" | "center" | "right";
}

interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  idField?: keyof T; // Campo que identifica únicamente cada fila (default: "id")
  selectable?: boolean;
  onEdit?: (item: T) => void;
  onDelete?: (item: T) => void;
  onRowClick?: (item: T) => void;
  itemsPerPage?: number;
  showPagination?: boolean;
  bulkActions?: ReactNode;
  emptyMessage?: string;
  customRowActions?: (item: T) => ReactNode;
}

export function DataTable<T extends Record<string, any>>({
  data,
  columns,
  idField = "id" as keyof T,
  selectable = true,
  onEdit,
  onDelete,
  onRowClick,
  itemsPerPage = 10,
  showPagination = true,
  bulkActions,
  emptyMessage = "No hay datos para mostrar",
  customRowActions,
}: DataTableProps<T>) {
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);

  const totalPages = Math.ceil(data.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentData = data.slice(startIndex, endIndex);

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedItems(currentData.map(item => String(item[idField])));
    } else {
      setSelectedItems([]);
    }
  };

  const handleSelectItem = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedItems([...selectedItems, id]);
    } else {
      setSelectedItems(selectedItems.filter(itemId => itemId !== id));
    }
  };

  const allSelected = currentData.length > 0 && selectedItems.length === currentData.length;

  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      pages.push(1);
      
      if (currentPage > 3) {
        pages.push('...');
      }
      
      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);
      
      for (let i = start; i <= end; i++) {
        if (!pages.includes(i)) {
          pages.push(i);
        }
      }
      
      if (currentPage < totalPages - 2) {
        pages.push('...');
      }
      
      pages.push(totalPages);
    }
    
    return pages;
  };

  return (
    <div className="flex flex-col flex-1 overflow-hidden bg-white">
      {/* Action Bar - Mostrar cuando hay selección */}
      {selectable && selectedItems.length > 0 && (
        <div className="px-6 py-3 bg-blue-50 border-b border-blue-200 flex items-center gap-4">
          <span className="text-sm text-gray-700">
            {selectedItems.length} seleccionado{selectedItems.length > 1 ? 's' : ''}
          </span>
          {bulkActions || (
            <>
              {onDelete && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="gap-2 text-red-600 hover:text-red-700 hover:bg-red-50"
                  onClick={() => {
                    selectedItems.forEach(id => {
                      const item = data.find(item => String(item[idField]) === id);
                      if (item && onDelete) onDelete(item);
                    });
                    setSelectedItems([]);
                  }}
                >
                  <Trash2 className="w-4 h-4" />
                  Eliminar seleccionados
                </Button>
              )}
            </>
          )}
        </div>
      )}

      {/* Table Container */}
      <div className="flex-1 overflow-auto">
        <table className="w-full border-collapse">
          <thead className="sticky top-0 z-10" style={{ backgroundColor: '#eff5fd' }}>
            <tr>
              {selectable && (
                <th className="px-4 py-2.5 text-left border-b border-gray-200 w-12">
                  <Checkbox
                    checked={allSelected}
                    onCheckedChange={handleSelectAll}
                  />
                </th>
              )}
              {columns.map((column) => (
                <th
                  key={column.key}
                  className={`px-4 py-2.5 border-b border-gray-200 ${
                    column.align === "right" ? "text-right" : column.align === "center" ? "text-center" : "text-left"
                  } ${column.width || ""}`}
                >
                  <span className="text-xs text-gray-500 uppercase tracking-wider">
                    {column.label}
                  </span>
                </th>
              ))}
              {(onEdit || onDelete || customRowActions) && (
                <th className="px-4 py-2.5 text-right border-b border-gray-200 w-24">
                  <span className="text-xs text-gray-500 uppercase tracking-wider">Acciones</span>
                </th>
              )}
            </tr>
          </thead>
          <tbody className="bg-white">
            {currentData.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length + (selectable ? 1 : 0) + (onEdit || onDelete ? 1 : 0)}
                  className="px-4 py-12 text-center text-gray-500"
                >
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              currentData.map((item) => {
                const itemId = String(item[idField]);
                const isSelected = selectedItems.includes(itemId);

                return (
                  <tr
                    key={itemId}
                    className={`hover:bg-gray-50 transition-colors ${
                      onRowClick ? "cursor-pointer" : ""
                    }`}
                    onClick={() => onRowClick && onRowClick(item)}
                  >
                    {selectable && (
                      <td className="px-4 py-3 border-b border-gray-100">
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={(checked) =>
                            handleSelectItem(itemId, checked as boolean)
                          }
                          onClick={(e) => e.stopPropagation()}
                        />
                      </td>
                    )}
                    {columns.map((column) => (
                      <td
                        key={column.key}
                        className={`px-4 py-3 border-b border-gray-100 ${
                          column.align === "right" ? "text-right" : column.align === "center" ? "text-center" : "text-left"
                        }`}
                      >
                        {column.render
                          ? column.render(item)
                          : <span className="text-xs text-gray-900">{item[column.key]}</span>}
                      </td>
                    ))}
                    {(onEdit || onDelete || customRowActions) && (
                      <td className="px-4 py-3 border-b border-gray-100">
                        <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                          {customRowActions ? (
                            customRowActions(item)
                          ) : (
                            <>
                              {onEdit && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-7 w-7 p-0"
                                  onClick={() => onEdit(item)}
                                >
                                  <Pencil className="w-3.5 h-3.5 text-gray-600" />
                                </Button>
                              )}
                              {onDelete && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-7 w-7 p-0"
                                  onClick={() => onDelete(item)}
                                >
                                  <Trash2 className="w-3.5 h-3.5 text-red-600" />
                                </Button>
                              )}
                            </>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination - FUERA del contenedor de scroll */}
      {showPagination && data.length > 0 && (
        <div className="px-6 py-4 border-t border-gray-200 bg-white flex items-center justify-between">
          <div className="text-sm text-gray-700">
            Mostrando {startIndex + 1} a {Math.min(endIndex, data.length)} de {data.length} registros
          </div>
          <div className="flex items-center gap-1.5">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(1)}
              disabled={currentPage === 1}
              className="h-7 px-2"
              title="Primera página"
            >
              <span className="text-xs">&laquo;</span>
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(currentPage - 1)}
              disabled={currentPage === 1}
              className="h-7 w-7 p-0"
              title="Página anterior"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </Button>
            
            <div className="flex items-center gap-0.5">
              {getPageNumbers().map((page, index) => 
                page === '...' ? (
                  <span key={`ellipsis-${index}`} className="px-1.5 text-sm text-gray-400">...</span>
                ) : (
                  <Button
                    key={page}
                    variant={currentPage === page ? "default" : "outline"}
                    size="sm"
                    className="h-7 w-7 p-0 text-xs"
                    style={currentPage === page ? { backgroundColor: '#004ef0' } : {}}
                    onClick={() => setCurrentPage(page as number)}
                  >
                    {page}
                  </Button>
                )
              )}
            </div>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="h-7 w-7 p-0"
              title="Página siguiente"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(totalPages)}
              disabled={currentPage === totalPages}
              className="h-7 px-2"
              title="Última página"
            >
              <span className="text-xs">&raquo;</span>
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Helpers para renderizado común de columnas
 */
export const TableHelpers = {
  /**
   * Renderiza una celda con título y subtítulo
   */
  renderTwoLine: (title: string, subtitle: string, titleLink?: () => void) => (
    <div className="flex flex-col gap-0.5">
      {titleLink ? (
        <button 
          onClick={(e) => {
            e.stopPropagation();
            titleLink();
          }}
          className="text-sm text-left hover:underline"
          style={{ color: '#004ef0' }}
        >
          {title}
        </button>
      ) : (
        <span className="text-sm" style={{ color: '#004ef0' }}>{title}</span>
      )}
      <span className="text-xs text-gray-500">{subtitle}</span>
    </div>
  ),

  /**
   * Renderiza un badge de estado
   */
  renderStatusBadge: (status: string, variant: "success" | "warning" | "error" | "info" | "default" = "default") => {
    const variants = {
      success: "bg-green-100 text-green-700 hover:bg-green-100",
      warning: "bg-yellow-100 text-yellow-700 hover:bg-yellow-100",
      error: "bg-red-100 text-red-700 hover:bg-red-100",
      info: "bg-blue-100 text-blue-700 hover:bg-blue-100",
      default: "bg-gray-100 text-gray-700 hover:bg-gray-100",
    };

    return (
      <Badge className={`${variants[variant]} text-xs`}>
        {status}
      </Badge>
    );
  },

  /**
   * Renderiza texto simple con tamaño estándar
   */
  renderText: (text: string | number) => (
    <span className="text-xs text-gray-900">{text}</span>
  ),

  /**
   * Renderiza un link clickeable
   */
  renderLink: (text: string, onClick: () => void) => (
    <button
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      className="text-sm hover:underline"
      style={{ color: '#004ef0' }}
    >
      {text}
    </button>
  ),
};