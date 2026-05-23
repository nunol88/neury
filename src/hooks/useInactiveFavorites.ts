import { useMemo } from 'react';
import { Task, AllTasks } from '@/hooks/useAgendamentos';
import { Client } from '@/hooks/useClients';

export interface InactiveFavorite {
  client: Client;
  lastServiceDate: string | null; // ISO yyyy-mm-dd
  daysSince: number; // 9999 if never
}

const DAYS_THRESHOLD = 30;

export const useInactiveFavorites = (
  allTasks: AllTasks,
  clients: Client[]
): InactiveFavorite[] => {
  return useMemo(() => {
    const tasksFlat: Task[] = Object.values(allTasks).flat();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const favorites = clients.filter((c) => c.favorito);

    const result: InactiveFavorite[] = favorites.map((client) => {
      const clientTasks = tasksFlat
        .filter((t) => t.client === client.nome && t.completed)
        .sort((a, b) => b.date.localeCompare(a.date));
      const last = clientTasks[0];
      if (!last) {
        return { client, lastServiceDate: null, daysSince: 9999 };
      }
      const lastDate = new Date(last.date + 'T00:00:00');
      const days = Math.floor((today.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));
      return { client, lastServiceDate: last.date, daysSince: days };
    });

    return result
      .filter((r) => r.daysSince >= DAYS_THRESHOLD)
      .sort((a, b) => b.daysSince - a.daysSince);
  }, [allTasks, clients]);
};
