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
    // Extract and validate Authorization header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      console.error("Missing or invalid Authorization header");
      return new Response(
        JSON.stringify({ error: "Autenticação necessária" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const token = authHeader.replace("Bearer ", "");
    
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Create client with user's token to verify authentication
    const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: { Authorization: authHeader },
      },
    });

    // Verify user authentication
    const { data: { user }, error: authError } = await supabaseAuth.auth.getUser(token);

    if (authError || !user) {
      console.error("Auth verification failed:", authError?.message);
      return new Response(
        JSON.stringify({ error: "Sessão inválida. Por favor, faça login novamente." }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check user role using service role client to bypass RLS
    const supabaseService = createClient(supabaseUrl, supabaseServiceKey);
    const { data: roleData, error: roleError } = await supabaseService
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .single();

    if (roleError || !roleData) {
      console.error("Role check failed:", roleError?.message);
      return new Response(
        JSON.stringify({ error: "Utilizador sem permissões atribuídas" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Allow both admin and neury roles to access the AI assistant
    if (roleData.role !== "admin" && roleData.role !== "neury") {
      console.error("Insufficient permissions for user:", user.id, "role:", roleData.role);
      return new Response(
        JSON.stringify({ error: "Acesso restrito" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const body = await req.json();
    const { messages, mode } = body;

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // ============ PROACTIVE ANALYSIS MODE ============
    if (mode === "proactive_analysis") {
      console.log("Proactive analysis mode activated");
      
      const today = new Date();
      const past45Days = new Date(today);
      past45Days.setDate(past45Days.getDate() - 45);
      
      const next7Days = new Date(today);
      next7Days.setDate(next7Days.getDate() + 7);

      // Fetch appointments from last 45 days
      const { data: historyAgendamentos, error: historyError } = await supabaseService
        .from("agendamentos")
        .select("*")
        .gte("data_inicio", past45Days.toISOString())
        .lte("data_inicio", today.toISOString())
        .order("data_inicio", { ascending: true });

      if (historyError) {
        console.error("Error fetching history:", historyError);
        throw new Error("Erro ao buscar histórico de agendamentos");
      }

      // Fetch appointments for next 7 days
      const { data: upcomingAgendamentos, error: upcomingError } = await supabaseService
        .from("agendamentos")
        .select("*")
        .gte("data_inicio", today.toISOString())
        .lte("data_inicio", next7Days.toISOString())
        .order("data_inicio", { ascending: true });

      if (upcomingError) {
        console.error("Error fetching upcoming:", upcomingError);
        throw new Error("Erro ao buscar agendamentos futuros");
      }

      console.log(`Found ${historyAgendamentos?.length || 0} history appointments and ${upcomingAgendamentos?.length || 0} upcoming`);

      // Format data for AI
      const historyData = (historyAgendamentos || []).map(a => ({
        cliente: a.cliente_nome,
        data: a.data_inicio.split('T')[0],
        diaSemana: new Date(a.data_inicio).toLocaleDateString('pt-PT', { weekday: 'long' }),
        hora: new Date(a.data_inicio).toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' }),
        status: a.status,
      }));

      const upcomingData = (upcomingAgendamentos || []).map(a => ({
        cliente: a.cliente_nome,
        data: a.data_inicio.split('T')[0],
        diaSemana: new Date(a.data_inicio).toLocaleDateString('pt-PT', { weekday: 'long' }),
        hora: new Date(a.data_inicio).toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' }),
      }));

      const proactiveSystemPrompt = `És um assistente inteligente de agendamento. Analisa o histórico JSON fornecido.
Identifica padrões de clientes (ex: Clientes que vêm todas as semanas no mesmo dia, como 'Casa Pablo' ou 'Evoé').
Verifica se esses clientes regulares TÊM agendamento na lista de 'próximos 7 dias'.
Se um cliente regular NÃO tiver agendamento futuro, gera um objeto de sugestão.

Data de hoje: ${today.toISOString().split('T')[0]}

HISTÓRICO DOS ÚLTIMOS 45 DIAS:
${JSON.stringify(historyData, null, 2)}

PRÓXIMOS 7 DIAS:
${JSON.stringify(upcomingData, null, 2)}

Retorna APENAS um array JSON válido (sem markdown, sem \`\`\`) neste formato:
[
  {
    "type": "missing_booking",
    "clientName": "Nome do Cliente",
    "suggestedDate": "YYYY-MM-DD",
    "suggestedTime": "HH:MM",
    "confidence": 0.9,
    "reason": "O cliente costuma agendar à segunda-feira."
  }
]

Se não houver sugestões, retorna um array vazio: []`;

      // Call AI for proactive analysis (non-streaming)
      const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [
            { role: "system", content: proactiveSystemPrompt },
            { role: "user", content: "Analisa os dados e gera sugestões de agendamentos em falta." },
          ],
          stream: false,
        }),
      });

      if (!aiResponse.ok) {
        if (aiResponse.status === 429) {
          return new Response(
            JSON.stringify({ error: "Limite de pedidos excedido. Tenta novamente mais tarde." }),
            { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        if (aiResponse.status === 402) {
          return new Response(
            JSON.stringify({ error: "Créditos insuficientes." }),
            { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        const errorText = await aiResponse.text();
        console.error("AI gateway error:", aiResponse.status, errorText);
        throw new Error("Erro ao comunicar com a IA");
      }

      const aiData = await aiResponse.json();
      const content = aiData.choices?.[0]?.message?.content || "[]";
      
      console.log("AI response content:", content);

      // Parse the JSON response
      let suggestions = [];
      try {
        // Remove any markdown code blocks if present
        const cleanContent = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        suggestions = JSON.parse(cleanContent);
      } catch (parseError) {
        console.error("Failed to parse AI response:", parseError, "Content:", content);
        suggestions = [];
      }

      return new Response(
        JSON.stringify({ suggestions }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ============ REGULAR CHAT MODE ============
    if (!messages || !Array.isArray(messages)) {
      throw new Error("Messages array is required");
    }

    // Now use service client to fetch data (user is verified as admin)
    // Fetch appointments
    const { data: agendamentos, error: agendamentosError } = await supabaseService
      .from("agendamentos")
      .select("*")
      .order("data_inicio", { ascending: true });

    if (agendamentosError) {
      console.error("Error fetching agendamentos:", agendamentosError);
    }

    // Fetch clients
    const { data: clients, error: clientsError } = await supabaseService
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
      
      // Parse descricao for price - the field can be "price" or "preco"
      let preco = "N/A";
      let morada = "N/A";
      let notas = "";
      try {
        if (a.descricao) {
          const desc = JSON.parse(a.descricao);
          preco = desc.price || desc.preco || "N/A";
          morada = desc.address || desc.morada || "N/A";
          notas = desc.notes || desc.notas || "";
        }
      } catch {
        // Not JSON, ignore
      }

      return {
        data: inicio.toLocaleDateString("pt-PT"),
        cliente: a.cliente_nome,
        horario: `${inicio.toLocaleTimeString("pt-PT", { hour: "2-digit", minute: "2-digit" })} - ${fim.toLocaleTimeString("pt-PT", { hour: "2-digit", minute: "2-digit" })}`,
        status: a.status,
        preco: preco + "€",
        morada: morada,
        notas: notas,
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
          // Check for "price" (English) or "preco" (Portuguese)
          receitaMes += parseFloat(desc.price) || parseFloat(desc.preco) || 0;
        }
      } catch {
        // Ignore
      }
    });

    // Calculate pending revenue
    const pendentes = thisMonthAgendamentos.filter((a) => a.status === "agendado");
    let receitaPendente = 0;
    pendentes.forEach((a) => {
      try {
        if (a.descricao) {
          const desc = JSON.parse(a.descricao);
          receitaPendente += parseFloat(desc.price) || parseFloat(desc.preco) || 0;
        }
      } catch {
        // Ignore
      }
    });

    // Get tomorrow's appointments
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];
    
    const tomorrowAgendamentos = (agendamentos || []).filter((a) => {
      const dataInicio = a.data_inicio.split('T')[0];
      return dataInicio === tomorrowStr;
    });

    const systemPrompt = `És a MayIA, uma assistente inteligente e versátil. Respondes SEMPRE em português de Portugal.
Responde de forma concisa, amigável e útil. Usa emojis ocasionalmente para tornar a conversa mais agradável.

🎯 QUEM ÉS:
Tu és a assistente pessoal da May, uma profissional de limpezas. Ajudas com:
1. Gestão de agendamentos e clientes (tens acesso aos dados reais abaixo)
2. Dicas de limpeza profissional e produtos recomendados
3. Escrever mensagens profissionais para clientes
4. Cálculos de orçamentos e preços
5. Conversas gerais e qualquer outra pergunta

Data atual: ${dateStr}

📊 RESUMO DO MÊS ATUAL (${today.toLocaleDateString("pt-PT", { month: "long", year: "numeric" })}):
- Total de agendamentos este mês: ${thisMonthAgendamentos.length}
- Concluídos: ${concluidos.length}
- Pendentes: ${pendentes.length}
- Receita já ganha (concluídos): ${receitaMes.toFixed(2)}€
- Receita pendente (por concluir): ${receitaPendente.toFixed(2)}€
- Receita total prevista: ${(receitaMes + receitaPendente).toFixed(2)}€

📅 AGENDAMENTOS DE AMANHÃ (${tomorrow.toLocaleDateString("pt-PT")}):
${tomorrowAgendamentos.length > 0 
  ? tomorrowAgendamentos.map((a) => {
      const inicio = new Date(a.data_inicio);
      const fim = new Date(a.data_fim);
      let preco = "N/A";
      try {
        if (a.descricao) {
          const desc = JSON.parse(a.descricao);
          preco = (desc.price || desc.preco || "N/A") + "€";
        }
      } catch {}
      return `- ${a.cliente_nome}: ${inicio.toLocaleTimeString("pt-PT", { hour: "2-digit", minute: "2-digit" })} - ${fim.toLocaleTimeString("pt-PT", { hour: "2-digit", minute: "2-digit" })} (${preco})`;
    }).join("\n")
  : "Sem agendamentos para amanhã."}

📋 TODOS OS AGENDAMENTOS (${agendamentosContext.length} total):
${JSON.stringify(agendamentosContext, null, 2)}

👥 CLIENTES REGISTADOS (${clientsContext.length} total):
${JSON.stringify(clientsContext, null, 2)}

🧹 CONHECIMENTOS DE LIMPEZA:
Tens conhecimento profissional sobre:
- Produtos de limpeza (multiusos, desengordurantes, limpa-vidros, etc.)
- Técnicas para diferentes superfícies (madeira, inox, vidro, cerâmica, mármore)
- Remoção de manchas difíceis
- Organização e gestão de tempo em limpezas
- Frequência recomendada para diferentes tipos de limpeza
- Dicas ecológicas e produtos naturais (vinagre, bicarbonato, limão)

✉️ ESCRITA DE MENSAGENS:
Podes ajudar a escrever mensagens profissionais para:
- Confirmar agendamentos
- Reagendar ou cancelar
- Lembrar clientes de limpezas
- Pedir feedback
- Comunicar alterações de preços
- Agradecer pela preferência

💰 CÁLCULOS DE PREÇOS:
- O preço médio por hora dos clientes registados é usado como referência
- Podes sugerir orçamentos baseados no tamanho da casa (T0, T1, T2, etc.)
- Considera tempo extra para limpezas mais profundas

INSTRUÇÕES:
- Responde sempre em português de Portugal
- Para perguntas sobre agendamentos/clientes/receitas, usa os dados reais acima
- Para dicas de limpeza, usa o teu conhecimento profissional
- Para escrever mensagens, sê profissional mas simpática
- Para outras perguntas (cultura geral, conversas, etc.), responde normalmente como uma IA inteligente
- Se não tiveres informação específica do negócio, indica isso educadamente
- Formata valores monetários com o símbolo €
- Usa formatação simples (sem markdown complexo)
- Sê proativa: se vires algo relevante nos dados, menciona!`;

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
