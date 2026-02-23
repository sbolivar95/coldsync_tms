import { z } from 'zod'

/**
 * Rate Card Validation Schemas
 * Following project conventions: snake_case field names, Spanish error messages
 */

// Break schema for tiered pricing (PER_TN charges)
export const rateCardChargeBreakSchema = z
  .object({
    min_value: z.number().min(0, 'El valor mínimo debe ser mayor o igual a 0'),
    max_value: z
      .number()
      .nullable()
      .refine((val) => val === null || val > 0, 'El valor máximo debe ser mayor a 0'),
    rate_value: z.number().min(0, 'El valor de tarifa debe ser mayor o igual a 0'),
  })
  .refine(
    (data) => {
      if (data.max_value === null) return true
      // Allow max >= min: max > min for ranges, max === min for exact capacity breaks
      return data.max_value >= data.min_value
    },
    {
      message: 'El valor máximo debe ser mayor o igual al valor mínimo',
      path: ['max_value'],
    }
  )

export type RateCardChargeBreakFormData = z.infer<typeof rateCardChargeBreakSchema>

// Charge schema
export const rateCardChargeSchema = z
  .object({
    charge_type: z.enum(['BASE', 'FREIGHT', 'DISTANCE', 'FUEL', 'HYBRID'], {
      errorMap: () => ({ message: 'Tipo de cargo inválido' }),
    }),
    rate_basis: z.enum(['FLAT', 'PER_TN', 'PER_KM', 'PERCENTAGE'], {
      errorMap: () => ({ message: 'Base de cálculo inválida' }),
    }),
    value: z.number().min(0, 'El valor debe ser mayor o igual a 0'),
    label: z.string().nullable().optional(),
    sort_order: z.number().int().min(0, 'El orden debe ser mayor o igual a 0'),
    is_active: z.boolean().default(true),
    apply_before_pct: z.boolean().default(true),
    weight_source: z
      .enum(['ACTUAL', 'TRUCK_CAPACITY'], {
        errorMap: () => ({ message: 'Base de cobro por peso inválida' }),
      })
      .default('ACTUAL'),
    breaks: z.array(rateCardChargeBreakSchema).optional(),
  })
  .refine(
    (data) => {
      // Breaks are only valid for PER_TN rate_basis
      if (data.rate_basis === 'PER_TN') {
        return data.breaks && data.breaks.length > 0
      }
      return true
    },
    {
      message: 'Los escalones son requeridos para tarifas por tonelada',
      path: ['breaks'],
    }
  )
  .refine(
    (data) => {
      // Validate breaks don't overlap for ACTUAL weight (cargo ranges)
      // TRUCK_CAPACITY uses closest-lower matching, so overlaps are allowed
      if (data.weight_source === 'TRUCK_CAPACITY' || !data.breaks || data.breaks.length < 2) return true
      const sorted = [...data.breaks].sort((a, b) => a.min_value - b.min_value)
      for (let i = 0; i < sorted.length - 1; i++) {
        const current = sorted[i]!
        const next = sorted[i + 1]!
        const currentMax = current.max_value ?? Infinity
        if (currentMax >= next.min_value) return false
      }
      return true
    },
    {
      message: 'Los escalones no pueden solaparse (base: peso transportado)',
      path: ['breaks'],
    }
  )

export type RateCardChargeFormData = z.infer<typeof rateCardChargeSchema>

// Main rate card schema
export const rateCardSchema = z
  .object({
    name: z.string().nullable().optional(),
    lane_id: z.string().min(1, 'El carril es requerido'),
    carrier_id: z.number().nullable().optional(),
    thermal_profile_id: z.number().nullable().optional(),
    valid_from: z.string().min(1, 'La fecha de inicio es requerida'),
    valid_to: z.string().nullable().optional(),
    is_active: z.boolean().default(true),
    charges: z.array(rateCardChargeSchema).min(1, 'Debe agregar al menos un cargo'),
  })
  .refine(
    (data) => {
      // Validate date range
      if (data.valid_to) {
        return new Date(data.valid_to) >= new Date(data.valid_from)
      }
      return true
    },
    {
      message: 'La fecha de fin debe ser posterior o igual a la fecha de inicio',
      path: ['valid_to'],
    }
  )
  .refine(
    (data) => {
      // Validate unique sort_order
      const sortOrders = data.charges.map((c) => c.sort_order)
      return new Set(sortOrders).size === sortOrders.length
    },
    {
      message: 'Los cargos deben tener órdenes únicos',
      path: ['charges'],
    }
  )

export type RateCardFormData = z.infer<typeof rateCardSchema>
