import { useState, useMemo, forwardRef } from "react";
import { Search } from "lucide-react";
import { Label } from "../ui/Label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/Select";
import { Input } from "../ui/Input";

/**
 * SMART SELECT COMPONENT - ColdSync (Shadcn/Radix UI Based)
 * 
 * Componente de selección basado en shadcn/ui Select (Radix UI)
 * Soluciona todos los problemas de posicionamiento, scroll y viewport
 * 
 * Cumple con FormControl (Slot): acepta y reenvía id, aria-* al SelectTrigger
 */

// ==================== TIPOS ====================

export interface BaseOption {
  value: string;
  label: string;
}

export interface SmartOption extends BaseOption {
  subtitle?: string;
  secondaryId?: string;
}

interface SmartSelectProps extends Omit<React.ComponentPropsWithoutRef<"div">, "onChange"> {
  // Configuración básica
  label?: string;
  name?: string;
  placeholder?: string;
  required?: boolean;
  helpText?: string;
  error?: string;
  disabled?: boolean;

  // Opciones
  options: SmartOption[];

  // Valor
  value?: string;
  onChange?: (value: string) => void;

  // Búsqueda
  searchable?: boolean;
  searchPlaceholder?: string;
}

export const SmartSelect = forwardRef<HTMLDivElement, SmartSelectProps>(
  function SmartSelect(
    {
      label,
      id,
      name,
      placeholder = "Seleccionar...",
      required = false,
      helpText,
      error,
      disabled = false,
      options,
      value,
      onChange,
      searchable = true,
      searchPlaceholder = "Buscar...",
      // Capture aria-* and other props forwarded by FormControl's Slot
      ...rest
    },
    ref,
  ) {
    const [searchQuery, setSearchQuery] = useState("");

    // Filtrado de opciones
    const filteredOptions = useMemo(() => {
      if (!searchQuery) return options;

      const query = searchQuery.toLowerCase();
      return options.filter(
        (option) =>
          option.label.toLowerCase().includes(query) ||
          option.subtitle?.toLowerCase().includes(query) ||
          option.secondaryId?.toLowerCase().includes(query)
      );
    }, [options, searchQuery]);

    // Extract aria-* props to forward to SelectTrigger (accessibility)
    const ariaProps: Record<string, unknown> = {};
    const divProps: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(rest)) {
      if (key.startsWith("aria-") || key === "data-slot") {
        ariaProps[key] = val;
      } else {
        divProps[key] = val;
      }
    }

    return (
      <div ref={ref} className="space-y-1.5" {...divProps}>
        {/* Label */}
        {label && (
          <Label htmlFor={id} className="text-xs text-label-foreground">
            {label}
            {required && <span className="text-red-500 ml-1">*</span>}
          </Label>
        )}

        {/* Select usando Shadcn/Radix UI */}
        <Select
          name={name}
          value={value || ""}
          onValueChange={onChange}
          disabled={disabled}
        >
          <SelectTrigger
            id={id}
            className={`h-9 text-sm ${error ? "border-red-500" : ""}`}
            {...ariaProps}
          >
            <SelectValue placeholder={placeholder} />
          </SelectTrigger>
          <SelectContent position="popper">
            {/* Search Bar */}
            {searchable && options.length > 5 && (
              <div className="p-2 border-b">
                <div className="relative">
                  <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    type="text"
                    placeholder={searchPlaceholder}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="h-8 pl-8 text-sm"
                    onClick={(e) => e.stopPropagation()}
                  />
                </div>
              </div>
            )}

            {/* Options */}
            <div className="max-h-[300px] overflow-y-auto">
              {filteredOptions.length === 0 ? (
                <div className="px-2 py-6 text-center text-sm text-gray-500">
                  No se encontraron resultados
                </div>
              ) : (
                filteredOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    <div className="flex items-center gap-2 max-w-full">
                      <span className="text-sm font-medium truncate shrink-0">{option.label}</span>
                      {option.subtitle && (
                        <span className="text-xs text-gray-500 truncate shrink min-w-0">
                          {option.subtitle}
                        </span>
                      )}
                      {option.secondaryId && (
                        <span className="text-xs text-gray-400 shrink-0 ml-auto">
                          {option.secondaryId}
                        </span>
                      )}
                    </div>
                  </SelectItem>
                ))
              )}
            </div>
          </SelectContent>
        </Select>

        {/* Help Text */}
        {helpText && !error && (
          <p className="text-xs text-gray-500">{helpText}</p>
        )}

        {/* Error Message */}
        {error && <p className="text-xs text-red-500">{error}</p>}
      </div>
    );
  },
);
