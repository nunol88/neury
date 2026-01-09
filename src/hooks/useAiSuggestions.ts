import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface AiSuggestion {
  type: 'missing_booking';
  clientName: string;
  suggestedDate: string;
  suggestedTime: string;
  confidence: number;
  reason: string;
}

interface ProactiveAnalysisResponse {
  suggestions: AiSuggestion[];
  error?: string;
}

const fetchAiSuggestions = async (): Promise<AiSuggestion[]> => {
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
      body: JSON.stringify({ mode: 'proactive_analysis' }),
    }
  );

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || 'Erro ao obter sugestões');
  }

  const data: ProactiveAnalysisResponse = await response.json();
  
  if (data.error) {
    throw new Error(data.error);
  }

  return data.suggestions || [];
};

export function useAiSuggestions() {
  return useQuery({
    queryKey: ['ai-suggestions'],
    queryFn: fetchAiSuggestions,
    staleTime: 1000 * 60 * 60, // 1 hour
    gcTime: 1000 * 60 * 60 * 2, // 2 hours
    retry: 1,
    refetchOnWindowFocus: false,
  });
}
