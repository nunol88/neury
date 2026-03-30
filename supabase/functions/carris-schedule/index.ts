import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { unzipSync, strFromU8 } from "https://esm.sh/fflate@0.8.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const GTFS_URL = "https://gateway.carris.pt/gateway/gtfs/api/v2.11/GTFS";

// In-memory cache
let cachedStops: any[] | null = null;
let cachedSchedules: Map<string, string[]> | null = null;
let cacheTime = 0;
const CACHE_TTL = 6 * 60 * 60 * 1000;

function parseCSVLines(text: string): { headers: string[]; rows: string[][] } {
  const lines = text.split("\n").filter(l => l.trim());
  const headers = lines[0].split(",").map(h => h.trim());
  const rows = lines.slice(1).map(l => l.split(",").map(v => v.trim()));
  return { headers, rows };
}

async function loadGTFS() {
  if (cachedStops && cachedSchedules && Date.now() - cacheTime < CACHE_TTL) return;

  console.log("Downloading Carris GTFS...");
  const res = await fetch(GTFS_URL);
  const buf = new Uint8Array(await res.arrayBuffer());
  console.log(`Downloaded ${buf.length} bytes, unzipping...`);

  const unzipped = unzipSync(buf);

  // Parse stops
  const stopsText = strFromU8(unzipped["stops.txt"]);
  const stopsCSV = parseCSVLines(stopsText);
  const si = (h: string) => stopsCSV.headers.indexOf(h);
  cachedStops = stopsCSV.rows.map(r => ({
    id: r[si("stop_id")],
    name: r[si("stop_name")],
    lat: parseFloat(r[si("stop_lat")]),
    lon: parseFloat(r[si("stop_lon")]),
  }));

  // Parse routes
  const routesText = strFromU8(unzipped["routes.txt"]);
  const routesCSV = parseCSVLines(routesText);
  const ri = (h: string) => routesCSV.headers.indexOf(h);
  const routes = new Map<string, string>();
  for (const r of routesCSV.rows) routes.set(r[ri("route_id")], r[ri("route_short_name")]);

  // Parse calendar
  const calText = strFromU8(unzipped["calendar.txt"]);
  const calCSV = parseCSVLines(calText);
  const ci = (h: string) => calCSV.headers.indexOf(h);
  const services = new Map<string, string>();
  for (const r of calCSV.rows) {
    services.set(r[ci("service_id")], r[ci("monday")] === "1" ? "w" : r[ci("saturday")] === "1" ? "s" : "u");
  }

  // Parse trips
  const tripsText = strFromU8(unzipped["trips.txt"]);
  const tripsCSV = parseCSVLines(tripsText);
  const ti = (h: string) => tripsCSV.headers.indexOf(h);
  const trips = new Map<string, [string, string]>();
  for (const r of tripsCSV.rows) {
    trips.set(r[ti("trip_id")], [routes.get(r[ti("route_id")]) || "?", services.get(r[ti("service_id")]) || "w"]);
  }

  // Parse stop_times
  const stText = strFromU8(unzipped["stop_times.txt"]);
  const lines = stText.split("\n");
  const stHeaders = lines[0].split(",").map(h => h.trim());
  const tripIdx = stHeaders.indexOf("trip_id");
  const timeIdx = stHeaders.indexOf("departure_time");
  const stopIdx = stHeaders.indexOf("stop_id");

  cachedSchedules = new Map();
  const seen = new Map<string, Set<string>>();

  for (let i = 1; i < lines.length; i++) {
    const vals = lines[i].split(",");
    if (vals.length <= stopIdx) continue;
    const stopId = vals[stopIdx]?.trim();
    const tripId = vals[tripIdx]?.trim();
    const time = vals[timeIdx]?.trim()?.substring(0, 5);
    if (!stopId || !tripId || !time) continue;

    const trip = trips.get(tripId);
    if (!trip) continue;

    const key = `${time}|${trip[0]}|${trip[1]}`;
    if (!seen.has(stopId)) seen.set(stopId, new Set());
    if (seen.get(stopId)!.has(key)) continue;
    seen.get(stopId)!.add(key);

    if (!cachedSchedules.has(stopId)) cachedSchedules.set(stopId, []);
    cachedSchedules.get(stopId)!.push(key);
  }

  // Sort per stop
  for (const [, entries] of cachedSchedules) entries.sort();

  cacheTime = Date.now();
  console.log(`GTFS loaded: ${cachedStops.length} stops, ${cachedSchedules.size} with schedules`);
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
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const entries = cachedSchedules?.get(stopId) || [];
      const stopInfo = cachedStops?.find(s => s.id === stopId) || null;

      const now = new Date();
      const day = now.getDay();
      const dayType = day === 0 ? "u" : day === 6 ? "s" : "w";
      const currentTime = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;

      const departures = entries
        .filter(e => e.endsWith(`|${dayType}`) && e.substring(0, 5) >= currentTime)
        .slice(0, 15)
        .map(e => {
          const [t, r, s] = e.split("|");
          return { t, r, s };
        });

      return new Response(JSON.stringify({ stop: stopInfo, departures }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Unknown action" }), {
      status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error:", error);
    return new Response(JSON.stringify({ error: String(error) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
