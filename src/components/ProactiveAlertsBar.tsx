import React, { useState } from 'react';
import { useSmartInsights } from '@/hooks/useAiSuggestions';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  AlertTriangle, 
  UserX, 
  ChevronRight,
  Bell,
  X,
  Sparkles
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { pt } from 'date-fns/locale';

interface ProactiveAlertsBarProps {
  onViewAll: () => void;
}

export const ProactiveAlertsBar: React.FC<ProactiveAlertsBarProps> = ({ onViewAll }) => {
  const { data: insights, isLoading } = useSmartInsights();
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  if (isLoading) {
    return (
      <div className="bg-card border border-border rounded-xl p-3 mb-4 animate-pulse">
        <div className="flex items-center gap-3">
          <Skeleton className="h-5 w-5 rounded-full" />
          <Skeleton className="h-4 w-48" />
        </div>
      </div>
    );
  }

  if (!insights) return null;

  const conflictCount = insights.conflicts.length;
  const inactiveCount = insights.inactiveClients.length;
  const totalAlerts = conflictCount + inactiveCount;

  // No alerts
  if (totalAlerts === 0) {
    return (
      <div className="bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-xl p-3 mb-4">
        <div className="flex items-center gap-3">
          <div className="p-1.5 bg-emerald-100 dark:bg-emerald-900/50 rounded-full">
            <Sparkles size={16} className="text-emerald-600 dark:text-emerald-400" />
          </div>
          <span className="text-sm text-emerald-700 dark:text-emerald-300 font-medium">
            Tudo em ordem! Sem alertas pendentes.
          </span>
        </div>
      </div>
    );
  }

  // Get highest priority alert for display
  const highSeverityConflict = insights.conflicts.find(c => c.severity === 'high');
  const highPriorityInactive = insights.inactiveClients.find(c => c.priority === 'high');

  // Determine bar color based on severity
  const hasHighPriority = !!highSeverityConflict || !!highPriorityInactive;
  const barBg = hasHighPriority 
    ? 'bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800'
    : 'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800';
  const bellColor = hasHighPriority ? 'text-red-500' : 'text-amber-500';

  return (
    <div className={`${barBg} border rounded-xl p-3 mb-4 animate-fade-in`}>
      <div className="flex items-center justify-between gap-3">
        {/* Left: Alert icon + summary */}
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="relative">
            <Bell size={18} className={bellColor} />
            <span className={`absolute -top-1 -right-1 w-4 h-4 ${hasHighPriority ? 'bg-red-500' : 'bg-amber-500'} text-white text-[10px] font-bold rounded-full flex items-center justify-center`}>
              {totalAlerts}
            </span>
          </div>
          
          {/* Alert chips */}
          <div className="flex items-center gap-2 flex-wrap">
            {conflictCount > 0 && (
              <Badge 
                variant="outline" 
                className={`${highSeverityConflict ? 'border-red-300 bg-red-100 text-red-700 dark:border-red-700 dark:bg-red-900/50 dark:text-red-300' : 'border-amber-300 bg-amber-100 text-amber-700 dark:border-amber-700 dark:bg-amber-900/50 dark:text-amber-300'} gap-1`}
              >
                <AlertTriangle size={12} />
                {conflictCount} {conflictCount === 1 ? 'conflito' : 'conflitos'}
                {highSeverityConflict && (
                  <span className="text-[10px]">
                    ({format(parseISO(highSeverityConflict.agendamento1.data), 'EEE', { locale: pt })})
                  </span>
                )}
              </Badge>
            )}
            
            {inactiveCount > 0 && (
              <Badge 
                variant="outline" 
                className={`${highPriorityInactive ? 'border-red-300 bg-red-100 text-red-700 dark:border-red-700 dark:bg-red-900/50 dark:text-red-300' : 'border-amber-300 bg-amber-100 text-amber-700 dark:border-amber-700 dark:bg-amber-900/50 dark:text-amber-300'} gap-1`}
              >
                <UserX size={12} />
                {inactiveCount} {inactiveCount === 1 ? 'cliente inativo' : 'clientes inativos'}
              </Badge>
            )}
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={onViewAll}
            className="text-xs font-medium"
          >
            Ver tudo
            <ChevronRight size={14} className="ml-1" />
          </Button>
          <Button 
            variant="ghost" 
            size="icon"
            className="h-7 w-7"
            onClick={() => setDismissed(true)}
          >
            <X size={14} />
          </Button>
        </div>
      </div>
    </div>
  );
};
