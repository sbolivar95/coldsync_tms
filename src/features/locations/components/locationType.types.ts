import { z } from 'zod'

/**
 * StopType - Types of stops available in the system.
 * Narrowed from database.types.ts to exclude 'DELIVERY' as requested.
 */
export type StopType = 'PICKUP' | 'DROP_OFF' | 'MANDATORY_WAYPOINT' | 'OPTIONAL_WAYPOINT'

export interface LocationType {
    id: number
    name: string
    org_id: string
    description?: string
    allowed_stop_types: StopType[]
    created_at?: string
}

export const locationTypeSchema = z.object({
    name: z.string().min(1, 'El nombre es requerido'),
    description: z.string().optional(),
    allowedStopTypes: z.array(z.string()).min(1, 'Selecciona al menos un rol operativo'),
})

export type LocationTypeFormData = z.infer<typeof locationTypeSchema>
