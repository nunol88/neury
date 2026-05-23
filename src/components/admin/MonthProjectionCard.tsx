import React, { useMemo } from 'react';
import { Task } from '@/hooks/useAgendamentos';
import { Crystal, Sparkles, TrendingUp } from 'lucide-react';
import { parseISO, getDaysInMonth } from 'date-fns';

interface Props {
  /** All tasks for the CURRENT month (filtered by caller). */
  monthTasks: Task[];
  /** Optional extras net total to add. */
  extrasNetTotal?: number;
}

/**
 * Projects month-end revenue based on:
 *  - already-billed (completed): receita garantida
 *  - already-scheduled (pending in future): receita esperada
 *  - linear extrapolation from current pace (services per day so far)
 *
 * Only renders when the displayed month is the CURRENT month.
 */
const MonthProjectionCard: React.FC<Props> = ({ monthTasks, extrasNetTotal = 0 }) => {
  const projection = useMemo(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    const todayDay = now.getDate();
    const daysInMonth = getDaysInMonth(now);
    const daysRemaining = daysInMonth - todayDay;

    // Verify we have tasks for the current month
    const thisMonthTasks = monthTasks.filter(t => {
      const d = parseISO(t.date);
      return d.getFullYear() === year && d.getMonth() === month;
    });

    if (thisMonthTasks.length === 0) return null;

    const todayStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(todayDay).padStart(2, '0')}`;

    const completed = thisMonthTasks.filter(t => t.completed);
    const scheduledFuture = thisMonthTasks.filter(t => !t.completed && t.date >= todayStr);
    const missed = thisMonthTasks.filter(t => !t.completed && t.date < todayStr);

    const completedRevenue = completed.reduce((s, t) => s + (parseFloat(t.price) || 0), 0);
    const scheduledFutureRevenue = scheduledFuture.reduce((s, t) => s + (parseFloat(t.price) || 0), 0);
    // Optimistic projection = completed + scheduled future + extras
    const baseProjection = completedRevenue + scheduledFutureRevenue + extrasNetTotal;

    // Trend-based extrapolation: if pace continues, what's the rough monthly total?
    const dailyAvg = todayDay > 0 ? completedRevenue / todayDay : 0;
    const linearProjection = dailyAvg * daysInMonth + extrasNetTotal;

    return {
      completedRevenue,
      scheduledFutureRevenue,
      baseProjection,
      linearProjection,
      missedCount: missed.length,
      daysRemaining,
      daysInMonth,
      todayDay,
    };
  }, [monthTasks, extrasNetTotal]);

  if (!projection) return null;

  return (
    <div className="relative overflow-hidden rounded-2xl p-5 text-white animate-fade-in-up hover-lift glass-gradient"
         style={{ background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.9) 0%, rgba(139, 92, 246, 0.85) 100%)' }}>
      <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-xl" />
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Sparkles size={20} className="opacity-90" />
            <span className="text-sm font-medium opacity-90">Projeção do Mês</span>
          </div>
          <span className="text-[10px] uppercase tracking-wide opacity-70">
            Dia {projection.todayDay}/{projection.daysInMonth}
          </span>
        </div>
        <p className="text-3xl font-bold drop-shadow-sm">
          €{projection.baseProjection.toFixed(2)}
        </p>
        <p className="text-xs opacity-80 mt-1">
          €{projection.completedRevenue.toFixed(0)} feito + €{projection.scheduledFutureRevenue.toFixed(0)} agendado
        </p>
        <div className="mt-3 pt-3 border-t border-white/20 flex items-center justify-between text-xs">
          <div className="flex items-center gap-1 opacity-90">
            <TrendingUp size={12} />
            <span>Ritmo atual: €{projection.linearProjection.toFixed(0)}/mês</span>
          </div>
          <span className="opacity-80">{projection.daysRemaining} dia{projection.daysRemaining !== 1 ? 's' : ''} restantes</span>
        </div>
        {projection.missedCount > 0 && (
          <p className="mt-2 text-[11px] bg-white/15 rounded-md px-2 py-1 inline-block">
            ⚠ {projection.missedCount} serviço{projection.missedCount !== 1 ? 's' : ''} sem marcar como concluído
          </p>
        )}
      </div>
    </div>
  );
};

export default MonthProjectionCard;
