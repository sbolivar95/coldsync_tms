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
import { useState } from "react";
import { ChevronLeft, Trash2, AlertTriangle, X, Check } from "lucide-react";
import { Button } from "../ui/Button";
import { cn } from "../../lib/utils";

type ConfirmVariant = "default" | "destructive" | "warning";

interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string | React.ReactNode;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void | Promise<void>;
  onCancel?: () => void;
  variant?: ConfirmVariant;
  confirmDisabled?: boolean;
  confirmLoading?: boolean;
  confirmLoadingText?: string;
  showBackButton?: boolean;
  onBack?: () => void;
}

const variantStyles: Record<ConfirmVariant, string> = {
  default: "",
  destructive: "",
  warning: "bg-orange-600 hover:bg-orange-700 text-white border-none",
};

const buttonVariantMap: Record<ConfirmVariant, "default" | "destructive" | "secondary"> = {
  default: "default",
  destructive: "destructive",
  warning: "default", // Warning uses manual styling as there's no warning variant in shadcn base
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
  confirmLoading = false,
  confirmLoadingText = "Procesando...",
  showBackButton = false,
  onBack,
}: ConfirmDialogProps) {
  const [isConfirming, setIsConfirming] = useState(false);
  const loading = confirmLoading || isConfirming;

  const handleConfirm = async (e?: React.MouseEvent) => {
    e?.preventDefault(); // Keep dialog open until async onConfirm completes (Radix would close on click otherwise)
    setIsConfirming(true);
    try {
      await Promise.resolve(onConfirm());
    } finally {
      setIsConfirming(false);
    }
  };

  const handleCancel = () => {
    onCancel?.();
    onOpenChange(false);
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader className="space-y-0.5">
          <div className="flex items-center gap-2 -ml-1">
            {showBackButton && onBack && (
              <Button
                variant="ghost"
                size="icon"
                onClick={onBack}
                className="h-8 w-8 text-gray-500 hover:text-gray-900 rounded-md shrink-0"
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
            )}
            <AlertDialogTitle className="text-base font-semibold flex-1">
              {title}
            </AlertDialogTitle>
          </div>
          {description && (
            <AlertDialogDescription
              className={cn(
                "text-xs text-gray-500",
                showBackButton ? "pl-9" : "pl-0"
              )}
              asChild
            >
              <div>
                {description}
              </div>
            </AlertDialogDescription>
          )}
        </AlertDialogHeader>
        <AlertDialogFooter className="gap-3">
          <AlertDialogCancel
            className="px-4 gap-2"
            onClick={handleCancel}
            disabled={loading}
          >
            <X className="w-4 h-4" />
            {cancelText}
          </AlertDialogCancel>
          <AlertDialogAction
            className={cn("px-4 gap-2", variantStyles[variant])}
            variant={buttonVariantMap[variant]}
            onClick={(e) => handleConfirm(e)}
            disabled={confirmDisabled || loading}
          >
            {variant === "destructive" ? (
              <Trash2 className="w-4 h-4" />
            ) : variant === "warning" ? (
              <AlertTriangle className="w-4 h-4" />
            ) : (
              <Check className="w-4 h-4" />
            )}
            {loading ? confirmLoadingText : confirmText}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
