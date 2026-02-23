import { supabase } from '../../lib/supabase'
import { ReeferEquipment, ReeferEquipmentInsert, ReeferEquipmentUpdate, ReeferOwnerType } from '../../types/database.types'

export const reeferEquipmentsService = {
    /**
     * Get reefer equipment by owner (vehicle or trailer)
     * If multiple records exist, returns the most recent one (by updated_at or id)
     */
    async getByOwner(orgId: string, ownerType: ReeferOwnerType, ownerId: string): Promise<ReeferEquipment | null> {
        const { data, error } = await supabase
            .from('reefer_equipments')
            .select('*')
            .eq('org_id', orgId)
            .eq('owner_type', ownerType)
            .eq('owner_id', ownerId)
            .order('updated_at', { ascending: false })
            .order('id', { ascending: false })
            .limit(1)
            .maybeSingle()

        if (error) {
            // Handle case where multiple rows exist (PGRST116)
            // This can happen if there are duplicate records in the database
            if (error.code === 'PGRST116') {
                // Get all records and return the most recent one
                const { data: allData, error: allError } = await supabase
                    .from('reefer_equipments')
                    .select('*')
                    .eq('org_id', orgId)
                    .eq('owner_type', ownerType)
                    .eq('owner_id', ownerId)
                    .order('updated_at', { ascending: false })
                    .order('id', { ascending: false })
                
                if (allError) {
                    console.error('Error fetching reefer equipment:', allError)
                    throw allError
                }
                
                // Return the first (most recent) record, or null if empty
                return allData && allData.length > 0 ? allData[0] : null
            }
            
            console.error('Error fetching reefer equipment:', error)
            throw error
        }

        return data
    },

    /**
     * Create or update reefer equipment
     * Uses upsert based on (owner_type, owner_id) constraint if enforcing 1:1,
     * or relies on ID if editing.
     */
    async upsert(
        orgId: string,
        equipment: ReeferEquipmentInsert | ReeferEquipmentUpdate
    ): Promise<ReeferEquipment> {
        // If it's an update with ID, use that.
        // Ideally, we pass the full object.

        const { data, error } = await supabase
            .from('reefer_equipments')
            .upsert({
                ...equipment,
                org_id: orgId,
                updated_at: new Date().toISOString()
            })
            .select()
            .single()

        if (error) {
            console.error('Error upserting reefer equipment:', error)
            throw error
        }

        return data
    },

    /**
     * Delete reefer equipment associated with an owner
     */
    async deleteByOwner(orgId: string, ownerType: ReeferOwnerType, ownerId: string): Promise<void> {
        const { error } = await supabase
            .from('reefer_equipments')
            .delete()
            .eq('org_id', orgId)
            .eq('owner_type', ownerType)
            .eq('owner_id', ownerId)

        if (error) {
            console.error('Error deleting reefer equipment:', error)
            throw error
        }
    },

    /**
     * Get reefer equipment for multiple owners
     */
    async getByOwners(orgId: string, owners: { type: ReeferOwnerType; id: string }[]): Promise<ReeferEquipment[]> {
        if (owners.length === 0) return []

        const vehicleIds = owners.filter(o => o.type === 'VEHICLE').map(o => o.id)
        const trailerIds = owners.filter(o => o.type === 'TRAILER').map(o => o.id)

        const tasks = []
        if (vehicleIds.length > 0) {
            tasks.push(
                supabase
                    .from('reefer_equipments')
                    .select('*')
                    .eq('org_id', orgId)
                    .eq('owner_type', 'VEHICLE')
                    .in('owner_id', vehicleIds)
                    .order('created_at', { ascending: false })
            )
        }
        if (trailerIds.length > 0) {
            tasks.push(
                supabase
                    .from('reefer_equipments')
                    .select('*')
                    .eq('org_id', orgId)
                    .eq('owner_type', 'TRAILER')
                    .in('owner_id', trailerIds)
                    .order('created_at', { ascending: false })
            )
        }

        const results = await Promise.all(tasks)
        const allReefers: ReeferEquipment[] = []
        
        results.forEach(({ data, error }) => {
            if (error) throw error
            if (data) allReefers.push(...data)
        })

        // Filter to keep only the most recent record for each owner
        const latestReefersMap = new Map<string, ReeferEquipment>()
        
        // Since we ordered by created_at DESC, the first one encountered is the latest
        allReefers.forEach(reefer => {
            const key = `${reefer.owner_type}_${reefer.owner_id}`
            if (!latestReefersMap.has(key)) {
                latestReefersMap.set(key, reefer)
            }
        })

        return Array.from(latestReefersMap.values())
    }
}
