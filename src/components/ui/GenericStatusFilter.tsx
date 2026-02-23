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

export interface StatusOption {
  value: string;
  label: string;
}

interface GenericStatusFilterProps {
  value: string;
  onChange: (value: string) => void;
  options: StatusOption[];
  label?: string;
  allLabel?: string;
}

/**
 * Generic status filter component that can handle any set of status options
 * More flexible than the original StatusFilter for different entity types
 * 
 * @example
 * ```tsx
 * const organizationStatusOptions = [
 *   { value: "ACTIVE", label: "Activo" },
 *   { value: "SUSPENDED", label: "Suspendido" }
 * ];
 * 
 * <GenericStatusFilter
 *   value={statusFilter}
 *   onChange={setStatusFilter}
 *   options={organizationStatusOptions}
 *   label="Estado"
 * />
 * ```
 */
export function GenericStatusFilter({
  value,
  onChange,
  options,
  label = "Estado",
  allLabel = "Todos"
}: GenericStatusFilterProps) {
  const getDisplayText = () => {
    if (value === 'all') {
      return allLabel;
    }

    const selectedOption = options.find(opt => opt.value === value);
    return selectedOption?.label || allLabel;
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