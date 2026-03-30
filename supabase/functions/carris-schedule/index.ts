import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { JSZip } from "https://deno.land/x/jszip@0.11.0/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const GTFS_URL = "https://gateway.carris.pt/gateway/gtfs/api/v2.11/GTFS";

// Cache the parsed GTFS data in memory (per isolate)
let cachedStops: any[] | null = null;
let cachedStopTimes: Map<string, any[]> | null = null;
let cachedRoutes: Map<string, string> | null = null;
let cachedTrips: Map<string, { route: string; service: string }> | null = null;
let cachedServices: Map<string, string> | null = null;
let cacheTime = 0;
const CACHE_TTL = 6 * 60 * 60 * 1000; // 6 hours

function parseCSV(text: string): any[] {
  const lines = text.split("\n").filter(l => l.trim());
  if (lines.length === 0) return [];
  const headers = lines[0].split(",").map(h => h.trim());
  return lines.slice(1).map(line => {
    const values = line.split(",");
    const obj: any = {};
    headers.forEach((h, i) => obj[h] = (values[i] || "").trim());
    return obj;
  });
}

async function loadGTFS() {
  if (cachedStops && Date.now() - cacheTime < CACHE_TTL) return;

  console.log("Downloading Carris GTFS...");
  const res = await fetch(GTFS_URL);
  const buf = await res.arrayBuffer();
  const zip = await JSZip.loadAsync(buf);

  // Parse stops
  const stopsText = await zip.file("stops.txt")!.async("string");
  cachedStops = parseCSV(stopsText).map(s => ({
    id: s.stop_id, name: s.stop_name,
    lat: parseFloat(s.stop_lat), lon: parseFloat(s.stop_lon)
  }));

  // Parse routes
  cachedRoutes = new Map();
  const routesText = await zip.file("routes.txt")!.async("string");
  for (const r of parseCSV(routesText)) {
    cachedRoutes.set(r.route_id, r.route_short_name);
  }

  // Parse calendar
  cachedServices = new Map();
  const calText = await zip.file("calendar.txt")!.async("string");
  for (const c of parseCSV(calText)) {
    cachedServices.set(c.service_id,
      c.monday === "1" ? "w" : c.saturday === "1" ? "s" : "u"
    );
  }

  // Parse trips
  cachedTrips = new Map();
  const tripsText = await zip.file("trips.txt")!.async("string");
  for (const t of parseCSV(tripsText)) {
    cachedTrips.set(t.trip_id, {
      route: cachedRoutes.get(t.route_id) || "?",
      service: cachedServices.get(t.service_id) || "w"
    });
  }

  // Parse stop_times - index by stop_id
  cachedStopTimes = new Map();
  const stText = await zip.file("stop_times.txt")!.async("string");
  const lines = stText.split("\n");
  const headers = lines[0].split(",").map(h => h.trim());
  const tripIdx = headers.indexOf("trip_id");
  const timeIdx = headers.indexOf("departure_time");
  const stopIdx = headers.indexOf("stop_id");

  for (let i = 1; i < lines.length; i++) {
    const vals = lines[i].split(",");
    if (vals.length < stopIdx + 1) continue;
    const stopId = vals[stopIdx]?.trim();
    const tripId = vals[tripIdx]?.trim();
    const time = vals[timeIdx]?.trim();
    if (!stopId || !tripId || !time) continue;

    const trip = cachedTrips.get(tripId);
    if (!trip) continue;

    if (!cachedStopTimes.has(stopId)) cachedStopTimes.set(stopId, []);
    cachedStopTimes.get(stopId)!.push({
      t: time.substring(0, 5),
      r: trip.route,
      s: trip.service
    });
  }

  // Deduplicate per stop
  for (const [stopId, entries] of cachedStopTimes) {
    const seen = new Set<string>();
    const unique = entries.filter((e: any) => {
      const key = `${e.t}-${e.r}-${e.s}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
    unique.sort((a: any, b: any) => a.t.localeCompare(b.t));
    cachedStopTimes.set(stopId, unique);
  }

  cacheTime = Date.now();
  console.log(`GTFS loaded: ${cachedStops.length} stops`);
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const action = url.searchParams.get("action") || "stops";

    await loadGTFS();

    if (action === "stops") {
      return new Response(JSON.stringify(cachedStops), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "schedule") {
      const stopId = url.searchParams.get("stop_id");
      if (!stopId) {
        return new Response(JSON.stringify({ error: "stop_id required" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const entries = cachedStopTimes?.get(stopId) || [];
      const stopInfo = cachedStops?.find(s => s.id === stopId) || null;

      // Filter by current day type
      const now = new Date();
      const day = now.getDay();
      const dayType = day === 0 ? "u" : day === 6 ? "s" : "w";
      const currentTime = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;

      const upcoming = entries
        .filter((e: any) => e.s === dayType && e.t >= currentTime)
        .slice(0, 15);

      return new Response(JSON.stringify({ stop: stopInfo, departures: upcoming }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Unknown action" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error:", error);
    return new Response(JSON.stringify({ error: "Internal error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
