import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { Database } from '@/integrations/supabase/types';
import { z } from 'zod';

type AgendamentoRow = Database['public']['Tables']['agendamentos']['Row'];
type AgendamentoInsert = Database['public']['Tables']['agendamentos']['Insert'];

// Zod schema for validated JSON parsing from descricao field
// Using .strict() to reject unknown fields and prevent data injection
const DescricaoSchema = z.object({
  address: z.string().max(500).optional().default(''),
  pricePerHour: z.string().regex(/^\d+(\.\d{1,2})?$/, { message: 'Invalid price format' }).optional().default('7'),
  price: z.string().regex(/^\d+(\.\d{1,2})?$/, { message: 'Invalid price format' }).optional().default('0'),
  notes: z.string().max(2000).optional().default('')
}).strict();

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
  completedByRole?: string | null;
  pago: boolean;
  dataPagamento?: string | null;
}

export interface AllTasks {
  december: Task[];
  january: Task[];
  february: Task[];
  march: Task[];
  april: Task[];
  may: Task[];
  june: Task[];
  july: Task[];
  august: Task[];
  september: Task[];
  october: Task[];
  november: Task[];
  december2026: Task[];
}

const ALL_MONTH_KEYS: (keyof AllTasks)[] = [
  'december', 'january', 'february', 'march', 'april', 'may',
  'june', 'july', 'august', 'september', 'october', 'november', 'december2026'
];

