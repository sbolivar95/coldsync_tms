import { MoreVertical, Pause, Play } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../ui/DropdownMenu";
import { Button } from "../ui/Button";

export interface EntityActionsMenuProps<T = any> {
  entity: T;
  status: string;
  onSuspend: (entity: T) => void;
  onReactivate?: (entity: T) => void;
}

export function EntityActionsMenu<T>({
  entity,
  status,
  onSuspend,
  onReactivate,
}: EntityActionsMenuProps<T>) {
  const isSuspended = status === "Suspendido" || status === "SUSPENDED";
  const isActive = status === "Activo" || status === "ACTIVE";
  
  // Show suspend option only for active users
  // Show reactivate option only for suspended users (user_id exists but is_active = false)
  // Note: "Inactivo" users (user_id IS NULL) cannot be suspended or reactivated
  const showSuspend = isActive;
  const showReactivate = onReactivate && isSuspended;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0 hover:bg-gray-100"
        >
          <MoreVertical className="h-4 w-4 text-gray-600" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        {showSuspend && (
          <DropdownMenuItem
            onClick={() => onSuspend(entity)}
            className="cursor-pointer"
          >
            <Pause className="mr-2 h-4 w-4" />
            Suspender
          </DropdownMenuItem>
        )}
        
        {showReactivate && (
          <DropdownMenuItem
            onClick={() => onReactivate!(entity)}
            className="cursor-pointer"
          >
            <Play className="mr-2 h-4 w-4" />
            Reactivar
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}