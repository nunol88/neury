import React, { useState, useMemo } from 'react';
import { X, ChevronLeft, ChevronRight, MapPin, Clock, Phone, ArrowLeft } from 'lucide-react';
import { Task, AllTasks } from '@/hooks/useAgendamentos';
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameMonth,
  startOfWeek,
  endOfWeek,
  isToday,
} from 'date-fns';
import { pt } from 'date-fns/locale';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface CalendarModalProps {
  isOpen: boolean;
  onClose: () => void;
  allTasks: AllTasks;
  isLoading?: boolean;
}

type ViewMode = 'calendar' | 'day';

const CalendarModal: React.FC<CalendarModalProps> = ({ 
  isOpen, 
  onClose, 
  allTasks,
  isLoading = false,
}) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('calendar');
  const [activeTooltip, setActiveTooltip] = useState<string | null>(null);

  // Flatten all tasks
  const allTasksFlat = useMemo(() => {
    return Object.values(allTasks).flat();
  }, [allTasks]);

  // Get tasks for a specific date
  const getTasksForDate = (date: Date): Task[] => {
    const dateString = format(date, 'yyyy-MM-dd');
    return allTasksFlat.filter(task => task.date === dateString);
  };

  // Get tasks for selected date
  const selectedDateTasks = useMemo(() => {
    if (!selectedDate) return [];
    return getTasksForDate(selectedDate).sort((a, b) => a.startTime.localeCompare(b.startTime));
  }, [selectedDate, allTasksFlat]);

  // Generate calendar days
  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 });
    const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
    
    return eachDayOfInterval({ start: calendarStart, end: calendarEnd });
  }, [currentMonth]);

  const goToPreviousMonth = () => setCurrentMonth(prev => {
    const newMonth = new Date(prev);
    newMonth.setMonth(newMonth.getMonth() - 1);
    return newMonth;
  });
  
  const goToNextMonth = () => setCurrentMonth(prev => {
    const newMonth = new Date(prev);
    newMonth.setMonth(newMonth.getMonth() + 1);
    return newMonth;
  });
  
  const goToToday = () => {
    setCurrentMonth(new Date());
  };

  const handleDayClick = (day: Date) => {
    setSelectedDate(day);
    setViewMode('day');
  };

  const handleBackToCalendar = () => {
    setViewMode('calendar');
  };

  const handleClose = () => {
    setViewMode('calendar');
    setSelectedDate(null);
    onClose();
  };

  // Calculate total for selected date
  const selectedDateTotal = useMemo(() => {
    return selectedDateTasks.reduce((sum, t) => sum + parseFloat(t.price || '0'), 0);
  }, [selectedDateTasks]);

  const completedCount = selectedDateTasks.filter(t => t.completed).length;
  const pendingCount = selectedDateTasks.filter(t => !t.completed).length;

  if (!isOpen) return null;

  return (
    <TooltipProvider delayDuration={0}>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        {/* Backdrop */}
        <div 
          className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          onClick={handleClose}
        />
        
        {/* Modal */}
        <div className="relative bg-card w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-scale-in flex flex-col max-h-[85vh]">
          
          {viewMode === 'calendar' ? (
            <>
              {/* Header */}
              <div className="bg-gradient-to-r from-primary to-primary/80 text-white px-3 py-3">
                <div className="flex items-center justify-between">
                  <button
                    onClick={handleClose}
                    className="p-1.5 hover:bg-white/20 rounded-full transition"
                  >
                    <X size={18} />
                  </button>
                  <span className="text-sm font-semibold">Calendário</span>
                  <button
                    onClick={goToToday}
                    className="text-xs font-medium px-2 py-1 bg-white/20 rounded-full hover:bg-white/30 transition"
                  >
                    Hoje
                  </button>
                </div>
                
                <div className="flex items-center justify-between mt-2">
                  <button
                    onClick={goToPreviousMonth}
                    className="p-1.5 hover:bg-white/20 rounded-full transition"
                  >
                    <ChevronLeft size={20} />
                  </button>
                  <h2 className="text-base font-bold capitalize">
                    {format(currentMonth, 'MMMM yyyy', { locale: pt })}
                  </h2>
                  <button
                    onClick={goToNextMonth}
                    className="p-1.5 hover:bg-white/20 rounded-full transition"
                  >
                    <ChevronRight size={20} />
                  </button>
                </div>
              </div>

              {/* Week days header */}
              <div className="grid grid-cols-7 bg-secondary border-b border-border">
                {['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'].map((day, i) => (
                  <div key={i} className="py-2 text-center text-[10px] font-semibold text-muted-foreground">
                    {day}
                  </div>
                ))}
              </div>

              {/* Calendar grid */}
              <div className="flex-1 overflow-y-auto">
                {isLoading ? (
                  <div className="flex flex-col items-center justify-center py-16">
                    <div className="w-12 h-12 rounded-full border-4 border-red-100 border-t-red-500 animate-spin" />
                    <p className="mt-4 text-sm text-gray-500 font-medium">A carregar...</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-7">
                    {calendarDays.map((day, idx) => {
                      const tasks = getTasksForDate(day);
                      const isCurrentMonth = isSameMonth(day, currentMonth);
                      const isTodayDate = isToday(day);
                      
                      return (
                        <div
                          key={idx}
                          onClick={() => tasks.length > 0 && handleDayClick(day)}
                          className={`
                            relative min-h-[70px] p-1 border-b border-r border-border
                            transition-all duration-150
                            ${!isCurrentMonth ? 'bg-muted/50' : 'bg-card'}
                            ${isTodayDate ? 'bg-primary/10' : ''}
                            ${tasks.length > 0 ? 'cursor-pointer hover:bg-secondary' : ''}
                          `}
                        >
                          {/* Day number */}
                          <div className="flex justify-end mb-0.5">
                            <span className={`
                              text-[10px] font-medium w-5 h-5 flex items-center justify-center rounded-full
                              ${!isCurrentMonth ? 'text-muted-foreground/50' : 'text-card-foreground'}
                              ${isTodayDate ? 'bg-primary text-white font-bold' : ''}
                            `}>
                              {format(day, 'd')}
                            </span>
                          </div>
                          
                          {/* Client names with tooltips */}
                          <div className="space-y-0.5">
                            {tasks.slice(0, 3).map((task, taskIdx) => {
                              const tooltipId = `${format(day, 'yyyy-MM-dd')}-${taskIdx}`;
                              return (
                                <Tooltip 
                                  key={taskIdx} 
                                  open={activeTooltip === tooltipId}
                                  onOpenChange={(open) => setActiveTooltip(open ? tooltipId : null)}
                                >
                                  <TooltipTrigger asChild>
                                    <div
                                      className={`
                                        text-[8px] leading-tight px-1 py-0.5 rounded truncate cursor-default
                                        ${task.completed 
                                          ? 'bg-green-100 text-green-700' 
                                          : 'bg-yellow-100 text-yellow-700'
                                        }
                                        active:scale-95 transition-transform
                                      `}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setActiveTooltip(activeTooltip === tooltipId ? null : tooltipId);
                                      }}
                                      onTouchStart={(e) => {
                                        e.stopPropagation();
                                        setActiveTooltip(activeTooltip === tooltipId ? null : tooltipId);
                                      }}
                                    >
                                      {task.client.split(' ')[0]}
                                    </div>
                                  </TooltipTrigger>
                                  <TooltipContent 
                                    side="top" 
                                    className="bg-gray-900 text-white border-0 shadow-lg max-w-[200px]"
                                    sideOffset={4}
                                  >
                                    <div className="text-xs space-y-1 p-0.5">
                                      <p className="font-semibold">{task.client}</p>
                                      <div className="flex items-center gap-1 text-gray-300">
                                        <Clock size={10} />
                                        <span>{task.startTime} - {task.endTime}</span>
                                      </div>
                                      <p className="text-green-400 font-bold">€{task.price}</p>
                                      {task.completed && (
                                        <span className="text-green-400 text-[10px]">✓ Concluído</span>
                                      )}
                                    </div>
                                  </TooltipContent>
                                </Tooltip>
                              );
                            })}
                            {tasks.length > 3 && (
                              <div className="text-[8px] text-gray-400 text-center">
                                +{tasks.length - 3}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Legend */}
              <div className="px-3 py-2 bg-card border-t border-border flex items-center justify-center gap-4 text-xs text-muted-foreground">
                <div className="flex items-center gap-1">
                  <div className="w-3 h-2 rounded bg-warning/20 border border-warning/50" />
                  <span>Pendente</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-2 rounded bg-success/20 border border-success/50" />
                  <span>Concluído</span>
                </div>
              </div>
            </>
          ) : (
            <>
              {/* Day View Header */}
              <div className="bg-gradient-to-r from-primary to-primary/80 text-white px-3 py-3">
                <div className="flex items-center justify-between">
                  <button
                    onClick={handleBackToCalendar}
                    className="p-1.5 hover:bg-white/20 rounded-full transition flex items-center gap-1"
                  >
                    <ArrowLeft size={18} />
                  </button>
                  <div className="text-center">
                    <p className="text-xs opacity-80">
                      {selectedDate && format(selectedDate, 'EEEE', { locale: pt })}
                    </p>
                    <h2 className="text-lg font-bold">
                      {selectedDate && format(selectedDate, "d 'de' MMMM", { locale: pt })}
                    </h2>
                  </div>
                  <button
                    onClick={handleClose}
                    className="p-1.5 hover:bg-white/20 rounded-full transition"
                  >
                    <X size={18} />
                  </button>
                </div>
                
                {/* Day stats */}
                <div className="flex justify-center gap-4 mt-2 text-sm">
                  <div className="text-center">
                    <p className="text-xl font-bold">{selectedDateTasks.length}</p>
                    <p className="text-[10px] opacity-80">Agendamentos</p>
                  </div>
                  <div className="w-px bg-white/30" />
                  <div className="text-center">
                    <p className="text-xl font-bold text-green-200">€{selectedDateTotal.toFixed(0)}</p>
                    <p className="text-[10px] opacity-80">Total</p>
                  </div>
                </div>
              </div>

              {/* Status pills */}
              <div className="flex gap-2 px-3 py-2 bg-secondary border-b border-border">
                <span className="px-2 py-0.5 bg-success/20 text-success rounded-full text-xs font-medium">
                  {completedCount} concluído{completedCount !== 1 ? 's' : ''}
                </span>
                <span className="px-2 py-0.5 bg-warning/20 text-warning rounded-full text-xs font-medium">
                  {pendingCount} pendente{pendingCount !== 1 ? 's' : ''}
                </span>
              </div>

              {/* Tasks list */}
              <div className="flex-1 overflow-y-auto p-3 bg-secondary">
                {selectedDateTasks.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-muted-foreground py-8">
                    <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-3">
                      <Clock size={24} className="text-muted-foreground/50" />
                    </div>
                    <p className="text-sm font-medium text-muted-foreground">Sem agendamentos</p>
                    <p className="text-xs">Este dia está livre</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {selectedDateTasks.map((task) => (
                      <div
                        key={task.id}
                        className={`
                          w-full text-left p-3 rounded-xl
                          ${task.completed 
                            ? 'bg-card border border-success/30' 
                            : 'bg-card border border-border shadow-sm'
                          }
                        `}
                      >
                        <div className="flex gap-2">
                          {/* Time column */}
                          <div className="flex flex-col items-center">
                            <div className={`
                              w-2 h-2 rounded-full
                              ${task.completed ? 'bg-green-500' : 'bg-red-500'}
                            `} />
                            <div className={`
                              w-0.5 flex-1 my-0.5
                              ${task.completed ? 'bg-green-200' : 'bg-red-200'}
                            `} />
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <h4 className="font-bold text-gray-800 text-sm">
                                  {task.client}
                                </h4>
                                <div className="flex items-center gap-1 text-xs text-gray-500">
                                  <Clock size={12} />
                                  <span className="font-medium">{task.startTime} - {task.endTime}</span>
                                </div>
                              </div>
                              <span className="text-sm font-bold text-green-600 shrink-0">
                                €{task.price}
                              </span>
                            </div>
                            
                            {task.phone && (
                              <div className="flex items-center gap-1 mt-1 text-xs text-gray-400">
                                <Phone size={10} />
                                <span>{task.phone}</span>
                              </div>
                            )}
                            
                            {task.address && (
                              <div className="flex items-center gap-1 mt-0.5 text-xs text-gray-400">
                                <MapPin size={10} />
                                <span className="truncate">{task.address}</span>
                              </div>
                            )}
                            
                            {/* Status badge */}
                            <div className="mt-2">
                              <span className={`
                                text-[10px] px-2 py-0.5 rounded-full font-medium
                                ${task.completed 
                                  ? 'bg-green-100 text-green-700' 
                                  : 'bg-yellow-100 text-yellow-700'
                                }
                              `}>
                                {task.completed ? '✓ Concluído' : '○ Pendente'}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </TooltipProvider>
  );
};

export default CalendarModal;