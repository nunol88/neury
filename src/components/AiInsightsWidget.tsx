import React from 'react';
import { useAiSuggestions, AiSuggestion } from '@/hooks/useAiSuggestions';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Sparkles, 
  Calendar, 
  Clock, 
  User, 
  AlertCircle, 
  RefreshCw,
  Lightbulb,
  TrendingUp
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { pt } from 'date-fns/locale';

interface SuggestionCardProps {
  suggestion: AiSuggestion;
  onSchedule: (suggestion: AiSuggestion) => void;
}

const SuggestionCard: React.FC<SuggestionCardProps> = ({ suggestion, onSchedule }) => {
  const formattedDate = format(parseISO(suggestion.suggestedDate), "EEEE, d 'de' MMMM", { locale: pt });
  const confidencePercent = Math.round(suggestion.confidence * 100);
  
  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'bg-emerald-500/20 text-emerald-600 border-emerald-500/30';
    if (confidence >= 0.6) return 'bg-amber-500/20 text-amber-600 border-amber-500/30';
    return 'bg-gray-500/20 text-gray-600 border-gray-500/30';
  };

  return (
    <div className="group relative p-4 rounded-xl border border-indigo-200/50 dark:border-indigo-500/20 bg-gradient-to-br from-indigo-50/50 to-violet-50/50 dark:from-indigo-950/30 dark:to-violet-950/30 hover:shadow-lg hover:shadow-indigo-500/10 transition-all duration-300">
      {/* Confidence badge */}
      <Badge 
        variant="outline" 
        className={`absolute top-3 right-3 text-xs ${getConfidenceColor(suggestion.confidence)}`}
      >
        {confidencePercent}% certeza
      </Badge>

      {/* Client name */}
      <div className="flex items-center gap-2 mb-3">
        <div className="p-1.5 rounded-lg bg-indigo-500/10">
          <User size={14} className="text-indigo-600 dark:text-indigo-400" />
        </div>
        <span className="font-semibold text-foreground">{suggestion.clientName}</span>
      </div>

      {/* Date and time */}
      <div className="flex flex-wrap gap-3 mb-3 text-sm text-muted-foreground">
        <div className="flex items-center gap-1.5">
          <Calendar size={14} className="text-violet-500" />
          <span className="capitalize">{formattedDate}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Clock size={14} className="text-violet-500" />
          <span>{suggestion.suggestedTime}</span>
        </div>
      </div>

      {/* Reason */}
      <p className="text-sm text-muted-foreground mb-4 italic">
        "{suggestion.reason}"
      </p>

      {/* Action button */}
      <Button 
        size="sm" 
        onClick={() => onSchedule(suggestion)}
        className="w-full bg-gradient-to-r from-indigo-500 to-violet-500 hover:from-indigo-600 hover:to-violet-600 text-white shadow-md hover:shadow-lg transition-all"
      >
        <Calendar size={14} className="mr-2" />
        Agendar
      </Button>
    </div>
  );
};

export const AiInsightsWidget: React.FC = () => {
  const { data: suggestions, isLoading, error, refetch, isFetching } = useAiSuggestions();

  const handleSchedule = (suggestion: AiSuggestion) => {
    console.log('Agendar sugestão:', {
      clientName: suggestion.clientName,
      date: suggestion.suggestedDate,
      time: suggestion.suggestedTime,
      reason: suggestion.reason,
    });
    // TODO: Futuramente vai abrir o modal de agendamento
  };

  // Loading state
  if (isLoading) {
    return (
      <Card className="border-indigo-200/50 dark:border-indigo-500/20 bg-gradient-to-br from-indigo-50/30 to-violet-50/30 dark:from-indigo-950/20 dark:to-violet-950/20">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Sparkles className="text-indigo-500" size={20} />
            <span className="bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">
              IA Proativa
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  // Error state
  if (error) {
    return (
      <Card className="border-red-200/50 dark:border-red-500/20 bg-gradient-to-br from-red-50/30 to-orange-50/30 dark:from-red-950/20 dark:to-orange-950/20">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <AlertCircle className="text-red-500" size={20} />
            <span className="text-red-600 dark:text-red-400">Erro na IA Proativa</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-3">
            {error instanceof Error ? error.message : 'Erro ao carregar sugestões'}
          </p>
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            <RefreshCw size={14} className="mr-2" />
            Tentar novamente
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Empty state
  if (!suggestions || suggestions.length === 0) {
    return (
      <Card className="border-indigo-200/50 dark:border-indigo-500/20 bg-gradient-to-br from-indigo-50/30 to-violet-50/30 dark:from-indigo-950/20 dark:to-violet-950/20">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Sparkles className="text-indigo-500" size={20} />
              <span className="bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">
                IA Proativa
              </span>
            </CardTitle>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => refetch()}
              disabled={isFetching}
              className="h-8 w-8"
            >
              <RefreshCw size={14} className={isFetching ? 'animate-spin' : ''} />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-6 text-center">
            <div className="p-3 rounded-full bg-emerald-500/10 mb-3">
              <TrendingUp size={24} className="text-emerald-500" />
            </div>
            <p className="font-medium text-foreground mb-1">Tudo em dia!</p>
            <p className="text-sm text-muted-foreground">
              Todos os clientes regulares têm agendamentos nos próximos 7 dias.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Success state with suggestions
  return (
    <Card className="border-indigo-200/50 dark:border-indigo-500/20 bg-gradient-to-br from-indigo-50/30 to-violet-50/30 dark:from-indigo-950/20 dark:to-violet-950/20 shadow-lg shadow-indigo-500/5">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Sparkles className="text-indigo-500" size={20} />
            <span className="bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">
              IA Proativa
            </span>
            <Badge variant="secondary" className="ml-2 bg-indigo-500/10 text-indigo-600 border-indigo-500/20">
              {suggestions.length} {suggestions.length === 1 ? 'sugestão' : 'sugestões'}
            </Badge>
          </CardTitle>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => refetch()}
            disabled={isFetching}
            className="h-8 w-8"
          >
            <RefreshCw size={14} className={isFetching ? 'animate-spin' : ''} />
          </Button>
        </div>
        <p className="text-sm text-muted-foreground flex items-center gap-1.5 mt-1">
          <Lightbulb size={14} className="text-amber-500" />
          Clientes regulares que podem precisar de agendamento
        </p>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {suggestions.map((suggestion, index) => (
            <SuggestionCard 
              key={`${suggestion.clientName}-${suggestion.suggestedDate}-${index}`}
              suggestion={suggestion}
              onSchedule={handleSchedule}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
