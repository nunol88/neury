import React, { useState } from 'react';
import { useSmartInsights, useProximitySuggestions } from '@/hooks/useAiSuggestions';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import mayiaAvatar from '@/assets/mayia-avatar.png';
import { AiInsightsWidget } from './AiInsightsWidget';

export const MayiaCompactWidget: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { data: insights, isLoading: insightsLoading } = useSmartInsights();
  const { data: proximityData, isLoading: proximityLoading } = useProximitySuggestions();

  const isLoading = insightsLoading || proximityLoading;

  // Calculate total notifications
  const conflictsCount = insights?.conflicts?.length ?? 0;
  const inactiveClientsCount = insights?.inactiveClients?.length ?? 0;
  const proximitySuggestionsCount = proximityData?.suggestions?.length ?? 0;
  const distanceAlertsCount = proximityData?.distanceAlerts?.length ?? 0;
  const totalNotifications = conflictsCount + inactiveClientsCount + proximitySuggestionsCount + distanceAlertsCount;

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 p-2">
        <Skeleton className="h-8 w-8 rounded-full" />
        <Skeleton className="h-4 w-16" />
      </div>
    );
  }

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 px-3 py-2 rounded-full bg-primary/10 hover:bg-primary/20 border border-primary/20 hover:border-primary/40 transition-all duration-200 group"
      >
        <div className="relative">
          <Avatar className="h-7 w-7">
            <AvatarImage src={mayiaAvatar} alt="MayIA" />
            <AvatarFallback className="bg-primary text-primary-foreground text-xs">MI</AvatarFallback>
          </Avatar>
          {totalNotifications > 0 && (
            <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-red-500 flex items-center justify-center text-[10px] font-bold text-white">
              {totalNotifications > 9 ? '9+' : totalNotifications}
            </span>
          )}
        </div>
        <span className="text-sm font-medium text-primary group-hover:text-primary/80">MayIA</span>
      </button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-[95vw] w-full max-h-[90vh] overflow-hidden p-0 gap-0">
          <DialogHeader className="px-6 py-4 border-b bg-gradient-to-r from-primary/5 to-accent/5">
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10 ring-2 ring-primary/30">
                <AvatarImage src={mayiaAvatar} alt="MayIA" />
                <AvatarFallback className="bg-primary text-primary-foreground">MI</AvatarFallback>
              </Avatar>
              <div>
                <DialogTitle className="text-xl font-bold text-gradient-primary">MayIA</DialogTitle>
                <p className="text-xs text-muted-foreground">Sugestões e alertas inteligentes</p>
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
