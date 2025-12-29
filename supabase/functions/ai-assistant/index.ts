import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages } = await req.json();
    
    if (!messages || !Array.isArray(messages)) {
      throw new Error("Messages array is required");
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Get Supabase client to fetch data
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch appointments
    const { data: agendamentos, error: agendamentosError } = await supabase
      .from("agendamentos")
      .select("*")
      .order("data_inicio", { ascending: true });

    if (agendamentosError) {
      console.error("Error fetching agendamentos:", agendamentosError);
    }

    // Fetch clients
    const { data: clients, error: clientsError } = await supabase
      .from("clients")
      .select("*")
      .order("nome", { ascending: true });

    if (clientsError) {
      console.error("Error fetching clients:", clientsError);
    }

    // Build context for the AI
    const today = new Date();
    const dateStr = today.toLocaleDateString("pt-PT", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    // Format appointments for context
    const agendamentosContext = (agendamentos || []).map((a) => {
      const inicio = new Date(a.data_inicio);
      const fim = new Date(a.data_fim);
      
      // Parse descricao for price
      let preco = "N/A";
      try {
        if (a.descricao) {
          const desc = JSON.parse(a.descricao);
          preco = desc.preco || "N/A";
        }
      } catch {
        // Not JSON, ignore
      }

      return {
        data: inicio.toLocaleDateString("pt-PT"),
        cliente: a.cliente_nome,
        horario: `${inicio.toLocaleTimeString("pt-PT", { hour: "2-digit", minute: "2-digit" })} - ${fim.toLocaleTimeString("pt-PT", { hour: "2-digit", minute: "2-digit" })}`,
        status: a.status,
        preco: preco,
        contacto: a.cliente_contacto || "N/A",
      };
    });

    // Format clients for context
    const clientsContext = (clients || []).map((c) => ({
      nome: c.nome,
      telefone: c.telefone || "N/A",
      morada: c.morada || "N/A",
      preco_hora: c.preco_hora || "7",
      notas: c.notas || "",
    }));

    // Calculate some statistics
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();
    
    const thisMonthAgendamentos = (agendamentos || []).filter((a) => {
      const d = new Date(a.data_inicio);
      return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    });
    
    const concluidos = thisMonthAgendamentos.filter((a) => a.status === "concluido");
    let receitaMes = 0;
    concluidos.forEach((a) => {
      try {
        if (a.descricao) {
          const desc = JSON.parse(a.descricao);
          receitaMes += parseFloat(desc.preco) || 0;
        }
      } catch {
        // Ignore
      }
    });

    const systemPrompt = `És um assistente de gestão de agendamentos de limpeza. Respondes SEMPRE em português de Portugal.
Responde de forma concisa, amigável e útil. Usa emojis ocasionalmente para tornar a conversa mais agradável.

Data atual: ${dateStr}

📊 RESUMO DO MÊS ATUAL:
- Total de agendamentos este mês: ${thisMonthAgendamentos.length}
- Concluídos: ${concluidos.length}
- Receita do mês: ${receitaMes.toFixed(2)}€

📅 TODOS OS AGENDAMENTOS (${agendamentosContext.length} total):
${JSON.stringify(agendamentosContext, null, 2)}

👥 CLIENTES REGISTADOS (${clientsContext.length} total):
${JSON.stringify(clientsContext, null, 2)}

INSTRUÇÕES:
- Responde sempre em português de Portugal
- Quando perguntarem sobre dinheiro/receita, calcula a partir dos preços nos agendamentos concluídos
- Quando perguntarem sobre agendamentos futuros, considera a data atual
- Se não tiveres informação suficiente, indica isso educadamente
- Formata valores monetários com o símbolo €
- Usa formatação simples (sem markdown complexo)`;

    // Call Lovable AI Gateway
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Limite de pedidos excedido. Tenta novamente mais tarde." }),
          {
            status: 429,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Créditos insuficientes. Adiciona créditos ao workspace." }),
          {
            status: 402,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      return new Response(
        JSON.stringify({ error: "Erro ao comunicar com a IA" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Stream the response back
    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (error) {
    console.error("AI Assistant error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Erro desconhecido" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
