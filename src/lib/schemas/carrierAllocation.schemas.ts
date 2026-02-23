import { z } from 'zod';

export const carrierAllocationRuleSchema = z.object({
  id: z.string().optional(),
  target_orders: z.number().int().min(0, "Debe ser mayor o igual a 0"),
  reset_every_days: z.number().int().min(1, "Debe ser al menos 1 día"),
  starts_on: z.string().min(1, "Fecha de inicio requerida"),
  ends_on: z.string().nullable().optional(),
  reject_rate_threshold: z.number().min(0).max(1, "Debe estar entre 0 y 1").step(0.01),
  carryover_enabled: z.boolean().default(false),
  is_active: z.boolean().default(true),
});

export type CarrierAllocationRuleFormData = z.infer<typeof carrierAllocationRuleSchema>;

// Database defaults (matching schema.sql)
export const defaultAllocationRule: CarrierAllocationRuleFormData = {
  target_orders: 0,
  reset_every_days: 7, // DB default
  starts_on: new Date().toISOString().split('T')[0],
  ends_on: null,
  reject_rate_threshold: 0.50, // DB default (50%)
  carryover_enabled: true, // DB default
  is_active: true,
};
