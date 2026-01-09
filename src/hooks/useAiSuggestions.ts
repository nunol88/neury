import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

// Types for conflicts
export interface ConflictAgendamento {
  id?: string;
  cliente: string;
  data: string;
  horaInicio: string;
  horaFim: string;
}

export interface Conflict {
  type: 'overlap' | 'tight_schedule';
  agendamento1: ConflictAgendamento;
  agendamento2: ConflictAgendamento;
  severity: 'high' | 'medium';
  gapMinutes?: number;
}

// Types for last week comparison
export interface LastWeekSummary {
  agendamentos: number;
  horas: number;
  receita: number;
}

// Types for inactive clients
export interface InactiveClient {
  id?: string;
  nome: string;
  telefone: string | null;
  ultimoAgendamento: string;
  diasSemAgendar: number;
  priority: 'high' | 'medium';
}

// Types for weekly summary
export interface WeekDayBreakdown {
  dia: string;
  data: string;
  agendamentos: number;
  horas: number;
  receita: number;
  isPast: boolean;
}

export interface WeeklyTotal {
  agendamentos: number;
  horas: number;
  receita: number;
  concluidos: number;
}

export interface WeeklySummary {
  breakdown: WeekDayBreakdown[];
  total: WeeklyTotal;
}

// Types for revenue forecast
export interface RevenueForecast {
  mesAtual: string;
  receitaConfirmada: number;
  receitaPendente: number;
  previsaoTotal: number;
  mesAnterior: number;
  comparacao: number | null;
  diasRestantes: number;
  horasTrabalhadas: number;
  horasPendentes: number;
}

// Combined insights response
export interface SmartInsights {
  conflicts: Conflict[];
  inactiveClients: InactiveClient[];
  weeklySummary: WeeklySummary;
  lastWeekSummary?: LastWeekSummary;
  revenueForecast: RevenueForecast;
  generatedAt: string;
}

const fetchSmartInsights = async (): Promise<SmartInsights> => {
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session?.access_token) {
    throw new Error('Não autenticado');
  }

  const response = await fetch(
    `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-assistant`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({ mode: 'smart_insights' }),
    }
  );

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || 'Erro ao obter insights');
  }

  const data = await response.json();
  
  if (data.error) {
    throw new Error(data.error);
  }

  return data;
};

export function useSmartInsights() {
  return useQuery({
    queryKey: ['smart-insights'],
    queryFn: fetchSmartInsights,
    staleTime: 1000 * 60 * 15, // 15 minutes
    gcTime: 1000 * 60 * 30, // 30 minutes
    retry: 1,
    refetchOnWindowFocus: false,
  });
}

// Legacy hook for backwards compatibility
export interface AiSuggestion {
  type: 'missing_booking';
  clientName: string;
  suggestedDate: string;
  suggestedTime: string;
  confidence: number;
  reason: string;
}

export function useAiSuggestions() {
  return useQuery({
    queryKey: ['ai-suggestions'],
    queryFn: async (): Promise<AiSuggestion[]> => [],
    staleTime: 1000 * 60 * 60,
    gcTime: 1000 * 60 * 60 * 2,
    retry: 1,
    refetchOnWindowFocus: false,
  });
}
