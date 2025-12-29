import React from 'react';
import { CalendarCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface GoToTodayButtonProps {
  onClick: () => void;
  isVisible: boolean;
}

const GoToTodayButton: React.FC<GoToTodayButtonProps> = ({ onClick, isVisible }) => {
  if (!isVisible) return null;

  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            onClick={onClick}
            size="icon"
            className="fixed bottom-20 right-4 z-40 h-12 w-12 rounded-full shadow-lg bg-primary hover:bg-primary/90 text-primary-foreground animate-fade-in hover:scale-110 transition-transform"
          >
            <CalendarCheck size={20} />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="left">
          <p>Ir para hoje</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default GoToTodayButton;
