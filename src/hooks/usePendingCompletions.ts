import { useEffect, useMemo, useState, useCallback } from 'react';
import type { Task, AllTasks } from '@/hooks/useAgendamentos';

/**
 * Identifies tasks whose end time has passed but are still not marked as completed.
 * Re-evaluates every 60s so a task naturally "becomes" overdue once its end time hits.
 */
export function usePendingCompletions(allTasks: AllTasks) {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(interval);
  }, []);

  const overdueTasks = useMemo<Task[]>(() => {
    const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    const nowMinutes = now.getHours() * 60 + now.getMinutes();
    const flat: Task[] = [];
    for (const key of Object.keys(allTasks) as (keyof AllTasks)[]) {
      const list = allTasks[key] || [];
      for (const t of list) {
        if (t.completed) continue;
        if (t.date < todayStr) {
          flat.push(t);
        } else if (t.date === todayStr) {
          const [h, m] = (t.endTime || '00:00').split(':').map(Number);
          if (h * 60 + m <= nowMinutes) flat.push(t);
        }
      }
    }
    return flat.sort((a, b) =>
      a.date === b.date ? a.startTime.localeCompare(b.startTime) : a.date.localeCompare(b.date)
    );
  }, [allTasks, now]);

  const overdueIds = useMemo(() => new Set(overdueTasks.map(t => t.id)), [overdueTasks]);
  const isOverdue = useCallback((task: Task) => overdueIds.has(task.id), [overdueIds]);

  return { overdueTasks, count: overdueTasks.length, isOverdue };
}
