import { useState, useEffect } from "react";
import { AlertTriangle, X, Check, Loader2 } from "lucide-react"; // Added Loader2
import { SecondaryButton } from "../../../../components/widgets/SecondaryButton";
import { Button } from "../../../../components/ui/Button";
import { Checkbox } from "../../../../components/ui/Checkbox";
import { Textarea } from "../../../../components/ui/Textarea";
import { Label } from "../../../../components/ui/Label";
import { CarrierOrder, ordersService, RejectionReason } from "../../../../services/database/orders.service";

interface FailAfterAcceptViewProps {
  order: CarrierOrder;
  onBack: () => void;
  onConfirm: (reason: string, comments: string) => void;
}

export function FailAfterAcceptView({ onBack, onConfirm }: FailAfterAcceptViewProps) {
  const [selectedReason, setSelectedReason] = useState<string>("");
  const [comments, setComments] = useState("");
  const [reasons, setReasons] = useState<RejectionReason[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadReasons = async () => {
      try {
        const fetchedReasons = await ordersService.getRejectionReasons('post_acceptance');
        setReasons(fetchedReasons);
      } catch (error) {
        console.error('Error loading rejection reasons:', error);
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

    // Comments are required only for "other" reason (or typically if no specific reason is self-explanatory)
    // For consistecy with dialog, we check "other" or empty specific reasons if any
    if (selectedReason === "other" && !comments.trim()) {
      return;
    }

    onConfirm(selectedReason, comments);
    
    // Reset state after confirmation
    setSelectedReason("");
    setComments("");
  };

  // Validation: reason is always required, comments only required for "other"
  const isValid = selectedReason !== "" && (selectedReason !== "other" || comments.trim() !== "");

  return (
    <div className="flex flex-col h-full">
      {/* Fixed header - consistent with drawer header height */}
      <div 
        className="shrink-0 px-6 border-b border-gray-200 flex items-center justify-between"
        style={{ minHeight: '60px' }}
      >
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-red-600 shrink-0" />
          <h3 className="text-sm font-semibold text-gray-900">
            Declarar Falla Post-Aceptación
          </h3>
        </div>
      </div>

      {/* Scrollable content area */}
      <div className="flex-1 min-h-0 overflow-y-auto px-6 py-6">
        <div className="space-y-6">
          {/* Warning message */}
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex gap-3">
              <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-xs font-semibold text-red-900 mb-1">
                  Ruptura de Compromiso
                </p>
                <p className="text-xs text-red-700">
                  Esta acción declara la imposibilidad de ejecutar una orden previamente aceptada. 
                  Esto genera un evento auditable y puede tener implicaciones contractuales.
                </p>
              </div>
            </div>
          </div>

          {/* Reason selection */}
          <div className="space-y-2">
            <Label className="text-xs font-medium text-gray-700">
              Motivo de la Falla <span className="text-red-600">*</span>
            </Label>
            
            {isLoading ? (
               <div className="flex justify-center py-4">
                 <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
               </div>
            ) : (
                <div className="space-y-0.5">
                  {reasons.map((reason) => (
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
                      <div className="flex flex-col">
                          <span className="text-xs font-medium text-gray-900 leading-4">
                            {reason.label}
                          </span>
                      </div>
                    </div>
                  ))}
                  {reasons.length === 0 && (
                      <div className="text-sm text-gray-500 py-2">No se encontraron motivos.</div>
                  )}
                </div>
            )}
          </div>

          {/* Comments - only visible when "other" is selected */}
          {selectedReason === "other" && (
            <div className="space-y-2">
              <Label htmlFor="fail-comments" className="text-xs font-medium text-gray-700">
                Detalles adicionales <span className="text-red-600">*</span>
              </Label>
              <Textarea
                id="fail-comments"
                placeholder="Describe los detalles de la situación que impide ejecutar la orden..."
                value={comments}
                onChange={(e) => setComments(e.target.value)}
                rows={4}
                className="resize-none text-sm"
              />
              <p className="text-xs text-gray-500">
                Estos detalles son requeridos para el motivo 'Otro'
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
          Confirmar Falla
        </Button>
      </div>
    </div>
  );
}
