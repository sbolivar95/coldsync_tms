import { PrimaryButton } from "./PrimaryButton";
import { SecondaryButton } from "./SecondaryButton";
import { Save, X } from "lucide-react";

interface FormActionsProps {
  onCancel?: () => void;
  onSave?: () => void;
  saveLabel?: string;
  cancelLabel?: string;
  isSubmitting?: boolean;
  disabled?: boolean;
  className?: string;
}

export function FormActions({
  onCancel,
  onSave,
  saveLabel = "Guardar Cambios",
  cancelLabel = "Cancelar",
  isSubmitting = false,
  disabled = false,
  className = "",
}: FormActionsProps) {
  return (
    <div className={`flex justify-end gap-3 pt-6 border-t border-gray-200 mt-6 ${className}`}>
      <SecondaryButton
        icon={X}
        onClick={onCancel}
        disabled={isSubmitting}
      >
        {cancelLabel}
      </SecondaryButton>
      <PrimaryButton
        icon={Save}
        onClick={onSave}
        disabled={disabled || isSubmitting}
      >
        {isSubmitting ? "Guardando..." : "Guardar"}
      </PrimaryButton>
    </div>
  );
}