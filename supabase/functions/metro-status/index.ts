const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const GRAPHQL_URL = "https://api.proximometro.pt/graphql";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const action = url.searchParams.get("action") || "status";

    if (action === "status") {
      const res = await fetch("https://app.metrolisboa.pt/status/getLinhas.php");
      const data = await res.text();
      return new Response(data, {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "stations") {
      const res = await fetch(GRAPHQL_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: "{ stations { id name lat lon lines } }",
        }),
      });
      const json = await res.json();
      return new Response(JSON.stringify(json.data?.stations || []), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "wait") {
      const stationId = url.searchParams.get("station_id");
      if (!stationId) {
        return new Response(JSON.stringify({ error: "station_id required" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const res = await fetch(GRAPHQL_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: `{ station(id: "${stationId}") { id name waitTimes { destination { id name } time live ut } } }`,
        }),
      });
      const json = await res.json();
      return new Response(JSON.stringify(json.data?.station || null), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Invalid action" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({ error: "Failed to fetch metro data" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
