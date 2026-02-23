import { z } from 'zod'

export const reeferPowerSupply = z.enum(['DIESEL', 'ELECTRIC', 'HYBRID'])
export type ReeferPowerSupplySchema = z.infer<typeof reeferPowerSupply>

export const reeferOwnerType = z.enum(['TRAILER', 'VEHICLE'])
export type ReeferOwnerTypeSchema = z.infer<typeof reeferOwnerType>

export const reeferEquipmentSchema = z.object({
    // Identification
    brand: z.string().min(1, 'La marca es requerida'),
    model: z.string().optional().nullable(),
    year: z.coerce
        .number()
        .int()
        .min(1950, 'Año inválido')
        .max(new Date().getFullYear() + 1, 'No puede ser futuro')
        .optional()
        .nullable(),
    serial_number: z.string().optional().nullable(),

    // Operational
    reefer_hours: z.coerce.number().min(0).optional().nullable(),
    power_type: reeferPowerSupply.default('DIESEL'),
    diesel_capacity_l: z.coerce.number().min(0).optional().nullable(),
    consumption_lph: z.coerce.number().min(0).optional().nullable(),

    // Thermal Capability
    temp_min_c: z.coerce.number().min(-100).max(100).optional().nullable(),
    temp_max_c: z.coerce.number().min(-100).max(100).optional().nullable(),

    // Polymorphic Owner - Usually handled by backend or parent form, but good to validate
    owner_type: reeferOwnerType,
    owner_id: z.string().uuid(),

    org_id: z.string().uuid()
}).refine(
    (data) => {
        if (data.temp_min_c !== null && data.temp_min_c !== undefined &&
            data.temp_max_c !== null && data.temp_max_c !== undefined) {
            return data.temp_min_c <= data.temp_max_c;
        }
        return true;
    },
    {
        message: "La temperatura mínima no puede ser mayor que la máxima",
        path: ["temp_min_c"],
    }
);

export type ReeferEquipmentFormData = z.infer<typeof reeferEquipmentSchema>
