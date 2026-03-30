import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { unzipSync, strFromU8 } from "https://esm.sh/fflate@0.8.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const GTFS_URL = "https://gateway.carris.pt/gateway/gtfs/api/v2.11/GTFS";

/* ── ZIP helpers ── */

function readU16(b: Uint8Array, o: number) {
  return b[o] | (b[o + 1] << 8);
}
function readU32(b: Uint8Array, o: number) {
  return (b[o] | (b[o + 1] << 8) | (b[o + 2] << 16) | (b[o + 3] << 24)) >>> 0;
}

/** Find a single file entry in a ZIP buffer and return its compressed data slice + method */
function findZipEntry(
  buf: Uint8Array,
  filename: string
): { data: Uint8Array; method: number } | null {
  // Find EOCD (last 22+ bytes)
  let eocd = -1;
  for (let i = buf.length - 22; i >= Math.max(0, buf.length - 65557); i--) {
    if (
      buf[i] === 0x50 &&
      buf[i + 1] === 0x4b &&
      buf[i + 2] === 0x05 &&
      buf[i + 3] === 0x06
    ) {
      eocd = i;
      break;
    }
  }
  if (eocd === -1) return null;

  const cdOffset = readU32(buf, eocd + 16);
  const cdSize = readU32(buf, eocd + 12);
  let pos = cdOffset;

  while (pos < cdOffset + cdSize) {
    if (readU32(buf, pos) !== 0x02014b50) break;
    const method = readU16(buf, pos + 10);
    const compSize = readU32(buf, pos + 20);
    const nameLen = readU16(buf, pos + 28);
    const extraLen = readU16(buf, pos + 30);
    const commentLen = readU16(buf, pos + 32);
    const localOffset = readU32(buf, pos + 42);

    const name = new TextDecoder().decode(
      buf.subarray(pos + 46, pos + 46 + nameLen)
    );

    if (name === filename) {
      const localNameLen = readU16(buf, localOffset + 26);
      const localExtraLen = readU16(buf, localOffset + 28);
      const dataStart = localOffset + 30 + localNameLen + localExtraLen;
      return {
        data: buf.subarray(dataStart, dataStart + compSize),
        method,
      };
    }

    pos += 46 + nameLen + extraLen + commentLen;
  }
  return null;
}

function parseCSV(text: string) {
  const lines = text.split("\n").filter((l) => l.trim());
  const headers = lines[0].split(",").map((h) => h.trim());
  const rows = lines.slice(1).map((l) => l.split(",").map((v) => v.trim()));
  return { headers, rows };
}

/* ── Main processing ── */

