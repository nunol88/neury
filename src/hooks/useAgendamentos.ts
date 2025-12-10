import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { Database } from '@/integrations/supabase/types';

type AgendamentoRow = Database['public']['Tables']['agendamentos']['Row'];
type AgendamentoInsert = Database['public']['Tables']['agendamentos']['Insert'];

export interface Task {
  id: string;
  date: string;
  client: string;
  phone: string;
  startTime: string;
  endTime: string;
  address: string;
  pricePerHour: string;
  price: string;
  notes: string;
  completed: boolean;
}

export interface AllTasks {
  december: Task[];
  january: Task[];
  february: Task[];
}

const getMonthKeyFromDate = (dateString: string): keyof AllTasks | null => {
  // Parse date string as YYYY-MM-DD to get correct month/year
  const parts = dateString.split('-');
  if (parts.length !== 3) return null;
  
  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10) - 1; // 0-indexed

  if (month === 11 && year === 2025) return 'december';
  if (month === 0 && year === 2026) return 'january';
  if (month === 1 && year === 2026) return 'february';
  return null;
};

const mapRowToTask = (row: AgendamentoRow): Task => {
  const startDate = new Date(row.data_inicio);
  const endDate = new Date(row.data_fim);
  
  // Format date as YYYY-MM-DD using UTC to avoid timezone issues
  const year = startDate.getUTCFullYear();
  const month = String(startDate.getUTCMonth() + 1).padStart(2, '0');
  const day = String(startDate.getUTCDate()).padStart(2, '0');
  const dateStr = `${year}-${month}-${day}`;
  
  // Format times using UTC
  const startHours = String(startDate.getUTCHours()).padStart(2, '0');
  const startMinutes = String(startDate.getUTCMinutes()).padStart(2, '0');
  const startTime = `${startHours}:${startMinutes}`;
  
  const endHours = String(endDate.getUTCHours()).padStart(2, '0');
  const endMinutes = String(endDate.getUTCMinutes()).padStart(2, '0');
  const endTime = `${endHours}:${endMinutes}`;
  
  // Parse descricao JSON for additional fields
  let parsedData: any = {};
  if (row.descricao) {
    try {
      parsedData = JSON.parse(row.descricao);
    } catch {
      parsedData = { notes: row.descricao };
    }
  }

  return {
    id: row.id,
    date: dateStr,
    client: row.cliente_nome,
    phone: row.cliente_contacto || '',
    startTime,
    endTime,
    address: parsedData.address || '',
    pricePerHour: parsedData.pricePerHour || '7',
    price: parsedData.price || '0',
    notes: parsedData.notes || '',
    completed: row.status === 'concluido'
  };
};

const mapTaskToInsert = (task: Omit<Task, 'id'>): AgendamentoInsert => {
  // Create UTC dates to avoid timezone issues
  const startDateTime = new Date(`${task.date}T${task.startTime}:00Z`);
  const endDateTime = new Date(`${task.date}T${task.endTime}:00Z`);

  return {
    cliente_nome: task.client,
    cliente_contacto: task.phone || null,
    data_inicio: startDateTime.toISOString(),
    data_fim: endDateTime.toISOString(),
    descricao: JSON.stringify({
      address: task.address,
      pricePerHour: task.pricePerHour,
      price: task.price,
      notes: task.notes
    }),
    status: task.completed ? 'concluido' : 'agendado'
  };
};

