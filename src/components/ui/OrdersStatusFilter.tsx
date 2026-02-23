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

export type OrdersStatusFilterValue = 
  | 'all' 
  | 'pending' 
  | 'accepted' 
  | 'rejected' 
  | 'expired' 
  | 'observed' 
  | 'dispatched';

interface OrdersStatusFilterProps {
  value: OrdersStatusFilterValue;
  onChange: (value: OrdersStatusFilterValue) => void;
  label?: string;
}

/**
 * Status filter component specifically for Orders based on orders.md states
 * Filters by tender/commitment states according to ColdSync Orders specification
 */
export function OrdersStatusFilter({
  value,
  onChange,
  label = "Estado"
}: OrdersStatusFilterProps) {
  const statusOptions = [
    { value: 'all', label: 'Todos' },
    { value: 'pending', label: 'Pendientes' },
    { value: 'accepted', label: 'Aceptadas' },
    { value: 'rejected', label: 'Rechazadas' },
    { value: 'expired', label: 'Expiradas' },
    { value: 'observed', label: 'Observadas' },
    { value: 'dispatched', label: 'Despachadas' },
  ] as const;

  const getDisplayText = () => {
    const option = statusOptions.find(opt => opt.value === value);
    return option?.label || 'Todos';
  };

  const hasActiveFilter = value !== 'all';

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={`gap-2 ${hasActiveFilter ? 'bg-blue-50 border-blue-200 text-blue-700' : ''}`}
        >
          <Filter className="w-4 h-4" />
          {getDisplayText()}
          {hasActiveFilter && (
            <div className="w-2 h-2 bg-blue-600 rounded-full" />
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-48">
        <DropdownMenuLabel>{label}</DropdownMenuLabel>
        <DropdownMenuSeparator />

        {statusOptions.map((option) => (
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