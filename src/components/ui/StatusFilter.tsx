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

export type StatusFilterValue = 'all' | 'active' | 'inactive';

interface StatusFilterProps {
  value: StatusFilterValue;
  onChange: (value: StatusFilterValue) => void;
  label?: string;
  activeLabel?: string;
  inactiveLabel?: string;
  allLabel?: string;
}

/**
 * Reusable status filter component using Shadcn DropdownMenu
 * Allows filtering by active/inactive status with customizable labels
 * 
 * @example
 * ```tsx
 * const [statusFilter, setStatusFilter] = useState<StatusFilterValue>("all");
 * 
 * <StatusFilter
 *   value={statusFilter}
 *   onChange={setStatusFilter}
 *   label="Estado"
 *   activeLabel="Activos"
 *   inactiveLabel="Inactivos"
 * />
 * ```
 */
export function StatusFilter({
  value,
  onChange,
  label = "Estado",
  activeLabel = "Activos",
  inactiveLabel = "Inactivos",
  allLabel = "Todos"
}: StatusFilterProps) {
  const getDisplayText = () => {
    switch (value) {
      case 'active':
        return activeLabel;
      case 'inactive':
        return inactiveLabel;
      default:
        return allLabel;
    }
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

        <DropdownMenuCheckboxItem
          checked={value === 'active'}
          onCheckedChange={() => onChange('active')}
          className={`${value === 'active' ? 'text-primary font-medium' : ''
            }`}
        >
          {activeLabel}
        </DropdownMenuCheckboxItem>

        <DropdownMenuCheckboxItem
          checked={value === 'inactive'}
          onCheckedChange={() => onChange('inactive')}
          className={`${value === 'inactive' ? 'text-primary font-medium' : ''
            }`}
        >
          {inactiveLabel}
        </DropdownMenuCheckboxItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}