import * as React from "react";

import { cn } from "../../lib/utils";

// Mapeo de tipos de input a valores de autocomplete apropiados
const getAutocompleteValue = (type: string, name?: string, id?: string) => {
  // Si ya se proporciona autocomplete, no lo sobrescribimos
  if (name || id) {
    const identifier = (name || id || '').toLowerCase();

    // Mapeo basado en nombres/ids comunes
    if (identifier.includes('email') || identifier.includes('correo')) return 'email';
    if (identifier.includes('password') || identifier.includes('contraseña')) return 'current-password';
    if (identifier.includes('newpassword') || identifier.includes('nueva')) return 'new-password';
    if (identifier.includes('firstname') || identifier.includes('nombre')) return 'given-name';
    if (identifier.includes('lastname') || identifier.includes('apellido')) return 'family-name';
    if (identifier.includes('phone') || identifier.includes('telefono') || identifier.includes('tel')) return 'tel';
    if (identifier.includes('address') || identifier.includes('direccion')) return 'street-address';
    if (identifier.includes('city') || identifier.includes('ciudad')) return 'address-level2';
    if (identifier.includes('country') || identifier.includes('pais')) return 'country';
    if (identifier.includes('postal') || identifier.includes('zip') || identifier.includes('codigo')) return 'postal-code';
    if (identifier.includes('organization') || identifier.includes('empresa') || identifier.includes('organizacion')) return 'organization';
    if (identifier.includes('job') || identifier.includes('title') || identifier.includes('cargo') || identifier.includes('puesto')) return 'organization-title';
  }

  // Mapeo basado en tipo de input
  switch (type) {
    case 'email': return 'email';
    case 'password': return 'current-password';
    case 'tel': return 'tel';
    case 'url': return 'url';
    default: return 'off'; // Para campos que no necesitan autocompletado
  }
};

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, autoComplete, name, id, ...props }, ref) => {
    // Solo agregar autocomplete si no se proporciona explícitamente
    const autocompleteValue = autoComplete || getAutocompleteValue(type || 'text', name, id);

    return (
      <input
        {...props}
        type={type}
        name={name}
        id={id}
        autoComplete={autocompleteValue}
        data-slot="input"
        className={cn(
          "file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/30 border-input-border text-input-foreground flex h-9 w-full min-w-0 rounded-md border px-3 py-1 text-sm bg-input-background transition-[color,box-shadow] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
          "focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]",
          "aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
          // Estilos específicos para date/time inputs
          type === "date" || type === "time" ? "[&::-webkit-calendar-picker-indicator]:opacity-100 [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:w-[18px] [&::-webkit-calendar-picker-indicator]:h-[18px] [&::-webkit-calendar-picker-indicator]:mr-[-4px]" : "",
          className,
        )}
        ref={ref}
      />
    );
  }
);

Input.displayName = "Input";

export { Input };