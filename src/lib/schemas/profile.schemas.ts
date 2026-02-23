import { z } from "zod";

// Profile form schema
export const profileSchema = z.object({
  firstName: z.string().min(1, "El nombre es requerido").min(2, "El nombre debe tener al menos 2 caracteres"),
  lastName: z.string().min(1, "El apellido es requerido").min(2, "El apellido debe tener al menos 2 caracteres"),
  email: z.string().min(1, "El correo es requerido").email("El correo no es válido"),
  phone: z.string().min(1, "El teléfono es requerido"),
});

// Company form schema
export const companySchema = z.object({
  companyName: z.string().min(1, "El nombre de la empresa es requerido"),
  rut: z.string().min(1, "El RUT es requerido"),
  address: z.string().min(1, "La dirección es requerida"),
  phone: z.string().min(1, "El teléfono es requerido"),
});

// Password change schema
export const passwordSchema = z.object({
  new: z.string().min(8, "La nueva contraseña debe tener al menos 8 caracteres"),
  confirm: z.string().min(1, "Por favor confirma la contraseña"),
}).refine((data) => data.new === data.confirm, {
  message: "Las contraseñas no coinciden",
  path: ["confirm"],
});

export type ProfileFormData = z.infer<typeof profileSchema>;
export type CompanyFormData = z.infer<typeof companySchema>;
export type PasswordFormData = z.infer<typeof passwordSchema>;


