import { z } from 'zod'

// Connection Device form schema (main hardware entity)
export const connectionDeviceSchema = z.object({
  provider: z
    .coerce
    .number()
    .int('El proveedor debe ser un número entero')
    .nullable()
    .optional(),
  flespi_device_type_id: z
    .coerce
    .number()
    .int()
    .min(1, 'Seleccione un modelo válido'),
  tracked_entity_type: z
    .enum(['VEHICLE', 'TRAILER'] as const)
    .nullable()
    .optional(),
  ident: z
    .string()
    .min(1, 'El ID de dispositivo (IMEI/Serial) es requerido')
    .min(5, 'El ID de dispositivo debe tener al menos 5 caracteres'),
  phone_number: z
    .string()
    .optional()
    .nullable()
    .refine(
      (val) => !val || val.length >= 10,
      'El número de teléfono debe tener al menos 10 caracteres'
    ),
  serial: z
    .string()
    .optional()
    .nullable(),
  notes: z
    .string()
    .optional()
    .nullable(),
  carrier_id: z
    .coerce
    .number()
    .int('El ID del transportista debe ser un número entero')
    .min(1, 'El transportista es requerido'),
  assigned_entity_id: z
    .string()
    .optional()
    .nullable(),
})

export type ConnectionDeviceFormData = z.infer<typeof connectionDeviceSchema>

// Telematics Provider form schema
export const telematicsProviderSchema = z.object({
  name: z
    .string()
    .min(1, 'El nombre del proveedor es requerido')
    .min(2, 'El nombre debe tener al menos 2 caracteres'),
  carrier_id: z
    .number()
    .int('El ID del transportista debe ser un número entero')
    .min(1, 'El transportista es requerido'),
})

export type TelematicsProviderFormData = z.infer<typeof telematicsProviderSchema>
