import { ReactNode } from "react";
import { Search, Filter, Plus, Download, Upload, ChevronDown } from "lucide-react";
import { PrimaryButton } from "./PrimaryButton";
import { SecondaryButton } from "./SecondaryButton";
import { Input } from "../ui/Input";

/**
 * TOOLBAR DE TABLA - ColdSync
 * 
 * Componente estandarizado para la barra de herramientas superior de las tablas.
 * Incluye búsqueda, filtros y botones de acción.
 */

interface TableToolbarProps {
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  searchPlaceholder?: string;
  filters?: ReactNode;
  actions?: ReactNode;
  showSearch?: boolean;
}

export function TableToolbar({
  searchValue,
  onSearchChange,
  searchPlaceholder = "Buscar...",
  filters,
  actions,
  showSearch = true,
}: TableToolbarProps) {
  return (
    <div className="px-6 py-4 border-b border-gray-200 bg-white">
      <div className="flex items-center justify-between gap-4">
        {/* Search Bar */}
        {showSearch && (
          <div className="flex-1 max-w-md relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            <Input
              type="search"
              placeholder={searchPlaceholder}
              value={searchValue}
              onChange={(e) => onSearchChange?.(e.target.value)}
              className="pl-9"
            />
          </div>
        )}

        {/* Filters and Actions */}
        <div className="flex items-center gap-2">
          {filters}
          {actions}
        </div>
      </div>
    </div>
  );
}

/**
 * Botones de acción comunes pre-construidos
 */
export const TableActions = {
  /**
   * Botón para crear nuevo registro
   */
  Create: ({ onClick, label = "Nuevo" }: { onClick: () => void; label?: string }) => (
    <PrimaryButton
      onClick={onClick}
      icon={Plus}
    >
      {label}
    </PrimaryButton>
  ),

  /**
   * Botón para exportar datos
   */
  Export: ({ onClick, label = "Exportar" }: { onClick: () => void; label?: string }) => (
    <SecondaryButton
      onClick={onClick}
      icon={Download}
    >
      {label}
    </SecondaryButton>
  ),

  /**
   * Botón para importar datos
   */
  Import: ({ onClick, label = "Importar" }: { onClick: () => void; label?: string }) => (
    <SecondaryButton
      onClick={onClick}
      icon={Upload}
    >
      {label}
    </SecondaryButton>
  ),

  /**
   * Botón de filtro con dropdown
   */
  FilterDropdown: ({ 
    onClick, 
    label = "Filtros",
    active = false 
  }: { 
    onClick: () => void; 
    label?: string;
    active?: boolean;
  }) => (
    <SecondaryButton
      onClick={onClick}
      icon={Filter}
      className={active ? 'bg-blue-50 border-blue-300' : ''}
    >
      {label}
    </SecondaryButton>
  ),

  /**
   * Botón de dropdown genérico
   */
  Dropdown: ({ 
    label, 
    onClick 
  }: { 
    label: string; 
    onClick: () => void;
  }) => (
    <SecondaryButton
      onClick={onClick}
      className="gap-2"
    >
      {label}
      <ChevronDown className="w-4 h-4" />
    </SecondaryButton>
  ),
};

/**
 * Tabs para filtrado rápido (Todos, Activos, Inactivos, etc.)
 */
interface QuickFilterTab {
  id: string;
  label: string;
  count?: number;
}

interface QuickFilterTabsProps {
  tabs: QuickFilterTab[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
}

export function QuickFilterTabs({ tabs, activeTab, onTabChange }: QuickFilterTabsProps) {
  return (
    <div className="border-b border-gray-200 bg-white">
      <div className="px-6">
        <div className="flex gap-6">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`
                relative py-4 text-sm transition-colors
                ${activeTab === tab.id 
                  ? 'text-gray-900' 
                  : 'text-gray-600 hover:text-gray-900'
                }
              `}
            >
              <span>{tab.label}</span>
              {tab.count !== undefined && (
                <span className={`
                  ml-2 px-2 py-0.5 rounded-full text-xs
                  ${activeTab === tab.id 
                    ? 'bg-blue-100 text-blue-700' 
                    : 'bg-gray-100 text-gray-600'
                  }
                `}>
                  {tab.count}
                </span>
              )}
              {activeTab === tab.id && (
                <div 
                  className="absolute bottom-0 left-0 right-0 h-0.5"
                  style={{ backgroundColor: '#004ef0' }}
                />
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

/**
 * Contenedor completo que combina tabs + toolbar
 */
interface TableHeaderProps {
  tabs?: QuickFilterTab[];
  activeTab?: string;
  onTabChange?: (tabId: string) => void;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  searchPlaceholder?: string;
  filters?: ReactNode;
  actions?: ReactNode;
  showSearch?: boolean;
}

export function TableHeader({
  tabs,
  activeTab,
  onTabChange,
  searchValue,
  onSearchChange,
  searchPlaceholder,
  filters,
  actions,
  showSearch = true,
}: TableHeaderProps) {
  return (
    <>
      {tabs && activeTab && onTabChange && (
        <QuickFilterTabs 
          tabs={tabs} 
          activeTab={activeTab} 
          onTabChange={onTabChange} 
        />
      )}
      <TableToolbar
        searchValue={searchValue}
        onSearchChange={onSearchChange}
        searchPlaceholder={searchPlaceholder}
        filters={filters}
        actions={actions}
        showSearch={showSearch}
      />
    </>
  );
}