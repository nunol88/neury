import React, { useState, useRef, useEffect } from 'react';
import { Task } from '@/hooks/useAgendamentos';
import TaskCard from './TaskCard';
import { CalendarPlus, Sparkles } from 'lucide-react';

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
  isAdmin: boolean;
  isDarkMode: boolean;
  headerBg: string;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent, dateString: string) => void;
  onDragStart: (e: React.DragEvent, task: Task) => void;
  onEditTask: (task: Task) => void;
  onDeleteTask: (id: string) => void;
  onToggleStatus: (id: string, completed: boolean) => void;
  animationDelay?: number;
}

const DayCard: React.FC<DayCardProps> = ({
  dayObj,
  tasks,
  isAdmin,
  isDarkMode,
  headerBg,
  onDragOver,
  onDrop,
  onDragStart,
  onEditTask,
  onDeleteTask,
  onToggleStatus,
  animationDelay = 0,
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  
  const isWeekend = dayObj.dateObject.getDay() === 0 || dayObj.dateObject.getDay() === 6;
  const isSunday = dayObj.dateObject.getDay() === 0;
  
  // Check if this is today
  const today = new Date();
  const isToday = dayObj.dateObject.toDateString() === today.toDateString();
  
  // Check if date is in the past
  const isPast = dayObj.dateObject < new Date(today.setHours(0, 0, 0, 0));

  const handleDragOver = (e: React.DragEvent) => {
    if (!isAdmin) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = isPast ? 'none' : 'move';
    if (!isPast) {
      setIsDragOver(true);
    }
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
    if (!isPast) {
      onDrop(e, dayObj.dateString);
    }
  };

  // Calculate total value for the day
  const dayTotal = tasks.reduce((sum, task) => sum + (parseFloat(task.price) || 0), 0);
  const completedTasks = tasks.filter(t => t.completed).length;

  return (
    <div
      ref={cardRef}
      data-is-today={isToday}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      style={{ 
        animationDelay: `${animationDelay}ms`,
        animationFillMode: 'backwards'
      }}
      className={`glass-card rounded-xl overflow-hidden flex flex-col print:mb-4 print:break-inside-avoid h-full transition-all duration-300 animate-slide-up
        ${isWeekend ? 'bg-muted/50' : ''}
        ${isSunday ? 'border-l-4 border-l-destructive/50' : ''}
        ${isToday ? 'ring-2 ring-primary ring-offset-2 ring-offset-background shadow-glow-primary' : ''}
        ${isPast && isAdmin ? 'opacity-60' : ''}
        ${isDragOver && !isPast ? 'ring-2 ring-primary ring-offset-2 scale-[1.02] shadow-xl border-primary/50' : ''}
        ${isDragOver && isPast ? 'ring-2 ring-destructive/50 bg-destructive/5' : ''}
        hover:shadow-lg hover:scale-[1.01]
      `}
    >
      {/* Drop indicator overlay */}
      {isDragOver && !isPast && (
        <div className="absolute inset-0 bg-primary/10 rounded-xl pointer-events-none z-10 flex items-center justify-center animate-pulse backdrop-blur-[1px]">
          <div className="glass rounded-full p-4 shadow-lg">
            <CalendarPlus className="w-8 h-8 text-primary animate-bounce" />
          </div>
        </div>
      )}
      
      {/* Past date warning overlay */}
      {isDragOver && isPast && (
        <div className="absolute inset-0 bg-destructive/10 rounded-xl pointer-events-none z-10 flex items-center justify-center">
          <div className="glass rounded-lg px-4 py-2">
            <span className="text-sm text-destructive font-semibold">Data passada</span>
          </div>
        </div>
      )}

      {/* Header */}
      <div className={`p-3 border-b border-border/50 flex justify-between items-center relative overflow-hidden
        ${isWeekend ? 'bg-muted/50' : 'bg-gradient-to-r from-card to-card/80'}
        ${isToday ? 'bg-gradient-to-r from-primary/10 via-primary/5 to-transparent' : ''}
      `}>
        {/* Decorative gradient for today */}
        {isToday && (
          <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-transparent pointer-events-none" />
        )}
        
        <div className="relative z-10">
          <h2 className={`font-bold capitalize flex items-center gap-2 ${
            isSunday ? 'text-destructive' : 'text-card-foreground'
          } ${isToday ? 'text-primary' : ''}`}>
            {dayObj.dayName}
            {isToday && (
              <span className="flex items-center gap-1 text-xs bg-gradient-to-r from-primary to-primary/80 text-primary-foreground px-2.5 py-1 rounded-full shadow-md animate-pulse">
                <Sparkles size={10} className="animate-spin" style={{ animationDuration: '3s' }} />
                Hoje
              </span>
            )}
          </h2>
          <span className="text-xs text-muted-foreground font-semibold tracking-wide">{dayObj.formatted}</span>
        </div>
        
        <div className="flex items-center gap-2 relative z-10">
          {tasks.length > 0 && (
            <div className="flex flex-col items-end gap-0.5">
              <span className={`text-xs font-bold px-2.5 py-1 rounded-full shadow-sm transition-all
                ${completedTasks === tasks.length 
                  ? 'bg-success/20 text-success border border-success/30' 
                  : 'bg-primary/10 text-primary border border-primary/20'
                }`}>
                {completedTasks}/{tasks.length}
              </span>
              {dayTotal > 0 && (
                <span className="text-[10px] text-success font-bold">
                  €{dayTotal.toFixed(0)}
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className={`p-2 flex-1 min-h-[100px] relative transition-all duration-300 ${
        isDragOver && !isPast ? 'bg-primary/5' : ''
      }`}>
        {tasks.length === 0 ? (
          <div className={`h-full flex items-center justify-center text-xs italic transition-all duration-300 ${
            isDragOver && !isPast 
              ? 'text-primary font-semibold scale-105' 
              : 'text-muted-foreground/40'
          }`}>
            {isDragOver && !isPast ? (
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
                onDragStart={onDragStart}
                onEdit={onEditTask}
                onDelete={onDeleteTask}
                onToggleStatus={onToggleStatus}
                animationDelay={index * 50}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default DayCard;
