/**
 * FormLabel - Label de formulario estandarizado
 * Tailwind v4 Puro - Siempre con text-xs text-gray-600
 */

import { Label } from "@/components/ui/Label";
import { ReactNode } from "react";

interface FormLabelProps {
  children: ReactNode;
  htmlFor: string;
  required?: boolean;
  className?: string;
}

/**
 * Label de formulario con estilo consistente
 * 
 * Uso:
 * <FormLabel htmlFor="nombre" required>Nombre</FormLabel>
 * 
 * Características:
 * - Tamaño: text-xs (12px)
 * - Color: text-gray-600
 * - Asterisco rojo automático si required=true
 */
export function FormLabel({ 
  children, 
  htmlFor, 
  required = false,
  className = ""
}: FormLabelProps) {
  return (
    <Label 
      htmlFor={htmlFor} 
      className={`text-xs text-gray-600 ${className}`}
    >
      {children}
      {required && <span className="text-red-500 ml-1">*</span>}
    </Label>
  );
}