async function processGTFS() {
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  console.log("GTFS update: downloading...");
  const res = await fetch(GTFS_URL);
  const buf = new Uint8Array(await res.arrayBuffer());
  console.log(`GTFS update: downloaded ${buf.length} bytes`);

  // Phase 1: Extract small files with fflate (they're tiny — ~1MB total)
  const small = unzipSync(buf, {
    filter: (file: { name: string }) =>
      file.name === "routes.txt" ||
      file.name === "calendar.txt" ||
      file.name === "trips.txt",
  });

  // Routes
  const routesCSV = parseCSV(strFromU8(small["routes.txt"]));
  const ri = (h: string) => routesCSV.headers.indexOf(h);
  const routes = new Map<string, string>();
  for (const r of routesCSV.rows)
    routes.set(r[ri("route_id")], r[ri("route_short_name")]);

  // Calendar
  const calCSV = parseCSV(strFromU8(small["calendar.txt"]));
  const ci = (h: string) => calCSV.headers.indexOf(h);
  const services = new Map<string, string>();
  for (const r of calCSV.rows) {
    services.set(
      r[ci("service_id")],
      r[ci("monday")] === "1"
        ? "w"
        : r[ci("saturday")] === "1"
        ? "s"
        : "u"
    );
  }

  // Trips
  const tripsCSV = parseCSV(strFromU8(small["trips.txt"]));
  const ti = (h: string) => tripsCSV.headers.indexOf(h);
  const trips = new Map<string, [string, string]>();
  for (const r of tripsCSV.rows) {
    trips.set(r[ti("trip_id")], [
      routes.get(r[ti("route_id")]) || "?",
      services.get(r[ti("service_id")]) || "w",
    ]);
  }

  console.log(
    `GTFS update: parsed ${routes.size} routes, ${services.size} services, ${trips.size} trips`
  );

  // Phase 2: Stream-decompress stop_times.txt to avoid holding full file in memory
  const entry = findZipEntry(buf, "stop_times.txt");
  if (!entry) throw new Error("stop_times.txt not found in GTFS zip");

  const schedules = new Map<string, Set<string>>();
  let lineCount = 0;

  // Use DecompressionStream for streaming decompression
  const stream = new Blob([entry.data])
    .stream()
    .pipeThrough(new DecompressionStream("deflate-raw"));
  const reader = stream.getReader();
  const decoder = new TextDecoder();

  let buffer = "";
  let headers: string[] = [];
  let tripIdx = -1;
  let timeIdx = -1;
  let stopIdx = -1;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() || "";

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;

      if (!headers.length) {
        headers = trimmed.split(",").map((h) => h.trim());
        tripIdx = headers.indexOf("trip_id");
        timeIdx = headers.indexOf("departure_time");
        stopIdx = headers.indexOf("stop_id");
        continue;
      }

      const vals = trimmed.split(",");
      if (vals.length <= Math.max(tripIdx, timeIdx, stopIdx)) continue;

      const stopId = vals[stopIdx]?.trim();
      const tripId = vals[tripIdx]?.trim();
      const time = vals[timeIdx]?.trim()?.substring(0, 5);
      if (!stopId || !tripId || !time) continue;

      const trip = trips.get(tripId);
      if (!trip) continue;

      const key = `${time}|${trip[0]}|${trip[1]}`;
      if (!schedules.has(stopId)) schedules.set(stopId, new Set());
      schedules.get(stopId)!.add(key);
      lineCount++;
    }
  }

  // Process remaining buffer
  if (buffer.trim() && headers.length) {
    const vals = buffer.trim().split(",");
    const stopId = vals[stopIdx]?.trim();
    const tripId = vals[tripIdx]?.trim();
    const time = vals[timeIdx]?.trim()?.substring(0, 5);
    if (stopId && tripId && time) {
      const trip = trips.get(tripId);
      if (trip) {
        const key = `${time}|${trip[0]}|${trip[1]}`;
        if (!schedules.has(stopId)) schedules.set(stopId, new Set());
        schedules.get(stopId)!.add(key);
      }
    }
  }

  console.log(
    `GTFS update: processed ${lineCount} entries across ${schedules.size} stops`
  );

  // Phase 3: Batch upsert into carris_schedules
  const allEntries = Array.from(schedules.entries());
  const BATCH = 100;
  let inserted = 0;

  for (let i = 0; i < allEntries.length; i += BATCH) {
    const batch = allEntries.slice(i, i + BATCH).map(([stop_id, entrySet]) => ({
      stop_id,
      entries: Array.from(entrySet).sort(),
      updated_at: new Date().toISOString(),
    }));

    const { error } = await supabase
      .from("carris_schedules")
      .upsert(batch, { onConflict: "stop_id" });

    if (error) {
      console.error(`GTFS update: batch error at ${i}:`, error);
      throw error;
    }
    inserted += batch.length;
  }

  console.log(`GTFS update: completed — ${inserted} stops updated`);
  return { stops: inserted };
}

/* ── Handler ── */

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Use waitUntil for background processing so we don't time out
    const resultPromise = processGTFS();

    // @ts-ignore — EdgeRuntime.waitUntil is available in Supabase edge functions
    if (typeof EdgeRuntime !== "undefined" && EdgeRuntime.waitUntil) {
      EdgeRuntime.waitUntil(
        resultPromise.catch((e) => console.error("GTFS background error:", e))
      );

      return new Response(
        JSON.stringify({
          status: "processing",
          message: "GTFS update started in background",
          timestamp: new Date().toISOString(),
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fallback: wait for result
    const result = await resultPromise;
    return new Response(
      JSON.stringify({
        status: "completed",
        ...result,
        timestamp: new Date().toISOString(),
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("GTFS update error:", error);
    return new Response(JSON.stringify({ error: String(error) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
