import { useState } from "react";
import { Button } from "../../ui/Button";
import { Checkbox } from "../../ui/Checkbox";
import { DataTablePagination } from "./DataTablePagination";
import { DataTableProps } from "./types";

export function DataTable<T>({
  data,
  columns,
  getRowId,
  onRowClick,
  actions = [],
  bulkActions = [],
  itemsPerPage = 10,
  emptyMessage = "No hay datos disponibles",
  totalLabel = "elementos",
  showPagination = true, // Por defecto mostrar paginador
}: DataTableProps<T>) {
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);

  const totalPages = Math.ceil(data.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentData = data.slice(startIndex, endIndex);

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedItems(currentData.map(item => getRowId(item)));
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
  const hasSelection = selectedItems.length > 0;

  // Calculate total colspan
  const totalColspan = columns.length + 1 + (actions.length > 0 ? 1 : 0);

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Table Container */}
      <div className="flex-1 overflow-auto">
        <table className="w-full border-collapse">
          <thead className="sticky top-0 z-10" style={{ backgroundColor: '#eff5fd' }}>
            {hasSelection ? (
              // Header transformado cuando hay selección
              <tr>
                <th colSpan={totalColspan} className="px-4 py-2.5 border-b" style={{ borderColor: '#dde9fb' }}>
                  <div className="flex items-center gap-3">
                    <Checkbox
                      checked={allSelected}
                      onCheckedChange={handleSelectAll}
                    />
                    <span className="text-sm text-gray-900">
                      {selectedItems.length} seleccionada{selectedItems.length > 1 ? 's' : ''}
                    </span>
                    {bulkActions
                      .filter(action => action.variant === 'destructive')
                      .map((action, index) => (
                        <Button 
                          key={index}
                          variant="outline" 
                          size="sm" 
                          className="h-7 gap-2 text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                          onClick={() => action.onClick(selectedItems)}
                        >
                          {action.icon}
                          {action.label}
                        </Button>
                      ))
                    }
                  </div>
                </th>
              </tr>
            ) : (
              // Header normal con columnas
              <tr>
                <th className="px-4 py-2.5 text-left border-b w-12" style={{ borderColor: '#dde9fb' }}>
                  <Checkbox
                    checked={allSelected}
                    onCheckedChange={handleSelectAll}
                  />
                </th>
                {columns.map((column) => (
                  <th 
                    key={column.key}
                    className={`px-4 py-2.5 border-b ${
                      column.align === 'center' ? 'text-center' : 
                      column.align === 'right' ? 'text-right' : 
                      'text-left'
                    }`}
                    style={{ 
                      borderColor: '#dde9fb',
                      width: column.width 
                    }}
                  >
                    <span className="text-xs text-gray-700 uppercase tracking-wider font-semibold">
                      {column.header}
                    </span>
                  </th>
                ))}
                {actions.length > 0 && (
                  <th className="px-4 py-2.5 text-right border-b w-24" style={{ borderColor: '#dde9fb' }}>
                    <span className="text-xs text-gray-700 uppercase tracking-wider font-semibold">
                      Acciones
                    </span>
                  </th>
                )}
              </tr>
            )}
          </thead>
          <tbody className="bg-white">
            {currentData.length === 0 ? (
              <tr>
                <td colSpan={totalColspan} className="px-4 py-8 text-center text-sm text-gray-500">
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              currentData.map((item) => {
                const itemId = getRowId(item);
                return (
                  <tr 
                    key={itemId}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-4 py-3 border-b border-gray-100">
                      <Checkbox
                        checked={selectedItems.includes(itemId)}
                        onCheckedChange={(checked) => handleSelectItem(itemId, checked as boolean)}
                      />
                    </td>
                    {columns.map((column) => (
                      <td 
                        key={column.key}
                        className={`px-4 py-3 border-b border-gray-100 ${
                          column.align === 'center' ? 'text-center' : 
                          column.align === 'right' ? 'text-right' : 
                          ''
                        }`}
                      >
                        {column.render(item)}
                      </td>
                    ))}
                    {actions.length > 0 && (
                      <td className="px-4 py-3 border-b border-gray-100">
                        <div className="flex items-center justify-end gap-1">
                          {actions.map((action, index) => (
                            <Button
                              key={index}
                              variant="ghost"
                              size="sm"
                              className="h-7 w-7 p-0"
                              onClick={() => action.onClick(item)}
                              title={action.title}
                            >
                              {action.icon}
                            </Button>
                          ))}
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

      {/* Pagination */}
      {showPagination && data.length > 0 && (
        <DataTablePagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={data.length}
          startIndex={startIndex}
          endIndex={endIndex}
          itemLabel={totalLabel}
          onPageChange={setCurrentPage}
        />
      )}
    </div>
  );
}