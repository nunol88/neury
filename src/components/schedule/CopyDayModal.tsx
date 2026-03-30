import React, { useState, useMemo } from 'react';
import { Task, AllTasks } from '@/hooks/useAgendamentos';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Copy, Clock, User, CalendarRange, MapPin, ChevronLeft, ChevronRight } from 'lucide-react';

interface CopyDayModalProps {
  open: boolean;
  onClose: () => void;
  targetDate: string;
  targetDayLabel: string;
  allTasks: AllTasks;
  monthsConfig: Record<string, { label: string; year: number; monthIndex: number }>;
  activeMonth: string;
  onCopyDay: (sourceTasks: Task[]) => void;
}

const DAY_COLORS = [
  { bg: 'bg-blue-500/10', border: 'border-blue-500/30', accent: 'text-blue-500', badge: 'bg-blue-500/15 text-blue-600', hover: 'hover:border-blue-500/50 hover:bg-blue-500/10 hover:shadow-blue-500/10' },
  { bg: 'bg-violet-500/10', border: 'border-violet-500/30', accent: 'text-violet-500', badge: 'bg-violet-500/15 text-violet-600', hover: 'hover:border-violet-500/50 hover:bg-violet-500/10 hover:shadow-violet-500/10' },
  { bg: 'bg-emerald-500/10', border: 'border-emerald-500/30', accent: 'text-emerald-500', badge: 'bg-emerald-500/15 text-emerald-600', hover: 'hover:border-emerald-500/50 hover:bg-emerald-500/10 hover:shadow-emerald-500/10' },
  { bg: 'bg-amber-500/10', border: 'border-amber-500/30', accent: 'text-amber-500', badge: 'bg-amber-500/15 text-amber-600', hover: 'hover:border-amber-500/50 hover:bg-amber-500/10 hover:shadow-amber-500/10' },
  { bg: 'bg-rose-500/10', border: 'border-rose-500/30', accent: 'text-rose-500', badge: 'bg-rose-500/15 text-rose-600', hover: 'hover:border-rose-500/50 hover:bg-rose-500/10 hover:shadow-rose-500/10' },
  { bg: 'bg-cyan-500/10', border: 'border-cyan-500/30', accent: 'text-cyan-500', badge: 'bg-cyan-500/15 text-cyan-600', hover: 'hover:border-cyan-500/50 hover:bg-cyan-500/10 hover:shadow-cyan-500/10' },
  { bg: 'bg-orange-500/10', border: 'border-orange-500/30', accent: 'text-orange-500', badge: 'bg-orange-500/15 text-orange-600', hover: 'hover:border-orange-500/50 hover:bg-orange-500/10 hover:shadow-orange-500/10' },
];

