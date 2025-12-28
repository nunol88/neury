import React, { useState, useMemo } from 'react';
import { X, ChevronLeft, ChevronRight, MapPin, Clock, Phone, Plus, ArrowLeft } from 'lucide-react';
import { Task, AllTasks } from '@/hooks/useAgendamentos';
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  addMonths,
  subMonths,
  startOfWeek,
  endOfWeek,
  parseISO,
  isToday,
} from 'date-fns';
import { pt } from 'date-fns/locale';

interface CalendarModalProps {
  isOpen: boolean;
  onClose: () => void;
  allTasks: AllTasks;
  onSelectTask?: (task: Task) => void;
  onAddTask?: (date: string) => void;
}

type ViewMode = 'calendar' | 'day';

const CalendarModal: React.FC<CalendarModalProps> = ({ 
  isOpen, 
  onClose, 
  allTasks,
  onSelectTask,
  onAddTask
}) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('calendar');

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

  // Check if a date has tasks
  const hasTasksOnDate = (date: Date): { count: number; hasCompleted: boolean; hasPending: boolean } => {
    const tasks = getTasksForDate(date);
    return {
      count: tasks.length,
      hasCompleted: tasks.some(t => t.completed),
      hasPending: tasks.some(t => !t.completed),
    };
  };

  const goToPreviousMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
  const goToNextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  const goToToday = () => {
    setCurrentMonth(new Date());
    setSelectedDate(new Date());
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
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={handleClose}
      />
      
      {/* Modal */}
      <div className="relative bg-white w-full sm:w-[440px] h-[85vh] sm:h-auto sm:max-h-[90vh] rounded-t-3xl sm:rounded-2xl shadow-2xl overflow-hidden animate-slide-up flex flex-col">
        
        {viewMode === 'calendar' ? (
          <>
            {/* Header - iOS Style */}
            <div className="bg-gradient-to-r from-red-500 to-red-600 text-white px-4 py-4">
              <div className="flex items-center justify-between mb-3">
                <button
                  onClick={handleClose}
                  className="p-2 hover:bg-white/20 rounded-full transition"
                >
                  <X size={20} />
                </button>
                <span className="text-lg font-semibold">Calendário</span>
                <button
                  onClick={goToToday}
                  className="text-sm font-medium px-3 py-1.5 bg-white/20 rounded-full hover:bg-white/30 transition"
                >
                  Hoje
                </button>
              </div>
              
              <div className="flex items-center justify-between">
                <button
                  onClick={goToPreviousMonth}
                  className="p-2 hover:bg-white/20 rounded-full transition"
                >
                  <ChevronLeft size={24} />
                </button>
                <h2 className="text-xl font-bold capitalize">
                  {format(currentMonth, 'MMMM yyyy', { locale: pt })}
                </h2>
                <button
                  onClick={goToNextMonth}
                  className="p-2 hover:bg-white/20 rounded-full transition"
                >
                  <ChevronRight size={24} />
                </button>
              </div>
            </div>

            {/* Week days header */}
            <div className="grid grid-cols-7 bg-gray-50 border-b">
              {['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'].map((day) => (
                <div key={day} className="py-3 text-center text-xs font-semibold text-gray-500 uppercase">
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar grid */}
            <div className="flex-1 overflow-y-auto">
              <div className="grid grid-cols-7">
                {calendarDays.map((day, idx) => {
                  const { count, hasCompleted, hasPending } = hasTasksOnDate(day);
                  const isCurrentMonth = isSameMonth(day, currentMonth);
                  const isTodayDate = isToday(day);
                  
                  return (
                    <button
                      key={idx}
                      onClick={() => handleDayClick(day)}
                      className={`
                        relative aspect-square flex flex-col items-center justify-center border-b border-r border-gray-100
                        transition-all duration-150 active:bg-gray-100
                        ${!isCurrentMonth ? 'text-gray-300 bg-gray-50/50' : 'text-gray-800 hover:bg-red-50'}
                        ${isTodayDate ? 'bg-red-50' : ''}
                      `}
                    >
                      <span className={`
                        text-sm font-medium w-8 h-8 flex items-center justify-center rounded-full
                        ${isTodayDate ? 'bg-red-500 text-white font-bold' : ''}
                      `}>
                        {format(day, 'd')}
                      </span>
                      
                      {/* Task indicators */}
                      {count > 0 && (
                        <div className="flex gap-0.5 mt-1 absolute bottom-1">
                          {hasPending && (
                            <div className="w-1.5 h-1.5 rounded-full bg-yellow-500" />
                          )}
                          {hasCompleted && (
                            <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                          )}
                          {count > 1 && (
                            <span className="text-[10px] text-gray-400 ml-0.5">+{count - 1}</span>
                          )}
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Legend */}
            <div className="px-4 py-3 bg-white border-t flex items-center justify-center gap-6 text-xs text-gray-500">
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-yellow-500" />
                <span>Pendente</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-green-500" />
                <span>Concluído</span>
              </div>
            </div>
          </>
        ) : (
          <>
            {/* Day View Header */}
            <div className="bg-gradient-to-r from-red-500 to-red-600 text-white px-4 py-4">
              <div className="flex items-center justify-between">
                <button
                  onClick={handleBackToCalendar}
                  className="p-2 hover:bg-white/20 rounded-full transition flex items-center gap-1"
                >
                  <ArrowLeft size={20} />
                </button>
                <div className="text-center">
                  <p className="text-sm opacity-80">
                    {selectedDate && format(selectedDate, 'EEEE', { locale: pt })}
                  </p>
                  <h2 className="text-2xl font-bold">
                    {selectedDate && format(selectedDate, "d 'de' MMMM", { locale: pt })}
                  </h2>
                </div>
                <button
                  onClick={handleClose}
                  className="p-2 hover:bg-white/20 rounded-full transition"
                >
                  <X size={20} />
                </button>
              </div>
              
              {/* Day stats */}
              <div className="flex justify-center gap-6 mt-3 text-sm">
                <div className="text-center">
                  <p className="text-2xl font-bold">{selectedDateTasks.length}</p>
                  <p className="text-xs opacity-80">Agendamentos</p>
                </div>
                <div className="w-px bg-white/30" />
                <div className="text-center">
                  <p className="text-2xl font-bold text-green-200">€{selectedDateTotal.toFixed(0)}</p>
                  <p className="text-xs opacity-80">Total</p>
                </div>
              </div>
            </div>

            {/* Status pills */}
            <div className="flex gap-2 px-4 py-3 bg-gray-50 border-b">
              <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                {completedCount} concluído{completedCount !== 1 ? 's' : ''}
              </span>
              <span className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs font-medium">
                {pendingCount} pendente{pendingCount !== 1 ? 's' : ''}
              </span>
            </div>

            {/* Tasks list */}
            <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
              {selectedDateTasks.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-gray-400 py-12">
                  <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                    <Clock size={32} className="text-gray-300" />
                  </div>
                  <p className="text-lg font-medium text-gray-500">Sem agendamentos</p>
                  <p className="text-sm">Este dia está livre</p>
                  {onAddTask && (
                    <button
                      onClick={() => {
                        if (selectedDate) {
                          onAddTask(format(selectedDate, 'yyyy-MM-dd'));
                          handleClose();
                        }
                      }}
                      className="mt-4 px-4 py-2 bg-red-500 text-white rounded-full text-sm font-medium flex items-center gap-2 hover:bg-red-600 transition"
                    >
                      <Plus size={16} />
                      Adicionar
                    </button>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  {selectedDateTasks.map((task) => (
                    <button
                      key={task.id}
                      onClick={() => onSelectTask?.(task)}
                      className={`
                        w-full text-left p-4 rounded-2xl transition-all
                        ${task.completed 
                          ? 'bg-white border-2 border-green-200' 
                          : 'bg-white border-2 border-gray-100 shadow-sm'
                        }
                        hover:shadow-lg active:scale-[0.98]
                      `}
                    >
                      <div className="flex gap-3">
                        {/* Time column */}
                        <div className="flex flex-col items-center">
                          <div className={`
                            w-3 h-3 rounded-full
                            ${task.completed ? 'bg-green-500' : 'bg-red-500'}
                          `} />
                          <div className={`
                            w-0.5 flex-1 my-1
                            ${task.completed ? 'bg-green-200' : 'bg-red-200'}
                          `} />
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <h4 className="font-bold text-gray-800 text-lg">
                                {task.client}
                              </h4>
                              <div className="flex items-center gap-2 mt-1 text-sm text-gray-500">
                                <Clock size={14} />
                                <span className="font-medium">{task.startTime} - {task.endTime}</span>
                              </div>
                            </div>
                            <span className="text-lg font-bold text-green-600 shrink-0">
                              €{task.price}
                            </span>
                          </div>
                          
                          {task.phone && (
                            <div className="flex items-center gap-2 mt-2 text-sm text-gray-400">
                              <Phone size={14} />
                              <span>{task.phone}</span>
                            </div>
                          )}
                          
                          {task.address && (
                            <div className="flex items-center gap-2 mt-1 text-sm text-gray-400">
                              <MapPin size={14} />
                              <span className="truncate">{task.address}</span>
                            </div>
                          )}
                          
                          {/* Status badge */}
                          <div className="mt-3">
                            <span className={`
                              text-xs px-3 py-1 rounded-full font-medium
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
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Add button for day view */}
            {onAddTask && selectedDateTasks.length > 0 && (
              <div className="p-4 bg-white border-t">
                <button
                  onClick={() => {
                    if (selectedDate) {
                      onAddTask(format(selectedDate, 'yyyy-MM-dd'));
                      handleClose();
                    }
                  }}
                  className="w-full py-3 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl font-medium flex items-center justify-center gap-2 hover:from-red-600 hover:to-red-700 transition"
                >
                  <Plus size={20} />
                  Adicionar Agendamento
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default CalendarModal;
