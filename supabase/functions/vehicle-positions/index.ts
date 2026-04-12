const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const CM_VEHICLES_URL = 'https://api.carrismetropolitana.pt/v2/vehicles';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const url = new URL(req.url);
  const routeId = url.searchParams.get('route_id');

  if (!routeId) {
    return new Response(JSON.stringify({ error: 'route_id is required' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    const res = await fetch(`${CM_VEHICLES_URL}?route_id=${encodeURIComponent(routeId)}`);
    if (!res.ok) {
      return new Response(JSON.stringify({ error: 'Upstream error', status: res.status }), {
        status: 502,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const raw = await res.json();
    const allVehicles = (Array.isArray(raw) ? raw : raw.data || []);
    // Filter by route_id and only include vehicles with valid coordinates
    const vehicles = allVehicles
      .filter((v: any) => {
        const vRoute = (v.route_id || '').replace(/_\d+$/, '');
        const targetRoute = routeId.replace(/_\d+$/, '');
        return vRoute === targetRoute && (v.lat || v.latitude) && (v.lon || v.longitude);
      })
      .map((v: any) => ({
        vehicle_id: v.id || v.vehicle_id || '',
        lat: v.lat ?? v.latitude ?? 0,
        lon: v.lon ?? v.longitude ?? 0,
        bearing: v.bearing ?? 0,
        speed: v.speed ?? 0,
        route_id: v.route_id || routeId,
        trip_id: v.trip_id || '',
        timestamp: v.timestamp || 0,
      }));

    return new Response(JSON.stringify(vehicles), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: 'Failed to fetch vehicles' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
