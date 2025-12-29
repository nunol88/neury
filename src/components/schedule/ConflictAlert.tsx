import React from 'react';
import { AlertTriangle, Clock, User } from 'lucide-react';
import { Task } from '@/hooks/useAgendamentos';

export interface Conflict {
  task: Task;
  type: 'overlap' | 'close'; // overlap = sobreposição, close = menos de 30 min
}

interface ConflictAlertProps {
  conflicts: Conflict[];
  className?: string;
}

export const ConflictAlert: React.FC<ConflictAlertProps> = ({ conflicts, className = '' }) => {
  if (conflicts.length === 0) return null;

  return (
    <div className={`bg-warning/10 border border-warning/30 rounded-lg p-3 ${className}`}>
      <div className="flex items-start gap-2">
        <AlertTriangle className="text-warning shrink-0 mt-0.5" size={18} />
        <div className="flex-1">
          <p className="text-sm font-medium text-warning">
            Atenção! {conflicts.length === 1 ? 'Conflito detetado' : `${conflicts.length} conflitos detetados`}
          </p>
          <ul className="mt-2 space-y-1">
            {conflicts.map((conflict, index) => (
              <li key={index} className="text-xs text-muted-foreground flex items-center gap-2">
                <Clock size={12} className="text-warning" />
                <span className="font-medium">{conflict.task.startTime}-{conflict.task.endTime}</span>
                <span>com</span>
                <User size={12} className="text-primary" />
                <span className="font-medium">{conflict.task.client}</span>
                <span className="text-warning">
                  ({conflict.type === 'overlap' ? 'sobreposição' : 'intervalo < 30min'})
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

// Utility function to detect conflicts
export const detectConflicts = (
  newTask: { date: string; startTime: string; endTime: string; id?: string },
  existingTasks: Task[],
  minInterval: number = 30 // minutes
): Conflict[] => {
  const conflicts: Conflict[] = [];
  
  // Filter tasks for the same day, excluding the task being edited
  const sameDayTasks = existingTasks.filter(t => 
    t.date === newTask.date && t.id !== newTask.id
  );
  
  if (sameDayTasks.length === 0) return [];
  
  const parseTimeToMinutes = (time: string): number => {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  };
  
  const newStart = parseTimeToMinutes(newTask.startTime);
  const newEnd = parseTimeToMinutes(newTask.endTime);
  
  for (const task of sameDayTasks) {
    const taskStart = parseTimeToMinutes(task.startTime);
    const taskEnd = parseTimeToMinutes(task.endTime);
    
    // Check for overlap
    const hasOverlap = (newStart < taskEnd && newEnd > taskStart);
    
    if (hasOverlap) {
      conflicts.push({ task, type: 'overlap' });
      continue;
    }
    
    // Check for close interval (less than minInterval minutes between)
    const gapBefore = newStart - taskEnd; // gap if new task is after existing
    const gapAfter = taskStart - newEnd; // gap if new task is before existing
    
    if ((gapBefore >= 0 && gapBefore < minInterval) || 
        (gapAfter >= 0 && gapAfter < minInterval)) {
      conflicts.push({ task, type: 'close' });
    }
  }
  
  return conflicts;
};

export default ConflictAlert;
