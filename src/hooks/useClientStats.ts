import { useMemo } from 'react';
import { Task, AllTasks } from '@/hooks/useAgendamentos';
import { Client } from '@/hooks/useClients';

export interface ClientStats {
  clientId: string;
  clientName: string;
  totalAgendamentos: number;
  concluidos: number;
  pendentes: number;
  totalHours: number;
  totalRevenue: number;
  pendingRevenue: number;
  lastService: string | null;
  firstService: string | null;
}

export interface ClientHistory {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  price: string;
  completed: boolean;
  address?: string;
  notes?: string;
}

export const useClientStats = (allTasks: AllTasks, clients: Client[]) => {
  const clientStats = useMemo(() => {
    const allTasksFlat: Task[] = Object.values(allTasks).flat();
    const stats: Record<string, ClientStats> = {};

    // Initialize stats for all clients
    clients.forEach(client => {
      stats[client.nome] = {
        clientId: client.id,
        clientName: client.nome,
        totalAgendamentos: 0,
        concluidos: 0,
        pendentes: 0,
        totalHours: 0,
        totalRevenue: 0,
        pendingRevenue: 0,
        lastService: null,
        firstService: null,
      };
    });

    // Calculate stats from tasks
    allTasksFlat.forEach(task => {
      if (!stats[task.client]) {
        stats[task.client] = {
          clientId: '',
          clientName: task.client,
          totalAgendamentos: 0,
          concluidos: 0,
          pendentes: 0,
          totalHours: 0,
          totalRevenue: 0,
          pendingRevenue: 0,
          lastService: null,
          firstService: null,
        };
      }

      const stat = stats[task.client];
      stat.totalAgendamentos += 1;

      // Calculate hours
      const start = new Date(`1970-01-01T${task.startTime}`);
      const end = new Date(`1970-01-01T${task.endTime}`);
      const hours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);

      const price = parseFloat(task.price || '0');

      if (task.completed) {
        stat.concluidos += 1;
        stat.totalHours += hours;
        stat.totalRevenue += price;
      } else {
        stat.pendentes += 1;
        stat.pendingRevenue += price;
      }

      // Track first and last service
      if (!stat.firstService || task.date < stat.firstService) {
        stat.firstService = task.date;
      }
      if (!stat.lastService || task.date > stat.lastService) {
        stat.lastService = task.date;
      }
    });

    return stats;
  }, [allTasks, clients]);

  const getClientHistory = (clientName: string): ClientHistory[] => {
    const allTasksFlat: Task[] = Object.values(allTasks).flat();
    return allTasksFlat
      .filter(task => task.client === clientName)
      .sort((a, b) => {
        // Sort by date descending, then by startTime descending
        if (a.date !== b.date) {
          return b.date.localeCompare(a.date);
        }
        return b.startTime.localeCompare(a.startTime);
      })
      .map(task => ({
        id: task.id,
        date: task.date,
        startTime: task.startTime,
        endTime: task.endTime,
        price: task.price || '0',
        completed: task.completed,
        address: task.address,
        notes: task.notes,
      }));
  };

  return {
    clientStats,
    getClientHistory,
  };
};