export const useAgendamentos = () => {
  const [allTasks, setAllTasks] = useState<AllTasks>({
    december: [],
    january: [],
    february: []
  });
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchAgendamentos = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('agendamentos')
        .select('*')
        .order('data_inicio', { ascending: true });

      if (error) throw error;

      const tasks: AllTasks = { december: [], january: [], february: [] };
      
      (data || []).forEach((row) => {
        const task = mapRowToTask(row);
        const monthKey = getMonthKeyFromDate(task.date);
        if (monthKey) {
          tasks[monthKey].push(task);
        }
      });

      setAllTasks(tasks);
    } catch (error: any) {
      console.error('Error fetching agendamentos:', error);
      toast({
        title: 'Erro ao carregar agendamentos',
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchAgendamentos();
  }, [fetchAgendamentos]);

  const addTask = async (taskData: Omit<Task, 'id'>): Promise<Task | null> => {
    try {
      const insertData = mapTaskToInsert(taskData);
      
      const { data, error } = await supabase
        .from('agendamentos')
        .insert(insertData)
        .select()
        .single();

      if (error) throw error;

      const newTask = mapRowToTask(data);
      const monthKey = getMonthKeyFromDate(newTask.date);
      
      if (monthKey) {
        setAllTasks(prev => ({
          ...prev,
          [monthKey]: [...prev[monthKey], newTask]
        }));
      }

      return newTask;
    } catch (error: any) {
      console.error('Error adding agendamento:', error);
      toast({
        title: 'Erro ao criar agendamento',
        description: error.message,
        variant: 'destructive'
      });
      return null;
    }
  };

  const updateTask = async (id: string, taskData: Omit<Task, 'id'>): Promise<boolean> => {
    try {
      const updateData = mapTaskToInsert(taskData);
      
      const { error } = await supabase
        .from('agendamentos')
        .update(updateData)
        .eq('id', id);

      if (error) throw error;

      // Refresh data to ensure consistency
      await fetchAgendamentos();
      return true;
    } catch (error: any) {
      console.error('Error updating agendamento:', error);
      toast({
        title: 'Erro ao atualizar agendamento',
        description: error.message,
        variant: 'destructive'
      });
      return false;
    }
  };

  const deleteTask = async (id: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('agendamentos')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setAllTasks(prev => ({
        december: prev.december.filter(t => t.id !== id),
        january: prev.january.filter(t => t.id !== id),
        february: prev.february.filter(t => t.id !== id)
      }));

      return true;
    } catch (error: any) {
      console.error('Error deleting agendamento:', error);
      toast({
        title: 'Erro ao eliminar agendamento',
        description: error.message,
        variant: 'destructive'
      });
      return false;
    }
  };

  const toggleTaskStatus = async (id: string, currentlyCompleted: boolean): Promise<boolean> => {
    try {
      const newStatus = currentlyCompleted ? 'agendado' : 'concluido';
      
      const { error } = await supabase
        .from('agendamentos')
        .update({ status: newStatus })
        .eq('id', id);

      if (error) throw error;

      setAllTasks(prev => ({
        december: prev.december.map(t => t.id === id ? { ...t, completed: !currentlyCompleted } : t),
        january: prev.january.map(t => t.id === id ? { ...t, completed: !currentlyCompleted } : t),
        february: prev.february.map(t => t.id === id ? { ...t, completed: !currentlyCompleted } : t)
      }));

      return true;
    } catch (error: any) {
      console.error('Error toggling status:', error);
      toast({
        title: 'Erro ao alterar status',
        description: error.message,
        variant: 'destructive'
      });
      return false;
    }
  };

  const moveTask = async (id: string, newDate: string): Promise<boolean> => {
    // Find the task in any month
    let taskToMove: Task | null = null;
    
    for (const monthKey of ['december', 'january', 'february'] as const) {
      const found = allTasks[monthKey].find(t => t.id === id);
      if (found) {
        taskToMove = found;
        break;
      }
    }

    if (!taskToMove) return false;

    const updatedTask = { ...taskToMove, date: newDate };
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { id: _, ...taskWithoutId } = updatedTask;
    
    return await updateTask(id, taskWithoutId);
  };

  return {
    allTasks,
    loading,
    addTask,
    updateTask,
    deleteTask,
    toggleTaskStatus,
    moveTask,
    refetch: fetchAgendamentos
  };
};
