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

        console.log('Search request received from user:', userData.user.id)

        let query = ''
        try {
            const body = await req.json()
            query = body.query || ''
            console.log('Query:', query)
        } catch (e) {
            console.log('Body parsing failed, using empty query:', e)
        }

        // Flespi Feedback: Use 'all' selector or expression for filtering. 
        // 'title' is not a valid field for protocols.
        let selector = 'all'
        if (query.trim()) {
            // Using case-insensitive match expression (~ "*query*")
            // Must be URL-encoded appropriately.
            selector = encodeURIComponent(`{name ~ "*${query.trim()}*"}`)
        }

        const url = `${BASE_URL}/channel-protocols/${selector}?fields=id,name`

        console.log('Fetching from Flespi:', url)

        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Authorization': `FlespiToken ${FLESPI_TOKEN}`,
            }
        })

        if (!response.ok) {
            const errorText = await response.text()
            console.error(`Flespi API error (${response.status}):`, errorText)
            return json(response.status, {
                error: 'Flespi API request failed',
                status: response.status,
                details: errorText
            })
        }

        const data = await response.json()
        const protocols = data.result || []

        console.log(`Found ${protocols.length} protocols`)

        return json(200, {
            protocols: protocols,
            count: protocols.length
        })

    } catch (e: any) {
        console.error('Error in search-flespi-protocols:', e)
        return json(500, {
            error: 'Internal server error',
            message: e?.message || String(e)
        })
    }
})
