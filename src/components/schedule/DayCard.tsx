import React, { useState } from 'react';
import { Task } from '@/hooks/useAgendamentos';
import TaskCard from './TaskCard';
import { CalendarPlus } from 'lucide-react';

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
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  
  const isWeekend = dayObj.dateObject.getDay() === 0 || dayObj.dateObject.getDay() === 6;
  const isSunday = dayObj.dateObject.getDay() === 0;
  
  // Check if this is today
  const today = new Date();
  const isToday = dayObj.dateObject.toDateString() === today.toDateString();
  
  // Check if date is in the past
  const isPast = dayObj.dateObject < new Date(today.setHours(0, 0, 0, 0));

  const borderClass = 'border-border';
  const textHeader = 'text-card-foreground';

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
    // Only set to false if leaving the card entirely
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

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`rounded-xl shadow-sm overflow-hidden border flex flex-col print:mb-4 print:break-inside-avoid h-full transition-all duration-200
        ${isWeekend ? 'bg-muted border-border' : `bg-card ${borderClass}`}
        ${isSunday ? 'border-l-4 border-l-destructive/50' : ''}
        ${isToday ? 'ring-2 ring-primary ring-offset-2' : ''}
        ${isPast && isAdmin ? 'opacity-60' : ''}
        ${isDragOver && !isPast ? 'ring-2 ring-primary ring-offset-2 bg-primary/5 scale-[1.02] shadow-lg border-primary/50' : ''}
        ${isDragOver && isPast ? 'ring-2 ring-destructive/50 bg-destructive/5' : ''}
      `}
    >
      {/* Drop indicator overlay */}
      {isDragOver && !isPast && (
        <div className="absolute inset-0 bg-primary/10 rounded-xl pointer-events-none z-10 flex items-center justify-center animate-pulse">
          <div className="bg-primary/20 rounded-full p-3 backdrop-blur-sm">
            <CalendarPlus className="w-6 h-6 text-primary" />
          </div>
        </div>
      )}
      
      {/* Past date warning overlay */}
      {isDragOver && isPast && (
        <div className="absolute inset-0 bg-destructive/10 rounded-xl pointer-events-none z-10 flex items-center justify-center">
          <div className="bg-destructive/20 rounded-lg px-3 py-2 backdrop-blur-sm">
            <span className="text-xs text-destructive font-medium">Data passada</span>
          </div>
        </div>
      )}

      <div className={`p-3 border-b border-border flex justify-between items-center ${isWeekend ? 'bg-muted' : headerBg}`}>
        <div>
          <h2 className={`font-bold capitalize ${isSunday ? 'text-destructive' : textHeader} ${isToday ? 'text-primary' : ''}`}>
            {dayObj.dayName}
            {isToday && <span className="ml-2 text-xs bg-primary text-primary-foreground px-2 py-0.5 rounded-full">Hoje</span>}
          </h2>
          <span className="text-xs text-muted-foreground font-semibold">{dayObj.formatted}</span>
        </div>
        {tasks.length > 0 && (
          <span className="text-xs bg-primary/10 text-primary border border-primary/20 px-2 py-1 rounded-full shadow-sm">
            {tasks.length}
          </span>
        )}
      </div>

      <div className={`p-2 flex-1 min-h-[100px] relative transition-colors duration-200 ${
        isDragOver && !isPast ? 'bg-primary/5' : ''
      }`}>
        {tasks.length === 0 ? (
          <div className={`h-full flex items-center justify-center text-xs italic transition-colors duration-200 ${
            isDragOver && !isPast 
              ? 'text-primary font-medium' 
              : 'text-muted-foreground/50'
          }`}>
            {isDragOver && !isPast ? 'Soltar aqui' : (isSunday ? 'Domingo' : 'Livre')}
          </div>
        ) : (
          <div className="space-y-2">
            {tasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                isAdmin={isAdmin}
                onDragStart={onDragStart}
                onEdit={onEditTask}
                onDelete={onDeleteTask}
                onToggleStatus={onToggleStatus}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default DayCard;
