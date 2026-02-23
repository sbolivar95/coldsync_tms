import { SaveButton } from "./SaveButton";
import { CancelButton } from "./CancelButton";
import { DestructiveButton } from "./DestructiveButton";
import { Trash2 } from "lucide-react";

interface DialogActionsProps {
  onCancel: () => void;
  onSave: () => void;
  saveLabel?: string;
  cancelLabel?: string;
  disableSave?: boolean;
  saveLoading?: boolean;
  saveLoadingLabel?: string;
  size?: "default" | "sm" | "lg" | "icon";
  variant?: "default" | "destructive";
}

export function DialogActions({
  onCancel,
  onSave,
  saveLabel,
  cancelLabel,
  disableSave = false,
  saveLoading = false,
  saveLoadingLabel,
  variant = "default",
}: DialogActionsProps) {
  return (
    <div className="flex justify-end gap-3">
      <CancelButton
        onClick={onCancel}
        disabled={saveLoading}
      >
        {cancelLabel}
      </CancelButton>
      {variant === "destructive" ? (
        <DestructiveButton
          icon={Trash2}
          onClick={onSave}
          disabled={disableSave}
        >
          {saveLabel || "Eliminar"}
        </DestructiveButton>
      ) : (
        <SaveButton
          onClick={onSave}
          disabled={disableSave}
          isSubmitting={saveLoading}
          submittingLabel={saveLoadingLabel}
        >
          {saveLabel}
        </SaveButton>
      )}
    </div>
  );
}