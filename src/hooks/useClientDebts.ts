import { useMemo } from 'react';
import { AllTasks, Task } from '@/hooks/useAgendamentos';

export interface ClientDebt {
  clientName: string;
  oldestUnpaidDate: string; // yyyy-MM-dd of the OLDEST completed-but-unpaid service
  daysOld: number;          // days since oldestUnpaidDate (today - date)
  totalDue: number;         // sum of price of all completed-but-unpaid services
  unpaidCount: number;
}

/**
 * Computes, per client, the oldest completed-but-unpaid service age (in days)
 * and the total amount due. Useful to highlight clients with old debts.
 */
export const useClientDebts = (allTasks: AllTasks) => {
  const debtsByClient = useMemo(() => {
    const allFlat: Task[] = Object.values(allTasks).flat();
    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

    const map: Record<string, ClientDebt> = {};

    allFlat.forEach(task => {
      if (!task.completed) return;
      if (task.pago) return;
      // only count services already completed (date <= today)
      if (task.date > todayStr) return;

      const price = parseFloat(task.price || '0') || 0;
      const existing = map[task.client];
      if (!existing) {
        map[task.client] = {
          clientName: task.client,
          oldestUnpaidDate: task.date,
          daysOld: 0,
          totalDue: price,
          unpaidCount: 1,
        };
      } else {
        existing.totalDue += price;
        existing.unpaidCount += 1;
        if (task.date < existing.oldestUnpaidDate) {
          existing.oldestUnpaidDate = task.date;
        }
      }
    });

    // Compute daysOld
    Object.values(map).forEach(d => {
      const oldestDate = new Date(d.oldestUnpaidDate + 'T00:00:00');
      const diff = Math.floor((today.getTime() - oldestDate.getTime()) / (1000 * 60 * 60 * 24));
      d.daysOld = Math.max(0, diff);
    });

    return map;
  }, [allTasks]);

  return debtsByClient;
};
