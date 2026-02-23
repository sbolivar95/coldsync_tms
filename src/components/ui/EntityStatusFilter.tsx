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

export type EntityStatusFilterValue = 'all' | string;

interface StatusOption {
  value: string;
  label: string;
}

interface EntityStatusFilterProps {
  value: EntityStatusFilterValue;
  onChange: (value: EntityStatusFilterValue) => void;
  options: StatusOption[];
  label?: string;
  allLabel?: string;
}

/**
 * Flexible status filter component for entities with custom status options
 * Supports any number of status options with customizable labels
 * 
 * @example
 * ```tsx
 * const userStatusOptions = [
 *   { value: 'Activo', label: 'Activos' },
 *   { value: 'Inactivo', label: 'Inactivos' }
 * ];
 * 
 * <EntityStatusFilter
 *   value={statusFilter}
 *   onChange={setStatusFilter}
 *   options={userStatusOptions}
 *   label="Estado"
 * />
 * ```
 */
export function EntityStatusFilter({
  value,
  onChange,
  options,
  label = "Estado",
  allLabel = "Todos"
}: EntityStatusFilterProps) {
  const getDisplayText = () => {
    if (value === 'all') {
      return allLabel;
    }

    const option = options.find(opt => opt.value === value);
    return option ? option.label : allLabel;
  };

  const hasActiveFilter = value !== 'all';

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={`gap-2 ${hasActiveFilter ? 'bg-primary-light border-primary text-primary' : ''}`}
        >
          <Filter className="w-4 h-4" />
          {getDisplayText()}
          {hasActiveFilter && (
            <div className="w-2 h-2 bg-primary rounded-full" />
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-48">
        <DropdownMenuLabel>{label}</DropdownMenuLabel>
        <DropdownMenuSeparator />

        <DropdownMenuCheckboxItem
          checked={value === 'all'}
          onCheckedChange={() => onChange('all')}
          className={`${value === 'all' ? 'text-primary font-medium' : ''
            }`}
        >
          {allLabel}
        </DropdownMenuCheckboxItem>

        {options.map((option) => (
          <DropdownMenuCheckboxItem
            key={option.value}
            checked={value === option.value}
            onCheckedChange={() => onChange(option.value)}
            className={`${value === option.value ? 'text-primary font-medium' : ''
              }`}
          >
            {option.label}
          </DropdownMenuCheckboxItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}