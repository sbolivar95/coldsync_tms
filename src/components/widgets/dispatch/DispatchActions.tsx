import { Zap, Send, XCircle } from "lucide-react";
import { Button } from "../../ui/Button";

/**
 * DISPATCH ACTIONS COMPONENT - ColdSync
 * 
 * Common action buttons for dispatch boards.
 */

export interface DispatchActionsProps {
    /** Number of selected orders */
    selectedCount?: number;
    /** Callback to schedule/plan orders */
    onSchedule?: () => void;
    /** Callback to send orders to carrier */
    onSendDispatch?: () => void;
    /** Callback to cancel selected orders */
    onCancelSelected?: () => void;
    /** Whether to show text labels or just icons */
    showLabels?: boolean;
}

export function DispatchActions({
    selectedCount = 0,
    onSchedule,
    onSendDispatch,
    onCancelSelected,
    showLabels = true,
}: DispatchActionsProps) {
    return (
        <div className="flex items-center gap-2">
            {/* Cancel Selected Button */}
            {selectedCount > 0 && onCancelSelected && (
                <Button
                    variant="outline"
                    size="sm"
                    className="h-9 px-3 text-destructive hover:text-destructive hover:bg-red-50 gap-2 font-medium"
                    onClick={onCancelSelected}
                    title="Cancelar seleccionados"
                >
                    <XCircle className="w-4 h-4" />
                    {showLabels && <span>Cancelar ({selectedCount})</span>}
                </Button>
            )}

            {/* Schedule/Plan Button */}
            {selectedCount > 0 && onSchedule && (
                <Button
                    size="sm"
                    className="h-9 px-3 gap-2 font-medium"
                    onClick={onSchedule}
                >
                    <Zap className="h-4 w-4" />
                    {showLabels && <span>Planificar ({selectedCount})</span>}
                </Button>
            )}

            {/* Send to Carrier Button */}
            {onSendDispatch && (
                <Button
                    variant="outline"
                    size="sm"
                    className="h-9 px-3 gap-2 font-medium bg-white text-gray-700 hover:bg-gray-50 border-gray-300"
                    onClick={onSendDispatch}
                >
                    <Send className="h-4 w-4" />
                    {showLabels && <span>Enviar</span>}
                </Button>
            )}
        </div>
    );
}
