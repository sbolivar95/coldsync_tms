import { useMemo } from "react";
import type { UseFormReturn } from "react-hook-form";

/**
 * Hook para detectar cambios en formularios de React Hook Form
 * 
 * Compara los valores actuales del formulario con los valores originales
 * y retorna si hay cambios detectados.
 * 
 * @param form - Instancia de useForm de React Hook Form
 * @param originalData - Datos originales para comparar
 * @param mode - Modo del formulario ('create' siempre retorna true)
 * 
 * @returns { hasChanges: boolean, watchedValues: T }
 * 
 * @example
 * ```tsx
 * const form = useForm<FormData>({...});
 * const [originalData, setOriginalData] = useState<FormData | null>(null);
 * 
 * const { hasChanges } = useFormChanges(form, originalData, mode);
 * 
 * // En el botón
 * <PrimaryButton disabled={!hasChanges || isSubmitting}>
 *   Guardar
 * </PrimaryButton>
 * ```
 */
export function useFormChanges<T extends Record<string, any>>(
  form: UseFormReturn<T>,
  originalData: T | null,
  mode?: "view" | "edit" | "create"
): { hasChanges: boolean; watchedValues: T } {
  const watchedValues = form.watch();

  const hasChanges = useMemo(() => {
    // In create mode, always allow save (form is new)
    if (mode === "create") {
      return true;
    }

    // If no original data yet (still loading), don't allow save to prevent flicker
    if (!originalData) {
      return false;
    }

    // Deep comparison of all form values
    return Object.keys(watchedValues).some((key) => {
      const currentValue = watchedValues[key as keyof T];
      const originalValue = originalData[key as keyof T];

      // Handle null/undefined comparison
      if (currentValue === null && originalValue === null) return false;
      if (currentValue === undefined && originalValue === undefined) return false;
      if (currentValue === null && originalValue === undefined) return true;
      if (currentValue === undefined && originalValue === null) return true;

      // Deep comparison for objects and arrays
      if (typeof currentValue === "object" && currentValue !== null &&
        typeof originalValue === "object" && originalValue !== null) {
        return JSON.stringify(currentValue) !== JSON.stringify(originalValue);
      }

      return currentValue !== originalValue;
    });
  }, [watchedValues, originalData, mode]);

  return { hasChanges, watchedValues };
}
