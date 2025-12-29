import React from 'react';
import { Task } from '@/hooks/useAgendamentos';
import { CalendarCheck, Clock, Euro, TrendingUp, Sparkles } from 'lucide-react';

interface TodaySummaryProps {
  tasks: Task[];
  onScrollToToday?: () => void;
}

const TodaySummary: React.FC<TodaySummaryProps> = ({ tasks, onScrollToToday }) => {
  const todayTasks = tasks;
  const completedTasks = todayTasks.filter(t => t.completed);
  const pendingTasks = todayTasks.filter(t => !t.completed);
  
  const totalValue = todayTasks.reduce((sum, t) => sum + (parseFloat(t.price) || 0), 0);
  const completedValue = completedTasks.reduce((sum, t) => sum + (parseFloat(t.price) || 0), 0);
  
  const progress = todayTasks.length > 0 
    ? Math.round((completedTasks.length / todayTasks.length) * 100) 
    : 0;

  // Find next pending task (earliest by startTime)
  const nextTask = pendingTasks
    .sort((a, b) => a.startTime.localeCompare(b.startTime))[0];

  const isAllDone = todayTasks.length > 0 && completedTasks.length === todayTasks.length;

  return (
    <div 
      onClick={onScrollToToday}
      className={`glass-card rounded-2xl p-4 mb-6 cursor-pointer transition-all duration-300 hover:scale-[1.01] hover:shadow-xl animate-fade-in ${
        isAllDone ? 'ring-2 ring-success shadow-glow-success' : ''
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className={`p-2 rounded-xl ${isAllDone ? 'bg-success/20' : 'bg-primary/20'}`}>
            <CalendarCheck className={`w-5 h-5 ${isAllDone ? 'text-success' : 'text-primary'}`} />
          </div>
          <div>
            <h3 className="font-bold text-card-foreground flex items-center gap-2">
              Hoje
              {isAllDone && (
                <span className="flex items-center gap-1 text-xs bg-success/20 text-success px-2 py-0.5 rounded-full">
                  <Sparkles size={10} />
                  Tudo feito!
                </span>
              )}
            </h3>
            <p className="text-xs text-muted-foreground">
              {new Date().toLocaleDateString('pt-PT', { weekday: 'long', day: 'numeric', month: 'long' })}
            </p>
          </div>
        </div>
        
        {/* Progress Badge */}
        <div className={`px-3 py-1.5 rounded-full text-sm font-bold ${
          isAllDone 
            ? 'bg-success text-success-foreground' 
            : progress > 0 
              ? 'bg-primary/20 text-primary' 
              : 'bg-muted text-muted-foreground'
        }`}>
          {completedTasks.length}/{todayTasks.length}
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-4">
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <div 
            className={`h-full transition-all duration-500 ease-out rounded-full ${
              isAllDone ? 'bg-success' : 'bg-primary'
            }`}
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="text-xs text-muted-foreground mt-1 text-right">{progress}% concluído</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-3 gap-3">
        {/* Next Task */}
        <div className="bg-secondary/50 rounded-xl p-3">
          <div className="flex items-center gap-1.5 mb-1">
            <Clock size={12} className="text-muted-foreground" />
            <span className="text-[10px] text-muted-foreground uppercase tracking-wide">Próximo</span>
          </div>
          {nextTask ? (
            <div>
              <p className="text-sm font-semibold text-card-foreground truncate">{nextTask.client}</p>
              <p className="text-xs text-primary font-medium">{nextTask.startTime}</p>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground italic">
              {todayTasks.length === 0 ? 'Sem trabalhos' : 'Nenhum'}
            </p>
          )}
        </div>

        {/* Pending */}
        <div className="bg-secondary/50 rounded-xl p-3">
          <div className="flex items-center gap-1.5 mb-1">
            <TrendingUp size={12} className="text-muted-foreground" />
            <span className="text-[10px] text-muted-foreground uppercase tracking-wide">Por fazer</span>
          </div>
          <p className={`text-xl font-bold ${pendingTasks.length > 0 ? 'text-warning' : 'text-success'}`}>
            {pendingTasks.length}
          </p>
        </div>

        {/* Total Value */}
        <div className="bg-secondary/50 rounded-xl p-3">
          <div className="flex items-center gap-1.5 mb-1">
            <Euro size={12} className="text-muted-foreground" />
            <span className="text-[10px] text-muted-foreground uppercase tracking-wide">Total</span>
          </div>
          <div>
            <p className="text-xl font-bold text-success">€{totalValue.toFixed(0)}</p>
            {completedValue > 0 && completedValue < totalValue && (
              <p className="text-[10px] text-muted-foreground">€{completedValue.toFixed(0)} feito</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TodaySummary;
