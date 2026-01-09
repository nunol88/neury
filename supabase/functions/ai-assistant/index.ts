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

    // ============ SMART INSIGHTS MODE ============
    if (mode === "smart_insights") {
      console.log("Smart insights mode activated");
      
      const today = new Date();
      const todayStr = today.toISOString().split('T')[0];
      
      // Get start of current week (Monday)
      const startOfWeek = new Date(today);
      const dayOfWeek = today.getDay();
      const diff = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
      startOfWeek.setDate(today.getDate() - diff);
      startOfWeek.setHours(0, 0, 0, 0);
      
      // Get end of current week (Sunday)
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6);
      endOfWeek.setHours(23, 59, 59, 999);
      
      // Get last 60 days for inactive clients analysis
      const past60Days = new Date(today);
      past60Days.setDate(past60Days.getDate() - 60);
      
      // Get next 7 days for conflicts
      const next7Days = new Date(today);
      next7Days.setDate(next7Days.getDate() + 7);

      // Get start/end of current month
      const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
      
      // Get last month for comparison
      const startOfLastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      const endOfLastMonth = new Date(today.getFullYear(), today.getMonth(), 0);

      // Fetch all necessary data in parallel
      const [
        { data: allAgendamentos },
        { data: thisWeekAgendamentos },
        { data: thisMonthAgendamentos },
        { data: lastMonthAgendamentos },
        { data: upcomingAgendamentos },
        { data: clients }
      ] = await Promise.all([
        supabaseService.from("agendamentos").select("*").gte("data_inicio", past60Days.toISOString()),
        supabaseService.from("agendamentos").select("*").gte("data_inicio", startOfWeek.toISOString()).lte("data_inicio", endOfWeek.toISOString()),
        supabaseService.from("agendamentos").select("*").gte("data_inicio", startOfMonth.toISOString()).lte("data_inicio", endOfMonth.toISOString()),
        supabaseService.from("agendamentos").select("*").gte("data_inicio", startOfLastMonth.toISOString()).lte("data_inicio", endOfLastMonth.toISOString()),
        supabaseService.from("agendamentos").select("*").gte("data_inicio", todayStr).lte("data_inicio", next7Days.toISOString()).eq("status", "agendado"),
        supabaseService.from("clients").select("*")
      ]);

      // Helper function to parse price from description
      const getPrice = (agendamento: any): number => {
        try {
          if (agendamento.descricao) {
            const desc = JSON.parse(agendamento.descricao);
            return parseFloat(desc.price) || parseFloat(desc.preco) || 0;
          }
        } catch {}
        return 0;
      };

      // Helper function to get hours from agendamento
      const getHours = (agendamento: any): number => {
        const inicio = new Date(agendamento.data_inicio);
        const fim = new Date(agendamento.data_fim);
        return (fim.getTime() - inicio.getTime()) / (1000 * 60 * 60);
      };

      // ===== 1. CONFLICTS DETECTION =====
      const conflicts: any[] = [];
      const sortedUpcoming = [...(upcomingAgendamentos || [])].sort(
        (a, b) => new Date(a.data_inicio).getTime() - new Date(b.data_inicio).getTime()
      );
      
      for (let i = 0; i < sortedUpcoming.length - 1; i++) {
        const current = sortedUpcoming[i];
        const next = sortedUpcoming[i + 1];
        
        const currentEnd = new Date(current.data_fim);
        const nextStart = new Date(next.data_inicio);
        
        // Check for overlap
        if (currentEnd > nextStart) {
          conflicts.push({
            type: "overlap",
            agendamento1: {
              cliente: current.cliente_nome,
              data: current.data_inicio.split('T')[0],
              horaInicio: new Date(current.data_inicio).toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' }),
              horaFim: new Date(current.data_fim).toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' }),
            },
            agendamento2: {
              cliente: next.cliente_nome,
              data: next.data_inicio.split('T')[0],
              horaInicio: new Date(next.data_inicio).toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' }),
              horaFim: new Date(next.data_fim).toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' }),
            },
            severity: "high"
          });
        }
        // Check for too tight schedule (less than 30 min gap on same day)
        else if (
          current.data_inicio.split('T')[0] === next.data_inicio.split('T')[0] &&
          (nextStart.getTime() - currentEnd.getTime()) < 30 * 60 * 1000
        ) {
          conflicts.push({
            type: "tight_schedule",
            agendamento1: {
              cliente: current.cliente_nome,
              data: current.data_inicio.split('T')[0],
              horaInicio: new Date(current.data_inicio).toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' }),
              horaFim: new Date(current.data_fim).toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' }),
            },
            agendamento2: {
              cliente: next.cliente_nome,
              data: next.data_inicio.split('T')[0],
              horaInicio: new Date(next.data_inicio).toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' }),
              horaFim: new Date(next.data_fim).toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' }),
            },
            gapMinutes: Math.round((nextStart.getTime() - currentEnd.getTime()) / (1000 * 60)),
            severity: "medium"
          });
        }
      }

      // ===== 2. INACTIVE CLIENTS =====
      const clientLastBooking: Record<string, Date> = {};
      
      // Find last booking for each client
      (allAgendamentos || []).forEach(a => {
        const clientName = a.cliente_nome.toLowerCase().trim();
        const date = new Date(a.data_inicio);
        if (!clientLastBooking[clientName] || date > clientLastBooking[clientName]) {
          clientLastBooking[clientName] = date;
        }
      });

      // Get clients with future bookings
      const clientsWithFutureBookings = new Set(
        (upcomingAgendamentos || []).map(a => a.cliente_nome.toLowerCase().trim())
      );

      // Find inactive clients (no booking in last 21 days and no future booking)
      const inactiveClients: any[] = [];
      const inactiveThreshold = new Date(today);
      inactiveThreshold.setDate(inactiveThreshold.getDate() - 21);

      (clients || []).forEach(client => {
        const clientName = client.nome.toLowerCase().trim();
        const lastBooking = clientLastBooking[clientName];
        const hasFutureBooking = clientsWithFutureBookings.has(clientName);
        
        if (lastBooking && lastBooking < inactiveThreshold && !hasFutureBooking) {
          const daysSince = Math.floor((today.getTime() - lastBooking.getTime()) / (1000 * 60 * 60 * 24));
          inactiveClients.push({
            nome: client.nome,
            telefone: client.telefone,
            ultimoAgendamento: lastBooking.toISOString().split('T')[0],
            diasSemAgendar: daysSince,
            priority: daysSince > 30 ? "high" : "medium"
          });
        }
      });

      // Sort by days since last booking (descending)
      inactiveClients.sort((a, b) => b.diasSemAgendar - a.diasSemAgendar);

      // ===== 3. WEEKLY SUMMARY =====
      const weekDays = ['segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado', 'domingo'];
      const weekBreakdown = weekDays.map((day, idx) => {
        const dayDate = new Date(startOfWeek);
        dayDate.setDate(startOfWeek.getDate() + idx);
        const dayStr = dayDate.toISOString().split('T')[0];
        
        const dayAgendamentos = (thisWeekAgendamentos || []).filter(
          a => a.data_inicio.split('T')[0] === dayStr
        );
        
        const totalHours = dayAgendamentos.reduce((sum, a) => sum + getHours(a), 0);
        const totalRevenue = dayAgendamentos.reduce((sum, a) => sum + getPrice(a), 0);
        
        return {
          dia: day,
          data: dayStr,
          agendamentos: dayAgendamentos.length,
          horas: Math.round(totalHours * 10) / 10,
          receita: totalRevenue,
          isPast: dayDate < today
        };
      });

      const weekTotal = {
        agendamentos: (thisWeekAgendamentos || []).length,
        horas: Math.round(weekBreakdown.reduce((sum, d) => sum + d.horas, 0) * 10) / 10,
        receita: weekBreakdown.reduce((sum, d) => sum + d.receita, 0),
        concluidos: (thisWeekAgendamentos || []).filter(a => a.status === "concluido").length,
      };

      // ===== 4. REVENUE FORECAST =====
      // This month calculations
      const thisMonthConcluidos = (thisMonthAgendamentos || []).filter(a => a.status === "concluido");
      const thisMonthPendentes = (thisMonthAgendamentos || []).filter(a => a.status === "agendado");
      
      const receitaConfirmada = thisMonthConcluidos.reduce((sum, a) => sum + getPrice(a), 0);
      const receitaPendente = thisMonthPendentes.reduce((sum, a) => sum + getPrice(a), 0);
      
      // Last month calculations for comparison
      const lastMonthReceita = (lastMonthAgendamentos || [])
        .filter(a => a.status === "concluido")
        .reduce((sum, a) => sum + getPrice(a), 0);
      
      // Calculate days passed and remaining
      const diasPassados = today.getDate();
      const diasNoMes = endOfMonth.getDate();
      const diasRestantes = diasNoMes - diasPassados;
      
      // Average daily revenue this month
      const mediaDiaria = diasPassados > 0 ? receitaConfirmada / diasPassados : 0;
      
      // Projection: confirmed + pending + (average daily * remaining days without bookings)
      const diasComAgendamentos = new Set(
        thisMonthPendentes.map(a => a.data_inicio.split('T')[0])
      ).size;
      const diasSemAgendamentos = Math.max(0, diasRestantes - diasComAgendamentos);
      const projecaoExtrapolada = receitaConfirmada + receitaPendente + (mediaDiaria * diasSemAgendamentos * 0.5);

      const revenueForcast = {
        mesAtual: today.toLocaleDateString('pt-PT', { month: 'long', year: 'numeric' }),
        receitaConfirmada: Math.round(receitaConfirmada * 100) / 100,
        receitaPendente: Math.round(receitaPendente * 100) / 100,
        previsaoTotal: Math.round(projecaoExtrapolada * 100) / 100,
        mesAnterior: Math.round(lastMonthReceita * 100) / 100,
        comparacao: lastMonthReceita > 0 
          ? Math.round(((projecaoExtrapolada - lastMonthReceita) / lastMonthReceita) * 100) 
          : null,
        diasRestantes,
        horasTrabalhadas: Math.round(thisMonthConcluidos.reduce((sum, a) => sum + getHours(a), 0) * 10) / 10,
        horasPendentes: Math.round(thisMonthPendentes.reduce((sum, a) => sum + getHours(a), 0) * 10) / 10,
      };

      // Return all insights
      return new Response(
        JSON.stringify({
          conflicts,
          inactiveClients: inactiveClients.slice(0, 5), // Top 5
          weeklySummary: {
            breakdown: weekBreakdown,
            total: weekTotal
          },
          revenueForecast: revenueForcast,
          generatedAt: new Date().toISOString()
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ============ PROACTIVE ANALYSIS MODE (Legacy - kept for compatibility) ============
    if (mode === "proactive_analysis") {
      // Redirect to smart_insights for backwards compatibility
      console.log("Redirecting proactive_analysis to smart_insights");
      return new Response(
        JSON.stringify({ suggestions: [] }),
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
      JSON.stringify({ error: error instanceof Error ? error.message : "Erro interno do servidor" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
