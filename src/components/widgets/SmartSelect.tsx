import { useState, useMemo } from "react";
import { Search, X } from "lucide-react";
import { Label } from "../ui/Label";
import { Checkbox } from "../ui/Checkbox";
import { Badge } from "../ui/Badge";

/**
 * SMART SELECT COMPONENT - ColdSync
 * 
 * Componente reutilizable para diferentes tipos de selección:
 * 
 * Modos disponibles:
 * - 'single': Selección simple con búsqueda
 * - 'multi': Selección múltiple con checkboxes
 * - 'smart': Selección inteligente con filtros, scores y metadata
 */

// ==================== TIPOS ====================

export interface BaseOption {
  value: string;
  label: string;
}

export interface SmartOption extends BaseOption {
  // Metadata adicional para modo 'smart'
  subtitle?: string;
  score?: number;
  utilization?: number;
  tags?: string[];
  metadata?: { label: string; value: string }[];
  secondaryId?: string;
}

type SelectMode = 'single' | 'multi' | 'smart';

interface SmartSelectProps {
  // Configuración básica
  label?: string;
  id?: string;
  mode?: SelectMode;
  placeholder?: string;
  required?: boolean;
  helpText?: string;
  error?: string;
  disabled?: boolean;

  // Opciones
  options: SmartOption[];

  // Valores
  value?: string | string[];
  onChange?: (value: string | string[]) => void;

  // Configuración de búsqueda
  searchable?: boolean;
  searchPlaceholder?: string;

  // Tabs de filtrado (solo para modo 'smart')
  filters?: { id: string; label: string }[];
  activeFilter?: string;
  onFilterChange?: (filterId: string) => void;

  // Renderizado personalizado
  renderOption?: (option: SmartOption) => React.ReactNode;

  // Altura máxima del dropdown
  maxHeight?: string;
}

// ==================== COMPONENTE PRINCIPAL ====================

