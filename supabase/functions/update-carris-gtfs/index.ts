import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const GTFS_URL = "https://gateway.carris.pt/gateway/gtfs/api/v2.11/GTFS";

/* ── ZIP parsing (zero dependencies) ── */

function readU16(b: Uint8Array, o: number) {
  return b[o] | (b[o + 1] << 8);
}
function readU32(b: Uint8Array, o: number) {
  return (b[o] | (b[o + 1] << 8) | (b[o + 2] << 16) | (b[o + 3] << 24)) >>> 0;
}

interface ZipEntryRef {
  name: string;
  dataOffset: number;
  compressedSize: number;
  method: number;
}

function findZipEntries(buf: Uint8Array, wanted: Set<string>): ZipEntryRef[] {
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
  const results: ZipEntryRef[] = [];
  let pos = cdOffset;

  while (pos < cdOffset + cdSize) {
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
      const dataOffset = localOffset + 30 + localNameLen + localExtraLen;
      results.push({ name, dataOffset, compressedSize: compSize, method });
    }
    pos += 46 + nameLen + extraLen + commentLen;
  }
  return results;
}

async function decompressToString(data: Uint8Array, method: number): Promise<string> {
  if (method === 0) return new TextDecoder().decode(data);
  const stream = new Blob([data]).stream().pipeThrough(new DecompressionStream("deflate-raw"));
  const reader = stream.getReader();
  const chunks: Uint8Array[] = [];
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
  }
  const total = chunks.reduce((s, c) => s + c.length, 0);
  const merged = new Uint8Array(total);
  let off = 0;
  for (const c of chunks) { merged.set(c, off); off += c.length; }
  return new TextDecoder().decode(merged);
}

/* ── Main processing ── */

