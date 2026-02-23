import { PrimaryButton } from "./PrimaryButton";
import { Save } from "lucide-react";

interface SaveButtonProps {
    children?: React.ReactNode;
    onClick?: () => void;
    disabled?: boolean;
    isSubmitting?: boolean;
    submittingLabel?: string;
    type?: "button" | "submit" | "reset";
    className?: string;
}

export function SaveButton({
    children = "Guardar",
    onClick,
    disabled = false,
    isSubmitting = false,
    submittingLabel = "Guardando...",
    type = "button",
    className = "",
}: SaveButtonProps) {
    return (
        <PrimaryButton
            icon={Save}
            onClick={onClick}
            disabled={disabled || isSubmitting}
            type={type}
            className={className}
        >
            {isSubmitting ? submittingLabel : children}
        </PrimaryButton>
    );
}
