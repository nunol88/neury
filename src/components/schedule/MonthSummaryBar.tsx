import React from 'react';
import { Task } from '@/hooks/useAgendamentos';
import { Calendar, CheckCircle2, Clock, Euro, TrendingUp, Target } from 'lucide-react';

interface MonthSummaryBarProps {
  tasks: Task[];
  monthLabel: string;
  totalDays: number;
  isAdmin?: boolean;
  extrasTotal?: number;
}

const EMPLOYEE_RATE = 7;

const getTaskPrice = (t: Task, isAdmin: boolean): number => {
  if (isAdmin) return parseFloat(t.price) || 0;
  const start = new Date(`1970-01-01T${t.startTime}`);
  const end = new Date(`1970-01-01T${t.endTime}`);
  const hours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
  return hours * EMPLOYEE_RATE;
};

interface SummaryMetricProps {
  icon: React.ReactNode;
  value: string | number;
  label: string;
  tone: 'primary' | 'success' | 'warning' | 'muted';
}

const toneClasses: Record<SummaryMetricProps['tone'], { tile: string; icon: string; value: string }> = {
  primary: {
    tile: 'from-primary/10 to-primary/5 border-primary/20',
    icon: 'bg-primary/15 text-primary',
    value: 'text-primary',
  },
  success: {
    tile: 'from-success/10 to-success/5 border-success/20',
    icon: 'bg-success/15 text-success',
    value: 'text-success',
  },
  warning: {
    tile: 'from-warning/10 to-warning/5 border-warning/20',
    icon: 'bg-warning/15 text-warning',
    value: 'text-warning',
  },
  muted: {
    tile: 'from-secondary to-secondary/50 border-border/50',
    icon: 'bg-muted text-muted-foreground',
    value: 'text-foreground',
  },
};

const SummaryMetric: React.FC<SummaryMetricProps> = ({ icon, value, label, tone }) => {
  const classes = toneClasses[tone];

  return (
    <div className={`min-h-[86px] rounded-xl border bg-gradient-to-br p-3 ${classes.tile}`}>
      <div className="flex h-full min-w-0 flex-col justify-between gap-2">
        <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${classes.icon}`}>
          {icon}
        </div>
        <div className="min-w-0">
          <p className={`text-2xl font-bold leading-none ${classes.value}`}>{value}</p>
          <p className="mt-1 truncate text-[10px] font-semibold uppercase leading-tight tracking-normal text-muted-foreground">
            {label}
          </p>
        </div>
      </div>
    </div>
  );
};

const MonthSummaryBar: React.FC<MonthSummaryBarProps> = ({
  tasks,
  monthLabel,
  totalDays,
  isAdmin = true,
  extrasTotal = 0,
}) => {
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(t => t.completed).length;
  const pendingTasks = totalTasks - completedTasks;
  
  const totalValue = tasks.reduce((sum, t) => sum + getTaskPrice(t, isAdmin), 0) + extrasTotal;
  const completedValue = tasks.filter(t => t.completed).reduce((sum, t) => sum + getTaskPrice(t, isAdmin), 0) + extrasTotal;
  
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
    <div className="glass-card rounded-2xl border border-border/50 p-3 shadow-lg animate-slide-up sm:p-4">
      <div className="grid gap-3 xl:grid-cols-[1fr_360px] xl:items-stretch">
        <div className="grid min-w-0 grid-cols-2 gap-2 sm:gap-3 xl:grid-cols-4">
          <SummaryMetric icon={<Calendar size={17} />} value={totalTasks} label="Agendamentos" tone="primary" />
          <SummaryMetric icon={<CheckCircle2 size={17} />} value={completedTasks} label="Concluídos" tone="success" />
          <SummaryMetric icon={<Clock size={17} />} value={`${totalHours.toFixed(0)}h`} label="Horas" tone="muted" />
          <SummaryMetric icon={<Target size={17} />} value={pendingTasks} label="Pendentes" tone="warning" />
        </div>

        <div className="grid gap-2 sm:gap-3 xl:grid-cols-1">
          <div className="grid grid-cols-1 gap-3 rounded-xl border border-border/50 bg-secondary/45 p-3 sm:grid-cols-2">
            <div className="min-w-0">
              <div className="mb-2 flex items-center justify-between gap-2">
                <span className="truncate text-[10px] font-semibold uppercase tracking-normal text-muted-foreground">Feito</span>
                <span className="shrink-0 text-sm font-bold text-success">{completionRate.toFixed(0)}%</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-success transition-all duration-1000 ease-out"
                  style={{ width: `${completionRate}%` }}
                />
              </div>
            </div>

            <div className="min-w-0">
              <div className="mb-2 flex items-center justify-between gap-2">
                <span className="truncate text-[10px] font-semibold uppercase tracking-normal text-muted-foreground">Ocupação</span>
                <span className="shrink-0 text-sm font-bold text-primary">{occupancyRate.toFixed(0)}%</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-primary transition-all duration-1000 ease-out"
                  style={{ width: `${occupancyRate}%` }}
                />
              </div>
            </div>
          </div>

          <div className="min-w-0 rounded-xl border border-success/20 bg-gradient-to-br from-success/10 via-success/5 to-card/30 p-3 sm:p-4">
            <div className="mb-1 flex min-w-0 items-center gap-1 text-xs text-muted-foreground">
              <TrendingUp size={12} className="shrink-0" />
              <span className="truncate">Total {monthLabel}</span>
            </div>
            <div className="flex min-w-0 items-center gap-1">
              <Euro size={18} className="shrink-0 text-success" />
              <span className="truncate text-2xl font-bold leading-tight text-success">{totalValue.toFixed(2)}</span>
            </div>
            <div className="mt-1 grid grid-cols-1 gap-0.5 text-[10px] leading-tight text-muted-foreground md:grid-cols-2 xl:grid-cols-1">
              <span className="truncate text-success">€{completedValue.toFixed(2)} faturado</span>
              <span className="truncate text-warning">€{(totalValue - completedValue).toFixed(2)} pendente</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MonthSummaryBar;