async function processGTFS() {
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  console.log("GTFS: downloading...");
  const res = await fetch(GTFS_URL);
  let buf: Uint8Array | null = new Uint8Array(await res.arrayBuffer());
  console.log(`GTFS: ${buf.length} bytes`);

  const wanted = new Set(["routes.txt", "calendar.txt", "trips.txt", "stop_times.txt"]);
  const entryRefs = findZipEntries(buf, wanted);
  const refMap: Record<string, ZipEntryRef> = {};
  for (const e of entryRefs) refMap[e.name] = e;

  // ── Parse small files (routes, calendar, trips) ──
  // Use compact objects instead of Maps to save memory

  // Routes: route_id → short_name
  const rRef = refMap["routes.txt"];
  const rText = await decompressToString(buf.subarray(rRef.dataOffset, rRef.dataOffset + rRef.compressedSize), rRef.method);
  const routes: Record<string, string> = {};
  const rLines = rText.split("\n");
  const rH = rLines[0].split(",").map(h => h.trim());
  const rIdIdx = rH.indexOf("route_id"), rSnIdx = rH.indexOf("route_short_name");
  for (let i = 1; i < rLines.length; i++) {
    const v = rLines[i].split(",");
    if (v[rIdIdx]) routes[v[rIdIdx].trim()] = v[rSnIdx]?.trim() || "?";
  }
  console.log(`GTFS: ${Object.keys(routes).length} routes`);

  // Calendar: service_id → day type
  const cRef = refMap["calendar.txt"];
  const cText = await decompressToString(buf.subarray(cRef.dataOffset, cRef.dataOffset + cRef.compressedSize), cRef.method);
  const services: Record<string, string> = {};
  const cLines = cText.split("\n");
  const cH = cLines[0].split(",").map(h => h.trim());
  const cSidIdx = cH.indexOf("service_id"), cMonIdx = cH.indexOf("monday"), cSatIdx = cH.indexOf("saturday");
  for (let i = 1; i < cLines.length; i++) {
    const v = cLines[i].split(",");
    if (v[cSidIdx]) services[v[cSidIdx].trim()] = v[cMonIdx]?.trim() === "1" ? "w" : v[cSatIdx]?.trim() === "1" ? "s" : "u";
  }

  // Trips: trip_id → "route_short_name|day_type" (single string to save memory)
  const tRef = refMap["trips.txt"];
  const tText = await decompressToString(buf.subarray(tRef.dataOffset, tRef.dataOffset + tRef.compressedSize), tRef.method);
  const trips: Record<string, string> = {};
  const tLines = tText.split("\n");
  const tH = tLines[0].split(",").map(h => h.trim());
  const tTidIdx = tH.indexOf("trip_id"), tRidIdx = tH.indexOf("route_id"), tSidIdx = tH.indexOf("service_id");
  for (let i = 1; i < tLines.length; i++) {
    const v = tLines[i].split(",");
    const tid = v[tTidIdx]?.trim();
    if (!tid) continue;
    const route = routes[v[tRidIdx]?.trim()] || "?";
    const dayType = services[v[tSidIdx]?.trim()] || "w";
    trips[tid] = `${route}|${dayType}`;
  }
  console.log(`GTFS: ${Object.keys(trips).length} trips`);

  // ── CRITICAL: Copy stop_times compressed data, then FREE the 35MB zip buffer ──
  const stRef = refMap["stop_times.txt"];
  const stCompressed = new Uint8Array(buf.subarray(stRef.dataOffset, stRef.dataOffset + stRef.compressedSize));
  const stMethod = stRef.method;
  buf = null; // Free ~35MB

  console.log(`GTFS: streaming stop_times (${stCompressed.length} bytes compressed)...`);

  // ── Stream-decompress stop_times without holding full file ──
  const schedules: Record<string, Set<string>> = {};
  let lineCount = 0;

  const stream = stMethod === 0
    ? new Blob([stCompressed]).stream()
    : new Blob([stCompressed]).stream().pipeThrough(new DecompressionStream("deflate-raw"));

  const reader = stream.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let headers: string[] = [];
  let hTripIdx = -1, hTimeIdx = -1, hStopIdx = -1;

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
        headers = trimmed.split(",").map(h => h.trim());
        hTripIdx = headers.indexOf("trip_id");
        hTimeIdx = headers.indexOf("departure_time");
        hStopIdx = headers.indexOf("stop_id");
        continue;
      }

      const vals = trimmed.split(",");
      const stopId = vals[hStopIdx]?.trim();
      const tripId = vals[hTripIdx]?.trim();
      const time = vals[hTimeIdx]?.trim()?.substring(0, 5);
      if (!stopId || !tripId || !time) continue;

      const tripInfo = trips[tripId];
      if (!tripInfo) continue;

      const key = `${time}|${tripInfo}`;
      if (!schedules[stopId]) schedules[stopId] = new Set();
      schedules[stopId].add(key);
      lineCount++;
    }
  }

  console.log(`GTFS: ${lineCount} entries, ${Object.keys(schedules).length} stops`);

  // ── Batch upsert ──
  const stopIds = Object.keys(schedules);
  const BATCH = 100;
  let inserted = 0;

  for (let i = 0; i < stopIds.length; i += BATCH) {
    const batch = stopIds.slice(i, i + BATCH).map(stop_id => ({
      stop_id,
      entries: Array.from(schedules[stop_id]).sort(),
      updated_at: new Date().toISOString(),
    }));

    const { error } = await supabase
      .from("carris_schedules")
      .upsert(batch, { onConflict: "stop_id" });

    if (error) throw error;
    inserted += batch.length;
  }

  console.log(`GTFS: completed — ${inserted} stops updated`);
  return { stops: inserted };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const promise = processGTFS();

    // @ts-ignore
    if (typeof EdgeRuntime !== "undefined" && EdgeRuntime.waitUntil) {
      // @ts-ignore
      EdgeRuntime.waitUntil(promise.catch((e: Error) => console.error("GTFS error:", e)));
      return new Response(
        JSON.stringify({ status: "processing", timestamp: new Date().toISOString() }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const result = await promise;
    return new Response(
      JSON.stringify({ status: "completed", ...result }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("GTFS error:", error);
    return new Response(JSON.stringify({ error: String(error) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
