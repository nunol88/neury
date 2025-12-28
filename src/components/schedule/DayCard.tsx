import React from 'react';
import { Task } from '@/hooks/useAgendamentos';
import TaskCard from './TaskCard';

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
  const isWeekend = dayObj.dateObject.getDay() === 0 || dayObj.dateObject.getDay() === 6;
  const isSunday = dayObj.dateObject.getDay() === 0;
  
  // Check if this is today
  const today = new Date();
  const isToday = dayObj.dateObject.toDateString() === today.toDateString();

  const borderClass = 'border-border';
  const textHeader = 'text-card-foreground';

  return (
    <div
      onDragOver={onDragOver}
      onDrop={(e) => onDrop(e, dayObj.dateString)}
      className={`rounded-xl shadow-sm overflow-hidden border flex flex-col print:mb-4 print:break-inside-avoid h-full transition-colors duration-200
        ${isWeekend ? 'bg-muted border-border' : `bg-card ${borderClass}`}
        ${isSunday ? 'border-l-4 border-l-destructive/50' : ''}
        ${isToday ? 'ring-2 ring-primary ring-offset-2' : ''}
      `}
    >
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

      <div className="p-2 flex-1 min-h-[100px]">
        {tasks.length === 0 ? (
          <div className="h-full flex items-center justify-center text-muted-foreground/50 text-xs italic">
            {isSunday ? 'Domingo' : 'Livre'}
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