const CopyDayModal: React.FC<CopyDayModalProps> = ({
  open,
  onClose,
  targetDate,
  targetDayLabel,
  allTasks,
  monthsConfig,
  activeMonth,
  onCopyDay,
}) => {
  // Track which month the user is browsing in the modal
  const monthKeys = useMemo(() => Object.keys(monthsConfig), [monthsConfig]);
  const [browsingMonth, setBrowsingMonth] = useState(activeMonth);

  // Reset to active month when modal opens
  React.useEffect(() => {
    if (open) setBrowsingMonth(activeMonth);
  }, [open, activeMonth]);

  const browsingConfig = monthsConfig[browsingMonth];
  const browsingIndex = monthKeys.indexOf(browsingMonth);

  const canGoPrev = browsingIndex > 0;
  const canGoNext = browsingIndex < monthKeys.length - 1;

  // Get tasks for browsing month, exclude target date
  const tasks = (allTasks[browsingMonth as keyof AllTasks] || [])
    .filter(t => t.date !== targetDate);

  const tasksByDate = useMemo(() => {
    return tasks.reduce<Record<string, Task[]>>((acc, task) => {
      if (!acc[task.date]) acc[task.date] = [];
      acc[task.date].push(task);
      return acc;
    }, {});
  }, [tasks]);

  const sortedDates = useMemo(() => Object.keys(tasksByDate).sort(), [tasksByDate]);

  const formatDate = (dateStr: string) => {
    const [y, m, d] = dateStr.split('-').map(Number);
    const date = new Date(y, m - 1, d);
    const dayNames = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
    return { dayName: dayNames[date.getDay()], formatted: `${d}/${m}` };
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md max-h-[85vh] flex flex-col gap-0 p-0 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-primary/15 via-violet-500/10 to-blue-500/10 p-5 pb-3">
          <DialogHeader>
            <div className="flex items-center gap-3 mb-1">
              <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center animate-scale-in">
                <CalendarRange size={20} className="text-primary" />
              </div>
              <div>
                <DialogTitle className="text-base">Copiar agendamentos para</DialogTitle>
                <DialogDescription className="text-primary font-bold text-sm mt-0.5">
                  {targetDayLabel}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          {/* Month navigator */}
          <div className="flex items-center justify-between mt-3 bg-card/60 rounded-lg px-2 py-1.5 border border-border/50">
            <button
              onClick={() => canGoPrev && setBrowsingMonth(monthKeys[browsingIndex - 1])}
              disabled={!canGoPrev}
              className="p-1.5 rounded-md hover:bg-muted transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronLeft size={16} />
            </button>
            <span className="text-sm font-bold text-card-foreground capitalize">
              {browsingConfig?.label || browsingMonth}
            </span>
            <button
              onClick={() => canGoNext && setBrowsingMonth(monthKeys[browsingIndex + 1])}
              disabled={!canGoNext}
              className="p-1.5 rounded-md hover:bg-muted transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>

        {sortedDates.length === 0 ? (
          <div className="py-12 text-center text-muted-foreground text-sm italic px-6">
            Sem agendamentos em {browsingConfig?.label || browsingMonth}.
          </div>
        ) : (
          <ScrollArea className="flex-1 px-4 py-3">
            <div className="space-y-2.5 pb-2">
              {sortedDates.map((date, index) => {
                const dayTasks = tasksByDate[date].sort((a, b) => a.startTime.localeCompare(b.startTime));
                const { dayName, formatted } = formatDate(date);
                const color = DAY_COLORS[index % DAY_COLORS.length];
                const totalValue = dayTasks.reduce((sum, t) => sum + (parseFloat(t.price) || 0), 0);

                return (
                  <button
                    key={date}
                    onClick={() => onCopyDay(dayTasks)}
                    className={`w-full text-left p-3.5 rounded-xl border ${color.border} bg-card ${color.hover} hover:shadow-md transition-all duration-300 group animate-fade-in`}
                    style={{ animationDelay: `${index * 60}ms`, animationFillMode: 'backwards' }}
                  >
                    <div className="flex items-center justify-between mb-2.5">
                      <div className="flex items-center gap-2.5">
                        <div className={`w-8 h-8 rounded-lg ${color.bg} flex items-center justify-center transition-transform duration-300 group-hover:scale-110`}>
                          <span className={`text-xs font-bold ${color.accent}`}>{formatted.split('/')[0]}</span>
                        </div>
                        <div>
                          <span className="font-bold text-card-foreground capitalize text-sm">{dayName}</span>
                          <span className="text-muted-foreground text-xs ml-1.5">{formatted}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${color.badge}`}>
                          {dayTasks.length} {dayTasks.length === 1 ? 'serviço' : 'serviços'}
                        </span>
                        <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 group-hover:scale-110">
                          <Copy size={13} className="text-primary" />
                        </div>
                      </div>
                    </div>

                    <div className="space-y-1.5 ml-[42px]">
                      {dayTasks.map((task) => (
                        <div
                          key={task.id}
                          className={`flex items-center gap-2 text-xs rounded-lg px-2.5 py-1.5 ${color.bg} transition-all duration-200`}
                        >
                          <Clock size={11} className={`shrink-0 ${color.accent}`} />
                          <span className="font-mono font-medium text-card-foreground">{task.startTime}-{task.endTime}</span>
                          <span className="text-muted-foreground">•</span>
                          <User size={11} className="shrink-0 text-muted-foreground" />
                          <span className="truncate text-card-foreground font-medium">{task.client}</span>
                          {task.address && (
                            <MapPin size={10} className="shrink-0 text-muted-foreground ml-auto" />
                          )}
                        </div>
                      ))}
                    </div>

                    {totalValue > 0 && (
                      <div className="mt-2 ml-[42px] text-xs font-bold text-success">
                        €{totalValue.toFixed(0)} total
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </ScrollArea>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default CopyDayModal;
