import React from "react";
import { X } from "lucide-react";
import { Button } from "../ui/Button";
import { Sheet, SheetContent, SheetTitle, SheetDescription } from "../ui/Sheet";

export interface ActionDrawerAction {
  id: string;
  label: string;
  variant?: "default" | "destructive" | "outline" | "secondary";
  onClick: () => void;
  disabled?: boolean;
  loading?: boolean;
}

export interface ActionDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  actions?: ActionDrawerAction[];
  showCloseButton?: boolean;
  width?: "sm" | "md" | "lg" | "xl";
}

/**
 * ActionDrawer - Componente reutilizable para drawers con acciones
 * Sigue el patrón de la industria (Sixfold/Transporeon) con:
 * - Header con título y subtítulo
 * - Contenido scrolleable
 * - Acciones fijas en el footer
 */
export function ActionDrawer({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  actions = [],
  showCloseButton = true,
  width = "lg"
}: ActionDrawerProps) {
  
  const getWidthClass = () => {
    switch (width) {
      case "sm": return "w-[400px]";
      case "md": return "w-[500px]";
      case "lg": return "w-[600px]";
      case "xl": return "w-[800px]";
      default: return "w-[600px]";
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent 
        side="right" 
        className={`${getWidthClass()} p-0 flex flex-col`}
        onInteractOutside={(e) => e.preventDefault()}
      >
        {/* Título y descripción para accesibilidad - deben estar directamente en SheetContent */}
        <SheetTitle className="sr-only">
          {title}
        </SheetTitle>
        <SheetDescription className="sr-only">
          {subtitle || "Detalles de la orden"}
        </SheetDescription>

        {/* Header visible */}
        <div className="px-6 py-4 border-b border-gray-200 shrink-0">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h2 className="text-lg font-semibold text-gray-900 leading-tight">
                {title}
              </h2>
              {subtitle && (
                <p className="text-sm text-gray-500 mt-1">
                  {subtitle}
                </p>
              )}
            </div>
            {showCloseButton && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="h-8 w-8 p-0 -mr-2"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        {/* Content - Scrolleable */}
        <div className="flex-1 overflow-y-auto">
          <div className="px-6 py-4">
            {children}
          </div>
        </div>

        {/* Footer con acciones - Fijo */}
        {actions.length > 0 && (
          <div className="px-6 py-4 border-t border-gray-200 shrink-0 bg-white">
            <div className="flex gap-3 justify-end">
              {actions.map((action) => (
                <Button
                  key={action.id}
                  variant={action.variant || "default"}
                  onClick={action.onClick}
                  disabled={action.disabled || action.loading}
                  className={action.variant === "default" ? "min-w-[120px]" : ""}
                >
                  {action.loading ? "..." : action.label}
                </Button>
              ))}
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}