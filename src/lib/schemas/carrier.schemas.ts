import { z } from "zod";
import { carrierAllocationRuleSchema } from "./carrierAllocation.schemas";

// Carrier form schema (matches database table structure)
export const carrierSchema = z.object({
  carrier_id: z.string().min(1, "ID de transportista requerido"),
  commercial_name: z.string().min(1, "Nombre comercial requerido"),
  legal_name: z.string().min(1, "Razón social requerida"),
  carrier_type: z.enum(["OWNER", "THIRD PARTY"]),
  tax_id: z.string().min(1, "RUC/Tax ID requerido"),
  legal_representative: z.string().min(1, "Representante legal requerido"),
  country: z.string().min(1, "País requerido"),
  city: z.string().min(1, "Ciudad requerida"),
  fiscal_address: z.string().min(1, "Dirección fiscal requerida"),
  contact_name: z.string().min(1, "Nombre de contacto requerido"),
  contact_phone: z.string().min(1, "Teléfono de contacto requerido"),
  contact_email: z.string().email("Email inválido"),
  ops_phone_24_7: z.string().min(1, "Teléfono 24/7 requerido"),
  finance_email: z.string().email("Email inválido"),
  contract_number: z.string().optional().or(z.literal("")),
  contract_expires_at: z.string().optional().or(z.literal("")),
  payment_terms: z.coerce.number().min(0, "Días de pago inválidos"),
  currency: z.string().optional().or(z.literal("")),
  bank_name: z.string().optional().or(z.literal("")),
  bank_account_number: z.string().optional().or(z.literal("")),
  bank_cci_swift: z.string().optional().or(z.literal("")),
  
  // Optional allocation rule configuration
  allocation_rule: carrierAllocationRuleSchema.optional(),
});

export type CarrierFormData = z.infer<typeof carrierSchema>;

