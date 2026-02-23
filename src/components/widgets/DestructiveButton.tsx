import { Button } from "../ui/Button";
import { LucideIcon } from "lucide-react";
import { cn } from "../../lib/utils";

interface DestructiveButtonProps {
    children: React.ReactNode;
    icon?: LucideIcon;
    onClick?: () => void;
    disabled?: boolean;
    type?: "button" | "submit" | "reset";
    className?: string;
    size?: "default" | "sm" | "lg" | "icon";
}

export function DestructiveButton({
    children,
    icon: Icon,
    onClick,
    disabled = false,
    type = "button",
    className = "",
    size = "default",
}: DestructiveButtonProps) {
    return (
        <Button
            type={type}
            variant="destructive"
            size={size}
            onClick={onClick}
            disabled={disabled}
            className={cn("gap-2 hover:opacity-90 transition-opacity", className)}
        >
            {Icon && <Icon className="w-4 h-4" />}
            {children}
        </Button>
    );
}
