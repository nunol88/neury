import React from 'react';
import { Task } from '@/hooks/useAgendamentos';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Copy, Clock, User } from 'lucide-react';

interface CopyDayModalProps {
  open: boolean;
  onClose: () => void;
  targetDate: string;
  targetDayLabel: string;
  monthTasks: Task[];
  onCopyDay: (sourceTasks: Task[]) => void;
}

const CopyDayModal: React.FC<CopyDayModalProps> = ({
  open,
  onClose,
  targetDate,
  targetDayLabel,
  monthTasks,
  onCopyDay,
}) => {
  // Group tasks by date, excluding the target date
  const tasksByDate = monthTasks
    .filter(t => t.date !== targetDate)
    .reduce<Record<string, Task[]>>((acc, task) => {
      if (!acc[task.date]) acc[task.date] = [];
      acc[task.date].push(task);
      return acc;
    }, {});

  // Sort dates and format
  const sortedDates = Object.keys(tasksByDate).sort();

  const formatDate = (dateStr: string) => {
    const [y, m, d] = dateStr.split('-').map(Number);
    const date = new Date(y, m - 1, d);
    const dayNames = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
    return {
      dayName: dayNames[date.getDay()],
      formatted: `${d}/${m}`,
    };
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-lg">Copiar agendamentos para</DialogTitle>
          <DialogDescription className="text-primary font-semibold">
            {targetDayLabel}
          </DialogDescription>
        </DialogHeader>

        {sortedDates.length === 0 ? (
          <div className="py-8 text-center text-muted-foreground text-sm italic">
            Não há outros dias com agendamentos neste mês.
          </div>
        ) : (
          <ScrollArea className="flex-1 -mx-6 px-6">
            <div className="space-y-3 pb-2">
              {sortedDates.map((date) => {
                const tasks = tasksByDate[date].sort((a, b) => a.startTime.localeCompare(b.startTime));
                const { dayName, formatted } = formatDate(date);

                return (
                  <button
                    key={date}
                    onClick={() => onCopyDay(tasks)}
                    className="w-full text-left p-3 rounded-xl border border-border bg-card hover:bg-accent/50 hover:border-primary/30 transition-all duration-200 group"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <span className="font-bold text-card-foreground capitalize">{dayName}</span>
                        <span className="text-muted-foreground text-sm ml-2">{formatted}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                          {tasks.length} {tasks.length === 1 ? 'agendamento' : 'agendamentos'}
                        </span>
                        <Copy size={14} className="text-primary opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      {tasks.map((task) => (
                        <div key={task.id} className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Clock size={12} className="shrink-0" />
                          <span className="font-mono text-xs">{task.startTime}-{task.endTime}</span>
                          <User size={12} className="shrink-0" />
                          <span className="truncate">{task.client}</span>
                        </div>
                      ))}
                    </div>
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
