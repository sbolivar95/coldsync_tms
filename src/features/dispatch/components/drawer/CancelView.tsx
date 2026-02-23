import { useState } from "react";
import { X, Check } from "lucide-react";
import { SecondaryButton } from "../../../../components/widgets/SecondaryButton";
import { Button } from "../../../../components/ui/Button";
import { Checkbox } from "../../../../components/ui/Checkbox";
import { Textarea } from "../../../../components/ui/Textarea";
import { Label } from "../../../../components/ui/Label";
import { CancellationReason } from "../../../../services/database/cancellationReasons.service";

interface CancelViewProps {
  onBack: () => void;
  onConfirm: (reasonId: string, comment?: string) => void;
  reasons: CancellationReason[];
}

export function CancelView({ onBack, onConfirm, reasons }: CancelViewProps) {
  const [selectedReasonId, setSelectedReasonId] = useState<string>("");
  const [comments, setComments] = useState("");

  // Sort reasons to ensure 'OTHER' is at the end
  const sortedReasons = [...reasons].sort((a, b) => {
    if (a.code === 'OTHER') return 1;
    if (b.code === 'OTHER') return -1;
    return a.label.localeCompare(b.label);
  });

  const handleConfirm = () => {
    if (!selectedReasonId) {
      return;
    }

    const selectedReason = sortedReasons.find(r => r.id === selectedReasonId);

    if (selectedReason?.requires_comment && !comments.trim()) {
      return;
    }

    onConfirm(selectedReasonId, comments.trim() || undefined);
  };

  const selectedReason = sortedReasons.find(r => r.id === selectedReasonId);
  const isValid = selectedReasonId !== "" && (!selectedReason?.requires_comment || comments.trim() !== "");

  return (
    <div className="flex flex-col h-full">
      {/* Fixed header - consistent with drawer header height */}
      <div
        className="shrink-0 px-6 border-b border-gray-200 flex items-center justify-between"
        style={{ minHeight: '60px' }}
      >
        <h3 className="text-sm font-semibold text-gray-900">
          Motivo de Cancelación <span className="text-red-600">*</span>
        </h3>
      </div>

      {/* Scrollable content area */}
      <div className="flex-1 min-h-0 overflow-y-auto px-6 py-6">
        <div className="space-y-6">
          {/* Motivo de cancelación */}
          <div className="space-y-2">
            <div className="space-y-0.5">
              {sortedReasons.map((reason) => (
                <div
                  key={reason.id}
                  className={`
                    flex items-center gap-4 p-4 rounded cursor-pointer transition-all
                    ${reason.id === selectedReasonId ? 'bg-blue-50' : 'bg-white hover:bg-gray-100'}
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
              ))}
            </div>
          </div>

          {/* Comentarios Obligatorios */}
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
                rows={4}
                className="resize-none text-sm"
              />
              <p className="text-xs text-gray-500">
                Este motivo requiere comentarios obligatorios
              </p>
            </div>
          )}

          {/* Comentarios opcionales - Solo si es "Otro" y NO es obligatorio ya */}
          {selectedReason?.code === 'OTHER' && !selectedReason.requires_comment && (
            <div className="space-y-2">
              <Label htmlFor="cancel-comments" className="text-xs font-medium text-gray-700">
                Comentarios adicionales <span className="text-gray-400">(opcional)</span>
              </Label>
              <Textarea
                id="cancel-comments"
                placeholder="Agrega detalles adicionales sobre la cancelación..."
                value={comments}
                onChange={(e) => setComments(e.target.value)}
                rows={4}
                className="resize-none text-sm"
              />
              <p className="text-xs text-gray-500">
                Estos comentarios ayudarán a mejorar la planificación futura
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Footer con botones de acción */}
      <div
        className="shrink-0 border-t border-gray-200 px-6 py-3 bg-white flex gap-3 items-center"
        style={{ minHeight: '60px' }}
      >
        <SecondaryButton
          icon={X}
          size="sm"
          className="flex-1"
          onClick={onBack}
        >
          Cancelar
        </SecondaryButton>
        <Button
          variant="destructive"
          size="sm"
          className="flex-1 gap-2"
          onClick={handleConfirm}
          disabled={!isValid}
        >
          <Check className="w-4 h-4" />
          Confirmar Cancelación
        </Button>
      </div>
    </div>
  );
}
