import { useMemo, useState } from "react";
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
import { type CancellationReason } from "../../../../services/database/cancellationReasons.service";

interface DispatchCancelDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  reasons: CancellationReason[]; // Pre-cargados desde el padre
  orderCount: number;
  onConfirm: (reasonId: string, comment?: string) => void;
}

export function DispatchCancelDialog({
  open,
  onOpenChange,
  reasons,
  orderCount,
  onConfirm,
}: DispatchCancelDialogProps) {
  const [selectedReasonId, setSelectedReasonId] = useState<string>("");
  const [comments, setComments] = useState("");

  const sortedReasons = useMemo(() => {
    return [...reasons].sort((a, b) => {
      if (a.code === "OTHER") return 1;
      if (b.code === "OTHER") return -1;
      return a.label.localeCompare(b.label);
    });
  }, [reasons]);

  const selectedReason = sortedReasons.find((reason) => reason.id === selectedReasonId);
  const isValid =
    selectedReasonId !== "" &&
    (!selectedReason?.requires_comment || comments.trim() !== "");

  const resetState = () => {
    setSelectedReasonId("");
    setComments("");
  };

  const handleConfirm = () => {
    if (!isValid) return;
    onConfirm(selectedReasonId, comments.trim() || undefined);
    resetState();
    onOpenChange(false);
  };

  const handleCancel = () => {
    resetState();
    onOpenChange(false);
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader className="space-y-0.5">
          <div className="flex items-center gap-2">
            <XCircle className="w-5 h-5 text-red-600 shrink-0" />
            <AlertDialogTitle className="text-base font-semibold flex-1">
              {orderCount === 1 ? "Cancelar Orden" : "Cancelar Órdenes"}
            </AlertDialogTitle>
          </div>
          <AlertDialogDescription className="text-xs text-gray-500">
            {orderCount === 1
              ? "Selecciona un motivo para cancelar esta orden."
              : `Selecciona un motivo común para cancelar las ${orderCount} órdenes seleccionadas.`}
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label className="text-xs font-medium text-gray-700">
              Motivo de Cancelación <span className="text-red-600">*</span>
            </Label>
            <div className="space-y-0.5">
              {sortedReasons.length === 0 ? (
                <div className="text-center py-4 text-xs text-gray-500">
                  No hay motivos de cancelación disponibles
                </div>
              ) : (
                sortedReasons.map((reason) => (
                  <div
                    key={reason.id}
                    className={`
                      flex items-center gap-4 p-3 rounded cursor-pointer transition-all
                      ${reason.id === selectedReasonId ? "bg-blue-50" : "bg-white hover:bg-gray-100"}
                    `}
                    onClick={() => setSelectedReasonId(reason.id)}
                  >
                    <Checkbox
                      checked={reason.id === selectedReasonId}
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

          {selectedReason?.requires_comment && (
            <div className="space-y-2">
              <Label htmlFor="cancel-comments" className="text-xs font-medium text-gray-700">
                Comentarios <span className="text-red-600">*</span>
              </Label>
              <Textarea
                id="cancel-comments"
                placeholder="Agrega detalles sobre la cancelación..."
                value={comments}
                onChange={(e) => setComments(e.target.value)}
                rows={3}
                className="resize-none text-sm"
              />
            </div>
          )}

          {selectedReason?.code === "OTHER" && !selectedReason.requires_comment && (
            <div className="space-y-2">
              <Label htmlFor="cancel-comments" className="text-xs font-medium text-gray-700">
                Comentarios adicionales <span className="text-gray-400">(opcional)</span>
              </Label>
              <Textarea
                id="cancel-comments"
                placeholder="Agrega detalles adicionales sobre la cancelación..."
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
            Confirmar Cancelación
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
