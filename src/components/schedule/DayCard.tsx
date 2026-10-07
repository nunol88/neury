import React, { useState, useRef } from 'react';
import { Task } from '@/hooks/useAgendamentos';
import { Extra } from '@/hooks/useExtras';
import TaskCard from './TaskCard';
import { AlertTriangle, CalendarPlus, Check, Copy, Euro, Pencil, StickyNote, Trash2, TrendingDown } from 'lucide-react';
import { getHoliday } from '@/utils/portugueseHolidays';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface DayInfo {
  dateObject: Date;
  dateString: string;
  dayName: string;
  formatted: string;
  monthKey: string;
}

interface DayCardProps {
  dayObj: DayInfo;
  tasks: Task[];
  extras?: Extra[];
  isAdmin: boolean;
  canEdit?: boolean;
  userRole?: string;
  isDarkMode: boolean;
  headerBg: string;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent, dateString: string) => void;
  onDragStart: (e: React.DragEvent, task: Task) => void;
  onEditTask: (task: Task) => void;
  onDeleteTask: (id: string) => void;
  onToggleStatus: (id: string, completed: boolean, userRole?: string) => void;
  onTogglePayment?: (id: string, pago: boolean) => void;
  onCopyTask?: (task: Task) => void;
  onRepeatNextWeek?: (task: Task) => void;
  onDeleteExtra?: (id: string) => void;
  onEditExtra?: (extra: Extra) => void;
  onCopyDay?: (targetDate: string, targetDayLabel: string) => void;
  isOverdue?: (task: Task) => boolean;
  animationDelay?: number;
}

