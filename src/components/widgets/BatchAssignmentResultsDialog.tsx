import { CheckCircle2, XCircle, AlertCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../ui/Dialog";
import { Button } from "../ui/Button";
import { ScrollArea } from "../ui/ScrollArea";
import { Badge } from "../ui/Badge";

interface BatchAssignmentResult {
  dispatch_order_id: string;
  dispatch_number: string | null;
  success: boolean;
  message: string;
  fleet_set_id?: string;
  dispatch_order?: unknown;
}

interface BatchAssignmentResultsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  total: number;
  successCount: number;
  failCount: number;
  successful: BatchAssignmentResult[];
  failed: BatchAssignmentResult[];
  title?: string;
}

export function BatchAssignmentResultsDialog({
  open,
  onOpenChange,
  total,
  successCount,
  failCount,
  successful,
  failed,
  title,
}: BatchAssignmentResultsDialogProps) {
  const hasFailures = failCount > 0;
  const hasSuccesses = successCount > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-base font-medium">
            {title || "Resultados de Asignación en Lote"}
          </DialogTitle>
          <DialogDescription className="text-xs">
            Se procesaron {total} órdenes de despacho
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex flex-col gap-4">
          {/* Summary */}
          <div className="space-y-2">
            {hasSuccesses && (
              <div className="flex items-center gap-2 text-sm">
                <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0" />
                <span className="text-gray-900 font-medium">
                  {successCount} {successCount === 1 ? "orden asignada" : "órdenes asignadas"} exitosamente
                </span>
              </div>
            )}

            {hasFailures && (
              <div className="flex items-center gap-2 text-sm">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                <span className="text-gray-900 font-medium">
                  {failCount} {failCount === 1 ? "orden necesita atención" : "órdenes necesitan atención"}
                </span>
              </div>
            )}
          </div>

          {/* Failed Orders Details */}
          {hasFailures && (
            <div className="flex-1 flex flex-col min-h-0">
              <h3 className="text-sm font-medium text-gray-900 mb-2">
                Órdenes con Problemas
              </h3>
              <ScrollArea className="flex-1 border border-gray-200 rounded-md">
                <div className="p-3 space-y-2">
                  {failed.map((result) => (
                    <div
                      key={result.dispatch_order_id}
                      className="bg-red-50 border border-red-200 rounded-md p-3 text-sm"
                    >
                      <div className="flex items-start gap-2">
                        <XCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium text-red-900">
                              {result.dispatch_number || result.dispatch_order_id}
                            </span>
                            {result.dispatch_number && (
                              <Badge
                                variant="outline"
                                className="text-[10px] px-1.5 py-0 border-red-300 text-red-700"
                              >
                                {result.dispatch_order_id.slice(0, 8)}
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-red-700 leading-relaxed">
                            {result.message}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          )}

          {/* Successful Orders (Collapsible if many) */}
          {hasSuccesses && successful.length <= 10 && (
            <div className="flex-1 flex flex-col min-h-0">
              <h3 className="text-sm font-medium text-gray-900 mb-2">
                Órdenes Asignadas Exitosamente
              </h3>
              <ScrollArea className="flex-1 border border-gray-200 rounded-md">
                <div className="p-3 space-y-1.5">
                  {successful.map((result) => (
                    <div
                      key={result.dispatch_order_id}
                      className="bg-green-50 border border-green-200 rounded-md p-2.5 text-sm flex items-center gap-2"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 text-green-600 shrink-0" />
                      <span className="font-medium text-green-900">
                        {result.dispatch_number}
                      </span>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          )}

          {hasSuccesses && successful.length > 10 && (
            <div className="bg-green-50 border border-green-200 rounded-md p-3 text-sm">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0" />
                <span className="text-green-900">
                  {successful.length} órdenes asignadas exitosamente. Las órdenes se actualizarán en la lista.
                </span>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            className="text-xs"
            onClick={() => onOpenChange(false)}
          >
            Cerrar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
