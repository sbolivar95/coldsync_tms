import * as React from "react";

import { cn } from "../../lib/utils";

// Función para determinar el valor de autocomplete apropiado para textarea
const getTextareaAutocomplete = (name?: string, id?: string) => {
  if (name || id) {
    const identifier = (name || id || '').toLowerCase();
    
    if (identifier.includes('address') || identifier.includes('direccion')) return 'street-address';
    if (identifier.includes('note') || identifier.includes('nota') || identifier.includes('comment') || identifier.includes('comentario')) return 'off';
    if (identifier.includes('message') || identifier.includes('mensaje')) return 'off';
    if (identifier.includes('description') || identifier.includes('descripcion')) return 'off';
  }
  
  return 'off'; // Por defecto, los textareas no necesitan autocompletado
};

const Textarea = React.forwardRef<HTMLTextAreaElement, React.ComponentProps<"textarea">>(
  ({ className, autoComplete, name, id, ...props }, ref) => {
    // Solo agregar autocomplete si no se proporciona explícitamente
    const autocompleteValue = autoComplete || getTextareaAutocomplete(name, id);
    
    return (
      <textarea
        name={name}
        id={id}
        autoComplete={autocompleteValue}
        data-slot="textarea"
        className={cn(
          "resize-none border-input placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive dark:bg-input/30 flex field-sizing-content min-h-16 w-full rounded-md border bg-input-background px-3 py-2 text-base transition-[color,box-shadow] outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
          className,
        )}
        ref={ref}
        {...props}
      />
    );
  }
);

Textarea.displayName = "Textarea";

export { Textarea };
