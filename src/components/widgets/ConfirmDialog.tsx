import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../ui/AlertDialog";

type ConfirmVariant = "default" | "destructive" | "warning";

interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string | React.ReactNode;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel?: () => void;
  variant?: ConfirmVariant;
  confirmDisabled?: boolean;
}

const variantStyles: Record<ConfirmVariant, string> = {
  default: "bg-[#004ef0] hover:bg-[#003bc4]",
  destructive: "bg-red-600 hover:bg-red-700",
  warning: "bg-orange-600 hover:bg-orange-700",
};

/**
 * ConfirmDialog - Componente reutilizable para confirmaciones
 * 
 * @example
 * // Ejemplo básico
 * <ConfirmDialog
 *   open={showDialog}
 *   onOpenChange={setShowDialog}
 *   title="¿Confirmar acción?"
 *   description="Esta acción no se puede deshacer."
 *   onConfirm={handleConfirm}
 * />
 * 
 * @example
 * // Con variante destructiva
 * <ConfirmDialog
 *   open={showDialog}
 *   onOpenChange={setShowDialog}
 *   title="¿Eliminar elemento?"
 *   description="Esta acción es permanente."
 *   confirmText="Sí, eliminar"
 *   cancelText="No, cancelar"
 *   variant="destructive"
 *   onConfirm={handleDelete}
 * />
 */
export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmText = "Confirmar",
  cancelText = "Cancelar",
  onConfirm,
  onCancel,
  variant = "default",
  confirmDisabled = false,
}: ConfirmDialogProps) {
  const handleConfirm = () => {
    onConfirm();
    onOpenChange(false);
  };

  const handleCancel = () => {
    onCancel?.();
    onOpenChange(false);
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="z-[60]">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-base font-medium">
            {title}
          </AlertDialogTitle>
          <AlertDialogDescription className="text-xs">
            {description}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel 
            className="text-xs h-9" 
            onClick={handleCancel}
          >
            {cancelText}
          </AlertDialogCancel>
          <AlertDialogAction
            className={`text-xs h-9 ${variantStyles[variant]}`}
            onClick={handleConfirm}
            disabled={confirmDisabled}
          >
            {confirmText}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
