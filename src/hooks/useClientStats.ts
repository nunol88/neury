import { useMemo } from 'react';
import { Task, AllTasks } from '@/hooks/useAgendamentos';
import { Client } from '@/hooks/useClients';
import { MonthConfig } from '@/utils/monthConfig';

export interface ClientStats {
  clientId: string;
  clientName: string;
  totalAgendamentos: number;
  concluidos: number;
  pendentes: number;
  totalHours: number;
  totalRevenue: number;
  pendingRevenue: number;
  paidRevenue: number;
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
  pago: boolean;
  address?: string;
  notes?: string;
}

export interface MonthlyClientStats {
  monthKey: string;
  monthLabel: string;
  year: number;
  monthIndex: number;
  clients: Record<string, ClientStats>;
  totals: {
    totalAgendamentos: number;
    concluidos: number;
    pendentes: number;
    totalHours: number;
    totalRevenue: number;
    paidRevenue: number;
  };
}

export const useClientStats = (
  allTasks: AllTasks, 
  clients: Client[],
  monthsConfig?: Record<string, MonthConfig>
) => {
  // Calculate stats for a specific month
  const getStatsForMonth = useMemo(() => {
    return (monthKey: string | null): MonthlyClientStats | null => {
      if (!monthKey || !monthsConfig || !monthsConfig[monthKey]) return null;

      const config = monthsConfig[monthKey];
      const allTasksFlat: Task[] = Object.values(allTasks).flat();
      
      // Filter tasks for this specific month
      const monthTasks = allTasksFlat.filter(task => {
        const taskDate = new Date(task.date);
        return taskDate.getFullYear() === config.year && 
               taskDate.getMonth() === config.monthIndex;
      });

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
          paidRevenue: 0,
          lastService: null,
          firstService: null,
        };
      });

      // Calculate stats from tasks
      monthTasks.forEach(task => {
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
            paidRevenue: 0,
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
          if (task.pago) {
            stat.paidRevenue += price;
          }
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

      // Calculate totals
      const totals = {
        totalAgendamentos: 0,
        concluidos: 0,
        pendentes: 0,
        totalHours: 0,
        totalRevenue: 0,
        paidRevenue: 0,
      };

      Object.values(stats).forEach(stat => {
        totals.totalAgendamentos += stat.totalAgendamentos;
        totals.concluidos += stat.concluidos;
        totals.pendentes += stat.pendentes;
        totals.totalHours += stat.totalHours;
        totals.totalRevenue += stat.totalRevenue;
        totals.paidRevenue += stat.paidRevenue;
      });

      return {
        monthKey,
        monthLabel: config.label,
        year: config.year,
        monthIndex: config.monthIndex,
        clients: stats,
        totals,
      };
    };
  }, [allTasks, clients, monthsConfig]);

  // Overall stats (all time)
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
        paidRevenue: 0,
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
          paidRevenue: 0,
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
        if (task.pago) {
          stat.paidRevenue += price;
        }
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

  const getClientHistory = (clientName: string, monthKey?: string | null): ClientHistory[] => {
    const allTasksFlat: Task[] = Object.values(allTasks).flat();
    
    let filteredTasks = allTasksFlat.filter(task => task.client === clientName);
    
    // Filter by month if provided
    if (monthKey && monthsConfig && monthsConfig[monthKey]) {
      const config = monthsConfig[monthKey];
      filteredTasks = filteredTasks.filter(task => {
        const taskDate = new Date(task.date);
        return taskDate.getFullYear() === config.year && 
               taskDate.getMonth() === config.monthIndex;
      });
    }
    
    return filteredTasks
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
        pago: task.pago || false,
        address: task.address,
        notes: task.notes,
      }));
  };

  // Get available months with data
  const getMonthsWithData = useMemo(() => {
    if (!monthsConfig) return [];
    
    const allTasksFlat: Task[] = Object.values(allTasks).flat();
    const monthsWithData: string[] = [];
    
    Object.entries(monthsConfig).forEach(([key, config]) => {
      const hasData = allTasksFlat.some(task => {
        const taskDate = new Date(task.date);
        return taskDate.getFullYear() === config.year && 
               taskDate.getMonth() === config.monthIndex;
      });
      if (hasData) {
        monthsWithData.push(key);
      }
    });
    
    // Sort by year and month
    return monthsWithData.sort((a, b) => {
      const configA = monthsConfig[a];
      const configB = monthsConfig[b];
      if (configA.year !== configB.year) return configB.year - configA.year;
      return configB.monthIndex - configA.monthIndex;
    });
  }, [allTasks, monthsConfig]);

  return {
    clientStats,
    getClientHistory,
    getStatsForMonth,
    getMonthsWithData,
  };
};
