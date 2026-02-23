import { z } from "zod";
import type { Json, LocationInsert } from "../../types/database.types";

// Geofence data schema for circular type
const circularGeofenceSchema = z.object({
  center: z.object({
    lat: z.number().min(-90).max(90),
    lng: z.number().min(-180).max(180),
  }),
  radius: z.number().min(10, "El radio debe ser al menos 10 metros"),
});

// Geofence data schema for polygon type
const polygonGeofenceSchema = z.object({
  coordinates: z
    .array(
      z.object({
        lat: z.number().min(-90).max(90),
        lng: z.number().min(-180).max(180),
      })
    )
    .min(3, "Un polígono debe tener al menos 3 puntos"),
});

// Location form schema (matches database table structure)
export const locationSchema = z
  .object({
    name: z
      .string()
      .min(1, "El nombre de la ubicación es requerido")
      .min(2, "El nombre debe tener al menos 2 caracteres"),
    code: z
      .string()
      .min(1, "El código de la ubicación es requerido")
      .min(2, "El código debe tener al menos 2 caracteres"),
    address: z.string().min(1, "La dirección es requerida"),
    city: z.string().min(1, "La ciudad es requerida"),
    country_id: z
      .union([z.string(), z.number()])
      .refine((val) => {
        if (typeof val === "string") {
          return val !== "" && !isNaN(parseInt(val, 10));
        }
        return typeof val === "number" && val > 0;
      }, "El país es requerido")
      .transform((val) => (typeof val === "string" ? parseInt(val, 10) : val))
      .pipe(z.number().min(1, "El país es requerido")),
    type_location_id: z
      .string()
      .optional()
      .transform((val) => (val === "" || !val ? undefined : parseInt(val, 10)))
      .pipe(z.number().optional()),
    geofence_type: z.enum(["circular", "polygon"]),
    geofence_data: z.union([circularGeofenceSchema, polygonGeofenceSchema]).nullable(),
    num_docks: z
      .number()
      .int("El número de muelles debe ser un número entero")
      .min(1, "Debe haber al menos 1 muelle"),
    default_dwell_time_hours: z
      .number()
      .min(0, "El tiempo de parada no puede ser negativo")
      .default(0),
    is_active: z.boolean().default(true),
  })
  .refine(
    (data) => {
      if (!data.geofence_data) return true; // Permitir nulo inicialmente
      if (data.geofence_type === "circular") {
        return circularGeofenceSchema.safeParse(data.geofence_data).success;
      }
      if (data.geofence_type === "polygon") {
        return polygonGeofenceSchema.safeParse(data.geofence_data).success;
      }
      return true;
    },
    {
      message: "Los datos del geofence no coinciden con el tipo seleccionado",
      path: ["geofence_data"],
    }
  );

export type LocationFormData = z.infer<typeof locationSchema>;

// Form schema that accepts strings for country_id and type_location_id
export const locationFormSchema = z.object({
  name: z
    .string()
    .min(1, "El nombre de la ubicación es requerido")
    .min(2, "El nombre debe tener al menos 2 caracteres"),
  code: z
    .string()
    .min(1, "El código de la ubicación es requerido")
    .min(2, "El código debe tener al menos 2 caracteres"),
  address: z.string().min(1, "La dirección es requerida"),
  city: z.string().min(1, "La ciudad es requerida"),
  country_id: z.string().min(1, "El país es requerido"),
  type_location_id: z.string().optional().or(z.literal("")),
  geofence_type: z.enum(["circular", "polygon"]),
  geofence_data: z.union([circularGeofenceSchema, polygonGeofenceSchema]).nullable(),
  num_docks: z
    .number()
    .int("El número de muelles debe ser un número entero")
    .min(1, "Debe haber al menos 1 muelle"),
  default_dwell_time_hours: z.number().min(0, "El tiempo de parada no puede ser negativo"),
  is_active: z.boolean(),
}).refine(
  (data) => {
    if (!data.geofence_data) return true; // Permitir nulo inicialmente
    if (data.geofence_type === "circular") {
      return circularGeofenceSchema.safeParse(data.geofence_data).success;
    }
    if (data.geofence_type === "polygon") {
      return polygonGeofenceSchema.safeParse(data.geofence_data).success;
    }
    return true;
  },
  {
    message: "Los datos del geofence no coinciden con el tipo seleccionado",
    path: ["geofence_data"],
  }
);

// Form data type with string country_id for form inputs
export type LocationFormDataWithString = z.infer<typeof locationFormSchema>;

// Location Type form schema
export const locationTypeSchema = z.object({
  name: z
    .string()
    .min(1, "El nombre del tipo de ubicación es requerido")
    .min(2, "El nombre debe tener al menos 2 caracteres"),
  description: z
    .string()
    .optional()
    .nullable(),
  allowed_stop_types: z
    .array(z.string())
    .optional()
    .default([]),
});

export type LocationTypeFormData = z.infer<typeof locationTypeSchema>;

// Helper function to transform database Location to form data
export function locationToFormData(location: {
  id?: number;
  name: string;
  code: string;
  address: string;
  city: string;
  country_id?: number;
  countries?: { id: number; name: string; iso_code: string } | null;
  type_location_id?: number | null;
  geofence_type: "circular" | "polygon";
  geofence_data: unknown;
  num_docks: number;
  default_dwell_time_hours?: number | null;
  is_active: boolean;
}): LocationFormDataWithString {
  const geofenceData = location.geofence_data as
    | { center: { lat: number; lng: number }; radius: number }
    | { coordinates: Array<{ lat: number; lng: number }> };

  // Get country_id from direct field or from countries relation
  const countryId: number | undefined = location.country_id || location.countries?.id;

  return {
    name: location.name,
    code: location.code,
    address: location.address,
    city: location.city,
    country_id: countryId ? String(countryId) : "",
    type_location_id: location.type_location_id?.toString() || "",
    geofence_type: location.geofence_type,
    geofence_data: geofenceData,
    num_docks: location.num_docks,
    default_dwell_time_hours: location.default_dwell_time_hours ? Number(location.default_dwell_time_hours) : 0,
    is_active: location.is_active,
  };
}

// Helper function to transform form data to database LocationInsert
export function formDataToLocationInsert(
  formData: LocationFormData,
  orgId: string
): LocationInsert {
  return {
    name: formData.name,
    code: formData.code,
    address: formData.address,
    city: formData.city,
    country_id: formData.country_id,
    type_location_id: formData.type_location_id || null,
    geofence_type: formData.geofence_type,
    geofence_data: formData.geofence_data as Json,
    num_docks: formData.num_docks,
    default_dwell_time_hours: formData.default_dwell_time_hours,
    is_active: formData.is_active,
    org_id: orgId,
  };
}
