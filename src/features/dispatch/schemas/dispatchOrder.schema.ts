import { z } from 'zod'

/**
 * Schema for a single compartment (shared by Standard and Hybrid)
 * 
 * Standard = 1 compartment, Hybrid = 2+
 * Both share the same structure: producto, perfil térmico, peso.
 */
export const compartmentSchema = z.object({
  product_id: z.number().int(),
  thermal_profile_id: z.number().int(),
  weight_tn: z.number().min(0),
})

export type CompartmentFormData = z.infer<typeof compartmentSchema>

/**
 * Schema for creating a new dispatch order
 * 
 * Un solo formulario: compartments[] es la única fuente de datos de carga.
 * - Standard: 1 compartment con producto, perfil y peso > 0
 * - Hybrid: 2+ compartments con producto y peso > 0
 */
export const createDispatchOrderSchema = z
  .object({
    // Configuration: 'standard' or 'hybrid'
    configuration: z.enum(['standard', 'hybrid']),

    // Lane selection
    lane_id: z.string().uuid('Carril es requerido'),

    // Quantity of orders to create (batch creation)
    quantity: z
      .number({ message: 'Cantidad es requerida' })
      .int('Cantidad debe ser un número entero')
      .min(1, 'Mínimo 1 orden')
      .max(50, 'Máximo 50 órdenes'),

    // Planned date for pickup
    planned_date: z.date({ message: 'Fecha prevista es requerida' }),

    // Pickup time window (nullable = no preference)
    pickup_window_start: z.string().nullable(),
    pickup_window_end: z.string().nullable(),

    // Notes (optional)
    notes: z.string().optional(),

    // Compartments: única fuente de datos de carga
    compartments: z.array(compartmentSchema),
  })
  // Validate time window: both must be set or both null
  .refine(
    (data) => {
      const hasStart = data.pickup_window_start !== null
      const hasEnd = data.pickup_window_end !== null
      return hasStart === hasEnd
    },
    {
      message: 'Debe especificar inicio y fin de la ventana horaria, o ninguno',
      path: ['pickup_window_end'],
    }
  )

export type CreateDispatchOrderFormData = z.infer<typeof createDispatchOrderSchema>

/**
 * Schema for editing an existing dispatch order
 * Configuration cannot be changed after creation
 */
export const editDispatchOrderSchema = z
  .object({
    // Configuration is read-only but needed for validation
    configuration: z.enum(['standard', 'hybrid']).optional(),

    // Lane selection
    lane_id: z.string().uuid('Carril es requerido').optional(),

    // Planned date for pickup
    planned_date: z.date({ message: 'Fecha prevista es requerida' }),

    // Pickup time window (nullable = no preference)
    pickup_window_start: z.string().nullable(),
    pickup_window_end: z.string().nullable(),

    // Notes (optional)
    notes: z.string().optional(),

    // Compartments: única fuente de datos de carga
    compartments: z.array(compartmentSchema).optional(),
  })
  // Validate time window: both must be set or both null
  .refine(
    (data) => {
      const hasStart = data.pickup_window_start !== null
      const hasEnd = data.pickup_window_end !== null
      return hasStart === hasEnd
    },
    {
      message: 'Debe especificar inicio y fin de la ventana horaria, o ninguno',
      path: ['pickup_window_end'],
    }
  )

export type EditDispatchOrderFormData = z.infer<typeof editDispatchOrderSchema>

/**
 * Default values for creating a new dispatch order
 */
export const createDispatchOrderDefaults: Partial<CreateDispatchOrderFormData> = {
  configuration: 'standard',
  quantity: 1,
  pickup_window_start: null,
  pickup_window_end: null,
  notes: '',
  compartments: [{
    product_id: 0,
    thermal_profile_id: 0,
    weight_tn: 0,
  }],
}

/**
 * Time validation helper
 */
export function isValidTimeFormat(time: string): boolean {
  const regex = /^([01]?[0-9]|2[0-3]):([0-5][0-9])$/
  return regex.test(time)
}

/**
 * Parse time string to minutes for comparison
 */
export function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number)
  return hours * 60 + minutes
}
