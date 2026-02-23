import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "../ui/Dialog";
import { DialogActions } from "./DialogActions";
import { Button } from "../ui/Button";
import { ChevronLeft } from "lucide-react";
import { ReactNode } from "react";

interface EntityDialogProps {
  open: boolean;
  onClose: () => void;
  title: string | ReactNode;
  description: string | ReactNode;
  children: ReactNode;
  onSave: () => void;
  onCancel?: () => void;
  saveLabel?: string;
  cancelLabel?: string;
  isEdit?: boolean;
  disableSave?: boolean;
  saveLoading?: boolean;
  saveLoadingLabel?: string;
  maxWidth?: string;
  hideActions?: boolean;
  onBack?: () => void;
  showBackButton?: boolean;
  variant?: "default" | "destructive";
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
  disableSave = false,
  saveLoading = false,
  saveLoadingLabel,
  maxWidth = "max-w-lg",
  hideActions = false,
  onBack,
  showBackButton = false,
  variant = "default"
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
        <DialogHeader className="space-y-0.5">
          <div className="flex items-center gap-2 -ml-1">
            {showBackButton && onBack && (
              <Button
                variant="ghost"
                size="icon"
                onClick={onBack}
                className="h-8 w-8 rounded-md hover:bg-gray-100 transition-colors shrink-0"
              >
                <ChevronLeft className="w-5 h-5 text-gray-500" />
              </Button>
            )}
            <DialogTitle className="text-base font-semibold flex-1">
              {title}
            </DialogTitle>
          </div>
          {description && (
            <div className={showBackButton ? "pl-9" : ""}>
              <DialogDescription className="text-xs text-gray-500">
                {description}
              </DialogDescription>
            </div>
          )}
        </DialogHeader>

        <div className="space-y-5 py-4">
          {children}
        </div>

        {!hideActions && (
          <DialogFooter>
            <DialogActions
              onCancel={handleCancel}
              onSave={handleSave}
              cancelLabel={cancelLabel}
              saveLabel={saveLabel}
              disableSave={disableSave}
              saveLoading={saveLoading}
              saveLoadingLabel={saveLoadingLabel}
              variant={variant}
            />
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}