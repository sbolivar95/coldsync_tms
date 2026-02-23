import { z } from "zod";

// User form schema
export const userSchema = z.object({
  firstName: z
    .string()
    .min(1, "El nombre es requerido")
    .min(2, "El nombre debe tener al menos 2 caracteres"),
  lastName: z
    .string()
    .min(1, "El apellido es requerido")
    .min(2, "El apellido debe tener al menos 2 caracteres"),
  email: z
    .string()
    .min(1, "El correo es requerido")
    .email("El correo no es válido"),
  phone: z.string().optional(),
  role: z.enum(["OWNER", "ADMIN", "STAFF", "DRIVER"]).refine(
    (role) => !!role,
    { message: "El rol es requerido" }
  ),
  // Status is calculated dynamically from user_id and is_active in organization_members
  // It should not be editable in the form
  organizationId: z.string().min(1, "La organización es requerida"),
  // Carrier member fields
  isCarrierMember: z.boolean(),
  carrierId: z.number().nullable().optional(),
  driverId: z.number().nullable().optional(),
});


export type UserFormData = z.infer<typeof userSchema>;


