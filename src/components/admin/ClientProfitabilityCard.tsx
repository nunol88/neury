import React, { useMemo } from 'react';
import { Task } from '@/hooks/useAgendamentos';
import { TrendingUp, TrendingDown, Award, AlertTriangle } from 'lucide-react';

interface Props {
  /** All tasks (across all months). Used to compute year-to-date per client. */
  allTasksFlat: Task[];
}

interface ClientProfitability {
  name: string;
  totalHours: number;
  totalRevenue: number;
  servicesCount: number;
  ratePerHour: number;
}

/**
 * Calculates real €/hour per client and shows ranked list.
 * Helps Mayara identify her least profitable clients (so she can renegotiate or replace).
 */
const ClientProfitabilityCard: React.FC<Props> = ({ allTasksFlat }) => {
  const ranking = useMemo<ClientProfitability[]>(() => {
    const map: Record<string, ClientProfitability> = {};

    allTasksFlat.forEach(task => {
      if (!task.completed) return;
      const price = parseFloat(task.price || '0') || 0;
      const start = new Date(`1970-01-01T${task.startTime}`);
      const end = new Date(`1970-01-01T${task.endTime}`);
      const hours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
      if (hours <= 0) return;

      if (!map[task.client]) {
        map[task.client] = {
          name: task.client,
          totalHours: 0,
          totalRevenue: 0,
          servicesCount: 0,
          ratePerHour: 0,
        };
      }
      map[task.client].totalHours += hours;
      map[task.client].totalRevenue += price;
      map[task.client].servicesCount += 1;
    });

    return Object.values(map)
      .map(c => ({ ...c, ratePerHour: c.totalHours > 0 ? c.totalRevenue / c.totalHours : 0 }))
      // Need at least 1h of data to be meaningful
      .filter(c => c.totalHours >= 1)
      .sort((a, b) => a.ratePerHour - b.ratePerHour);
  }, [allTasksFlat]);

  if (ranking.length === 0) {
    return null;
  }

  // Average rate
  const totalRev = ranking.reduce((s, c) => s + c.totalRevenue, 0);
  const totalHrs = ranking.reduce((s, c) => s + c.totalHours, 0);
  const avgRate = totalHrs > 0 ? totalRev / totalHrs : 0;

  return (
    <div className="bg-card rounded-2xl shadow-sm p-6 border border-border animate-fade-in-up hover-lift">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-foreground flex items-center gap-2">
          <Award size={18} className="text-primary" />
          Rentabilidade por Cliente
        </h3>
        <span className="text-xs text-muted-foreground">
          Média: <strong className="text-foreground">€{avgRate.toFixed(2)}/h</strong>
        </span>
      </div>

      <p className="text-xs text-muted-foreground mb-4">
        Calculado com base nos serviços concluídos. Clientes em vermelho pagam abaixo da média.
      </p>

      <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1">
        {ranking.map((c, idx) => {
          const isBelow = c.ratePerHour < avgRate * 0.9;
          const isAbove = c.ratePerHour > avgRate * 1.1;
          const toneBg = isBelow ? 'bg-destructive/5 border-destructive/20' : isAbove ? 'bg-success/5 border-success/20' : 'bg-muted/30 border-border';
          const toneText = isBelow ? 'text-destructive' : isAbove ? 'text-success' : 'text-foreground';
          const Icon = isBelow ? TrendingDown : isAbove ? TrendingUp : AlertTriangle;
          return (
            <div
              key={c.name}
              className={`flex items-center gap-3 p-3 rounded-xl border ${toneBg}`}
            >
              <span className="w-6 h-6 rounded-full bg-card border border-border flex items-center justify-center text-xs font-bold text-muted-foreground shrink-0">
                {idx + 1}
              </span>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-foreground truncate">{c.name}</p>
                <p className="text-xs text-muted-foreground">
                  {c.servicesCount} serviço{c.servicesCount !== 1 ? 's' : ''} · {c.totalHours.toFixed(1)}h · €{c.totalRevenue.toFixed(0)} total
                </p>
              </div>
              <div className={`text-right shrink-0 ${toneText}`}>
                <div className="flex items-center gap-1 font-bold">
                  {(isBelow || isAbove) && <Icon size={14} />}
                  €{c.ratePerHour.toFixed(2)}
                </div>
                <p className="text-[10px] uppercase tracking-wide text-muted-foreground">por hora</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ClientProfitabilityCard;
