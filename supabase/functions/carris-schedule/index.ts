import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const stopId = url.searchParams.get("stop_id");

    if (!stopId) {
      return new Response(JSON.stringify({ error: "stop_id required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!
    );

    const { data, error } = await supabase
      .from("carris_schedules")
      .select("entries")
      .eq("stop_id", stopId)
      .maybeSingle();

    if (error) throw error;

    const entries: string[] = data?.entries || [];

    // Use Lisbon timezone (GTFS times are local)
    const now = new Date();
    const lisbon = new Date(now.toLocaleString("en-US", { timeZone: "Europe/Lisbon" }));
    const day = lisbon.getDay();
    const dayType = day === 0 ? "u" : day === 6 ? "s" : "w";
    const currentTime = `${String(lisbon.getHours()).padStart(2, "0")}:${String(lisbon.getMinutes()).padStart(2, "0")}`;

    const departures = entries
      .filter((e: string) => {
        const parts = e.split("|");
        const dayFlag = parts[2];
        return dayFlag === dayType && parts[0] >= currentTime;
      })
      .slice(0, 15)
      .map((e: string) => {
        const [t, r, , d] = e.split("|");
        return { t, r, d: d || "" };
      });

    return new Response(JSON.stringify({ departures }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error:", error);
    return new Response(JSON.stringify({ error: String(error) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
