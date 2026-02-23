import { useState } from "react";
import { XCircle, X, Check } from "lucide-react";
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
import { type RejectionReason } from "../../../../services/database/orders.service";

interface BulkDeclineDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  reasons: RejectionReason[]; // Pre-cargados desde el padre
  orderCount: number;
  onConfirm: (reason: string, comments: string) => void;
}

export function BulkDeclineDialog({
  open,
  onOpenChange,
  reasons,
  orderCount,
  onConfirm,
}: BulkDeclineDialogProps) {
  const [selectedReason, setSelectedReason] = useState<string>("");
  const [comments, setComments] = useState("");

  const handleConfirm = () => {
    if (!selectedReason) return;
    
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

  const isValid = selectedReason !== "";

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader className="space-y-0.5">
          <div className="flex items-center gap-2">
            <XCircle className="w-5 h-5 text-red-600 shrink-0" />
            <AlertDialogTitle className="text-base font-semibold flex-1">
              {orderCount === 1 ? "Rechazar Orden" : "Rechazar Órdenes"}
            </AlertDialogTitle>
          </div>
          <AlertDialogDescription className="text-xs text-gray-500">
            {orderCount === 1 
              ? "Selecciona un motivo para rechazar esta orden."
              : `Selecciona un motivo común para rechazar las ${orderCount} órdenes seleccionadas.`
            }
          </AlertDialogDescription>
        </AlertDialogHeader>

        {/* Content */}
        <div className="space-y-4 py-2">
          {/* Reason selection */}
          <div className="space-y-2">
            <Label className="text-xs font-medium text-gray-700">
              Motivo de Rechazo <span className="text-red-600">*</span>
            </Label>
            <div className="space-y-0.5">
              {reasons.length === 0 ? (
                <div className="text-center py-4 text-xs text-gray-500">
                  No hay motivos de rechazo disponibles
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

          {/* Comments - only when "other" is selected */}
          {selectedReason === "other" && (
            <div className="space-y-2">
              <Label htmlFor="bulk-decline-comments" className="text-xs font-medium text-gray-700">
                Comentarios adicionales <span className="text-gray-400">(opcional)</span>
              </Label>
              <Textarea
                id="bulk-decline-comments"
                placeholder="Agrega detalles adicionales sobre el rechazo..."
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
            Confirmar Rechazo
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
