import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const body = await req.json();
    const { batch } = body; // array of {stop_id, entries}

    if (!Array.isArray(batch) || batch.length === 0) {
      return new Response(JSON.stringify({ error: "batch required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { error } = await supabase
      .from("carris_schedules")
      .upsert(batch.map((b: any) => ({
        stop_id: b.stop_id,
        entries: b.entries,
        updated_at: new Date().toISOString(),
      })), { onConflict: "stop_id" });

    if (error) throw error;

    return new Response(JSON.stringify({ ok: true, count: batch.length }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: String(error) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
