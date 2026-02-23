import { useState } from "react";
import { AlertTriangle, X, Check } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../../../../components/ui/AlertDialog";
import { Checkbox } from "../../../../components/ui/Checkbox";
import { Textarea } from "../../../../components/ui/Textarea";
import { Label } from "../../../../components/ui/Label";
import type { Order } from "../../../../lib/mockData";
import { type RejectionReason } from "../../../../services/database/orders.service";

interface FailAfterAcceptDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  order: Order | null;
  reasons: RejectionReason[]; // Pre-cargados desde el padre
  onConfirm: (reason: string, comments: string) => void;
}

export function FailAfterAcceptDialog({
  open,
  onOpenChange,
  order,
  reasons,
  onConfirm,
}: FailAfterAcceptDialogProps) {
  const [selectedReason, setSelectedReason] = useState<string>("");
  const [comments, setComments] = useState("");

  const handleConfirm = () => {
    if (!selectedReason) return;
    
    // Comments are required only for "other" reason
    if (selectedReason === "other" && !comments.trim()) return;
    
    onConfirm(selectedReason, comments);
    
    // Reset state
    setSelectedReason("");
    setComments("");
    onOpenChange(false);
  };

  const handleCancel = () => {
    // Reset state
    setSelectedReason("");
    setComments("");
    onOpenChange(false);
  };

  // Validation: reason is always required, comments only required for "other"
  const isValid = selectedReason !== "" && (selectedReason !== "other" || comments.trim() !== "");

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader className="space-y-0.5">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-red-600 shrink-0" />
            <AlertDialogTitle className="text-base font-semibold flex-1">
              Declarar Falla Post-Aceptación
            </AlertDialogTitle>
          </div>
          <AlertDialogDescription className="text-xs text-gray-500">
            Orden: <span className="font-semibold text-gray-900">{order?.id}</span>
          </AlertDialogDescription>
        </AlertDialogHeader>

        {/* Content */}
        <div className="space-y-4 py-2">
          {/* Warning message */}
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <div className="flex gap-2">
              <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-xs font-semibold text-red-900 mb-1">
                  Ruptura de Compromiso
                </p>
                <p className="text-xs text-red-700">
                  Esta acción declara la imposibilidad de ejecutar una orden previamente aceptada.
                </p>
              </div>
            </div>
          </div>

          {/* Reason selection */}
          <div className="space-y-2">
            <Label className="text-xs font-medium text-gray-700">
              Motivo de la Falla <span className="text-red-600">*</span>
            </Label>
            <div className="space-y-0.5 max-h-48 overflow-y-auto">
              {reasons.length === 0 ? (
                <div className="text-center py-4 text-xs text-gray-500">
                  No hay motivos disponibles
                </div>
              ) : (
                reasons.map((reason) => (
                  <div 
                    key={reason.code}
                    className={`
                      flex items-center gap-4 p-3 rounded cursor-pointer transition-all
                      ${reason.code === selectedReason ? 'bg-blue-50' : 'bg-white hover:bg-gray-100'}
                    `}
                    onClick={() => setSelectedReason(reason.code)}
                  >
                    <Checkbox 
                      checked={reason.code === selectedReason}
                      className="shrink-0"
                    />
                    <span className="text-xs font-medium text-gray-900 leading-4">
                      {reason.label}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Comments - only visible when "other" is selected */}
          {selectedReason === "other" && (
            <div className="space-y-2">
              <Label htmlFor="fail-dialog-comments" className="text-xs font-medium text-gray-700">
                Detalles adicionales <span className="text-red-600">*</span>
              </Label>
              <Textarea
                id="fail-dialog-comments"
                placeholder="Describe los detalles de la situación que impide ejecutar la orden..."
                value={comments}
                onChange={(e) => setComments(e.target.value)}
                rows={3}
                className="resize-none text-sm"
              />
            </div>
          )}
        </div>

        <AlertDialogFooter className="gap-3">
          <AlertDialogCancel
            className="px-4 gap-2"
            onClick={handleCancel}
          >
            <X className="w-4 h-4" />
            Cancelar
          </AlertDialogCancel>
          <AlertDialogAction
            className="px-4 gap-2"
            variant="destructive"
            onClick={handleConfirm}
            disabled={!isValid}
          >
            <Check className="w-4 h-4" />
            Confirmar Falla
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
