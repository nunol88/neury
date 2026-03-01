import React, { useState, useRef } from 'react';
import { Task } from '@/hooks/useAgendamentos';
import TaskCard from './TaskCard';
import { CalendarPlus, Check } from 'lucide-react';
import { getHoliday } from '@/utils/portugueseHolidays';

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
  animationDelay?: number;
}

const DayCard: React.FC<DayCardProps> = ({
  dayObj,
  tasks,
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
  animationDelay = 0,
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  
  const isWeekend = dayObj.dateObject.getDay() === 0 || dayObj.dateObject.getDay() === 6;
  const isSunday = dayObj.dateObject.getDay() === 0;
  
  const today = new Date();
  const isToday = dayObj.dateObject.toDateString() === today.toDateString();
  const isPast = dayObj.dateObject < new Date(today.setHours(0, 0, 0, 0));
  const holiday = getHoliday(dayObj.dateString);

  const handleDragOver = (e: React.DragEvent) => {
    if (!isAdmin) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = isPast ? 'none' : 'move';
    if (!isPast) setIsDragOver(true);
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
    if (!isPast) onDrop(e, dayObj.dateString);
  };

  const dayTotal = tasks.reduce((sum, task) => sum + (parseFloat(task.price) || 0), 0);
  const completedTasks = tasks.filter(t => t.completed).length;
  const isFullyCompleted = tasks.length > 0 && completedTasks === tasks.length;
  const isEmpty = tasks.length === 0;

  return (
    <div
      ref={cardRef}
      data-is-today={isToday}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      style={{ animationDelay: `${animationDelay}ms`, animationFillMode: 'backwards' }}
      className={`glass-card rounded-xl overflow-hidden flex flex-col print:mb-4 print:break-inside-avoid h-full transition-all duration-300 animate-slide-up relative
        ${isWeekend ? 'bg-muted/50' : ''}
        ${isSunday ? 'border-l-4 border-l-destructive/50' : ''}
        ${isToday ? 'ring-2 ring-primary ring-offset-2 ring-offset-background' : ''}
        ${isFullyCompleted && !isToday ? 'border-success/50' : ''}
        ${isPast && isAdmin ? 'opacity-60' : ''}
        ${isDragOver && !isPast ? 'ring-2 ring-primary ring-offset-2 scale-[1.02] shadow-xl border-primary/50' : ''}
        ${isDragOver && isPast ? 'ring-2 ring-destructive/50 bg-destructive/5' : ''}
        ${isEmpty && !isToday && !isPast ? 'opacity-50' : ''}
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
      {isDragOver && !isPast && (
        <div className="absolute inset-0 bg-primary/10 rounded-xl pointer-events-none z-10 flex items-center justify-center backdrop-blur-[1px]">
          <div className="glass rounded-full p-4 shadow-lg">
            <CalendarPlus className="w-8 h-8 text-primary" />
          </div>
        </div>
      )}
      
      {isDragOver && isPast && (
        <div className="absolute inset-0 bg-destructive/10 rounded-xl pointer-events-none z-10 flex items-center justify-center">
          <div className="glass rounded-lg px-4 py-2">
            <span className="text-sm text-destructive font-semibold">Data passada</span>
          </div>
        </div>
      )}

      {/* Header */}
      <div className={`p-3 border-b border-border/50 flex justify-between items-center
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
          {tasks.length > 0 && (
            <div className="flex flex-col items-end gap-0.5">
              <span className={`text-xs font-bold px-2 py-0.5 rounded-full
                ${completedTasks === tasks.length 
                  ? 'bg-success/15 text-success' 
                  : 'bg-primary/10 text-primary'
                }`}>
                {completedTasks}/{tasks.length}
              </span>
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
        isDragOver && !isPast ? 'bg-primary/5' : ''
      }`}>
        {tasks.length === 0 ? (
          <div className={`h-full flex items-center justify-center text-xs italic ${
            isDragOver && !isPast 
              ? 'text-primary font-semibold' 
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
                canEdit={canEdit}
                userRole={userRole}
                onDragStart={onDragStart}
                onEdit={onEditTask}
                onDelete={onDeleteTask}
                onToggleStatus={onToggleStatus}
                onTogglePayment={onTogglePayment}
                onCopy={onCopyTask}
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
