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

interface CalendarModalProps {
  isOpen: boolean;
  onClose: () => void;
  allTasks: AllTasks;
}

type ViewMode = 'calendar' | 'day';

const CalendarModal: React.FC<CalendarModalProps> = ({ 
  isOpen, 
  onClose, 
  allTasks,
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
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={handleClose}
      />
      
      {/* Modal - Compact size */}
      <div className="relative bg-white w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden animate-scale-in flex flex-col max-h-[75vh]">
        
        {viewMode === 'calendar' ? (
          <>
            {/* Header - Compact */}
            <div className="bg-gradient-to-r from-red-500 to-red-600 text-white px-3 py-3">
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
            <div className="grid grid-cols-7 bg-gray-50 border-b">
              {['S', 'T', 'Q', 'Q', 'S', 'S', 'D'].map((day, i) => (
                <div key={i} className="py-2 text-center text-xs font-semibold text-gray-500">
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar grid - Compact */}
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
                      relative h-10 flex flex-col items-center justify-center border-b border-r border-gray-100
                      transition-all duration-150 active:bg-gray-100
                      ${!isCurrentMonth ? 'text-gray-300 bg-gray-50/50' : 'text-gray-800 hover:bg-red-50'}
                      ${isTodayDate ? 'bg-red-50' : ''}
                    `}
                  >
                    <span className={`
                      text-xs font-medium w-6 h-6 flex items-center justify-center rounded-full
                      ${isTodayDate ? 'bg-red-500 text-white font-bold' : ''}
                    `}>
                      {format(day, 'd')}
                    </span>
                    
                    {/* Task indicators */}
                    {count > 0 && (
                      <div className="flex gap-0.5 absolute bottom-0.5">
                        {hasPending && (
                          <div className="w-1 h-1 rounded-full bg-yellow-500" />
                        )}
                        {hasCompleted && (
                          <div className="w-1 h-1 rounded-full bg-green-500" />
                        )}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Legend - Compact */}
            <div className="px-3 py-2 bg-white border-t flex items-center justify-center gap-4 text-xs text-gray-500">
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-yellow-500" />
                <span>Pendente</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-green-500" />
                <span>Concluído</span>
              </div>
            </div>
          </>
        ) : (
          <>
            {/* Day View Header - Compact */}
            <div className="bg-gradient-to-r from-red-500 to-red-600 text-white px-3 py-3">
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
              
              {/* Day stats - Compact */}
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
            <div className="flex gap-2 px-3 py-2 bg-gray-50 border-b">
              <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                {completedCount} concluído{completedCount !== 1 ? 's' : ''}
              </span>
              <span className="px-2 py-0.5 bg-yellow-100 text-yellow-700 rounded-full text-xs font-medium">
                {pendingCount} pendente{pendingCount !== 1 ? 's' : ''}
              </span>
            </div>

            {/* Tasks list - View only */}
            <div className="flex-1 overflow-y-auto p-3 bg-gray-50">
              {selectedDateTasks.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-gray-400 py-8">
                  <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-3">
                    <Clock size={24} className="text-gray-300" />
                  </div>
                  <p className="text-sm font-medium text-gray-500">Sem agendamentos</p>
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
                          ? 'bg-white border border-green-200' 
                          : 'bg-white border border-gray-100 shadow-sm'
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
  );
};

export default CalendarModal;
