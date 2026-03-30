import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const GTFS_URL = "https://gateway.carris.pt/gateway/gtfs/api/v2.11/GTFS";

/* ── ZIP parsing (no external library) ── */

function readU16(b: Uint8Array, o: number) {
  return b[o] | (b[o + 1] << 8);
}
function readU32(b: Uint8Array, o: number) {
  return (b[o] | (b[o + 1] << 8) | (b[o + 2] << 16) | (b[o + 3] << 24)) >>> 0;
}

interface ZipEntry {
  name: string;
  compressedData: Uint8Array;
  method: number;
}

function listZipEntries(buf: Uint8Array, wanted: Set<string>): ZipEntry[] {
  // Find EOCD
  let eocd = -1;
  for (let i = buf.length - 22; i >= Math.max(0, buf.length - 65557); i--) {
    if (buf[i] === 0x50 && buf[i + 1] === 0x4b && buf[i + 2] === 0x05 && buf[i + 3] === 0x06) {
      eocd = i;
      break;
    }
  }
  if (eocd === -1) throw new Error("Not a valid ZIP");

  const cdOffset = readU32(buf, eocd + 16);
  const cdSize = readU32(buf, eocd + 12);
  const results: ZipEntry[] = [];
  let pos = cdOffset;

  while (pos < cdOffset + cdSize && results.length < wanted.size) {
    if (readU32(buf, pos) !== 0x02014b50) break;
    const method = readU16(buf, pos + 10);
    const compSize = readU32(buf, pos + 20);
    const nameLen = readU16(buf, pos + 28);
    const extraLen = readU16(buf, pos + 30);
    const commentLen = readU16(buf, pos + 32);
    const localOffset = readU32(buf, pos + 42);
    const name = new TextDecoder().decode(buf.subarray(pos + 46, pos + 46 + nameLen));

    if (wanted.has(name)) {
      const localNameLen = readU16(buf, localOffset + 26);
      const localExtraLen = readU16(buf, localOffset + 28);
      const dataStart = localOffset + 30 + localNameLen + localExtraLen;
      results.push({
        name,
        compressedData: buf.subarray(dataStart, dataStart + compSize),
        method,
      });
    }
    pos += 46 + nameLen + extraLen + commentLen;
  }
  return results;
}

async function decompressEntry(entry: ZipEntry): Promise<string> {
  if (entry.method === 0) {
    return new TextDecoder().decode(entry.compressedData);
  }
  const stream = new Blob([entry.compressedData])
    .stream()
    .pipeThrough(new DecompressionStream("deflate-raw"));
  const reader = stream.getReader();
  const chunks: Uint8Array[] = [];
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
  }
  const total = chunks.reduce((s, c) => s + c.length, 0);
  const merged = new Uint8Array(total);
  let offset = 0;
  for (const c of chunks) {
    merged.set(c, offset);
    offset += c.length;
  }
  return new TextDecoder().decode(merged);
}

function parseCSV(text: string) {
  const lines = text.split("\n").filter((l) => l.trim());
  const headers = lines[0].split(",").map((h) => h.trim());
  const rows = lines.slice(1).map((l) => l.split(",").map((v) => v.trim()));
  return { headers, rows };
}

/* ── Stream process stop_times without holding full decompressed file ── */

async function streamStopTimes(
  entry: ZipEntry,
  trips: Map<string, [string, string]>
): Promise<Map<string, Set<string>>> {
  const schedules = new Map<string, Set<string>>();
  let lineCount = 0;

  const stream =
    entry.method === 0
      ? new Blob([entry.compressedData]).stream()
      : new Blob([entry.compressedData])
          .stream()
          .pipeThrough(new DecompressionStream("deflate-raw"));

  const reader = stream.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let headers: string[] = [];
  let tripIdx = -1, timeIdx = -1, stopIdx = -1;

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

  console.log(`GTFS update: streamed ${lineCount} stop_time entries, ${schedules.size} stops`);
  return schedules;
}

/* ── Main ── */

async function processGTFS() {
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  console.log("GTFS update: downloading...");
  const res = await fetch(GTFS_URL);
  const buf = new Uint8Array(await res.arrayBuffer());
  console.log(`GTFS update: downloaded ${buf.length} bytes`);

  // Find all needed ZIP entries (only references into buf, no decompression yet)
  const wanted = new Set(["routes.txt", "calendar.txt", "trips.txt", "stop_times.txt"]);
  const entries = listZipEntries(buf, wanted);
  const entryMap = new Map(entries.map((e) => [e.name, e]));

  // Decompress & parse small files one at a time
  const routesText = await decompressEntry(entryMap.get("routes.txt")!);
  const routesCSV = parseCSV(routesText);
  const ri = (h: string) => routesCSV.headers.indexOf(h);
  const routes = new Map<string, string>();
  for (const r of routesCSV.rows) routes.set(r[ri("route_id")], r[ri("route_short_name")]);
  console.log(`GTFS update: ${routes.size} routes`);

  const calText = await decompressEntry(entryMap.get("calendar.txt")!);
  const calCSV = parseCSV(calText);
  const ci = (h: string) => calCSV.headers.indexOf(h);
  const services = new Map<string, string>();
  for (const r of calCSV.rows) {
    services.set(r[ci("service_id")], r[ci("monday")] === "1" ? "w" : r[ci("saturday")] === "1" ? "s" : "u");
  }

  const tripsText = await decompressEntry(entryMap.get("trips.txt")!);
  const tripsCSV = parseCSV(tripsText);
  const ti = (h: string) => tripsCSV.headers.indexOf(h);
  const trips = new Map<string, [string, string]>();
  for (const r of tripsCSV.rows) {
    trips.set(r[ti("trip_id")], [routes.get(r[ti("route_id")]) || "?", services.get(r[ti("service_id")]) || "w"]);
  }
  console.log(`GTFS update: ${trips.size} trips`);

  // Stream stop_times (never holds full decompressed file)
  const schedules = await streamStopTimes(entryMap.get("stop_times.txt")!, trips);

  // Batch upsert
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

    if (error) throw error;
    inserted += batch.length;
  }

  console.log(`GTFS update: completed — ${inserted} stops updated`);
  return { stops: inserted };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const resultPromise = processGTFS();

    // @ts-ignore
    if (typeof EdgeRuntime !== "undefined" && EdgeRuntime.waitUntil) {
      // @ts-ignore
      EdgeRuntime.waitUntil(
        resultPromise.catch((e: Error) => console.error("GTFS background error:", e))
      );
      return new Response(
        JSON.stringify({ status: "processing", timestamp: new Date().toISOString() }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const result = await resultPromise;
    return new Response(
      JSON.stringify({ status: "completed", ...result, timestamp: new Date().toISOString() }),
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
