import React, { useState, useMemo } from 'react';
import { X, ChevronLeft, ChevronRight, MapPin, Clock, Phone } from 'lucide-react';
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
}

const CalendarModal: React.FC<CalendarModalProps> = ({ 
  isOpen, 
  onClose, 
  allTasks,
  onSelectTask 
}) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

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
    return getTasksForDate(selectedDate);
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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-white w-full sm:w-[420px] sm:max-h-[90vh] rounded-t-3xl sm:rounded-2xl shadow-2xl overflow-hidden animate-slide-up flex flex-col">
        {/* Header - iOS Style */}
        <div className="bg-gradient-to-r from-red-500 to-red-600 text-white px-4 py-4">
          <div className="flex items-center justify-between mb-3">
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-full transition"
            >
              <X size={20} />
            </button>
            <button
              onClick={goToToday}
              className="text-sm font-medium px-3 py-1 bg-white/20 rounded-full hover:bg-white/30 transition"
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
            <div key={day} className="py-2 text-center text-xs font-semibold text-gray-500">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar grid */}
        <div className="grid grid-cols-7 gap-px bg-gray-100 p-1">
          {calendarDays.map((day, idx) => {
            const { count, hasCompleted, hasPending } = hasTasksOnDate(day);
            const isCurrentMonth = isSameMonth(day, currentMonth);
            const isSelected = selectedDate && isSameDay(day, selectedDate);
            const isTodayDate = isToday(day);
            
            return (
              <button
                key={idx}
                onClick={() => setSelectedDate(day)}
                className={`
                  relative aspect-square flex flex-col items-center justify-center bg-white
                  transition-all duration-150
                  ${!isCurrentMonth ? 'text-gray-300' : 'text-gray-800'}
                  ${isSelected ? 'bg-red-500 text-white rounded-xl shadow-lg scale-105 z-10' : 'hover:bg-gray-50'}
                  ${isTodayDate && !isSelected ? 'ring-2 ring-red-400 rounded-xl' : ''}
                `}
              >
                <span className={`text-sm font-medium ${isSelected ? 'font-bold' : ''}`}>
                  {format(day, 'd')}
                </span>
                
                {/* Task indicators */}
                {count > 0 && (
                  <div className="flex gap-0.5 mt-0.5">
                    {hasPending && (
                      <div className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-white/80' : 'bg-yellow-500'}`} />
                    )}
                    {hasCompleted && (
                      <div className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-white/80' : 'bg-green-500'}`} />
                    )}
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* Selected date tasks */}
        <div className="flex-1 overflow-y-auto bg-gray-50 min-h-[200px] max-h-[300px]">
          {selectedDate ? (
            <div className="p-4">
              <h3 className="text-sm font-semibold text-gray-500 mb-3 capitalize">
                {format(selectedDate, "EEEE, d 'de' MMMM", { locale: pt })}
              </h3>
              
              {selectedDateTasks.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  <p className="text-sm">Sem agendamentos</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {selectedDateTasks
                    .sort((a, b) => a.startTime.localeCompare(b.startTime))
                    .map((task) => (
                      <button
                        key={task.id}
                        onClick={() => onSelectTask?.(task)}
                        className={`
                          w-full text-left p-3 rounded-xl transition-all
                          ${task.completed 
                            ? 'bg-green-50 border border-green-200' 
                            : 'bg-white border border-gray-200 shadow-sm'
                          }
                          hover:shadow-md active:scale-[0.98]
                        `}
                      >
                        <div className="flex items-start gap-3">
                          {/* Time indicator */}
                          <div className={`
                            w-1 h-full min-h-[40px] rounded-full
                            ${task.completed ? 'bg-green-400' : 'bg-red-400'}
                          `} />
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2">
                              <h4 className="font-semibold text-gray-800 truncate">
                                {task.client}
                              </h4>
                              <span className="text-sm font-bold text-green-600 shrink-0">
                                €{task.price}
                              </span>
                            </div>
                            
                            <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                              <span className="flex items-center gap-1">
                                <Clock size={12} />
                                {task.startTime} - {task.endTime}
                              </span>
                              {task.phone && (
                                <span className="flex items-center gap-1">
                                  <Phone size={12} />
                                  {task.phone}
                                </span>
                              )}
                            </div>
                            
                            {task.address && (
                              <div className="flex items-center gap-1 mt-1 text-xs text-gray-400">
                                <MapPin size={12} />
                                <span className="truncate">{task.address}</span>
                              </div>
                            )}
                          </div>
                        </div>
                        
                        {/* Status badge */}
                        <div className="mt-2 flex justify-end">
                          <span className={`
                            text-xs px-2 py-0.5 rounded-full font-medium
                            ${task.completed 
                              ? 'bg-green-100 text-green-700' 
                              : 'bg-yellow-100 text-yellow-700'
                            }
                          `}>
                            {task.completed ? 'Concluído' : 'Pendente'}
                          </span>
                        </div>
                      </button>
                    ))}
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center justify-center h-full text-gray-400">
              <p className="text-sm">Selecione um dia para ver agendamentos</p>
            </div>
          )}
        </div>

        {/* Legend */}
        <div className="px-4 py-3 bg-white border-t flex items-center justify-center gap-6 text-xs text-gray-500">
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-yellow-500" />
            <span>Pendente</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-green-500" />
            <span>Concluído</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CalendarModal;
