import React from 'react';
import { useSmartInsights, useProximitySuggestions, Conflict, InactiveClient, WeekDayBreakdown, ProximitySuggestion } from '@/hooks/useAiSuggestions';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { 
  AlertTriangle, 
  UserX, 
  Calendar,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  Phone,
  Clock,
  Euro,
  ChevronRight,
  Sparkles,
  AlertCircle,
  CheckCircle2,
  Minus,
  MapPin,
  Users
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { pt } from 'date-fns/locale';
import mayiaAvatar from '@/assets/mayia-avatar.png';

// Conflicts Section
const ConflictsSection: React.FC<{ conflicts: Conflict[] }> = ({ conflicts }) => {
  if (conflicts.length === 0) {
    return (
      <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
        <CheckCircle2 size={16} />
        <span className="text-sm">Sem conflitos nos próximos 7 dias</span>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {conflicts.map((conflict, idx) => (
        <div 
          key={idx}
          className={`p-3 rounded-lg border ${
            conflict.severity === 'high' 
              ? 'bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800' 
              : 'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800'
          }`}
        >
          <div className="flex items-start gap-2">
            <AlertTriangle 
              size={16} 
              className={conflict.severity === 'high' ? 'text-red-500 mt-0.5' : 'text-amber-500 mt-0.5'} 
            />
            <div className="flex-1 text-sm">
              <p className="font-medium text-foreground">
                {conflict.type === 'overlap' ? 'Sobreposição' : 'Horário apertado'}
              </p>
              <p className="text-muted-foreground">
                <span className="font-medium">{conflict.agendamento1.cliente}</span>
                {' '}({conflict.agendamento1.horaInicio}-{conflict.agendamento1.horaFim})
                {' '}↔{' '}
                <span className="font-medium">{conflict.agendamento2.cliente}</span>
                {' '}({conflict.agendamento2.horaInicio}-{conflict.agendamento2.horaFim})
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {format(parseISO(conflict.agendamento1.data), "EEEE, d 'de' MMM", { locale: pt })}
                {conflict.gapMinutes !== undefined && ` • Apenas ${conflict.gapMinutes} min entre serviços`}
              </p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

// Inactive Clients Section with Quick Actions
const InactiveClientsSection: React.FC<{ clients: InactiveClient[] }> = ({ clients }) => {
  if (clients.length === 0) {
    return (
      <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
        <CheckCircle2 size={16} />
        <span className="text-sm">Todos os clientes estão ativos</span>
      </div>
    );
  }

  const getWhatsAppLink = (phone: string, clientName: string) => {
    const cleanPhone = phone.replace(/\D/g, '');
    const fullPhone = cleanPhone.startsWith('351') ? cleanPhone : `351${cleanPhone}`;
    const message = encodeURIComponent(`Olá ${clientName}! 👋 Espero que esteja tudo bem. Queria saber se gostaria de agendar uma limpeza em breve. Obrigada!`);
    return `https://wa.me/${fullPhone}?text=${message}`;
  };

  return (
    <div className="space-y-2">
      {clients.map((client, idx) => (
        <div 
          key={idx}
          className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-full ${
              client.priority === 'high' 
                ? 'bg-red-100 dark:bg-red-900/30' 
                : 'bg-amber-100 dark:bg-amber-900/30'
            }`}>
              <UserX size={14} className={
                client.priority === 'high' ? 'text-red-600' : 'text-amber-600'
              } />
            </div>
            <div>
              <p className="font-medium text-sm">{client.nome}</p>
              <p className="text-xs text-muted-foreground">
                Há {client.diasSemAgendar} dias sem agendar
              </p>
            </div>
          </div>
          {client.telefone && (
            <Button 
              variant="outline" 
              size="sm" 
              className="h-7 text-xs gap-1 bg-emerald-50 hover:bg-emerald-100 border-emerald-200 text-emerald-700 dark:bg-emerald-950/30 dark:hover:bg-emerald-900/50 dark:border-emerald-800 dark:text-emerald-300"
              asChild
            >
              <a href={getWhatsAppLink(client.telefone, client.nome)} target="_blank" rel="noopener noreferrer">
                <Phone size={12} />
                WhatsApp
              </a>
            </Button>
          )}
        </div>
      ))}
    </div>
  );
};

// Weekly Summary Section
const WeeklySummarySection: React.FC<{ breakdown: WeekDayBreakdown[], total: { agendamentos: number; horas: number; receita: number; concluidos: number } }> = ({ breakdown, total }) => {
  const maxHours = Math.max(...breakdown.map(d => d.horas), 1);
  
  return (
    <div className="space-y-4">
      {/* Days grid */}
      <div className="grid grid-cols-7 gap-1">
        {breakdown.map((day, idx) => (
          <div 
            key={idx}
            className={`text-center p-2 rounded-lg transition-colors ${
              day.isPast 
                ? 'bg-muted/30' 
                : day.agendamentos > 0 
                  ? 'bg-primary/10 border border-primary/20' 
                  : 'bg-muted/50'
            }`}
          >
            <p className="text-[10px] uppercase text-muted-foreground font-medium">
              {day.dia.slice(0, 3)}
            </p>
            <p className={`text-lg font-bold ${day.agendamentos > 0 ? 'text-primary' : 'text-muted-foreground'}`}>
              {day.agendamentos}
            </p>
            {day.horas > 0 && (
              <p className="text-[10px] text-muted-foreground">{day.horas}h</p>
            )}
          </div>
        ))}
      </div>
      
      {/* Weekly totals */}
      <div className="grid grid-cols-3 gap-3">
        <div className="text-center p-3 rounded-lg bg-muted/50">
          <Calendar size={16} className="mx-auto mb-1 text-muted-foreground" />
          <p className="text-xl font-bold">{total.agendamentos}</p>
          <p className="text-xs text-muted-foreground">Agendamentos</p>
        </div>
        <div className="text-center p-3 rounded-lg bg-muted/50">
          <Clock size={16} className="mx-auto mb-1 text-muted-foreground" />
          <p className="text-xl font-bold">{total.horas}h</p>
          <p className="text-xs text-muted-foreground">Horas</p>
        </div>
        <div className="text-center p-3 rounded-lg bg-muted/50">
          <Euro size={16} className="mx-auto mb-1 text-muted-foreground" />
          <p className="text-xl font-bold">{total.receita}€</p>
          <p className="text-xs text-muted-foreground">Receita</p>
        </div>
      </div>
    </div>
  );
};

// Revenue Forecast Section
const RevenueForecastSection: React.FC<{ forecast: {
  mesAtual: string;
  receitaConfirmada: number;
  receitaPendente: number;
  previsaoTotal: number;
  mesAnterior: number;
  comparacao: number | null;
  diasRestantes: number;
  horasTrabalhadas: number;
  horasPendentes: number;
} }> = ({ forecast }) => {
  const progressPercent = forecast.previsaoTotal > 0 
    ? (forecast.receitaConfirmada / forecast.previsaoTotal) * 100 
    : 0;

  return (
    <div className="space-y-4">
      {/* Main forecast */}
      <div className="text-center">
        <p className="text-sm text-muted-foreground capitalize">{forecast.mesAtual}</p>
        <p className="text-3xl font-bold text-primary">{forecast.previsaoTotal.toFixed(0)}€</p>
        <p className="text-xs text-muted-foreground">Previsão total</p>
      </div>

      {/* Progress bar */}
      <div className="space-y-1">
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>Confirmado: {forecast.receitaConfirmada.toFixed(0)}€</span>
          <span>Pendente: {forecast.receitaPendente.toFixed(0)}€</span>
        </div>
        <Progress value={progressPercent} className="h-2" />
      </div>

      {/* Comparison with last month */}
      {forecast.mesAnterior > 0 && forecast.comparacao !== null && (
        <div className={`flex items-center justify-center gap-2 p-2 rounded-lg ${
          forecast.comparacao >= 0 
            ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600' 
            : 'bg-red-50 dark:bg-red-950/30 text-red-600'
        }`}>
          {forecast.comparacao >= 0 ? (
            <TrendingUp size={16} />
          ) : (
            <TrendingDown size={16} />
          )}
          <span className="text-sm font-medium">
            {forecast.comparacao >= 0 ? '+' : ''}{forecast.comparacao}% vs mês anterior
          </span>
        </div>
      )}

      {/* Hours breakdown */}
      <div className="grid grid-cols-2 gap-3 text-center">
        <div className="p-2 rounded-lg bg-muted/50">
          <p className="text-lg font-bold">{forecast.horasTrabalhadas}h</p>
          <p className="text-xs text-muted-foreground">Trabalhadas</p>
        </div>
        <div className="p-2 rounded-lg bg-muted/50">
          <p className="text-lg font-bold">{forecast.horasPendentes}h</p>
          <p className="text-xs text-muted-foreground">Agendadas</p>
        </div>
      </div>

      {forecast.diasRestantes > 0 && (
        <p className="text-center text-xs text-muted-foreground">
          {forecast.diasRestantes} dias restantes no mês
        </p>
      )}
    </div>
  );
};

// Proximity Suggestions Section
const ProximitySuggestionsSection: React.FC<{ 
  suggestions: ProximitySuggestion[];
  isLoading: boolean;
}> = ({ suggestions, isLoading }) => {
  if (isLoading) {
    return (
      <div className="space-y-2">
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-16 w-full" />
      </div>
    );
  }

  if (suggestions.length === 0) {
    return (
      <div className="flex items-center gap-2 text-muted-foreground">
        <MapPin size={16} />
        <span className="text-sm">Sem sugestões de agrupamento por proximidade</span>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {suggestions.map((suggestion, idx) => (
        <div 
          key={idx}
          className={`p-3 rounded-lg border ${
            suggestion.priority === 'high' 
              ? 'bg-primary/5 border-primary/20' 
              : 'bg-muted/50 border-border'
          }`}
        >
          <div className="flex items-start gap-2">
            <div className={`p-1.5 rounded-full ${
              suggestion.priority === 'high' 
                ? 'bg-primary/10' 
                : 'bg-muted'
            }`}>
              <MapPin size={14} className={
                suggestion.priority === 'high' ? 'text-primary' : 'text-muted-foreground'
              } />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant="secondary" className="text-xs">
                  {suggestion.zona}
                </Badge>
                {suggestion.priority === 'high' && (
                  <Badge className="text-xs bg-primary/10 text-primary hover:bg-primary/20">
                    Muito próximos
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-1 mt-2 text-sm font-medium">
                <Users size={12} className="text-muted-foreground" />
                <span className="text-foreground">
                  {suggestion.clients.map(c => c.nome).join(' + ')}
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {suggestion.sugestao}
              </p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

// Main Widget Component
export const AiInsightsWidget: React.FC = () => {
  const { data: insights, isLoading, error, refetch, isFetching } = useSmartInsights();
  const { data: proximityData, isLoading: proximityLoading, refetch: refetchProximity } = useProximitySuggestions();

  // Loading state
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="border-border/50">
            <CardHeader className="pb-2">
              <Skeleton className="h-5 w-32" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-24 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <Card className="border-red-200/50 dark:border-red-800/50 bg-red-50/50 dark:bg-red-950/20">
        <CardContent className="py-6">
          <div className="flex items-center gap-3">
            <AlertCircle className="text-red-500" size={20} />
            <div className="flex-1">
              <p className="font-medium text-red-600 dark:text-red-400">Erro ao carregar insights</p>
              <p className="text-sm text-muted-foreground">
                {error instanceof Error ? error.message : 'Erro desconhecido'}
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              <RefreshCw size={14} className="mr-2" />
              Tentar novamente
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!insights) return null;

  const hasConflicts = insights.conflicts.length > 0;
  const hasInactiveClients = insights.inactiveClients.length > 0;

  return (
    <div className="space-y-4">
      {/* Header with gradient background */}
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-primary/10 via-primary/5 to-accent/10 p-4 border border-primary/20">
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-accent/10 rounded-full blur-2xl translate-y-1/2 -translate-x-1/2" />
        
        <div className="relative flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <Avatar className="h-10 w-10 ring-2 ring-primary/30 shadow-glow-primary">
                <AvatarImage src={mayiaAvatar} alt="MayIA" />
                <AvatarFallback className="bg-gradient-to-br from-primary to-primary/70 text-primary-foreground text-sm font-semibold">MI</AvatarFallback>
              </Avatar>
              {/* Online indicator */}
              <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-emerald-500 ring-2 ring-background animate-pulse" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gradient-primary">MayIA</h2>
              <p className="text-xs text-muted-foreground">Assistente Inteligente</p>
            </div>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => {
              refetch();
              refetchProximity();
            }}
            disabled={isFetching || proximityLoading}
            className="bg-background/50 hover:bg-background/80 border-primary/20 hover:border-primary/40 transition-all"
          >
            <RefreshCw size={14} className={`mr-2 ${isFetching || proximityLoading ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
        </div>
      </div>

      {/* Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Conflicts Card */}
        <Card className={`border-border/50 ${hasConflicts ? 'ring-2 ring-red-500/20' : ''}`}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <AlertTriangle size={16} className={hasConflicts ? 'text-red-500' : 'text-muted-foreground'} />
              Conflitos
              {hasConflicts && (
                <Badge variant="destructive" className="ml-auto text-xs">
                  {insights.conflicts.length}
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ConflictsSection conflicts={insights.conflicts} />
          </CardContent>
        </Card>

        {/* Inactive Clients Card */}
        <Card className={`border-border/50 ${hasInactiveClients ? 'ring-2 ring-amber-500/20' : ''}`}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <UserX size={16} className={hasInactiveClients ? 'text-amber-500' : 'text-muted-foreground'} />
              Clientes Inativos
              {hasInactiveClients && (
                <Badge variant="secondary" className="ml-auto text-xs bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                  {insights.inactiveClients.length}
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <InactiveClientsSection clients={insights.inactiveClients} />
          </CardContent>
        </Card>

        {/* Weekly Summary Card */}
        <Card className="border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Calendar size={16} className="text-muted-foreground" />
              Esta Semana
            </CardTitle>
          </CardHeader>
          <CardContent>
            <WeeklySummarySection 
              breakdown={insights.weeklySummary.breakdown} 
              total={insights.weeklySummary.total}
            />
          </CardContent>
        </Card>

        {/* Proximity Suggestions Card */}
        <Card className={`border-border/50 ${(proximityData?.suggestions?.length ?? 0) > 0 ? 'ring-2 ring-primary/20' : ''}`}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <MapPin size={16} className={(proximityData?.suggestions?.length ?? 0) > 0 ? 'text-primary' : 'text-muted-foreground'} />
              Sugestões de Proximidade
              {(proximityData?.suggestions?.length ?? 0) > 0 && (
                <Badge variant="secondary" className="ml-auto text-xs bg-primary/10 text-primary">
                  {proximityData?.suggestions?.length}
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ProximitySuggestionsSection 
              suggestions={proximityData?.suggestions || []} 
              isLoading={proximityLoading}
            />
          </CardContent>
        </Card>

        {/* Revenue Forecast Card */}
        <Card className="border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingUp size={16} className="text-muted-foreground" />
              Previsão de Faturação
            </CardTitle>
          </CardHeader>
          <CardContent>
            <RevenueForecastSection forecast={insights.revenueForecast} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
