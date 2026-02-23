import { useState, useMemo, useEffect } from "react";
import { Button } from "../../ui/Button";
import { Checkbox } from "../../ui/Checkbox";
import { DataTablePagination } from "./DataTablePagination";
import { DataTableProps, DataTableColumn, DataTableAction } from "./types";
import { ScrollArea } from "../../ui/ScrollArea";
import { PrimaryButton } from "../PrimaryButton";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

interface SortableRowProps<T> {
  item: T;
  getRowId: (item: T) => string;
  columns: DataTableColumn<T>[];
  actions: DataTableAction<T>[];
  showSelection: boolean;
  onRowClick?: (item: T) => void;
  selectedItems: string[];
  handleSelectItem: (id: string, checked: boolean) => void;
}

function SortableRow<T>({
  item,
  getRowId,
  columns,
  actions,
  showSelection,
  onRowClick,
  selectedItems,
  handleSelectItem
}: SortableRowProps<T>) {
  const itemId = getRowId(item);
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: itemId });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : 0,
    opacity: isDragging ? 0.5 : 1,
    position: 'relative' as const,
  };

  return (
    <tr
      ref={setNodeRef}
      style={style}
      className={`hover:bg-gray-50 transition-colors ${onRowClick ? 'cursor-pointer' : ''} ${isDragging ? 'bg-blue-50/50 shadow-sm border-blue-200 cursor-grabbing' : ''}`}
      onClick={(e) => {
        const target = e.target as HTMLElement;
        if (!target.closest('input[type="checkbox"]') && !target.closest('button')) {
          onRowClick?.(item);
        }
      }}
    >
      {showSelection && (
        <td className="px-4 py-3 border-b border-gray-50" onClick={(e) => e.stopPropagation()}>
          <Checkbox
            checked={selectedItems.includes(itemId)}
            onCheckedChange={(checked) => handleSelectItem(itemId, checked as boolean)}
          />
        </td>
      )}
      {columns.map((column, colIdx) => (
        <td
          key={column.key}
          className={`px-4 py-3 border-b border-gray-50 ${column.align === 'center' ? 'text-center' :
            column.align === 'right' ? 'text-right' :
              ''
            }`}
          {...(colIdx === 0 ? { ...attributes, ...listeners } : {})}
        >
          {column.render(item)}
        </td>
      ))}
      {actions.length > 0 && (
        <td className="px-4 py-3 border-b border-gray-50" onClick={(e) => e.stopPropagation()}>
          <div className="flex items-center justify-end gap-1">
            {actions
              .filter(action => !action.hidden || !action.hidden(item))
              .map((action, index) => {
                const icon = typeof action.icon === 'function' ? action.icon(item) : action.icon;
                const title = typeof action.title === 'function' ? action.title(item) : action.title;
                const variant = typeof action.variant === 'function' ? action.variant(item) : action.variant;

                const isCompleteComponent = icon &&
                  typeof icon === 'object' &&
                  'type' in icon &&
                  typeof (icon as { type?: unknown }).type === 'function';

                if (isCompleteComponent) {
                  return <div key={index}>{icon}</div>;
                }

                return (
                  <Button
                    key={index}
                    variant="ghost"
                    size="sm"
                    className={`h-7 w-7 p-0 ${variant === 'destructive' ? 'hover:bg-red-50' : ''}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      action.onClick(item);
                    }}
                    title={title}
                  >
                    {icon}
                  </Button>
                );
              })}
          </div>
        </td>
      )}
    </tr>
  );
}

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
  showPagination = true,
  showSelection = true,
  onReorder,
  headerHeight = "default"
}: DataTableProps<T>) {
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);

  // Clean up selection when selected items no longer exist in current data
  useEffect(() => {
    if (selectedItems.length > 0) {
      const currentIds = data.map(item => getRowId(item));
      const validSelectedItems = selectedItems.filter(id => currentIds.includes(id));
      
      if (validSelectedItems.length !== selectedItems.length) {
        setSelectedItems(validSelectedItems);
      }
    }
  }, [data, selectedItems, getRowId]);

  const totalPages = Math.ceil(data.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentData = data.slice(startIndex, endIndex);

  // DnD Sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id && onReorder) {
      const oldIndex = data.findIndex(item => getRowId(item) === active.id);
      const newIndex = data.findIndex(item => getRowId(item) === over.id);

      if (oldIndex !== -1 && newIndex !== -1) {
        onReorder(oldIndex, newIndex);
      }
    }
  };

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

  const totalColspan = columns.length + (showSelection ? 1 : 0) + (actions.length > 0 ? 1 : 0);
  const isDispatchHeader = headerHeight === "dispatch";
  const headerCellClass = isDispatchHeader ? "px-4 h-[52px] align-middle border-b" : "px-4 py-2.5 border-b";
  const headerRowClass = isDispatchHeader ? "h-[52px]" : "";

  const rowIds = useMemo(() => currentData.map(item => getRowId(item)), [currentData, getRowId]);

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <ScrollArea className="flex-1">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <table className="w-full border-collapse">
            <thead className="sticky top-0 z-1" style={{ backgroundColor: '#eff5fd' }}>
              {hasSelection ? (
                <tr className={headerRowClass}>
                  <th colSpan={totalColspan} className={headerCellClass} style={{ borderColor: '#dde9fb' }}>
                    <div className="flex items-center gap-3">
                      <Checkbox
                        checked={allSelected}
                        onCheckedChange={handleSelectAll}
                      />
                      <span className="text-sm text-gray-900">
                        {selectedItems.length} seleccionada{selectedItems.length > 1 ? 's' : ''}
                      </span>
                      {bulkActions
                        .filter(action => !action.isVisible || action.isVisible(selectedItems))
                        .map((action, index) => {
                        // Usar PrimaryButton para acciones default (Aceptar)
                        // Usar Button outline para acciones destructive (Rechazar)
                        if (action.variant === 'destructive') {
                          return (
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
                          );
                        }
                        
                        return (
                          <PrimaryButton
                            key={index}
                            onClick={() => action.onClick(selectedItems)}
                            size="sm"
                            className="h-7"
                          >
                            {action.icon}
                            {action.label}
                          </PrimaryButton>
                        );
                      })}
                    </div>
                  </th>
                </tr>
              ) : (
                <tr className={headerRowClass}>
                  {showSelection && (
                    <th
                      className={`${headerCellClass} text-left w-12 rounded-tl-md`}
                      style={{ borderColor: '#dde9fb' }}
                    >
                      <Checkbox
                        checked={allSelected}
                        onCheckedChange={handleSelectAll}
                      />
                    </th>
                  )}
                  {columns.map((column, index) => (
                    <th
                      key={column.key}
                      className={`${headerCellClass} ${column.align === 'center' ? 'text-center' :
                        column.align === 'right' ? 'text-right' :
                          'text-left'
                        } ${index === 0 && !showSelection ? 'rounded-tl-md' : ''} ${index === columns.length - 1 && actions.length === 0 ? 'rounded-tr-md' : ''}`}
                      style={{
                        borderColor: '#dde9fb',
                        width: column.width
                      }}
                    >
                      <span className="text-xs text-gray-500 uppercase tracking-wider font-semibold">
                        {column.header}
                      </span>
                    </th>
                  ))}
                  {actions.length > 0 && (
                    <th
                      className={`${headerCellClass} text-right w-24 rounded-tr-md`}
                      style={{ borderColor: '#dde9fb' }}
                    >
                      <span className="text-xs text-gray-500 uppercase tracking-wider font-semibold">
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
              ) : onReorder ? (
                <SortableContext
                  items={rowIds}
                  strategy={verticalListSortingStrategy}
                >
                  {currentData.map((item) => (
                    <SortableRow
                      key={getRowId(item)}
                      item={item}
                      getRowId={getRowId}
                      columns={columns}
                      actions={actions}
                      showSelection={showSelection}
                      onRowClick={onRowClick}
                      selectedItems={selectedItems}
                      handleSelectItem={handleSelectItem}
                    />
                  ))}
                </SortableContext>
              ) : (
                currentData.map((item) => {
                  const itemId = getRowId(item);
                  return (
                    <tr
                      key={itemId}
                      className={`hover:bg-gray-50 transition-colors ${onRowClick ? 'cursor-pointer' : ''}`}
                      onClick={(e) => {
                        const target = e.target as HTMLElement;
                        if (!target.closest('input[type="checkbox"]') && !target.closest('button')) {
                          onRowClick?.(item);
                        }
                      }}
                    >
                      {showSelection && (
                        <td className="px-4 py-3 border-b border-gray-50" onClick={(e) => e.stopPropagation()}>
                          <Checkbox
                            checked={selectedItems.includes(itemId)}
                            onCheckedChange={(checked) => handleSelectItem(itemId, checked as boolean)}
                          />
                        </td>
                      )}
                      {columns.map((column) => (
                        <td
                          key={column.key}
                          className={`px-4 py-3 border-b border-gray-50 ${column.align === 'center' ? 'text-center' :
                            column.align === 'right' ? 'text-right' :
                              ''
                            }`}
                        >
                          {column.render(item)}
                        </td>
                      ))}
                      {actions.length > 0 && (
                        <td className="px-4 py-3 border-b border-gray-50" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-end gap-1">
                            {actions
                              .filter(action => !action.hidden || !action.hidden(item))
                              .map((action, index) => {
                                const icon = typeof action.icon === 'function' ? action.icon(item) : action.icon;
                                const title = typeof action.title === 'function' ? action.title(item) : action.title;
                                const variant = typeof action.variant === 'function' ? action.variant(item) : action.variant;

                                const isCompleteComponent = icon &&
                                  typeof icon === 'object' &&
                                  'type' in icon &&
                                  typeof (icon as { type?: unknown }).type === 'function';

                                if (isCompleteComponent) {
                                  return <div key={index}>{icon}</div>;
                                }

                                return (
                                  <Button
                                    key={index}
                                    variant="ghost"
                                    size="sm"
                                    className={`h-7 w-7 p-0 ${variant === 'destructive' ? 'hover:bg-red-50' : ''}`}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      action.onClick(item);
                                    }}
                                    title={title}
                                  >
                                    {icon}
                                  </Button>
                                );
                              })}
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </DndContext>
      </ScrollArea>

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