export function SmartSelect({
  label,
  id,
  mode = 'single',
  placeholder = 'Seleccionar...',
  required = false,
  helpText,
  error,
  disabled = false,
  options,
  value,
  onChange,
  searchable = true,
  searchPlaceholder = 'Buscar...',
  filters,
  activeFilter,
  onFilterChange,
  renderOption,
  maxHeight = '320px',
}: SmartSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedValues, setSelectedValues] = useState<string[]>(
    Array.isArray(value) ? value : value ? [value] : []
  );

  // Filtrado de opciones
  const filteredOptions = useMemo(() => {
    if (!searchQuery) return options;

    const query = searchQuery.toLowerCase();
    return options.filter(
      (option) =>
        option.label.toLowerCase().includes(query) ||
        option.subtitle?.toLowerCase().includes(query) ||
        option.secondaryId?.toLowerCase().includes(query) ||
        option.tags?.some((tag) => tag.toLowerCase().includes(query))
    );
  }, [options, searchQuery]);

  // Manejo de selección
  const handleSelect = (optionValue: string) => {
    if (mode === 'single') {
      setSelectedValues([optionValue]);
      onChange?.(optionValue);
      setIsOpen(false);
      setSearchQuery('');
    } else if (mode === 'multi') {
      const newValues = selectedValues.includes(optionValue)
        ? selectedValues.filter((v) => v !== optionValue)
        : [...selectedValues, optionValue];
      setSelectedValues(newValues);
      onChange?.(newValues);
    } else if (mode === 'smart') {
      setSelectedValues([optionValue]);
      onChange?.(optionValue);
      setIsOpen(false);
      setSearchQuery('');
    }
  };

  const isSelected = (optionValue: string) => selectedValues.includes(optionValue);

  const getDisplayLabel = () => {
    if (selectedValues.length === 0) return placeholder;
    if (mode === 'multi') {
      return `${selectedValues.length} seleccionado${selectedValues.length > 1 ? 's' : ''}`;
    }
    const selected = options.find((opt) => opt.value === selectedValues[0]);
    return selected?.label || placeholder;
  };

  // ==================== RENDERIZADO ====================

  return (
    <div className="space-y-1.5">
      {/* Label */}
      {label && (
        <Label htmlFor={id} className="text-xs text-gray-600">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </Label>
      )}

      {/* Select Container */}
      <div className="relative">
        {/* Trigger Button */}
        <button
          type="button"
          id={id}
          disabled={disabled}
          onClick={() => !disabled && setIsOpen(!isOpen)}
          className={`
            w-full h-9 px-3 py-2 text-left text-sm
            border border-gray-300 rounded-md bg-white
            flex items-center justify-between
            transition-colors
            ${disabled ? 'bg-gray-50 text-gray-500 cursor-not-allowed' : 'hover:border-gray-400'}
            ${isOpen ? 'border-blue-500 ring-2 ring-blue-100' : ''}
            ${error ? 'border-red-500' : ''}
          `}
        >
          <span className={selectedValues.length === 0 ? 'text-gray-500' : 'text-gray-900'}>
            {getDisplayLabel()}
          </span>
          <svg
            className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {/* Dropdown */}
        {isOpen && (
          <>
            {/* Backdrop */}
            <div
              className="fixed inset-0 z-10"
              onClick={() => setIsOpen(false)}
            />

            {/* Dropdown Content */}
            <div
              className="absolute z-20 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg overflow-hidden"
              style={{ maxHeight }}
            >
              {/* Search Bar */}
              {searchable && (
                <div className="p-2 border-b border-gray-100">
                  <div className="relative">
                    <Search className="absolute left-2.5 top-2 h-4 w-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder={searchPlaceholder}
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full h-8 pl-8 pr-8 text-sm border border-gray-200 rounded focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-100"
                      onClick={(e) => e.stopPropagation()}
                    />
                    {searchQuery && (
                      <button
                        onClick={() => setSearchQuery('')}
                        className="absolute right-2 top-2 text-gray-400 hover:text-gray-600"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* Filters (modo smart) */}
              {mode === 'smart' && filters && filters.length > 0 && (
                <div className="flex gap-1 px-3 py-2 border-b border-gray-100 bg-gray-50">
                  {filters.map((filter) => (
                    <button
                      key={filter.id}
                      onClick={() => onFilterChange?.(filter.id)}
                      className={`
                        px-3 py-1 text-xs rounded transition-colors
                        ${
                          activeFilter === filter.id
                            ? 'bg-blue-500 text-white'
                            : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
                        }
                      `}
                    >
                      {filter.label}
                    </button>
                  ))}
                </div>
              )}

              {/* Options List */}
              <div className="overflow-y-auto" style={{ maxHeight: 'calc(320px - 80px)' }}>
                {filteredOptions.length === 0 ? (
                  <div className="px-3 py-8 text-center text-sm text-gray-500">
                    No se encontraron resultados
                  </div>
                ) : (
                  filteredOptions.map((option) => (
                    <div key={option.value}>
                      {renderOption ? (
                        <div onClick={() => handleSelect(option.value)}>
                          {renderOption(option)}
                        </div>
                      ) : mode === 'single' ? (
                        <SingleOption
                          option={option}
                          isSelected={isSelected(option.value)}
                          onClick={() => handleSelect(option.value)}
                        />
                      ) : mode === 'multi' ? (
                        <MultiOption
                          option={option}
                          isSelected={isSelected(option.value)}
                          onClick={() => handleSelect(option.value)}
                        />
                      ) : (
                        <SmartOptionItem
                          option={option}
                          isSelected={isSelected(option.value)}
                          onClick={() => handleSelect(option.value)}
                        />
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Help Text / Error */}
      {helpText && !error && (
        <p className="text-xs text-gray-500">{helpText}</p>
      )}
      {error && (
        <p className="text-xs text-red-500">{error}</p>
      )}
    </div>
  );
}

// ==================== OPTION COMPONENTS ====================

// Single Select Option (Imagen 1)
function SingleOption({
  option,
  isSelected,
  onClick,
}: {
  option: SmartOption;
  isSelected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`
        w-full px-3 py-2.5 text-left text-sm transition-colors
        hover:bg-gray-50
        ${isSelected ? 'bg-blue-50 text-blue-700' : 'text-gray-900'}
      `}
    >
      {option.label}
    </button>
  );
}

// Multi Select Option (Imagen 2)
function MultiOption({
  option,
  isSelected,
  onClick,
}: {
  option: SmartOption;
  isSelected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full px-3 py-2.5 text-left hover:bg-gray-50 transition-colors flex items-center gap-3"
    >
      <Checkbox checked={isSelected} />
      <span className="text-sm text-gray-900">{option.label}</span>
    </button>
  );
}

// Smart Select Option (Imagen 3)
function SmartOptionItem({
  option,
  isSelected,
  onClick,
}: {
  option: SmartOption;
  isSelected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`
        w-full px-3 py-3 text-left hover:bg-gray-50 transition-colors border-b border-gray-100
        ${isSelected ? 'bg-blue-50' : ''}
      `}
    >
      {/* Header con ID, Secondary ID y Score */}
      <div className="flex items-start justify-between mb-1">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-900">{option.label}</span>
          {option.secondaryId && (
            <span className="text-xs text-gray-500">({option.secondaryId})</span>
          )}
          {option.utilization !== undefined && (
            <span className={`text-xs font-medium ${
              option.utilization >= 100 ? 'text-green-600' : 'text-gray-600'
            }`}>
              {option.utilization}% útil.
            </span>
          )}
        </div>
        {option.score !== undefined && (
          <span className="text-xs text-gray-500">Score: {option.score}</span>
        )}
      </div>

      {/* Subtitle */}
      {option.subtitle && (
        <div className="text-xs text-gray-600 mb-2">{option.subtitle}</div>
      )}

      {/* Tags/Badges */}
      {option.tags && option.tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {option.tags.map((tag, index) => (
            <span
              key={index}
              className="px-2 py-0.5 text-xs bg-gray-100 text-gray-700 rounded"
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* Metadata adicional */}
      {option.metadata && option.metadata.length > 0 && (
        <div className="flex flex-wrap gap-3 mt-2 text-xs text-gray-600">
          {option.metadata.map((meta, index) => (
            <span key={index}>
              {meta.label}: <span className="font-medium">{meta.value}</span>
            </span>
          ))}
        </div>
      )}
    </button>
  );
}
