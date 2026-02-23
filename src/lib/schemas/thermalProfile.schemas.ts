import { z } from "zod";

// Thermal Profile form schema
export const thermalProfileSchema = z.object({
  name: z
    .string()
    .min(1, "El nombre del perfil es requerido")
    .min(2, "El nombre debe tener al menos 2 caracteres"),
  description: z
    .string()
    .min(1, "La descripción es requerida")
    .min(5, "La descripción debe tener al menos 5 caracteres"),
  temp_min_c: z
    .number({
      error: (issue) => {
        if (issue.received === "undefined") {
          return { message: "La temperatura mínima es requerida" };
        }
        return { message: "La temperatura mínima debe ser un número" };
      },
    })
    .min(-200, "La temperatura mínima debe ser mayor a -200°C")
    .max(200, "La temperatura mínima debe ser menor a 200°C"),
  temp_max_c: z
    .number({
      error: (issue) => {
        if (issue.received === "undefined") {
          return { message: "La temperatura máxima es requerida" };
        }
        return { message: "La temperatura máxima debe ser un número" };
      },
    })
    .min(-200, "La temperatura máxima debe ser mayor a -200°C")
    .max(200, "La temperatura máxima debe ser menor a 200°C"),
  is_active: z.boolean().default(true),
}).refine((data) => data.temp_min_c < data.temp_max_c, {
  message: "La temperatura mínima debe ser menor que la máxima",
  path: ["temp_min_c"],
});

export type ThermalProfileFormData = z.infer<typeof thermalProfileSchema>;

