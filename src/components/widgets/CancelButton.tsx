import { SecondaryButton } from "./SecondaryButton";
import { X } from "lucide-react";

interface CancelButtonProps {
    children?: React.ReactNode;
    onClick?: () => void;
    disabled?: boolean;
    className?: string;
    size?: "default" | "sm" | "lg" | "icon";
}

export function CancelButton({
    children = "Cancelar",
    onClick,
    disabled = false,
    className = "",
    size = "sm",
}: CancelButtonProps) {
    return (
        <SecondaryButton
            icon={X}
            onClick={onClick}
            disabled={disabled}
            className={className}
            size={size}
        >
            {children}
        </SecondaryButton>
    );
}
