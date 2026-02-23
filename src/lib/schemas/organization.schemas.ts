import { z } from "zod";

// Currency options
export const currencyOptions = [
  { value: 'USD', label: 'USD - Dólar Estadounidense' },
  { value: 'BOB', label: 'BOB - Boliviano' },
] as const;

// Plan type options
export const planTypeOptions = [
  { value: 'PROFESSIONAL', label: 'Professional' },
  { value: 'STARTER', label: 'Starter' },
] as const;

// Latin America timezone options
export const timezoneOptions = [
  { value: 'America/La_Paz', label: 'Bolivia (La Paz)' },
  { value: 'America/Lima', label: 'Perú (Lima)' },
  { value: 'America/Santiago', label: 'Chile (Santiago)' },
  { value: 'America/Buenos_Aires', label: 'Argentina (Buenos Aires)' },
  { value: 'America/Bogota', label: 'Colombia (Bogotá)' },
  { value: 'America/Mexico_City', label: 'México (Ciudad de México)' },
  { value: 'America/Sao_Paulo', label: 'Brasil (São Paulo)' },
] as const;

// Form schema (uses strings for form inputs)
export const organizationFormSchema = z.object({
  // Basic fields
  comercial_name: z
    .string()
    .min(1, "El nombre comercial es requerido")
    .min(2, "El nombre comercial debe tener al menos 2 caracteres"),
  legal_name: z
    .string()
    .min(1, "La razón social es requerida")
    .min(2, "La razón social debe tener al menos 2 caracteres"),
  city: z.string().optional().or(z.literal("")),
  base_country_id: z
    .string()
    .min(1, "El país es requerido"),
  status: z.enum(["ACTIVE", "INACTIVE"]),
  // Fiscal fields
  tax_id: z.string().min(1, "El NIT/RUC es requerido"),
  fiscal_address: z.string().min(1, "La dirección fiscal es requerida"),
  billing_email: z.string()
    .min(1, "El email de facturación es requerido")
    .email({ message: "El formato del email de facturación no es válido" }),
  // Contact fields
  contact_name: z.string().min(1, "El nombre del contacto es requerido"),
  contact_phone: z.string().min(1, "El teléfono del contacto es requerido"),
  contact_email: z.string()
    .min(1, "El email del contacto es requerido")
    .email({ message: "El formato del email del contacto no es válido" }),
  // Configuration fields
  currency: z.enum(["BOB", "USD"]),
  time_zone: z.string().min(1, "La zona horaria es requerida"),
  plan_type: z.enum(["STARTER", "PROFESSIONAL"]),
});

// Database schema (uses numbers for database operations)
export const organizationSchema = z.object({
  // Basic fields
  comercial_name: z
    .string()
    .min(1, "El nombre comercial es requerido")
    .min(2, "El nombre comercial debe tener al menos 2 caracteres"),
  legal_name: z
    .string()
    .min(1, "La razón social es requerida")
    .min(2, "La razón social debe tener al menos 2 caracteres"),
  city: z.string().optional().or(z.literal("")),
  base_country_id: z
    .number()
    .min(1, "El país es requerido"),
  status: z.enum(["ACTIVE", "INACTIVE"]),
  // Fiscal fields
  tax_id: z.string().min(1, "El NIT/RUC es requerido"),
  fiscal_address: z.string().min(1, "La dirección fiscal es requerida"),
  billing_email: z.string()
    .min(1, "El email de facturación es requerido")
    .email({ message: "El formato del email de facturación no es válido" }),
  // Contact fields
  contact_name: z.string().min(1, "El nombre del contacto es requerido"),
  contact_phone: z.string().min(1, "El teléfono del contacto es requerido"),
  contact_email: z.string()
    .min(1, "El email del contacto es requerido")
    .email({ message: "El formato del email del contacto no es válido" }),
  // Configuration fields
  currency: z.enum(["BOB", "USD"]).default("USD"),
  time_zone: z.string().min(1, "La zona horaria es requerida").default("America/La_Paz"),
  plan_type: z.enum(["STARTER", "PROFESSIONAL"]).default("PROFESSIONAL"),
});

export type OrganizationFormData = z.infer<typeof organizationFormSchema>;
export type OrganizationData = z.infer<typeof organizationSchema>;


