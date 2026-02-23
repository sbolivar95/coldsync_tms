import { z } from "zod";

// Compartment form schema
export const compartmentSchema = z.object({
  id: z
    .string()
    .min(1, "El ID del compartimento es requerido")
    .min(1, "El ID del compartimento debe tener al menos 1 carácter"),
  tempMin: z
    .string()
    .min(1, "La temperatura mínima es requerida")
    .refine(
      (val) => {
        const num = parseFloat(val);
        return !isNaN(num) && num >= -50 && num <= 50;
      },
      {
        message: "La temperatura mínima debe estar entre -50°C y 50°C",
      }
    ),
  tempMax: z
    .string()
    .min(1, "La temperatura máxima es requerida")
    .refine(
      (val) => {
        const num = parseFloat(val);
        return !isNaN(num) && num >= -50 && num <= 50;
      },
      {
        message: "La temperatura máxima debe estar entre -50°C y 50°C",
      }
    ),
  maxWeight: z
    .string()
    .min(1, "El peso máximo es requerido")
    .refine(
      (val) => {
        const num = parseFloat(val);
        return !isNaN(num) && num > 0;
      },
      {
        message: "El peso máximo debe ser mayor a 0",
      }
    ),
  maxVolume: z
    .string()
    .min(1, "El volumen máximo es requerido")
    .refine(
      (val) => {
        const num = parseFloat(val);
        return !isNaN(num) && num > 0;
      },
      {
        message: "El volumen máximo debe ser mayor a 0",
      }
    ),
  maxUnits: z
    .string()
    .min(1, "Las unidades máximas son requeridas")
    .refine(
      (val) => {
        const num = parseFloat(val);
        return !isNaN(num) && num > 0;
      },
      {
        message: "Las unidades máximas deben ser mayor a 0",
      }
    ),
  thermalProfileIds: z.array(z.string()).default([]),
}).refine(
  (data) => {
    const tempMin = parseFloat(data.tempMin);
    const tempMax = parseFloat(data.tempMax);
    return tempMin < tempMax;
  },
  {
    message: "La temperatura mínima debe ser menor que la máxima",
    path: ["tempMax"],
  }
);

export type CompartmentFormData = z.infer<typeof compartmentSchema>;
