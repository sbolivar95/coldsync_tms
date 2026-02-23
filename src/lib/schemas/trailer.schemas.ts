import { z } from "zod";

// Trailer form schema (matches database table structure)
export const trailerSchema = z.object({
  code: z
    .string()
    .min(1, "El código del remolque es requerido")
    .min(2, "El código del remolque debe tener al menos 2 caracteres"),
  plate: z
    .string()
    .min(1, "La placa/patente es requerida")
    .min(2, "La placa/patente debe tener al menos 2 caracteres"),
  transport_capacity_weight_tn: z
    .number()
    .min(0.1, "La capacidad de peso debe ser mayor a 0")
    .max(100, "La capacidad de peso no puede exceder 100 toneladas"),
  volume_m3: z
    .number()
    .min(0.1, "El volumen debe ser mayor a 0")
    .max(500, "El volumen no puede exceder 500 m³"),
  tare_weight_tn: z
    .number()
    .min(0, "El peso tara debe ser mayor o igual a 0")
    .max(50, "El peso tara no puede exceder 50 toneladas"),
  length_m: z
    .number()
    .min(0.1, "El largo debe ser mayor a 0")
    .max(30, "El largo no puede exceder 30 metros"),
  width_m: z
    .number()
    .min(0.1, "El ancho debe ser mayor a 0")
    .max(5, "El ancho no puede exceder 5 metros"),
  height_m: z
    .number()
    .min(0.1, "El alto debe ser mayor a 0")
    .max(5, "El alto no puede exceder 5 metros"),
  supports_multi_zone: z.boolean().default(false),
  compartments: z
    .number()
    .int("El número de compartimientos debe ser un número entero")
    .min(1, "Debe tener al menos 1 compartimiento")
    .max(10, "No puede tener más de 10 compartimientos")
    .default(1),
  insulation_thickness_cm: z
    .number()
    .min(0, "El espesor de aislamiento debe ser mayor o igual a 0")
    .max(50, "El espesor de aislamiento no puede exceder 50 cm")
    .optional()
    .nullable(),
  notes: z.string().optional().nullable(),
  operational_status: z.enum([
    "ACTIVE",
    "IN_SERVICE",
    "IN_MAINTENANCE",
    "OUT_OF_SERVICE",
    "RETIRED",
    "IN_TRANSIT",
  ] as const).default("ACTIVE"),
  carrier_id: z
    .number()
    .int("El ID del transportista debe ser un número entero")
    .min(1, "El transportista es requerido"),
  // New fields for parity with Vehicle
  brand: z.string().optional().nullable(),
  model: z.string().optional().nullable(),
  year: z
    .number()
    .int("El año debe ser un número entero")
    .min(1900, "El año debe ser mayor a 1900")
    .max(new Date().getFullYear() + 1, "El año no puede ser mayor al año actual")
    .optional()
    .nullable(),
  vin: z.string().max(17, "El VIN no puede exceder 17 caracteres").optional().nullable(),
  load_capacity_type: z
    .enum(["PALLET", "MEAT_HOOK", "BASKET", "BOX", "BIN", "BULK", "OTHER"])
    .optional()
    .nullable(),
  load_capacity_quantity: z
    .number()
    .min(0, "La cantidad debe ser mayor o igual a 0")
    .optional()
    .nullable(),
});

export type TrailerFormData = z.infer<typeof trailerSchema>;

// Trailer Reefer Specs schema
export const trailerReeferSpecsSchema = z.object({
  power_type: z.enum(["DIESEL", "ELECTRIC", "HYBRID"] as const).optional(),
  reefer_hours: z
    .number()
    .min(0, "Las horas de reefer deben ser mayor o igual a 0")
    .optional()
    .nullable(),
  diesel_capacity_l: z
    .number()
    .min(0, "La capacidad de diésel debe ser mayor o igual a 0")
    .max(1000, "La capacidad de diésel no puede exceder 1000 litros")
    .optional()
    .nullable(),
  consumption_lph: z
    .number()
    .min(0, "El consumo debe ser mayor o igual a 0")
    .max(50, "El consumo no puede exceder 50 L/h")
    .optional()
    .nullable(),
  brand: z.string().optional().nullable(),
  model: z.string().optional().nullable(),
  year: z
    .number()
    .int("El año debe ser un número entero")
    .min(1900, "El año debe ser mayor a 1900")
    .max(new Date().getFullYear() + 1, "El año no puede ser mayor al año actual")
    .optional()
    .nullable(),
  temp_min_c: z
    .number()
    .min(-50, "La temperatura mínima no puede ser menor a -50°C")
    .max(50, "La temperatura mínima no puede ser mayor a 50°C")
    .optional()
    .nullable(),
  temp_max_c: z
    .number()
    .min(-50, "La temperatura máxima no puede ser menor a -50°C")
    .max(50, "La temperatura máxima no puede ser mayor a 50°C")
    .optional()
    .nullable(),
}).refine(
  (data) => {
    if (
      data.temp_min_c !== undefined &&
      data.temp_min_c !== null &&
      data.temp_max_c !== undefined &&
      data.temp_max_c !== null
    ) {
      return data.temp_min_c < data.temp_max_c;
    }
    return true;
  },
  {
    message: "La temperatura mínima debe ser menor que la máxima",
    path: ["temp_max_c"],
  }
);

export type TrailerReeferSpecsFormData = z.infer<typeof trailerReeferSpecsSchema>;

// Combined schema for complete trailer form (trailer + optional reefer specs)
export const trailerCompleteSchema = trailerSchema.extend({
  // Reefer specs fields (all optional since a trailer might not have specs)
  power_type: z.enum(["DIESEL", "ELECTRIC", "HYBRID"] as const).optional(),
  reefer_hours: z
    .number()
    .min(0, "Las horas de reefer deben ser mayor o igual a 0")
    .optional()
    .nullable(),
  diesel_capacity_l: z
    .number()
    .min(0, "La capacidad de diésel debe ser mayor o igual a 0")
    .max(1000, "La capacidad de diésel no puede exceder 1000 litros")
    .optional()
    .nullable(),
  consumption_lph: z
    .number()
    .min(0, "El consumo debe ser mayor o igual a 0")
    .max(50, "El consumo no puede exceder 50 L/h")
    .optional()
    .nullable(),
  brand: z.string().optional().nullable(),
  model: z.string().optional().nullable(),
  year: z
    .number()
    .int("El año debe ser un número entero")
    .min(1900, "El año debe ser mayor a 1900")
    .max(new Date().getFullYear() + 1, "El año no puede ser mayor al año actual")
    .optional()
    .nullable(),
  temp_min_c: z
    .number()
    .min(-50, "La temperatura mínima no puede ser menor a -50°C")
    .max(50, "La temperatura mínima no puede ser mayor a 50°C")
    .optional()
    .nullable(),
  temp_max_c: z
    .number()
    .min(-50, "La temperatura máxima no puede ser menor a -50°C")
    .max(50, "La temperatura máxima no puede ser mayor a 50°C")
    .optional()
    .nullable(),
}).refine(
  (data) => {
    // Only validate temp relationship if both temps are provided and not null
    if (
      data.temp_min_c !== undefined &&
      data.temp_min_c !== null &&
      data.temp_max_c !== undefined &&
      data.temp_max_c !== null
    ) {
      return data.temp_min_c < data.temp_max_c;
    }
    return true;
  },
  {
    message: "La temperatura mínima debe ser menor que la máxima",
    path: ["temp_max_c"],
  }
);

export type TrailerCompleteFormData = z.infer<typeof trailerCompleteSchema>;

