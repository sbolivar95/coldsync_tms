import { z } from "zod";

// Driver form schema (matches database table structure)
export const driverSchema = z.object({
  driver_id: z
    .string()
    .min(1, "El ID del conductor es requerido")
    .min(2, "El ID del conductor debe tener al menos 2 caracteres"),
  name: z
    .string()
    .min(1, "El nombre es requerido")
    .min(2, "El nombre debe tener al menos 2 caracteres"),
  license_number: z
    .string()
    .min(1, "El número de licencia es requerido")
    .min(2, "El número de licencia debe tener al menos 2 caracteres"),
  phone_number: z
    .string()
    .min(1, "El número de teléfono es requerido")
    .min(8, "El número de teléfono debe tener al menos 8 caracteres"),
  email: z
    .union([
      z.string().trim().email("El email debe ser válido"),
      z.literal(""),
      z.null()
    ])
    .optional(),
  birth_date: z
    .string()
    .min(1, "La fecha de nacimiento es requerida")
    .refine(
      (date) => {
        const parsedDate = new Date(date);
        const today = new Date();
        const age = today.getFullYear() - parsedDate.getFullYear();
        return age >= 18 && age <= 100;
      },
      {
        message: "La fecha de nacimiento debe corresponder a una edad entre 18 y 100 años",
      }
    ),
  nationality: z
    .coerce.number()
    .int("La nacionalidad debe ser un número entero")
    .min(1, "La nacionalidad es requerida"),
  address: z
    .string()
    .min(1, "La dirección es requerida")
    .min(5, "La dirección debe tener al menos 5 caracteres"),
  city: z
    .string()
    .min(1, "La ciudad es requerida")
    .min(2, "La ciudad debe tener al menos 2 caracteres"),
  status: z.enum(["AVAILABLE", "INACTIVE", "DRIVING"] as const).default("AVAILABLE"),
  contract_date: z
    .string()
    .min(1, "La fecha de contrato es requerida")
    .refine(
      (date) => {
        const parsedDate = new Date(date);
        return !isNaN(parsedDate.getTime());
      },
      {
        message: "La fecha de contrato debe ser válida",
      }
    ),
  notes: z.string().optional().nullable(),
  carrier_id: z
    .coerce.number()
    .int("El ID del transportista debe ser un número entero")
    .min(1, "El transportista es requerido"),
});

export type DriverFormData = z.infer<typeof driverSchema>;
