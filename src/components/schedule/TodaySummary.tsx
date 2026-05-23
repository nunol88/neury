import React, { useState } from 'react';
import { Task } from '@/hooks/useAgendamentos';
import { CalendarCheck, Clock, Euro, TrendingUp, Sparkles, ChevronDown, ChevronUp, Phone, Navigation, MessageCircle, FileText } from 'lucide-react';
import { buildServiceConfirmationMessage, openWhatsApp } from '@/utils/whatsappMessages';
import { generateDailyRoutePdf } from '@/utils/dailyRoutePdf';
import NextServiceHero from './NextServiceHero';

interface TodaySummaryProps {
  tasks: Task[];
  onScrollToToday?: () => void;
  isAdmin?: boolean;
  onArrived?: (id: string) => void;
  onLeft?: (id: string) => void;
}

const NEURY_RATE = 7;

const getTaskPrice = (t: Task, isAdmin: boolean): number => {
  if (isAdmin) return parseFloat(t.price) || 0;
  const start = new Date(`1970-01-01T${t.startTime}`);
  const end = new Date(`1970-01-01T${t.endTime}`);
  const hours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
  return hours * NEURY_RATE;
};

const TodaySummary: React.FC<TodaySummaryProps> = ({ tasks, onScrollToToday, isAdmin = true, onArrived, onLeft }) => {
  const [expanded, setExpanded] = useState(false);
  const todayTasks = tasks;
  const completedTasks = todayTasks.filter(t => t.completed);
  const pendingTasks = todayTasks.filter(t => !t.completed);
  
  const totalValue = todayTasks.reduce((sum, t) => sum + getTaskPrice(t, isAdmin), 0);
  const completedValue = completedTasks.reduce((sum, t) => sum + getTaskPrice(t, isAdmin), 0);
  
  const progress = todayTasks.length > 0 
    ? Math.round((completedTasks.length / todayTasks.length) * 100) 
    : 0;

  // Find next pending task (earliest by startTime)
  const nextTask = pendingTasks
    .sort((a, b) => a.startTime.localeCompare(b.startTime))[0];

  const isAllDone = todayTasks.length > 0 && completedTasks.length === todayTasks.length;

  return (
    <div
      className={`glass-card rounded-2xl p-4 mb-6 transition-all duration-300 hover:shadow-xl animate-fade-in ${
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

      {/* Quick actions row */}
      {todayTasks.length > 0 && (
        <>
          <div className="mt-4 flex gap-2">
            <button
              type="button"
              onClick={() => setExpanded(v => !v)}
              className="flex-1 inline-flex items-center justify-center gap-1.5 text-xs font-medium px-3 py-2 rounded-lg bg-secondary/60 hover:bg-secondary text-card-foreground transition-colors"
            >
              {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              {expanded ? 'Esconder lista' : `Ver ${todayTasks.length} serviço${todayTasks.length > 1 ? 's' : ''}`}
            </button>
            {onScrollToToday && (
              <button
                type="button"
                onClick={onScrollToToday}
                className="inline-flex items-center justify-center gap-1.5 text-xs font-medium px-3 py-2 rounded-lg bg-primary/15 hover:bg-primary/25 text-primary transition-colors"
              >
                Ir para hoje
              </button>
            )}
            <button
              type="button"
              onClick={() => {
                const today = new Date();
                const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
                generateDailyRoutePdf(todayStr, todayTasks);
              }}
              className="inline-flex items-center justify-center gap-1.5 text-xs font-medium px-3 py-2 rounded-lg bg-secondary/60 hover:bg-secondary text-card-foreground transition-colors"
              title="Gerar PDF da folha do dia"
            >
              <FileText size={14} />
              PDF
            </button>
          </div>

          {/* Expanded service list */}
          {expanded && (
            <ul className="mt-3 space-y-2 animate-fade-in">
              {todayTasks
                .slice()
                .sort((a, b) => a.startTime.localeCompare(b.startTime))
                .map(task => {
                  const mapsHref = task.address
                    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(task.address)}`
                    : null;
                  return (
                    <li
                      key={task.id}
                      className={`flex items-center gap-2 p-2.5 rounded-lg border ${
                        task.completed
                          ? 'bg-success/5 border-success/30 opacity-70'
                          : 'bg-secondary/40 border-border'
                      }`}
                    >
                      <div className="text-xs font-bold text-primary w-12 shrink-0 tabular-nums">
                        {task.startTime}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-card-foreground truncate">
                          {task.client}
                        </p>
                        {task.address && (
                          <p className="text-[11px] text-muted-foreground truncate">
                            {task.address}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        {task.phone && (
                          <a
                            href={`tel:${task.phone}`}
                            className="p-1.5 rounded-md hover:bg-primary/10 text-primary"
                            aria-label="Ligar"
                            title="Ligar"
                          >
                            <Phone size={14} />
                          </a>
                        )}
                        {task.phone && (
                          <button
                            type="button"
                            onClick={() =>
                              openWhatsApp(
                                task.phone,
                                buildServiceConfirmationMessage(
                                  task.client,
                                  task.date,
                                  task.startTime,
                                  task.endTime
                                )
                              )
                            }
                            className="p-1.5 rounded-md hover:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                            aria-label="Confirmar por WhatsApp"
                            title="Confirmar por WhatsApp"
                          >
                            <MessageCircle size={14} />
                          </button>
                        )}
                        {mapsHref && (
                          <a
                            href={mapsHref}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 rounded-md hover:bg-blue-500/10 text-blue-600 dark:text-blue-400"
                            aria-label="Abrir no Maps"
                            title="Abrir no Maps"
                          >
                            <Navigation size={14} />
                          </a>
                        )}
                      </div>
                    </li>
                  );
                })}
            </ul>
          )}
        </>
      )}
    </div>
  );
};

export default TodaySummary;
