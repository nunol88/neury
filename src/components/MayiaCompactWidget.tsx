import React, { useState } from 'react';
import { useSmartInsights, useProximitySuggestions } from '@/hooks/useAiSuggestions';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { 
  AlertTriangle, 
  UserX, 
  MapPin,
  Route,
  Sparkles,
  ChevronRight,
  Calendar,
  Clock,
  Euro
} from 'lucide-react';
import mayiaAvatar from '@/assets/mayia-avatar.png';
import { AiInsightsWidget } from './AiInsightsWidget';

export const MayiaCompactWidget: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { data: insights, isLoading: insightsLoading } = useSmartInsights();
  const { data: proximityData, isLoading: proximityLoading } = useProximitySuggestions();

  const isLoading = insightsLoading || proximityLoading;

  // Calculate total alerts/suggestions
  const conflictsCount = insights?.conflicts?.length ?? 0;
  const inactiveClientsCount = insights?.inactiveClients?.length ?? 0;
  const proximitySuggestionsCount = proximityData?.suggestions?.length ?? 0;
  const distanceAlertsCount = proximityData?.distanceAlerts?.length ?? 0;

  const totalAlerts = conflictsCount + inactiveClientsCount + distanceAlertsCount;
  const totalSuggestions = proximitySuggestionsCount;
  const hasNotifications = totalAlerts > 0 || totalSuggestions > 0;

  // Weekly summary data
  const weeklyTotal = insights?.weeklySummary?.total;
  const weeklyAgendamentos = weeklyTotal?.agendamentos ?? 0;
  const weeklyHoras = weeklyTotal?.horas ?? 0;
  const weeklyReceita = weeklyTotal?.receita ?? 0;

  if (isLoading) {
    return (
      <div className="flex items-center gap-3 p-4 rounded-xl bg-gradient-to-r from-primary/10 via-primary/5 to-accent/10 border border-primary/20">
        <Skeleton className="h-12 w-12 rounded-full" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-3 w-48" />
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Compact MayIA Widget */}
      <button
        onClick={() => setIsOpen(true)}
        className="w-full group relative overflow-hidden rounded-xl bg-gradient-to-r from-primary/10 via-primary/5 to-accent/10 p-4 border border-primary/20 hover:border-primary/40 hover:from-primary/15 hover:to-accent/15 transition-all duration-300 text-left"
      >
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 group-hover:bg-primary/15 transition-colors" />
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-accent/10 rounded-full blur-2xl translate-y-1/2 -translate-x-1/2" />
        
        <div className="relative flex items-center gap-4">
          {/* Avatar with notification indicator */}
          <div className="relative flex-shrink-0">
            <Avatar className="h-12 w-12 ring-2 ring-primary/30 shadow-glow-primary group-hover:ring-primary/50 transition-all">
              <AvatarImage src={mayiaAvatar} alt="MayIA" />
              <AvatarFallback className="bg-gradient-to-br from-primary to-primary/70 text-primary-foreground text-sm font-semibold">MI</AvatarFallback>
            </Avatar>
            {/* Online indicator */}
            <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-emerald-500 ring-2 ring-background animate-pulse" />
            {/* Notification badge */}
            {hasNotifications && (
              <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-red-500 ring-2 ring-background flex items-center justify-center text-[10px] font-bold text-white">
                {totalAlerts + totalSuggestions > 9 ? '9+' : totalAlerts + totalSuggestions}
              </span>
            )}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="text-lg font-bold text-gradient-primary">MayIA</h3>
              <Sparkles size={14} className="text-primary/60" />
            </div>
            
            {/* Weekly summary mini stats */}
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Calendar size={12} className="text-primary/70" />
                <span className="font-medium text-foreground">{weeklyAgendamentos}</span> esta semana
              </span>
              <span className="hidden sm:flex items-center gap-1">
                <Clock size={12} className="text-primary/70" />
                <span className="font-medium text-foreground">{weeklyHoras}h</span>
              </span>
              <span className="hidden md:flex items-center gap-1">
                <Euro size={12} className="text-emerald-500" />
                <span className="font-medium text-emerald-600 dark:text-emerald-400">{weeklyReceita}€</span>
              </span>
            </div>
          </div>

          {/* Alert badges */}
          <div className="hidden lg:flex items-center gap-2">
            {conflictsCount > 0 && (
              <Badge variant="destructive" className="text-xs gap-1">
                <AlertTriangle size={10} />
                {conflictsCount}
              </Badge>
            )}
            {distanceAlertsCount > 0 && (
              <Badge variant="secondary" className="text-xs gap-1 bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                <Route size={10} />
                {distanceAlertsCount}
              </Badge>
            )}
            {inactiveClientsCount > 0 && (
              <Badge variant="secondary" className="text-xs gap-1">
                <UserX size={10} />
                {inactiveClientsCount}
              </Badge>
            )}
            {proximitySuggestionsCount > 0 && (
              <Badge variant="secondary" className="text-xs gap-1 bg-primary/10 text-primary">
                <MapPin size={10} />
                {proximitySuggestionsCount}
              </Badge>
            )}
          </div>

          {/* Mobile notification indicator */}
          {hasNotifications && (
            <div className="lg:hidden flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
              <span className="text-xs text-muted-foreground">{totalAlerts + totalSuggestions}</span>
            </div>
          )}

          {/* Arrow */}
          <ChevronRight size={20} className="text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all flex-shrink-0" />
        </div>
      </button>

      {/* Full Modal with all AI insights */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-[95vw] w-full max-h-[90vh] overflow-hidden p-0 gap-0">
          <DialogHeader className="px-6 py-4 border-b bg-gradient-to-r from-primary/5 to-accent/5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10 ring-2 ring-primary/30">
                  <AvatarImage src={mayiaAvatar} alt="MayIA" />
                  <AvatarFallback className="bg-gradient-to-br from-primary to-primary/70 text-primary-foreground text-sm font-semibold">MI</AvatarFallback>
                </Avatar>
                <div>
                  <DialogTitle className="text-xl font-bold text-gradient-primary">MayIA - Assistente Inteligente</DialogTitle>
                  <p className="text-xs text-muted-foreground">Sugestões e alertas baseados em IA</p>
                </div>
              </div>
            </div>
          </DialogHeader>
          
          <div className="overflow-y-auto max-h-[calc(90vh-80px)] p-6">
            <AiInsightsWidget />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
