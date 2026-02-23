import { z } from "zod";

// Lane form schema (matches database table structure)
export const laneSchema = z.object({
    lane_id: z
        .string()
        .min(1, "El ID de carril es requerido")
        .min(2, "El ID de carril debe tener al menos 2 caracteres"),
    name: z
        .string()
        .min(1, "El nombre de carril es requerido")
        .min(2, "El nombre de carril debe tener al menos 2 caracteres"),
    distance: z.coerce
        .number()
        .positive("La distancia debe ser un número positivo")
        .min(0.01, "La distancia debe ser mayor a 0"),
    is_active: z.boolean(),
    operational_buffer: z.coerce
        .number()
        .nonnegative("El margen operacional no puede ser negativa")
        .optional()
        .nullable(),
    transit_time: z.coerce
        .number()
        .positive("El tiempo de tránsito debe ser un número positivo")
        .optional()
        .nullable(),
    lane_type_id: z.coerce.number().int().positive().optional().nullable(),
    stops: z.array(
        z.object({
            id: z.string().optional(),
            location_id: z.string().min(1, "La ubicación es requerida"),
            stop_type: z.enum(["PICKUP", "DROP_OFF", "MANDATORY_WAYPOINT", "OPTIONAL_WAYPOINT"]),
            stop_order: z.number(),
            estimated_duration: z.coerce.number().min(0),
            notes: z.string().optional(),
        })
    )
        .superRefine((stops, ctx) => {
            if (stops.length < 2) {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    message: "El carril debe tener al menos 2 ubicaciones (Origen y Destino)",
                    path: []
                });
            }

            if (stops.length > 0 && stops[0].stop_type !== "PICKUP") {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    message: "La primera ubicación DEBE ser de tipo Carga (PICKUP)",
                    path: [0, "stop_type"]
                });
            }

            if (stops.length > 0 && stops[stops.length - 1].stop_type !== "DROP_OFF") {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    message: "La última ubicación DEBE ser de tipo Descarga (DROP_OFF)",
                    path: [stops.length - 1, "stop_type"]
                });
            }
        }),
});

export type LaneFormData = z.infer<typeof laneSchema>;

// Lane Type form schema
export const laneTypeSchema = z.object({
    name: z
        .string()
        .min(1, "El nombre del tipo de carril es requerido")
        .min(2, "El nombre debe tener al menos 2 caracteres"),
    description: z.string().optional().nullable(),
});

export type LaneTypeFormData = z.infer<typeof laneTypeSchema>;
