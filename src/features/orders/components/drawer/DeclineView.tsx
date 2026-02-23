import { useState, useEffect } from "react";
import { X, Check } from "lucide-react";
import { SecondaryButton } from "../../../../components/widgets/SecondaryButton";
import { Button } from "../../../../components/ui/Button";
import { Checkbox } from "../../../../components/ui/Checkbox";
import { Textarea } from "../../../../components/ui/Textarea";
import { Label } from "../../../../components/ui/Label";
import { CarrierOrder, ordersService, RejectionReason } from "../../../../services/database/orders.service";

interface DeclineViewProps {
  order: CarrierOrder;
  onBack: () => void;
  onConfirm: (reason: string, comments: string) => void;
}

export function DeclineView({ onBack, onConfirm }: DeclineViewProps) {
  const [selectedReason, setSelectedReason] = useState<string>("");
  const [comments, setComments] = useState("");
  const [rejectionReasons, setRejectionReasons] = useState<RejectionReason[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const loadReasons = async () => {
      setIsLoading(true);
      try {
        const reasons = await ordersService.getRejectionReasons();
        setRejectionReasons(reasons);
      } catch (error) {
        console.error("Failed to load rejection reasons", error);
      } finally {
        setIsLoading(false);
      }
    };
    loadReasons();
  }, []);

  const handleConfirm = () => {
    if (!selectedReason) {
      return;
    }

    onConfirm(selectedReason, comments);
  };

  const isValid = selectedReason !== "";

  return (
    <div className="flex flex-col h-full">
      {/* Fixed header - consistent with drawer header height */}
      <div 
        className="shrink-0 px-6 border-b border-gray-200 flex items-center justify-between"
        style={{ minHeight: '60px' }}
      >
        <h3 className="text-sm font-semibold text-gray-900">
          Motivo de Rechazo <span className="text-red-600">*</span>
        </h3>
      </div>

      {/* Scrollable content area */}
      <div className="flex-1 min-h-0 overflow-y-auto px-6 py-6">
        <div className="space-y-6">
         

          {/* Motivo de rechazo */}
          <div className="space-y-2">
            <div className="space-y-0.5">
              {isLoading ? (
                 <div className="text-center py-4 text-xs text-gray-500">Cargando motivos...</div>
              ) : (
                rejectionReasons.map((reason) => (
                  <div 
                    key={reason.code}
                    className={`
                      flex items-center gap-4 p-4 rounded cursor-pointer transition-all
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

          {/* Comentarios adicionales - solo cuando se selecciona "Otro" */}
          {selectedReason === "other" && (
            <div className="space-y-2">
              <Label htmlFor="decline-comments" className="text-xs font-medium text-gray-700">
                Comentarios adicionales <span className="text-gray-400">(opcional)</span>
              </Label>
              <Textarea
                id="decline-comments"
                placeholder="Agrega detalles adicionales sobre el rechazo..."
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
          Confirmar Rechazo
        </Button>
      </div>
    </div>
  );
}
