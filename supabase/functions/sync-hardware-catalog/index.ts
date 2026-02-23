import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
    // Handle CORS preflight requests
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        // 1. Initialize Supabase Client (Service Role for upserting to system tables)
        const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
        const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
        const flespiToken = Deno.env.get('FLESPI_TOKEN');

        if (!supabaseUrl || !supabaseServiceKey) {
            throw new Error('Missing Supabase configuration');
        }
        if (!flespiToken) {
            throw new Error('Missing FLESPI_TOKEN secret');
        }

        const supabase = createClient(supabaseUrl, supabaseServiceKey);

        // 2. Fetch from Flespi (Sync Full by Protocol)
        // Default: Teltonika=14, Ruptela=5. Can be overridden by body.protocol_id for on-demand sync.
        let targetProtocols = '14,5';
        try {
            const body = await req.json();
            if (body.protocol_id) {
                targetProtocols = String(body.protocol_id);
                console.log(`On-demand sync for protocol ID: ${targetProtocols}`);
            }
        } catch (e) {
            // Body might be empty on scheduled runs
        }

        const protocolsUrl = `https://flespi.io/gw/channel-protocols/${targetProtocols}?fields=id,name`;
        const deviceTypesUrl = `https://flespi.io/gw/channel-protocols/${targetProtocols}/device-types/all?fields=id,name,title,protocol_id,protocol_name`;

        console.log(`Fetching catalog from Flespi...`);

        // Fetch both in parallel for efficiency
        const [protocolsRes, deviceTypesRes] = await Promise.all([
            fetch(protocolsUrl, { headers: { 'Authorization': `FlespiToken ${flespiToken}` } }),
            fetch(deviceTypesUrl, { headers: { 'Authorization': `FlespiToken ${flespiToken}` } })
        ]);

        if (!protocolsRes.ok) {
            const errorText = await protocolsRes.text();
            throw new Error(`Flespi Protocols API error: ${protocolsRes.status} - ${errorText}`);
        }
        if (!deviceTypesRes.ok) {
            const errorText = await deviceTypesRes.text();
            throw new Error(`Flespi Device Types API error: ${deviceTypesRes.status} - ${errorText}`);
        }

        const protocolsData = await protocolsRes.json();
        const deviceTypesData = await deviceTypesRes.json();

        const protocols = protocolsData.result || [];
        const deviceTypes = deviceTypesData.result || [];

        console.log(`Received ${protocols.length} protocols and ${deviceTypes.length} device types from Flespi.`);

        // 3. Process and Upsert Protocols
        if (protocols.length > 0) {
            const protocolsPayload = protocols.map((p: any) => ({
                id: p.id,
                name: p.name,
                updated_at: new Date().toISOString(),
            }));

            console.log(`Upserting ${protocolsPayload.length} protocols...`);
            const { error: protocolsError } = await supabase
                .from('flespi_protocols')
                .upsert(protocolsPayload);

            if (protocolsError) {
                throw new Error(`Error upserting protocols: ${protocolsError.message}`);
            }
        }

        // 4. Process and Upsert Device Types
        if (deviceTypes.length > 0) {
            const deviceTypesPayload = deviceTypes.map((dt: any) => ({
                id: dt.id,
                name: dt.title || dt.name, // Friendly title fallback to technical name
                protocol_id: dt.protocol_id,
                updated_at: new Date().toISOString(),
            }));

            console.log(`Upserting ${deviceTypesPayload.length} device types...`);
            const { error: typesError } = await supabase
                .from('flespi_device_types')
                .upsert(deviceTypesPayload);

            if (typesError) {
                throw new Error(`Error upserting device types: ${typesError.message}`);
            }
        }

        return new Response(
            JSON.stringify({
                success: true,
                message: `Synced ${protocols.length} protocols and ${deviceTypes.length} device types.`,
            }),
            {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 200,
            }
        );

    } catch (error) {
        console.error('Sync Error:', error);
        return new Response(
            JSON.stringify({ error: error.message }),
            {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 500,
            }
        );
    }
});
