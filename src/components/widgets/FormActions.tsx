import { SaveButton } from "./SaveButton";
import { CancelButton } from "./CancelButton";
import { DestructiveButton } from "./DestructiveButton";
import { Trash2 } from "lucide-react";

interface FormActionsProps {
  onCancel?: () => void;
  onSave?: () => void;
  saveLabel?: string;
  cancelLabel?: string;
  isSubmitting?: boolean;
  disabled?: boolean;
  className?: string;
  variant?: "default" | "destructive";
}

export function FormActions({
  onCancel,
  onSave,
  saveLabel,
  cancelLabel,
  isSubmitting = false,
  disabled = false,
  className = "",
  variant = "default",
}: FormActionsProps) {
  return (
    <div className={`flex justify-end gap-3 pt-6 border-t border-gray-200 mt-6 ${className}`}>
      <CancelButton
        onClick={onCancel}
        disabled={isSubmitting}
      >
        {cancelLabel}
      </CancelButton>
      {variant === "destructive" ? (
        <DestructiveButton
          icon={Trash2}
          onClick={onSave}
          disabled={disabled || isSubmitting}
        >
          {isSubmitting ? "Eliminando..." : saveLabel || "Eliminar"}
        </DestructiveButton>
      ) : (
        <SaveButton
          onClick={onSave}
          disabled={disabled}
          isSubmitting={isSubmitting}
        >
          {saveLabel}
        </SaveButton>
      )}
    </div>
  );
}