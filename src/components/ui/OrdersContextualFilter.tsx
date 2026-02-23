import { Filter } from "lucide-react";
import { Button } from "./Button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./DropdownMenu";

export type OrdersContextualFilterValue = string;

interface OrdersContextualFilterProps {
  activeTab: string;
  value: OrdersContextualFilterValue;
  onChange: (value: OrdersContextualFilterValue) => void;
}

/**
 * Contextual filter for Orders that changes options based on active tab
 */
export function OrdersContextualFilter({
  activeTab,
  value,
  onChange,
}: OrdersContextualFilterProps) {
  
  const getFilterConfig = () => {
    switch (activeTab) {
      case "solicitudes":
        return {
          label: "Fecha Pickup",
          options: [
            { value: "all", label: "Todas" },
            { value: "today", label: "Hoy" },
            { value: "tomorrow", label: "Mañana" },
            { value: "this_week", label: "Esta semana" },
            { value: "upcoming", label: "Próximas" },
          ]
        };
      
      case "compromisos":
        return {
          label: "Fecha Pickup",
          options: [
            { value: "all", label: "Todos" },
            { value: "today", label: "Hoy" },
            { value: "tomorrow", label: "Mañana" },
            { value: "this_week", label: "Esta semana" },
            { value: "upcoming", label: "Próximas" },
          ]
        };
      
      case "historial":
        return {
          label: "Tipo",
          options: [
            { value: "all", label: "Todos" },
            { value: "rejected", label: "Rechazadas" },
            { value: "expired", label: "Expiradas" },
            { value: "observed", label: "Observadas" },
            { value: "dispatched", label: "Despachadas" },
          ]
        };
      
      default:
        return {
          label: "Filtro",
          options: [{ value: "all", label: "Todos" }]
        };
    }
  };

  const config = getFilterConfig();
  const currentOption = config.options.find(opt => opt.value === value);
  const displayText = currentOption?.label || config.options[0].label;
  const hasActiveFilter = value !== "all";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={`gap-2 ${hasActiveFilter ? 'bg-blue-50 border-blue-200 text-blue-700' : ''}`}
        >
          <Filter className="w-4 h-4" />
          {displayText}
          {hasActiveFilter && (
            <div className="w-2 h-2 bg-blue-600 rounded-full" />
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-48">
        <DropdownMenuLabel>{config.label}</DropdownMenuLabel>
        <DropdownMenuSeparator />

        {config.options.map((option) => (
          <DropdownMenuCheckboxItem
            key={option.value}
            checked={value === option.value}
            onCheckedChange={() => onChange(option.value)}
            className={`${value === option.value ? 'text-blue-700 font-medium' : ''}`}
          >
            {option.label}
          </DropdownMenuCheckboxItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}