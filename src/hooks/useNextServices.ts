import { useMemo } from 'react';
import { AllTasks, Task } from '@/hooks/useAgendamentos';

export interface NextServiceInfo {
  date: string;
  startTime: string;
  endTime: string;
  daysAhead: number;
}

/**
 * For each client, find the next non-completed scheduled service from today onwards.
 */
export const useNextServices = (allTasks: AllTasks) => {
  return useMemo(() => {
    const flat: Task[] = Object.values(allTasks).flat();
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStr = today.toISOString().slice(0, 10);

    const map: Record<string, NextServiceInfo> = {};
    flat.forEach(t => {
      if (t.completed) return;
      if (t.date < todayStr) return;
      const existing = map[t.client];
      if (!existing || t.date < existing.date || (t.date === existing.date && t.startTime < existing.startTime)) {
        const daysAhead = Math.floor(
          (new Date(t.date).getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
        );
        map[t.client] = {
          date: t.date,
          startTime: t.startTime,
          endTime: t.endTime,
          daysAhead,
        };
      }
    });
    return map;
  }, [allTasks]);
};
