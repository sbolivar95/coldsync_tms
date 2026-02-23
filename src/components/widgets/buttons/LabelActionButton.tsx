import { Button } from "../../../components/ui/Button";
import { LucideIcon } from "lucide-react";
import { cn } from "../../../lib/utils";

interface LabelActionButtonProps {
    icon: LucideIcon;
    title: string;
    onClick: () => void;
    className?: string;
    iconClassName?: string;
    disabled?: boolean;
}

/**
 * LabelActionButton - Pequeño botón de acción diseñado para estar al lado de etiquetas (FormLabels)
 * o dentro de encabezados de tarjetas.
 * 
 * Garantiza consistencia en tamaño, hover y accesibilidad.
 */
export function LabelActionButton({
    icon: Icon,
    title,
    onClick,
    className,
    iconClassName,
    disabled = false
}: LabelActionButtonProps) {
    return (
        <Button
            type="button"
            variant="ghost"
            disabled={disabled}
            onClick={(e) => {
                e.preventDefault(); // Evitar comportamientos no deseados en formularios
                onClick();
            }}
            className={cn(
                "h-4 w-4 p-0 text-primary hover:bg-gray-100 hover:text-primary rounded-sm transition-colors",
                className
            )}
            title={title}
            aria-label={title}
        >
            <Icon className={cn("w-3.5 h-3.5", iconClassName)} />
        </Button>
    );
}