const getMonthKeyFromDate = (dateString: string): keyof AllTasks | null => {
  // Parse date string as YYYY-MM-DD to get correct month/year
  const parts = dateString.split('-');
  if (parts.length !== 3) return null;
  
  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10) - 1; // 0-indexed

  if (year === 2025 && month === 11) return 'december';
  if (year === 2026) {
    const monthKeys: (keyof AllTasks)[] = [
      'january', 'february', 'march', 'april', 'may', 'june',
      'july', 'august', 'september', 'october', 'november', 'december2026'
    ];
    return monthKeys[month] || null;
  }
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
  
  // Parse and validate descricao JSON for additional fields
  // Using strict schema validation to prevent unknown field injection
  let parsedData = { address: '', pricePerHour: '7', price: '0', notes: '' };
  if (row.descricao) {
    try {
      const rawData = JSON.parse(row.descricao);
      // Only accept objects, reject arrays or primitives
      if (typeof rawData !== 'object' || rawData === null || Array.isArray(rawData)) {
        console.warn('Descricao validation: Expected object, got primitive or array');
        parsedData = { address: '', pricePerHour: '7', price: '0', notes: String(row.descricao) };
      } else {
        // Extract only expected fields, ignore unknown ones
        const safeData = {
          address: typeof rawData.address === 'string' ? rawData.address.slice(0, 500) : '',
          pricePerHour: typeof rawData.pricePerHour === 'string' && /^\d+(\.\d{1,2})?$/.test(rawData.pricePerHour) 
            ? rawData.pricePerHour : '7',
          price: typeof rawData.price === 'string' && /^\d+(\.\d{1,2})?$/.test(rawData.price) 
            ? rawData.price : '0',
          notes: typeof rawData.notes === 'string' ? rawData.notes.slice(0, 2000) : ''
        };
        
        const validated = DescricaoSchema.safeParse(safeData);
        if (validated.success) {
          parsedData = {
            address: validated.data.address ?? '',
            pricePerHour: validated.data.pricePerHour ?? '7',
            price: validated.data.price ?? '0',
            notes: validated.data.notes ?? ''
          };
        } else {
          // Log validation failure for security monitoring
          console.warn('Descricao validation failed:', validated.error.flatten());
          parsedData = { address: '', pricePerHour: '7', price: '0', notes: row.descricao.slice(0, 2000) };
        }
      }
    } catch {
      // If JSON parsing fails, treat as plain text notes (truncated for safety)
      console.warn('Descricao JSON parsing failed, treating as plain text');
      parsedData = { address: '', pricePerHour: '7', price: '0', notes: row.descricao.slice(0, 2000) };
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
    completed: row.status === 'concluido',
    completedByRole: row.completed_by_role || null,
    pago: row.pago || false,
    dataPagamento: row.data_pagamento || null
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
    february: [],
    march: [],
    april: [],
    may: [],
    june: [],
    july: [],
    august: [],
    september: [],
    october: [],
    november: [],
    december2026: []
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

      const tasks: AllTasks = { 
        december: [], january: [], february: [], march: [], april: [], 
        may: [], june: [], july: [], august: [], september: [], 
        october: [], november: [], december2026: [] 
      };
      
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
    // Create optimistic task with temp ID
    const tempId = `temp-${Date.now()}`;
    const optimisticTask: Task = { id: tempId, ...taskData };
    const monthKey = getMonthKeyFromDate(taskData.date);

    // Optimistically add to state
    if (monthKey) {
      setAllTasks(prev => ({
        ...prev,
        [monthKey]: [...prev[monthKey], optimisticTask]
      }));
    }

    try {
      const insertData = mapTaskToInsert(taskData);
      
      const { data, error } = await supabase
        .from('agendamentos')
        .insert(insertData)
        .select()
        .single();

      if (error) throw error;

      const newTask = mapRowToTask(data);
      
      // Replace temp task with real task
      if (monthKey) {
        setAllTasks(prev => ({
          ...prev,
          [monthKey]: prev[monthKey].map(t => t.id === tempId ? newTask : t)
        }));
      }

      return newTask;
    } catch (error: any) {
      console.error('Error adding agendamento:', error);
      // Revert optimistic update
      if (monthKey) {
        setAllTasks(prev => ({
          ...prev,
          [monthKey]: prev[monthKey].filter(t => t.id !== tempId)
        }));
      }
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
      
      // Optimistically update local state immediately for better UX
      const updatedTask: Task = { id, ...taskData };
      const oldMonthKey = ALL_MONTH_KEYS.find(
        monthKey => allTasks[monthKey].some(t => t.id === id)
      );
      const newMonthKey = getMonthKeyFromDate(taskData.date);
      
      if (oldMonthKey && newMonthKey) {
        setAllTasks(prev => {
          const newState = { ...prev };
          
          // Remove from old month
          newState[oldMonthKey] = prev[oldMonthKey].filter(t => t.id !== id);
          
          // Add to new month (or update in same month)
          if (oldMonthKey === newMonthKey) {
            newState[newMonthKey] = [...newState[newMonthKey], updatedTask];
          } else {
            newState[newMonthKey] = [...prev[newMonthKey], updatedTask];
          }
          
          return newState;
        });
      }
      
      const { error } = await supabase
        .from('agendamentos')
        .update(updateData)
        .eq('id', id);

      if (error) {
        // Revert on error
        await fetchAgendamentos();
        throw error;
      }

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
    // Store original state for potential rollback
    const originalTasks = { ...allTasks };
    
    // Optimistically remove from state
    setAllTasks(prev => {
      const newState = { ...prev };
      (Object.keys(newState) as (keyof AllTasks)[]).forEach(key => {
        newState[key] = prev[key].filter(t => t.id !== id);
      });
      return newState;
    });

    try {
      const { error } = await supabase
        .from('agendamentos')
        .delete()
        .eq('id', id);

      if (error) throw error;

      return true;
    } catch (error: any) {
      console.error('Error deleting agendamento:', error);
      // Revert optimistic update
      setAllTasks(originalTasks);
      toast({
        title: 'Erro ao eliminar agendamento',
        description: error.message,
        variant: 'destructive'
      });
      return false;
    }
  };

  const toggleTaskStatus = async (id: string, currentlyCompleted: boolean, userRole?: string): Promise<boolean> => {
    // Store original state for potential rollback
    const originalTasks = { ...allTasks };
    const roleToSave = currentlyCompleted ? null : (userRole || 'user');
    
    // Optimistically update state
    setAllTasks(prev => {
      const newState = { ...prev };
      (Object.keys(newState) as (keyof AllTasks)[]).forEach(key => {
        newState[key] = prev[key].map(t => t.id === id ? { 
          ...t, 
          completed: !currentlyCompleted,
          completedByRole: roleToSave
        } : t);
      });
      return newState;
    });

    try {
      const newStatus = currentlyCompleted ? 'agendado' : 'concluido';
      
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      
      const { error } = await supabase
        .from('agendamentos')
        .update({ 
          status: newStatus,
          completed_by: currentlyCompleted ? null : user?.id,
          completed_by_role: roleToSave
        })
        .eq('id', id);

      if (error) throw error;

      return true;
    } catch (error: any) {
      console.error('Error toggling status:', error);
      // Revert optimistic update
      setAllTasks(originalTasks);
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
    
    for (const monthKey of ALL_MONTH_KEYS) {
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

  const togglePaymentStatus = async (id: string, currentlyPago: boolean): Promise<boolean> => {
    // Store original state for potential rollback
    const originalTasks = { ...allTasks };
    const now = new Date().toISOString();
    
    // Optimistically update state
    setAllTasks(prev => {
      const newState = { ...prev };
      (Object.keys(newState) as (keyof AllTasks)[]).forEach(key => {
        newState[key] = prev[key].map(t => t.id === id ? { 
          ...t, 
          pago: !currentlyPago,
          dataPagamento: currentlyPago ? null : now
        } : t);
      });
      return newState;
    });

    try {
      const { error } = await supabase
        .from('agendamentos')
        .update({ 
          pago: !currentlyPago,
          data_pagamento: currentlyPago ? null : now
        })
        .eq('id', id);

      if (error) throw error;

      return true;
    } catch (error: any) {
      console.error('Error toggling payment status:', error);
      // Revert optimistic update
      setAllTasks(originalTasks);
      toast({
        title: 'Erro ao alterar pagamento',
        description: error.message,
        variant: 'destructive'
      });
      return false;
    }
  };

  return {
    allTasks,
    loading,
    addTask,
    updateTask,
    deleteTask,
    toggleTaskStatus,
    togglePaymentStatus,
    moveTask,
    refetch: fetchAgendamentos
  };
};
