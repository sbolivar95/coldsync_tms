import { z } from "zod";

// Product form schema
export const productSchema = z.object({
  name: z
    .string()
    .min(1, "El nombre del producto es requerido")
    .min(2, "El nombre debe tener al menos 2 caracteres"),
  description: z
    .string()
    .min(1, "La descripción es requerida")
    .min(5, "La descripción debe tener al menos 5 caracteres"),
  thermalProfileIds: z
    .array(z.number())
    .min(1, "Debe seleccionar al menos un perfil térmico"),
  is_active: z.boolean().default(true),
});

export type ProductFormData = z.infer<typeof productSchema>;

