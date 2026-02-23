import { z } from 'zod'

// Base schema for fleet set assignment
const baseAssignmentSchema = z.object({
  carrier_id: z
    .number()
    .int('El ID del transportista debe ser un número entero')
    .positive('El ID del transportista debe ser positivo')
    .optional(), // Optional because it's inferred from context
  driver_id: z
    .number()
    .int('El ID del conductor debe ser un número entero')
    .positive('El ID del conductor debe ser positivo')
    .optional()
    .nullable(),
  vehicle_id: z
    .string()
    .min(1, 'El vehículo es requerido'),
  trailer_id: z
    .string()
    .optional()
    .nullable(),
  starts_at: z
    .string()
    .min(1, 'La fecha de inicio es requerida')
    .refine(
      (date) => {
        const dateObj = new Date(date)
        return !isNaN(dateObj.getTime())
      },
      {
        message: 'La fecha de inicio debe ser una fecha válida',
      }
    ),
  ends_at: z
    .string()
    .optional()
    .nullable()
    .refine(
      (date) => {
        if (!date) return true
        const dateObj = new Date(date)
        return !isNaN(dateObj.getTime())
      },
      {
        message: 'La fecha de fin debe ser una fecha válida',
      }
    ),
})

// Create assignment schema with conditional trailer validation based on vehicle type
// RF-03.3: Bobtail support - trailer_id is optional even for TRACTOR vehicles
// (shows warning visual instead of blocking error)
// Note: vehicleType parameter kept for API compatibility but not used in validation
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function createAssignmentSchema(_vehicleType?: string | null) {
  return baseAssignmentSchema.superRefine((data, ctx) => {
    const vehicleType = (_vehicleType ?? '').toUpperCase()
    const hasTrailer = Boolean(data.trailer_id && String(data.trailer_id).trim().length > 0)

    // Fleet rule: only TRACTOR can have trailer assignment.
    if (vehicleType && vehicleType !== 'TRACTOR' && hasTrailer) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['trailer_id'],
        message: 'Solo un vehículo tipo TRACTOR puede tener remolque asignado',
      })
    }
  })
}

// Default schema (without vehicle type validation - will be validated in component)
export const assignmentSchema = baseAssignmentSchema

export type AssignmentFormData = z.infer<typeof baseAssignmentSchema>

