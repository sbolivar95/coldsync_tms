import React from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "../../ui/Dialog";
import { DialogActions } from "../DialogActions";
import { cn } from "../../../lib/utils";

/**
 * DISPATCH DIALOG - ColdSync
 * 
 * Shell reutilizable para diálogos siguiendo la UI/UX de ColdSync.
 */

export interface DispatchDialogProps {
    open: boolean;
    onClose: () => void;
    title: string;
    description?: string;
    children: React.ReactNode;
    /** Callback para guardar/acción primaria */
    onSave?: () => void;
    saveLabel?: string;
    cancelLabel?: string;
    /** Clases CSS adicionales para el contenido */
    contentClassName?: string;
    /** Ancho máximo del diálogo (default: max-w-5xl) */
    maxWidth?: string;
}

export function DispatchDialog({
    open,
    onClose,
    title,
    description,
    children,
    onSave,
    saveLabel = "Guardar",
    cancelLabel = "Cancelar",
    contentClassName,
    maxWidth = "max-w-5xl",
}: DispatchDialogProps) {
    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className={cn(maxWidth, "max-h-[90vh] flex flex-col")}>
                <DialogHeader>
                    <DialogTitle className="text-base font-medium">{title}</DialogTitle>
                    {description && (
                        <DialogDescription className="text-xs text-gray-500">
                            {description}
                        </DialogDescription>
                    )}
                </DialogHeader>

                <div className={cn("flex-1 overflow-y-auto pr-2 py-3", contentClassName)}>
                    {children}
                </div>

                <DialogActions
                    onCancel={onClose}
                    onSave={onSave || (() => { })}
                    saveLabel={saveLabel}
                    cancelLabel={cancelLabel}
                />
            </DialogContent>
        </Dialog>
    );
}
