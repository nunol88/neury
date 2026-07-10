import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

const AGENT_EMAIL = "chatgpt@mayslimpo.app";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const token = url.searchParams.get("token") ?? req.headers.get("x-agent-token");
    const expected = Deno.env.get("AGENT_BYPASS_TOKEN");

    if (!expected || token !== expected) {
      return new Response(JSON.stringify({ error: "unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const redirectTo = url.searchParams.get("redirect") ?? "https://neury.lovable.app/admin/agendamentos";

    const { data, error } = await supabase.auth.admin.generateLink({
      type: "magiclink",
      email: AGENT_EMAIL,
      options: { redirectTo },
    });

    if (error) throw error;

    const actionLink = data?.properties?.action_link;
    if (!actionLink) throw new Error("no action link");

    // If ?redirect_now=1, 302 to the magic link so the agent lands logged in.
    if (url.searchParams.get("redirect_now") === "1") {
      return new Response(null, {
        status: 302,
        headers: { ...corsHeaders, Location: actionLink },
      });
    }

    return new Response(JSON.stringify({ action_link: actionLink }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("agent-login error", e);
    return new Response(JSON.stringify({ error: String(e?.message ?? e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
