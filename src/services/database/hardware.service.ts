import { supabase } from '../../lib/supabase'
import type {
  ConnectionDevice,
  ConnectionDeviceInsert,
  ConnectionDeviceUpdate,
  TelematicsProvider,
  AssignedType,
  FlespiProtocol,
  FlespiDeviceType,
} from '../../types/database.types'

/**
 * Hardware Service - CRUD operations for connection_device and catalog tables
 */

export const hardwareService = {
  // ============= CATALOG (FLESPI MIRROR) =============

  /**
   * Get all synced protocols (System Level)
   */
  async getFlespiProtocols(): Promise<FlespiProtocol[]> {
    const { data, error } = await supabase
      .from('flespi_protocols')
      .select('*')
      .order('name', { ascending: true })

    if (error) throw error
    return data || []
  },

  /**
   * Search for protocols in Flespi global catalog (via Edge Function)
   */
  async searchFlespiProtocols(query: string): Promise<{ id: number; name: string; title?: string }[]> {
    const session = (await supabase.auth.getSession()).data.session
    const functionUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/search-flespi-protocols`

    const response = await fetch(functionUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${session?.access_token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ query })
    })

    const data = await response.json()
    if (!response.ok) throw new Error(data.error || 'Error searching protocols')

    // Normalizar respuesta: la función devuelve { protocols: [...], count: X }
    return data.protocols || []
  },

  /**
   * Sync a specific protocol and its device types to local database
   */
  async syncFlespiProtocol(protocolId: number): Promise<void> {
    const session = (await supabase.auth.getSession()).data.session
    const functionUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/sync-hardware-catalog`

    const response = await fetch(functionUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${session?.access_token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ protocol_id: protocolId })
    })

    const data = await response.json()
    if (!response.ok) throw new Error(data.error || 'Error syncing protocol')
  },

  /**
   * Get device types, optionally filtered by protocol
   */
  async getFlespiDeviceTypes(protocolId?: number): Promise<FlespiDeviceType[]> {
    let query = supabase
      .from('flespi_device_types')
      .select('*')
      .order('name', { ascending: true })

    if (protocolId) {
      query = query.eq('protocol_id', protocolId)
    }

    const { data, error } = await query

    if (error) throw error
    return data || []
  },

  // ============= CONNECTION DEVICE (Main Hardware Entity) =============

  /**
   * Get all connection devices for an organization
   */
  async getAllConnectionDevices(
    orgId: string,
    carrierId?: number
  ): Promise<ConnectionDevice[]> {
    let query = supabase
      .from('connection_device')
      .select(`
        *,
        flespi_device_types (
          id,
          name,
          protocol_id,
          flespi_protocols ( name )
        )
      `)
      .eq('org_id', orgId)

    if (carrierId != null) {
      query = query.eq('carrier_id', carrierId)
    }

    const { data, error } = await query.order('ident', {
      ascending: true,
    })

    if (error) throw error
    return data ?? []
  },

  /**
   * Get connection device with related data (provider, device_type)
   */
  async getConnectionDeviceWithRelations(
    id: string,
    orgId: string
  ): Promise<
    | (ConnectionDevice & {
      telematics_provider: TelematicsProvider | null
      flespi_device_type:
      | (FlespiDeviceType & { flespi_protocols: FlespiProtocol | null })
      | null
    })
    | null
  > {
    const { data, error } = await supabase
      .from('connection_device')
      .select(
        `
        *,
        telematics_provider:provider (*),
        flespi_device_type:flespi_device_type_id (
          *,
          flespi_protocols:protocol_id (*)
        )
      `
      )
      .eq('id', id)
      .eq('org_id', orgId)
      .single()

    if (error) {
      if (error.code === 'PGRST116') return null
      throw error
    }
    // Casting to any because Supabase join types can be tricky with deep nesting
    return data as any
  },

  /**
   * Get a single connection device by ID
   */
  async getConnectionDeviceById(
    id: string,
    orgId: string
  ): Promise<ConnectionDevice | null> {
    const { data, error } = await supabase
      .from('connection_device')
      .select('*')
      .eq('id', id)
      .eq('org_id', orgId)
      .single()

    if (error) {
      if (error.code === 'PGRST116') return null
      throw error
    }
    return data
  },

  /**
   * Create a new connection device
   * Note: Enforces Vehicle-First logic if tracked_entity_type is missing,
   * but database now allows NULL so specific implementation can vary.
   */
  async createConnectionDevice(
    device: ConnectionDeviceInsert
  ): Promise<ConnectionDevice> {
    // 1. Create in Flespi via Edge Function
    // We use ident as the name for simplicity, similar to other integrations
    const flespiPayload = {
      name: device.ident,
      device_type_id: Number(device.flespi_device_type_id), // Force number type for Flespi
      ident: device.ident,
    }

    // Usamos fetch manual para mejor diagnóstico de errores (el cliente de Supabase oculta el body en error 400)
    const session = (await supabase.auth.getSession()).data.session
    const functionUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/manage-flespi-device`

    const response = await fetch(functionUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${session?.access_token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        action: 'create',
        device: flespiPayload
      })
    })

    const responseData = await response.json()

    if (!response.ok) {
      console.error('Flespi Edge Function Error:', responseData)
      throw new Error('Flespi: ' + (responseData.error || 'Error desconocido en Edge Function'))
    }

    if (!responseData.result?.id) {
      console.error('Unexpected Flespi Response:', responseData)
      throw new Error('Flespi did not return a valid device ID')
    }

    const flespiId = responseData.result.id

    // 2. Insert into Supabase with flespi_device_id
    const { data, error } = await supabase
      .from('connection_device')
      .insert({
        ...device,
        flespi_device_id: flespiId
      })
      .select()
      .single()

    if (error) {
      // TODO: Ideally rollback Flespi creation here
      throw error
    }
    return data
  },

  /**
   * Update a connection device
   */
  async updateConnectionDevice(
    id: string,
    orgId: string,
    updates: ConnectionDeviceUpdate
  ): Promise<ConnectionDevice> {
    // 1. Check if we need to sync with Flespi (if critical fields changed)
    const needsFlespiSync =
      updates.ident !== undefined || updates.flespi_device_type_id !== undefined

    if (needsFlespiSync) {
      // Fetch current device to get flespi ID and current values for merging
      const { data: currentDevice, error: fetchError } = await supabase
        .from('connection_device')
        .select('*')
        .eq('id', id)
        .single()

      if (fetchError) throw fetchError
      if (!currentDevice) throw new Error('Device not found')

      if (currentDevice.flespi_device_id) {
        // Prepare payload merging current data with updates
        const newIdent = updates.ident ?? currentDevice.ident
        const newTypeId =
          updates.flespi_device_type_id ?? currentDevice.flespi_device_type_id

        const flespiPayload = {
          name: newIdent, // Keep using ident as name
          device_type_id: Number(newTypeId),
          ident: newIdent,
        }

        const session = (await supabase.auth.getSession()).data.session
        const functionUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/manage-flespi-device`

        const response = await fetch(functionUrl, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session?.access_token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            action: 'update',
            id: currentDevice.flespi_device_id, // Pass the Flespi ID
            device: flespiPayload,
          })
        })

        const responseData = await response.json()

        if (!response.ok) {
          console.error('Flespi Update Error:', responseData)
          throw new Error(
            'Error updating device in Flespi: ' +
            (responseData.error || 'Error desconocido en Edge Function')
          )
        }
      }
    }

    // 2. Update in Supabase
    const { data, error } = await supabase
      .from('connection_device')
      .update(updates)
      .eq('id', id)
      .eq('org_id', orgId)
      .select()
      .single()

    if (error) throw error
    return data
  },

  /**
   * Delete a connection device
   */
  async deleteConnectionDevice(id: string, orgId: string): Promise<void> {
    // 1. Fetch device to get Flespi ID
    const { data: device, error: fetchError } = await supabase
      .from('connection_device')
      .select('flespi_device_id')
      .eq('id', id)
      .single()

    if (fetchError) {
      // If not found, maybe already deleted? Proceed to try delete from DB just in case.
      console.warn('Could not fetch device before delete:', fetchError)
    }

    if (device?.flespi_device_id) {
      // 2. Delete from Flespi
      const session = (await supabase.auth.getSession()).data.session
      const functionUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/manage-flespi-device`

      const response = await fetch(functionUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session?.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          action: 'delete',
          id: device.flespi_device_id,
        })
      })

      const responseData = await response.json()

      if (!response.ok) {
        console.error('Flespi Delete Error:', responseData)
        throw new Error(
          'Error deleting device from Flespi: ' +
          (responseData.error || 'Error desconocido en Edge Function')
        )
      }
    }

    // 3. Delete from Supabase
    const { error } = await supabase
      .from('connection_device')
      .delete()
      .eq('id', id)
      .eq('org_id', orgId)

    if (error) throw error
  },

  /**
   * Get connection devices by tracked entity type
   */
  async getConnectionDevicesByType(
    orgId: string,
    type: AssignedType,
    carrierId?: number
  ): Promise<ConnectionDevice[]> {
    let query = supabase
      .from('connection_device')
      .select('*')
      .eq('org_id', orgId)
      .eq('tracked_entity_type', type)

    if (carrierId != null) {
      query = query.eq('carrier_id', carrierId)
    }

    const { data, error } = await query.order('ident', { ascending: true })

    if (error) throw error
    return data || []
  },

  /**
   * Check if ident (connection ID) exists
   */
  async identExists(
    orgId: string,
    ident: string,
    excludeId?: string
  ): Promise<boolean> {
    let query = supabase
      .from('connection_device')
      .select('id')
      .eq('org_id', orgId)
      .eq('ident', ident)

    if (excludeId) {
      query = query.neq('id', excludeId)
    }

    const { data, error } = await query

    if (error) throw error
    return (data?.length ?? 0) > 0
  },

  // ============= TELEMATICS PROVIDER (Legacy/Auxiliary) =============

  /**
   * Get all telematics providers for an organization
   */
  /**
   * Get all telematics providers (Global Catalog)
   */
  async getAllProviders(): Promise<TelematicsProvider[]> {
    const { data, error } = await supabase
      .from('telematics_provider')
      .select('*')
      .order('name', { ascending: true })

    if (error) throw error
    return data || []
  },
}
