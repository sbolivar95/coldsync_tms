import { SecondaryButton } from "./SecondaryButton";
import { PrimaryButton } from "./PrimaryButton";
import { X, Save, Check } from "lucide-react";

interface DetailFooterProps {
  onCancel: () => void;
  onSave: () => void;
  isSubmitting?: boolean;
  hasChanges?: boolean;
  justSaved?: boolean;
  saveLabel?: string;
  cancelLabel?: string;
  showFooter?: boolean; // Control visibility (default: true)
}

/**
 * DetailFooter - Componente reutilizable para footers de detail views
 * 
 * Proporciona un footer consistente con botones Cancelar y Guardar
 * que se usa en todas las vistas de detalle (CarrierDetail, TrailerDetail, etc.)
 * 
 * @example
 * ```tsx
 * <DetailFooter
 *   onCancel={handleCancel}
 *   onSave={handleSave}
 *   isSubmitting={isSubmitting}
 *   hasChanges={hasChanges}
 *   justSaved={justSaved}
 * />
 * ```
 */
export function DetailFooter({
  onCancel,
  onSave,
  isSubmitting = false,
  hasChanges = true, // Default to true for create mode
  justSaved = false,
  saveLabel = "Guardar",
  cancelLabel = "Cancelar",
  showFooter = true,
}: DetailFooterProps) {
  if (!showFooter) return null;

  return (
    <div className="border-t border-gray-200 bg-white px-6 py-4 shrink-0">
      <div className="max-w-6xl mx-auto flex justify-end gap-3">
        <SecondaryButton
          icon={X}
          onClick={onCancel}
          disabled={isSubmitting}
        >
          {cancelLabel}
        </SecondaryButton>
        <PrimaryButton
          icon={justSaved ? Check : Save}
          onClick={onSave}
          disabled={isSubmitting || !hasChanges}
          className={justSaved ? 'bg-green-600 hover:bg-green-700' : ''}
        >
          {isSubmitting ? "Guardando..." : justSaved ? "Guardado" : saveLabel}
        </PrimaryButton>
      </div>
    </div>
  );
}
