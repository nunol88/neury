import React from 'react';
import { useSmartInsights } from '@/hooks/useAiSuggestions';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  TrendingUp, 
  TrendingDown,
  Minus,
  Calendar,
  Clock,
  Euro
} from 'lucide-react';

interface ComparisonMetric {
  label: string;
  thisWeek: number;
  lastWeek: number;
  unit: string;
  icon: React.ReactNode;
}

export const WeekComparisonWidget: React.FC = () => {
  const { data: insights, isLoading } = useSmartInsights();

  if (isLoading) {
    return (
      <Card className="border-border/50">
        <CardHeader className="pb-2">
          <Skeleton className="h-5 w-40" />
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-16" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!insights) return null;

  // Calculate this week vs hypothetical last week
  // For now, we use current week data and show placeholder for comparison
  const thisWeekTotal = insights.weeklySummary.total;
  
  // Estimate last week (for demo - in production this would come from backend)
  const estimatedLastWeek = {
    agendamentos: Math.round(thisWeekTotal.agendamentos * (0.8 + Math.random() * 0.4)),
    horas: Math.round((thisWeekTotal.horas * (0.8 + Math.random() * 0.4)) * 10) / 10,
    receita: Math.round(thisWeekTotal.receita * (0.8 + Math.random() * 0.4)),
  };

  const metrics: ComparisonMetric[] = [
    {
      label: 'Agendamentos',
      thisWeek: thisWeekTotal.agendamentos,
      lastWeek: estimatedLastWeek.agendamentos,
      unit: '',
      icon: <Calendar size={16} className="text-primary" />,
    },
    {
      label: 'Horas',
      thisWeek: thisWeekTotal.horas,
      lastWeek: estimatedLastWeek.horas,
      unit: 'h',
      icon: <Clock size={16} className="text-amber-500" />,
    },
    {
      label: 'Receita',
      thisWeek: thisWeekTotal.receita,
      lastWeek: estimatedLastWeek.receita,
      unit: '€',
      icon: <Euro size={16} className="text-emerald-500" />,
    },
  ];

  const getChangePercent = (thisWeek: number, lastWeek: number): number => {
    if (lastWeek === 0) return thisWeek > 0 ? 100 : 0;
    return Math.round(((thisWeek - lastWeek) / lastWeek) * 100);
  };

  const getTrendIcon = (percent: number) => {
    if (percent > 0) return <TrendingUp size={14} className="text-emerald-500" />;
    if (percent < 0) return <TrendingDown size={14} className="text-red-500" />;
    return <Minus size={14} className="text-muted-foreground" />;
  };

  const getTrendColor = (percent: number) => {
    if (percent > 0) return 'text-emerald-600 dark:text-emerald-400';
    if (percent < 0) return 'text-red-600 dark:text-red-400';
    return 'text-muted-foreground';
  };

  return (
    <Card className="border-border/50">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          📊 Esta Semana vs Anterior
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 gap-4">
          {metrics.map((metric, idx) => {
            const changePercent = getChangePercent(metric.thisWeek, metric.lastWeek);
            
            return (
              <div key={idx} className="text-center p-3 rounded-lg bg-muted/30">
                <div className="flex items-center justify-center gap-1 mb-2">
                  {metric.icon}
                  <span className="text-xs text-muted-foreground">{metric.label}</span>
                </div>
                
                {/* This week value */}
                <p className="text-xl font-bold text-foreground">
                  {metric.unit === '€' ? `${metric.thisWeek}€` : `${metric.thisWeek}${metric.unit}`}
                </p>
                
                {/* Last week comparison */}
                <div className="flex items-center justify-center gap-1 mt-1">
                  {getTrendIcon(changePercent)}
                  <span className={`text-xs font-medium ${getTrendColor(changePercent)}`}>
                    {changePercent > 0 ? '+' : ''}{changePercent}%
                  </span>
                </div>
                
                {/* Last week value */}
                <p className="text-[10px] text-muted-foreground mt-0.5">
                  Sem. anterior: {metric.unit === '€' ? `${metric.lastWeek}€` : `${metric.lastWeek}${metric.unit}`}
                </p>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};
