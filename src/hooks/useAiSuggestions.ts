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

// Types for proximity suggestions
export interface ProximityClient {
  nome: string;
  morada: string;
}

export interface ProximitySuggestion {
  clients: ProximityClient[];
  zona: string;
  sugestao: string;
  priority: 'high' | 'medium';
}

// Types for distance alerts
export interface DistanceAlertAppointment {
  time: string;
  client: string;
  zona: string;
}

export interface DistanceAlert {
  date: string;
  formattedDate: string;
  appointments: DistanceAlertAppointment[];
  message: string;
  severity: 'high' | 'medium';
}

export interface ProximitySuggestionsResponse {
  suggestions: ProximitySuggestion[];
  distanceAlerts: DistanceAlert[];
  generatedAt: string;
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
    // Return empty data instead of throwing when not authenticated
    return {
      conflicts: [],
      inactiveClients: [],
      weeklySummary: { breakdown: [], total: { agendamentos: 0, horas: 0, receita: 0, concluidos: 0 } },
      lastWeekSummary: { agendamentos: 0, horas: 0, receita: 0 },
      revenueForecast: {
        mesAtual: '',
        receitaConfirmada: 0,
        receitaPendente: 0,
        previsaoTotal: 0,
        mesAnterior: 0,
        comparacao: null,
        diasRestantes: 0,
        horasTrabalhadas: 0,
        horasPendentes: 0,
      },
      generatedAt: new Date().toISOString(),
    };
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
    // Handle 401 gracefully - user session expired
    if (response.status === 401) {
      console.warn('Session expired, returning empty insights');
      return {
        conflicts: [],
        inactiveClients: [],
        weeklySummary: { breakdown: [], total: { agendamentos: 0, horas: 0, receita: 0, concluidos: 0 } },
        lastWeekSummary: { agendamentos: 0, horas: 0, receita: 0 },
        revenueForecast: {
          mesAtual: '',
          receitaConfirmada: 0,
          receitaPendente: 0,
          previsaoTotal: 0,
          mesAnterior: 0,
          comparacao: null,
          diasRestantes: 0,
          horasTrabalhadas: 0,
          horasPendentes: 0,
        },
        generatedAt: new Date().toISOString(),
      };
    }
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

// Proximity suggestions hook
const fetchProximitySuggestions = async (): Promise<ProximitySuggestionsResponse> => {
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session?.access_token) {
    return {
      suggestions: [],
      distanceAlerts: [],
      generatedAt: new Date().toISOString(),
    };
  }

  const response = await fetch(
    `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-assistant`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({ mode: 'proximity_suggestions' }),
    }
  );

  if (!response.ok) {
    if (response.status === 401) {
      console.warn('Session expired, returning empty suggestions');
      return {
        suggestions: [],
        distanceAlerts: [],
        generatedAt: new Date().toISOString(),
      };
    }
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || 'Erro ao obter sugestões de proximidade');
  }

  const data = await response.json();
  
  if (data.error) {
    throw new Error(data.error);
  }

  return data;
};

export function useProximitySuggestions() {
  return useQuery({
    queryKey: ['proximity-suggestions'],
    queryFn: fetchProximitySuggestions,
    staleTime: 1000 * 60 * 30, // 30 minutes
    gcTime: 1000 * 60 * 60, // 1 hour
    retry: 1,
    refetchOnWindowFocus: false,
  });
}
