import { PrimaryButton } from "./PrimaryButton";
import { SecondaryButton } from "./SecondaryButton";
import { X, Save } from "lucide-react";

interface DialogActionsProps {
  onCancel: () => void;
  onSave: () => void;
  saveLabel?: string;
  cancelLabel?: string;
  disableSave?: boolean;
}

export function DialogActions({
  onCancel,
  onSave,
  saveLabel = "Guardar",
  cancelLabel = "Cancelar",
  disableSave = false,
}: DialogActionsProps) {
  return (
    <div className="flex justify-end gap-3">
      <SecondaryButton 
        icon={X}
        onClick={onCancel}
      >
        {cancelLabel}
      </SecondaryButton>
      <PrimaryButton 
        icon={Save}
        onClick={onSave}
        disabled={disableSave}
      >
        {saveLabel}
      </PrimaryButton>
    </div>
  );
}