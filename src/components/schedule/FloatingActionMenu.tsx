import React, { useState } from 'react';
import { Plus, Calendar, CalendarRange, Repeat, X, CalendarDays, CalendarCheck, Copy, Loader2, Undo2, Trash2 } from 'lucide-react';
import { useSidebar } from '@/components/ui/sidebar';
import { useIsMobile } from '@/hooks/use-mobile';

interface FloatingActionMenuProps {
  themeGradient: string;
  isAdmin: boolean;
  showGoToToday: boolean;
  canCopyFromPrevious: boolean;
  copyingFromPrevious: boolean;
  previousMonthLabel: string | null;
  canUndo: boolean;
  undoMessage: string | null;
  undoSaving: boolean;
  currentMonthLabel: string;
  hasTasksInMonth: boolean;
  onSelectSingle: () => void;
  onSelectFixed: () => void;
  onSelectBiWeekly: () => void;
  onOpenCalendar: () => void;
  onGoToToday: () => void;
  onCopyFromPrevious: () => void;
  onUndo: () => void;
  onDeleteMonth: () => void;
}

const FloatingActionMenu: React.FC<FloatingActionMenuProps> = ({
  themeGradient,
  isAdmin,
  showGoToToday,
  canCopyFromPrevious,
  copyingFromPrevious,
  previousMonthLabel,
  canUndo,
  undoMessage,
  undoSaving,
  currentMonthLabel,
  hasTasksInMonth,
  onSelectSingle,
  onSelectFixed,
  onSelectBiWeekly,
  onOpenCalendar,
  onGoToToday,
  onCopyFromPrevious,
  onUndo,
  onDeleteMonth,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const { open: sidebarOpen } = useSidebar();
  const isMobile = useIsMobile();
  
  // Calculate left offset based on sidebar state
  const leftOffset = !isMobile && sidebarOpen ? 'left-[calc(16rem+1.5rem)]' : 'left-6';

  const handleMainClick = () => {
    setIsExpanded(!isExpanded);
  };

  const handleOptionClick = (callback: () => void) => {
    setIsExpanded(false);
    callback();
  };

  return (
    <div className={`fixed bottom-6 ${leftOffset} z-50 flex flex-col items-start gap-3 print:hidden transition-all duration-300`}>
      {/* Backdrop when expanded */}
      {isExpanded && (
        <div 
          className="fixed inset-0 bg-black/10 backdrop-blur-[2px] -z-10 animate-fade-in"
          onClick={() => setIsExpanded(false)}
        />
      )}

      {/* Undo Button - Always visible when there's something to undo */}
      {canUndo && !isExpanded && (
        <button
          onClick={onUndo}
          disabled={undoSaving}
          className="flex items-center gap-2 bg-muted-foreground text-background px-4 py-2.5 rounded-full shadow-lg transition-all transform hover:scale-105 animate-fade-in disabled:opacity-50"
          title={undoMessage || 'Desfazer'}
        >
          {undoSaving ? (
            <Loader2 size={18} className="animate-spin" />
          ) : (
            <Undo2 size={18} />
          )}
          <span className="text-sm font-medium">Desfazer</span>
        </button>
      )}

      {/* Go to Today Button - Always above main button when visible */}
      {showGoToToday && !isExpanded && (
        <button
          onClick={onGoToToday}
          className={`w-12 h-12 rounded-full shadow-lg flex items-center justify-center transition-all transform hover:scale-110 bg-gradient-to-r ${themeGradient} text-white animate-fade-in`}
          title="Ir para Hoje"
        >
          <CalendarCheck size={22} />
        </button>
      )}

      {/* Expanded Options - Cascade upwards */}
      {isExpanded && (
        <div className="flex flex-col gap-2 animate-slide-up mb-2">
          {/* Calendar View */}
          <button
            onClick={() => handleOptionClick(onOpenCalendar)}
            className="group flex items-center gap-3 bg-card shadow-lg rounded-full pl-4 pr-5 py-3 transition-all hover:scale-105 hover:shadow-xl animate-fade-in"
            style={{ animationDelay: '100ms' }}
          >
            <div className="w-10 h-10 rounded-full bg-destructive/20 flex items-center justify-center">
              <CalendarDays size={20} className="text-destructive" />
            </div>
            <span className="text-sm font-medium text-card-foreground whitespace-nowrap">Ver Calendário</span>
          </button>

          {/* Admin-only options */}
          {isAdmin && (
            <>
              {/* Bi-Weekly */}
              <button
                onClick={() => handleOptionClick(onSelectBiWeekly)}
                className="group flex items-center gap-3 bg-card shadow-lg rounded-full pl-4 pr-5 py-3 transition-all hover:scale-105 hover:shadow-xl animate-fade-in"
                style={{ animationDelay: '75ms' }}
              >
                <div className="w-10 h-10 rounded-full bg-accent flex items-center justify-center">
                  <CalendarRange size={20} className="text-accent-foreground" />
                </div>
                <span className="text-sm font-medium text-card-foreground whitespace-nowrap">Quinzenal</span>
              </button>

              {/* Fixed */}
              <button
                onClick={() => handleOptionClick(onSelectFixed)}
                className="group flex items-center gap-3 bg-card shadow-lg rounded-full pl-4 pr-5 py-3 transition-all hover:scale-105 hover:shadow-xl animate-fade-in"
                style={{ animationDelay: '50ms' }}
              >
                <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center">
                  <Repeat size={20} className="text-secondary-foreground" />
                </div>
                <span className="text-sm font-medium text-card-foreground whitespace-nowrap">Fixo (semanal)</span>
              </button>

              {/* Single */}
              <button
                onClick={() => handleOptionClick(onSelectSingle)}
                className="group flex items-center gap-3 bg-card shadow-lg rounded-full pl-4 pr-5 py-3 transition-all hover:scale-105 hover:shadow-xl animate-fade-in"
              >
                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                  <Calendar size={20} className="text-primary" />
                </div>
                <span className="text-sm font-medium text-card-foreground whitespace-nowrap">Uma vez</span>
              </button>
            </>
          )}
        </div>
      )}

      {/* Main FAB Button */}
      <button
        onClick={handleMainClick}
        className={`w-14 h-14 rounded-full shadow-lg flex items-center justify-center transition-all duration-300 transform hover:scale-105 active:scale-95 bg-primary text-primary-foreground ${
          isExpanded ? 'rotate-45' : ''
        }`}
      >
        {isExpanded ? <X size={24} /> : <Plus size={28} />}
      </button>
    </div>
  );
};

export default FloatingActionMenu;
