import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "../ui/Dialog";
import { DialogActions } from "./DialogActions";
import { ReactNode } from "react";

interface EntityDialogProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description: string;
  children: ReactNode;
  onSave: () => void;
  onCancel?: () => void;
  saveLabel?: string;
  cancelLabel?: string;
  isEdit?: boolean;
  disableSave?: boolean;
  maxWidth?: string;
}

export function EntityDialog({
  open,
  onClose,
  title,
  description,
  children,
  onSave,
  onCancel,
  saveLabel = "Guardar",
  cancelLabel = "Cancelar",
  isEdit = false,
  disableSave = false,
  maxWidth = "max-w-lg"
}: EntityDialogProps) {
  const handleCancel = () => {
    onCancel?.();
    onClose();
  };

  const handleSave = () => {
    onSave();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className={maxWidth}>
        <DialogHeader>
          <DialogTitle className="text-base font-semibold">
            {title}
          </DialogTitle>
          <DialogDescription className="text-xs text-gray-500">
            {description}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-4">
          {children}
        </div>

        <DialogFooter>
          <DialogActions
            onCancel={handleCancel}
            onSave={handleSave}
            cancelLabel={cancelLabel}
            saveLabel={saveLabel}
            disableSave={disableSave}
          />
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}