import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const BASE_URL = "https://flespi.io/gw"

const corsHeaders: Record<string, string> = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

function json(status: number, payload: unknown) {
    return new Response(JSON.stringify(payload), {
        status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
}

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    if (req.method !== 'POST') {
        return json(405, { error: 'Método no permitido' })
    }

    try {
        const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? ''
        const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY') ?? ''
        const FLESPI_TOKEN = Deno.env.get('FLESPI_TOKEN')

        if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
            return json(500, { error: 'Error de configuración del servidor' })
        }

        if (!FLESPI_TOKEN) {
            return json(500, { error: 'Missing FLESPI_TOKEN secret' })
        }

        // Validate JWT using Supabase Client
        const authHeader = req.headers.get('Authorization') ?? ''
        if (!authHeader.startsWith('Bearer ')) {
            return json(401, { error: 'Falta token de autorización' })
        }

        const supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
            global: { headers: { Authorization: authHeader } },
            auth: { persistSession: false }
        })

        // Validate user
        const { data: userData, error: userErr } = await supabaseClient.auth.getUser()
        if (userErr || !userData?.user) {
            return json(401, { error: 'No autorizado' })
        }

        const { action, device, id } = await req.json()

        const headers = {
            'Content-Type': 'application/json',
            'Authorization': `FlespiToken ${FLESPI_TOKEN}`
        }

        let url = ''
        let method = ''
        let body: any = null

        switch (action) {
            case 'create':
                // Expects device: { name, device_type_id, ident }
                url = `${BASE_URL}/devices?fields=id,name,device_type_id,configuration`
                method = 'POST'
                body = [{
                    name: device.name,
                    device_type_id: device.device_type_id,
                    configuration: {
                        ident: device.ident || device.name,
                        ...device.configuration
                    }
                }]
                break

            case 'update':
                // Expects id and device: { name?, device_type_id?, configuration? }
                if (!id) {
                    return json(400, { error: 'Missing device id for update' })
                }
                url = `${BASE_URL}/devices/${id}`
                method = 'PUT'
                body = {
                    ...(device.name && { name: device.name }),
                    ...(device.device_type_id && { device_type_id: device.device_type_id }),
                    ...(device.configuration && { configuration: device.configuration })
                }
                break

            case 'delete':
                // Expects id
                if (!id) {
                    return json(400, { error: 'Missing device id for delete' })
                }
                url = `${BASE_URL}/devices/${id}`
                method = 'DELETE'
                break

            default:
                return json(400, { error: `Unknown action: ${action}` })
        }

        const response = await fetch(url, {
            method,
            headers,
            ...(body && { body: JSON.stringify(body) })
        })

        const data = await response.json()

        // Check for Flespi-specific errors
        if (data.errors && data.errors.length > 0) {
            return json(400, {
                error: 'Flespi API error',
                details: data.errors
            })
        }

        if (!response.ok) {
            return json(response.status, {
                error: 'Flespi API request failed',
                status: response.status,
                details: data
            })
        }

        return json(200, {
            success: true,
            action,
            data: data.result || data
        })

    } catch (e: any) {
        console.error('Error in manage-flespi-device:', e)
        return json(500, {
            error: 'Internal server error',
            message: e?.message || String(e)
        })
    }
})
