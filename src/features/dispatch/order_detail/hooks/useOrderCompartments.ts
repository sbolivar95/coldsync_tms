import { useEffect } from "react";
import { useFieldArray, useFormContext } from "react-hook-form";
import type { CreateDispatchOrderFormData, CompartmentFormData } from "../../schemas/dispatchOrder.schema";

export interface CompartmentState extends CompartmentFormData {
    id: string; // React Hook Form field id
}

/**
 * Hook para manejar compartimentos en órdenes de despacho
 * 
 * NOTA: Este hook es solo para creación. La edición se maneja en el DispatchDrawer.
 * 
 * compartments[] es la única fuente de datos de carga.
 * - Standard: 1 compartimiento (no se puede eliminar)
 * - Híbrido: Mínimo 2 compartimientos (no se puede reducir a menos de 2)
 */
export function useOrderCompartments() {
    const { control, setValue, watch } = useFormContext<CreateDispatchOrderFormData>();
    const { fields, append, remove, replace } = useFieldArray({
        control,
        name: "compartments"
    });

    const configuration = watch("configuration");
    const watchedCompartments = watch("compartments");

    const compartments = fields.map((field, index) => ({
        ...field,
        ...(watchedCompartments?.[index] || {}),
        id: field.id
    })) as unknown as CompartmentState[];

    // Initialize compartments based on configuration
    useEffect(() => {
        if (configuration === 'standard') {
            // Standard: siempre 1 compartimiento
            if (fields.length !== 1) {
                replace([{
                    product_id: 0,
                    thermal_profile_id: 0,
                    weight_tn: 0
                }]);
            }
        } else if (configuration === 'hybrid') {
            // Híbrido: Mínimo 2 compartimientos
            if (fields.length < 2) {
                replace([
                    {
                        product_id: 0,
                        thermal_profile_id: 0,
                        weight_tn: 0
                    },
                    {
                        product_id: 0,
                        thermal_profile_id: 0,
                        weight_tn: 0
                    }
                ]);
            }
        }
    }, [configuration, fields.length, replace]);

    const handleAddCompartment = () => {
        append({
            product_id: 0,
            thermal_profile_id: 0,
            weight_tn: 0
        });
    };

    const handleRemoveCompartment = (index: number) => {
        // No permitir eliminar si es standard o si híbrido tiene solo 2
        if (configuration === 'standard') return;
        if (configuration === 'hybrid' && fields.length <= 2) return;

        remove(index);
    };

    const handleCompartmentChange = (index: number, field: keyof CompartmentFormData, value: number) => {
        setValue(`compartments.${index}.${field}` as any, value);
    };

    return {
        compartments,
        handleAddCompartment,
        handleRemoveCompartment,
        handleCompartmentChange
    };
}