const DayCard: React.FC<DayCardProps> = ({
  dayObj,
  tasks,
  extras = [],
  isAdmin,
  canEdit = true,
  userRole = 'user',
  isDarkMode,
  headerBg,
  onDragOver,
  onDrop,
  onDragStart,
  onEditTask,
  onDeleteTask,
  onToggleStatus,
  onTogglePayment,
  onCopyTask,
  onRepeatNextWeek,
  onDeleteExtra,
  onEditExtra,
  onCopyDay,
  isOverdue,
  animationDelay = 0,
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [isLongPressing, setIsLongPressing] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const feedbackTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (!isAdmin || !onCopyDay) return;
    feedbackTimer.current = setTimeout(() => {
      setIsLongPressing(true);
      if (navigator.vibrate) navigator.vibrate(30);
      // Prevent text selection during long press
      window.getSelection()?.removeAllRanges();
    }, 300);
    longPressTimer.current = setTimeout(() => {
      setIsLongPressing(false);
      if (navigator.vibrate) navigator.vibrate([15, 50, 15]);
      const dayLabel = `${dayObj.dayName} ${dayObj.formatted}`;
      onCopyDay(dayObj.dateString, dayLabel);
    }, 600);
  };

  const handleTouchEnd = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
    if (feedbackTimer.current) {
      clearTimeout(feedbackTimer.current);
      feedbackTimer.current = null;
    }
    setIsLongPressing(false);
  };
  
  const isWeekend = dayObj.dateObject.getDay() === 0 || dayObj.dateObject.getDay() === 6;
  const isSunday = dayObj.dateObject.getDay() === 0;
  
  const today = new Date();
  const isToday = dayObj.dateObject.toDateString() === today.toDateString();
  const isPast = dayObj.dateObject < new Date(today.setHours(0, 0, 0, 0));
  const isPastBlocked = isPast && !isAdmin;
  const holiday = getHoliday(dayObj.dateString);

  const handleDragOver = (e: React.DragEvent) => {
    if (!isAdmin) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setIsDragOver(true);
    onDragOver(e);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX;
    const y = e.clientY;
    if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) {
      setIsDragOver(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    setIsDragOver(false);
    if (!isPastBlocked) onDrop(e, dayObj.dateString);
  };

  const extrasTotal = extras.reduce((sum, e) => sum + (e.tipo === 'despesa' ? -1 : 1) * (Number(e.valor) || 0), 0);
  const dayTotal = tasks.reduce((sum, task) => sum + (parseFloat(task.price) || 0), 0) + extrasTotal;
  const completedTasks = tasks.filter(t => t.completed).length;
  const isFullyCompleted = tasks.length > 0 && completedTasks === tasks.length && extras.length === 0;
  const isEmpty = tasks.length === 0 && extras.length === 0;
  const isOverloaded = tasks.length >= 3;
  const overdueCount = isOverdue ? tasks.filter(t => isOverdue(t)).length : 0;

  return (
    <div
      ref={cardRef}
      data-is-today={isToday}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onTouchMove={handleTouchEnd}
      style={{ animationDelay: `${animationDelay}ms`, animationFillMode: 'backwards', WebkitTouchCallout: 'none' }}
      className={`glass-card rounded-xl overflow-hidden flex flex-col print:mb-4 print:break-inside-avoid h-full transition-all duration-300 animate-slide-up relative select-none
        ${isWeekend ? 'bg-muted/50' : ''}
        ${isSunday ? 'border-l-4 border-l-destructive/50' : ''}
        ${isToday ? 'ring-2 ring-primary ring-offset-2 ring-offset-background' : ''}
        ${isFullyCompleted && !isToday ? 'border-success/50' : ''}
        ${isPast && !isAdmin ? 'opacity-60' : ''}
        ${isDragOver ? 'ring-2 ring-primary ring-offset-2 scale-[1.02] shadow-xl border-primary/50' : ''}
        ${isEmpty && !isToday && !isPastBlocked ? 'opacity-50' : ''}
        ${isLongPressing ? 'scale-[0.97] ring-2 ring-primary/60 shadow-lg' : ''}
      `}
    >
      {/* Simple check for fully completed days */}
      {isFullyCompleted && (
        <div className="absolute -top-1 -right-1 z-20">
          <div className="w-6 h-6 rounded-full bg-success flex items-center justify-center shadow-sm">
            <Check size={14} className="text-success-foreground" strokeWidth={3} />
          </div>
        </div>
      )}

      {/* Drop indicator overlay */}
      {isDragOver && (
        <div className="absolute inset-0 bg-primary/10 rounded-xl pointer-events-none z-10 flex items-center justify-center backdrop-blur-[1px]">
          <div className="glass rounded-full p-4 shadow-lg">
            <CalendarPlus className="w-8 h-8 text-primary" />
          </div>
        </div>
      )}

      {/* Header */}
      <div className={`p-3 border-b border-border/50 flex justify-between items-center group
        ${isWeekend ? 'bg-muted/50' : 'bg-card'}
        ${isToday ? 'bg-primary/5' : ''}
      `}>
        <div>
          <h2 className={`font-bold capitalize flex items-center gap-2 ${
            isSunday ? 'text-destructive' : 'text-card-foreground'
          } ${isToday ? 'text-primary' : ''}`}>
            {dayObj.dayName}
            {isToday && (
              <span className="text-xs bg-primary text-primary-foreground px-2 py-0.5 rounded-full font-medium">
                Hoje
              </span>
            )}
          </h2>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground font-semibold tracking-wide">{dayObj.formatted}</span>
            {holiday && (
              <span className="text-xs text-muted-foreground px-1.5 py-0.5 rounded-full bg-muted border border-border">
                {holiday.name} {holiday.emoji}
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {overdueCount > 0 && (
            <TooltipProvider delayDuration={200}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span
                    className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-destructive/15 text-destructive text-[10px] font-bold border border-destructive/30 animate-pulse"
                    aria-label={`${overdueCount} por marcar como concluído`}
                  >
                    <AlertTriangle size={10} />
                    {overdueCount}
                  </span>
                </TooltipTrigger>
                <TooltipContent side="top" className="text-xs">
                  {overdueCount === 1 ? '1 serviço por marcar' : `${overdueCount} serviços por marcar`}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
          {isOverloaded && (
            <TooltipProvider delayDuration={200}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span
                    className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-warning/15 text-warning text-[10px] font-bold border border-warning/30"
                    aria-label={`Dia sobrecarregado com ${tasks.length} serviços`}
                  >
                    <AlertTriangle size={10} />
                    {tasks.length}
                  </span>
                </TooltipTrigger>
                <TooltipContent side="top" className="text-xs">
                  Dia sobrecarregado — {tasks.length} serviços
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
          {isAdmin && onCopyDay && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                const dayLabel = `${dayObj.dayName} ${dayObj.formatted}`;
                onCopyDay(dayObj.dateString, dayLabel);
              }}
              className="p-1.5 hover:bg-primary/10 rounded-full transition-colors opacity-0 group-hover:opacity-100 print:hidden"
              title="Copiar dia de outro agendamento"
            >
              <Copy size={14} className="text-primary" />
            </button>
          )}
          {(tasks.length > 0 || extras.length > 0) && (
            <div className="flex flex-col items-end gap-0.5">
              {tasks.length > 0 && (
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full
                  ${completedTasks === tasks.length 
                    ? 'bg-success/15 text-success' 
                    : 'bg-primary/10 text-primary'
                  }`}>
                  {completedTasks}/{tasks.length}
                </span>
              )}
              {dayTotal > 0 && (
                <span className="text-xs text-success font-bold">
                  €{dayTotal.toFixed(0)}
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className={`p-2.5 flex-1 min-h-[100px] relative transition-all duration-300 ${
        isDragOver ? 'bg-primary/5' : ''
      }`}>
        {isEmpty ? (
          <div className={`h-full flex items-center justify-center text-xs italic ${
            isDragOver
              ? 'text-primary font-semibold' 
              : 'text-muted-foreground/40'
          }`}>
            {isDragOver ? (
              <span className="flex items-center gap-2">
                <CalendarPlus size={14} />
                Soltar aqui
              </span>
            ) : (
              isSunday ? 'Domingo' : 'Livre'
            )}
          </div>
        ) : (
          <div className="space-y-2">
            {tasks.map((task, index) => (
              <TaskCard
                key={task.id}
                task={task}
                isAdmin={isAdmin}
                canEdit={canEdit}
                userRole={userRole}
                onDragStart={onDragStart}
                onEdit={onEditTask}
                onDelete={onDeleteTask}
                onToggleStatus={onToggleStatus}
                onTogglePayment={onTogglePayment}
                onCopy={onCopyTask}
                onRepeatNextWeek={onRepeatNextWeek}
                isOverdue={isOverdue ? isOverdue(task) : false}
                animationDelay={index * 50}
              />
            ))}
            {/* Extra values (receitas e despesas) */}
            {extras.map((extra) => {
              const isDespesa = extra.tipo === 'despesa';
              const toneBorder = isDespesa ? 'border-destructive/30 bg-destructive/5' : 'border-success/30 bg-success/5';
              const toneIconBg = isDespesa ? 'bg-destructive/20' : 'bg-success/20';
              const toneText = isDespesa ? 'text-destructive' : 'text-success';
              const Icon = isDespesa ? TrendingDown : Euro;
              const sign = isDespesa ? '-' : '+';
              return (
                <div
                  key={extra.id}
                  className={`relative group p-3 rounded-xl border transition-all duration-200 text-sm animate-fade-in ${toneBorder}`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${toneIconBg}`}>
                        <Icon size={14} className={toneText} />
                      </div>
                      <div className="min-w-0">
                        <span className={`font-bold text-sm ${toneText}`}>
                          {sign}€{Number(extra.valor).toFixed(2)}
                        </span>
                        {extra.observacoes && (
                          <TooltipProvider delayDuration={200}>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <p className="text-xs text-muted-foreground truncate flex items-center gap-1 cursor-help">
                                  <StickyNote size={10} />
                                  {extra.observacoes}
                                </p>
                              </TooltipTrigger>
                              <TooltipContent side="top" className="max-w-[250px] text-xs">
                                <p className="whitespace-pre-wrap">{extra.observacoes}</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      {onEditExtra && (
                        <button
                          type="button"
                          onClick={() => onEditExtra(extra)}
                          className="p-2 hover:bg-primary/10 rounded-full transition-colors"
                          aria-label={`Editar registo de €${Number(extra.valor).toFixed(2)}`}
                          title="Editar"
                        >
                          <Pencil size={14} className="text-primary" />
                        </button>
                      )}
                      {onDeleteExtra && (
                        <button
                          type="button"
                          onClick={() => onDeleteExtra(extra.id)}
                          className="p-1.5 hover:bg-destructive/10 rounded-full transition-colors opacity-0 group-hover:opacity-100"
                          title="Remover"
                          aria-label="Remover registo"
                        >
                          <Trash2 size={13} className="text-destructive" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default DayCard;
