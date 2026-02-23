import { z } from 'zod'

// Vehicle form schema (matches database table structure)
// Note: vehicle_code field removed - using unit_code as primary identifier
export const vehicleSchema = z.object({
  unit_code: z
    .string()
    .min(1, 'El código de unidad es requerido')
    .min(2, 'El código de unidad debe tener al menos 2 caracteres'),
  vehicle_type: z
    .string()
    .min(1, 'El tipo de vehículo es requerido')
    .min(2, 'El tipo de vehículo debe tener al menos 2 caracteres'),
  plate: z
    .string()
    .min(1, 'La placa/patente es requerida')
    .min(2, 'La placa/patente debe tener al menos 2 caracteres'),
  brand: z
    .string()
    .min(1, 'La marca es requerida')
    .min(2, 'La marca debe tener al menos 2 caracteres'),
  model: z
    .string()
    .min(1, 'El modelo es requerido')
    .min(2, 'El modelo debe tener al menos 2 caracteres'),
  year: z
    .number()
    .int('El año debe ser un número entero')
    .min(1900, 'El año debe ser mayor a 1900')
    .max(
      new Date().getFullYear() + 1,
      'El año no puede ser mayor al año actual'
    ),
  vin: z
    .string()
    .optional()
    .refine(
      (val) => !val || val.length === 17,
      'El VIN debe tener 17 caracteres'
    ),
  odometer_value: z
    .number({
      message: 'El valor del odómetro es requerido',
    })
    .min(0, 'El valor del odómetro debe ser mayor o igual a 0'),
  odometer_unit: z
    .string({
      message: 'La unidad del odómetro es requerida',
    })
    .min(1, 'La unidad del odómetro es requerida'),
  additional_info: z.string(),
  connection_device_id: z.string().optional().nullable(),
  operational_status: z.enum([
    'ACTIVE',
    'IN_SERVICE',
    'IN_MAINTENANCE',
    'OUT_OF_SERVICE',
    'RETIRED',
    'IN_TRANSIT',
  ], {
    message: 'El estado operacional es requerido',
  }),
  carrier_id: z
    .number()
    .int("El ID del transportista debe ser un número entero")
    .min(1, "El transportista es requerido"),

  // Extended Capacity Fields (Optional/Nullable)
  transport_capacity_weight_tn: z.coerce.number().optional().nullable(),
  volume_m3: z.coerce.number().optional().nullable(),
  tare_weight_tn: z.coerce.number().optional().nullable(),
  length_m: z.coerce.number().optional().nullable(),
  width_m: z.coerce.number().optional().nullable(),
  height_m: z.coerce.number().optional().nullable(),
  insulation_thickness_cm: z.coerce.number().optional().nullable(),
  compartments: z.coerce.number().int().default(1),
  supports_multi_zone: z.boolean().default(false),
  notes: z.string().optional().nullable(),
  load_capacity_type: z.enum([
    'PALLET',
    'MEAT_HOOK',
    'BASKET',
    'BOX',
    'BIN',
    'BULK',
    'OTHER',
  ] as const).optional().nullable(),
  load_capacity_quantity: z.coerce.number().optional().nullable(),

  // Reefer Equipment Data (Embedded for Form Handling)
  // Using any to allow nested fields without strict validation
  // The actual validation happens at the service layer when saving
  // Note: This is necessary because React Hook Form uses dot notation for nested fields
  // and we need to support dynamic nested paths like "reefer_equipment.brand"
  reefer_equipment: z.any().optional().nullable(),
})

export type VehicleFormData = z.infer<typeof vehicleSchema>
