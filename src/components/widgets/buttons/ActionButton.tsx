import { Button } from "../../ui/Button";
import { LucideIcon } from "lucide-react";

interface ActionButtonProps {
    icon: LucideIcon;
    label: string;
    onClick: () => void;
    variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
    size?: "default" | "sm" | "lg" | "icon";
    className?: string;
}

/**
 * ActionButton - Botón reutilizable con icono + texto
 * 
 * Usado para acciones secundarias como "Añadir", "Asignar Flota", etc.
 * Sigue el patrón visual de icono + texto en azul (#004ef0)
 * 
 * @example
 * ```tsx
 * <ActionButton
 *   icon={Plus}
 *   label="Añadir"
 *   onClick={handleAdd}
 * />
 * 
 * <ActionButton
 *   icon={ArrowLeftRight}
 *   label="Asignar Flota"
 *   onClick={handleAssign}
 * />
 * ```
 */
export function ActionButton({
    icon: Icon,
    label,
    onClick,
    variant = "ghost",
    size = "sm",
    className = "",
}: ActionButtonProps) {
    const sizeClasses = {
        default: "h-9 text-sm px-3",
        sm: "h-7 text-xs px-2",
        lg: "h-11 text-base px-4",
        icon: "h-9 w-9",
    };

    const iconSizes = {
        default: "w-4 h-4",
        sm: "w-3.5 h-3.5",
        lg: "w-5 h-5",
        icon: "w-4 h-4",
    };

    return (
        <Button
            type="button"
            variant={variant}
            size={size}
            onClick={onClick}
            className={`${sizeClasses[size]} text-primary hover:text-primary/80 ${className}`}
        >
            <Icon className={`${iconSizes[size]} mr-1`} />
            {label}
        </Button>
    );
}
