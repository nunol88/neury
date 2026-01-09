import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Sparkles, 
  RefreshCw,
  AlertCircle,
  MessageCircle
} from 'lucide-react';

interface AiSummaryResponse {
  summary: string;
  generatedAt: string;
}

const fetchAiSummary = async (): Promise<AiSummaryResponse> => {
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
      body: JSON.stringify({ mode: 'ai_summary' }),
    }
  );

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || 'Erro ao gerar resumo');
  }

  const data = await response.json();
  
  if (data.error) {
    throw new Error(data.error);
  }

  return data;
};

export const AiSummaryWidget: React.FC = () => {
  const { data, isLoading, error, refetch, isFetching } = useQuery({
    queryKey: ['ai-summary'],
    queryFn: fetchAiSummary,
    staleTime: 1000 * 60 * 60, // 1 hour cache
    gcTime: 1000 * 60 * 60 * 2, // 2 hours
    retry: 1,
    refetchOnWindowFocus: false,
  });

  if (isLoading) {
    return (
      <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
        <CardContent className="py-4">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-primary/10 rounded-full">
              <Sparkles size={18} className="text-primary animate-pulse" />
            </div>
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="border-red-200/50 dark:border-red-800/50">
        <CardContent className="py-4">
          <div className="flex items-center gap-3">
            <AlertCircle className="text-red-500" size={18} />
            <span className="text-sm text-muted-foreground flex-1">
              {error instanceof Error ? error.message : 'Erro ao carregar resumo'}
            </span>
            <Button variant="ghost" size="sm" onClick={() => refetch()}>
              <RefreshCw size={14} className="mr-1" />
              Tentar
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!data) return null;

  const timeSinceGeneration = () => {
    const generatedAt = new Date(data.generatedAt);
    const now = new Date();
    const diffMinutes = Math.floor((now.getTime() - generatedAt.getTime()) / (1000 * 60));
    
    if (diffMinutes < 1) return 'agora mesmo';
    if (diffMinutes < 60) return `há ${diffMinutes} min`;
    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `há ${diffHours}h`;
    return `há ${Math.floor(diffHours / 24)} dias`;
  };

  return (
    <Card className="border-primary/20 bg-gradient-to-br from-primary/5 via-transparent to-primary/5">
      <CardContent className="py-4">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-primary/10 rounded-full flex-shrink-0">
            <MessageCircle size={18} className="text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm text-foreground leading-relaxed">
              {data.summary}
            </p>
            <div className="flex items-center justify-between mt-3">
              <span className="text-[10px] text-muted-foreground">
                Atualizado {timeSinceGeneration()}
              </span>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => refetch()}
                disabled={isFetching}
                className="h-6 text-xs px-2"
              >
                <RefreshCw size={12} className={`mr-1 ${isFetching ? 'animate-spin' : ''}`} />
                Atualizar
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
