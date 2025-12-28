import React from 'react';
import { Task } from '@/hooks/useAgendamentos';
import { Calendar, CheckCircle2, Clock, Euro, TrendingUp, Target } from 'lucide-react';

interface MonthSummaryBarProps {
  tasks: Task[];
  monthLabel: string;
  totalDays: number;
}

const MonthSummaryBar: React.FC<MonthSummaryBarProps> = ({
  tasks,
  monthLabel,
  totalDays,
}) => {
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(t => t.completed).length;
  const pendingTasks = totalTasks - completedTasks;
  
  const totalValue = tasks.reduce((sum, t) => sum + (parseFloat(t.price) || 0), 0);
  const completedValue = tasks.filter(t => t.completed).reduce((sum, t) => sum + (parseFloat(t.price) || 0), 0);
  
  const totalHours = tasks.reduce((sum, t) => {
    const start = new Date(`1970-01-01T${t.startTime}`);
    const end = new Date(`1970-01-01T${t.endTime}`);
    return sum + (end.getTime() - start.getTime()) / (1000 * 60 * 60);
  }, 0);

  // Days with appointments
  const uniqueDays = new Set(tasks.map(t => t.date)).size;
  const occupancyRate = totalDays > 0 ? (uniqueDays / totalDays) * 100 : 0;
  
  // Completion rate
  const completionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

  return (
    <div className="glass-card p-4 rounded-2xl shadow-lg border border-border/50 animate-slide-up">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        {/* Left side: Stats grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 flex-1">
          {/* Total appointments */}
          <div className="flex items-center gap-3 p-3 rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20">
            <div className="p-2 rounded-lg bg-primary/20">
              <Calendar size={18} className="text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold text-primary">{totalTasks}</p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Agendamentos</p>
            </div>
          </div>

          {/* Completed */}
          <div className="flex items-center gap-3 p-3 rounded-xl bg-gradient-to-br from-success/10 to-success/5 border border-success/20">
            <div className="p-2 rounded-lg bg-success/20">
              <CheckCircle2 size={18} className="text-success" />
            </div>
            <div>
              <p className="text-2xl font-bold text-success">{completedTasks}</p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Concluídos</p>
            </div>
          </div>

          {/* Hours */}
          <div className="flex items-center gap-3 p-3 rounded-xl bg-gradient-to-br from-secondary to-secondary/50 border border-border/50">
            <div className="p-2 rounded-lg bg-muted">
              <Clock size={18} className="text-muted-foreground" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{totalHours.toFixed(0)}h</p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Horas</p>
            </div>
          </div>

          {/* Pending */}
          <div className="flex items-center gap-3 p-3 rounded-xl bg-gradient-to-br from-amber-500/10 to-amber-500/5 border border-amber-500/20">
            <div className="p-2 rounded-lg bg-amber-500/20">
              <Target size={18} className="text-amber-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-amber-500">{pendingTasks}</p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Pendentes</p>
            </div>
          </div>
        </div>

        {/* Right side: Value + Progress */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 lg:gap-6">
          {/* Progress circles */}
          <div className="flex items-center gap-4">
            {/* Completion progress */}
            <div className="relative">
              <svg className="w-16 h-16 transform -rotate-90">
                <circle
                  cx="32"
                  cy="32"
                  r="28"
                  stroke="currentColor"
                  strokeWidth="4"
                  fill="none"
                  className="text-muted/30"
                />
                <circle
                  cx="32"
                  cy="32"
                  r="28"
                  stroke="currentColor"
                  strokeWidth="4"
                  fill="none"
                  strokeDasharray={`${2 * Math.PI * 28}`}
                  strokeDashoffset={`${2 * Math.PI * 28 * (1 - completionRate / 100)}`}
                  className="text-success transition-all duration-1000 ease-out"
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-sm font-bold text-success">{completionRate.toFixed(0)}%</span>
                <span className="text-[8px] text-muted-foreground">Feito</span>
              </div>
            </div>

            {/* Occupancy progress */}
            <div className="relative">
              <svg className="w-16 h-16 transform -rotate-90">
                <circle
                  cx="32"
                  cy="32"
                  r="28"
                  stroke="currentColor"
                  strokeWidth="4"
                  fill="none"
                  className="text-muted/30"
                />
                <circle
                  cx="32"
                  cy="32"
                  r="28"
                  stroke="currentColor"
                  strokeWidth="4"
                  fill="none"
                  strokeDasharray={`${2 * Math.PI * 28}`}
                  strokeDashoffset={`${2 * Math.PI * 28 * (1 - occupancyRate / 100)}`}
                  className="text-primary transition-all duration-1000 ease-out"
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-sm font-bold text-primary">{occupancyRate.toFixed(0)}%</span>
                <span className="text-[8px] text-muted-foreground">Ocupação</span>
              </div>
            </div>
          </div>

          {/* Total value */}
          <div className="flex flex-col items-center sm:items-end p-4 rounded-xl bg-gradient-to-br from-success/10 via-success/5 to-transparent border border-success/20">
            <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1">
              <TrendingUp size={12} />
              <span>Total {monthLabel}</span>
            </div>
            <div className="flex items-center gap-1">
              <Euro size={20} className="text-success" />
              <span className="text-3xl font-bold text-success">{totalValue.toFixed(2)}</span>
            </div>
            <div className="flex items-center gap-2 text-[10px] text-muted-foreground mt-1">
              <span className="text-success">€{completedValue.toFixed(2)} faturado</span>
              <span>•</span>
              <span className="text-amber-500">€{(totalValue - completedValue).toFixed(2)} pendente</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MonthSummaryBar;
