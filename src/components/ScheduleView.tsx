import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useAgendamentos, Task, AllTasks } from '@/hooks/useAgendamentos';
import { useClients, Client } from '@/hooks/useClients';
import { 
  Plus, Trash2, Check, MapPin, Calendar, Save, Download, X, 
  Phone, Repeat, CalendarRange, Pencil, Loader2, Users, UserPlus,
  CalendarDays
} from 'lucide-react';
import { useTheme } from '@/hooks/useTheme';
import CalendarModal from '@/components/CalendarModal';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import logoMayslimpo from '@/assets/logo-mayslimpo.jpg';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// Import refactored components
import {
  DayCard,
  ScheduleHeader,
  MonthTabs,
  UndoBar,
  PositionDialog,
  TypeSelectorModal,
} from '@/components/schedule';

import {
  generateMonthsConfig,
  generateDaysForMonth,
  getMonthKeyFromDate as getMonthKeyFromDateUtil,
  getThemeGradient,
  getBgColor,
  calculatePrice,
  validateTimeRange,
  formatTime,
  parseTime,
  MonthConfig,
} from '@/utils/monthConfig';

interface ScheduleViewProps {
  isAdmin: boolean;
}

const ScheduleView: React.FC<ScheduleViewProps> = ({ isAdmin }) => {
  const { user, role, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { theme, toggleTheme } = useTheme();
  const { allTasks, loading, addTask, updateTask, deleteTask, toggleTaskStatus } = useAgendamentos();
  const { clients, addClient } = useClients();
  
  // Static month configuration matching useAgendamentos
  const monthsConfig = useMemo(() => generateMonthsConfig(), []);
  const monthKeys = useMemo(() => Object.keys(monthsConfig), [monthsConfig]);
  
  // Get current month key
  const getCurrentMonthKey = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    
    for (const [key, config] of Object.entries(monthsConfig)) {
      if (config.year === year && config.monthIndex === month) {
        return key;
      }
    }
    return monthKeys[0];
  };
  
  const [activeMonth, setActiveMonth] = useState<string>(getCurrentMonthKey());
  const [showTypeSelector, setShowTypeSelector] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'single' | 'fixed' | 'biweekly'>('single');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [selectedClientId, setSelectedClientId] = useState<string>('');
  const [saveAsClient, setSaveAsClient] = useState(false);
  const [copiedTaskIds, setCopiedTaskIds] = useState<string[]>([]);
  const [showUndoBar, setShowUndoBar] = useState(false);
  const [copyingFromPrevious, setCopyingFromPrevious] = useState(false);
  
  
  // State for undo move functionality
  const [lastMovedTask, setLastMovedTask] = useState<{
    id: string;
    originalDate: string;
    originalStartTime: string;
    originalEndTime: string;
    newDate: string;
    newStartTime: string;
    newEndTime: string;
    clientName: string;
  } | null>(null);
  const [showMoveUndoBar, setShowMoveUndoBar] = useState(false);
  
  // State for position choice dialog
  const [showPositionDialog, setShowPositionDialog] = useState(false);
  const [pendingDrop, setPendingDrop] = useState<{
    taskToMove: Task;
    targetDateString: string;
    existingTasks: Task[];
  } | null>(null);
  
  // State for calendar modal
  const [showCalendarModal, setShowCalendarModal] = useState(false);

  const activeConfig = monthsConfig[activeMonth];
  const currentMonthDays = useMemo(() => 
    activeConfig ? generateDaysForMonth(activeConfig) : [], 
    [activeConfig]
  );

  const getMonthKeyFromDate = (dateString: string): string | null => {
    return getMonthKeyFromDateUtil(dateString, monthsConfig);
  };

  // Get tasks for a month
  const getTasksForMonth = (monthKey: string): Task[] => {
    return allTasks[monthKey as keyof AllTasks] || [];
  };

  const [newTask, setNewTask] = useState({
    date: '',
    client: '',
    phone: '',
    startTime: '08:00',
    endTime: '12:00',
    address: '',
    pricePerHour: '7',
    price: '28.00',
    notes: '',
    completed: false
  });

  const [fixedTask, setFixedTask] = useState({
    weekDay: 'quinta-feira',
    client: '',
    phone: '',
    startTime: '08:30',
    endTime: '11:30',
    address: '',
    pricePerHour: '7',
    price: '21.00',
    notes: '',
    completed: false
  });

  const [biWeeklyTask, setBiWeeklyTask] = useState({
    startDate: '',
    client: '',
    phone: '',
    startTime: '08:30',
    endTime: '11:30',
    address: '',
    pricePerHour: '7',
    price: '21.00',
    notes: '',
    completed: false
  });

  useEffect(() => {
    if (currentMonthDays.length > 0) {
      const firstDay = currentMonthDays[0].dateString;
      if (!editingId) {
        setNewTask(prev => ({ ...prev, date: firstDay }));
        setBiWeeklyTask(prev => ({ ...prev, startDate: firstDay }));
      }
    }
  }, [activeMonth, currentMonthDays.length, editingId]);

  const weekDaysList = ['segunda-feira', 'terça-feira', 'quarta-feira', 'quinta-feira', 'sexta-feira', 'sábado', 'domingo'];

  const handleInputChange = (setter: any, state: any, field: string, value: string) => {
    const updatedTask = { ...state, [field]: value };
    if (field === 'startTime' || field === 'endTime' || field === 'pricePerHour') {
      const newPrice = calculatePrice(updatedTask.startTime, updatedTask.endTime, updatedTask.pricePerHour);
      if (newPrice) updatedTask.price = newPrice;
    }
    setter(updatedTask);
  };

  const handleClientSelect = (clientId: string, setter: any, state: any) => {
    setSelectedClientId(clientId);
    if (clientId) {
      const client = clients.find(c => c.id === clientId);
      if (client) {
        const updatedPricePerHour = client.preco_hora || '7';
        const newPrice = calculatePrice(state.startTime, state.endTime, updatedPricePerHour);
        setter({
          ...state,
          client: client.nome,
          phone: client.telefone || '',
          address: client.morada || '',
          pricePerHour: updatedPricePerHour,
          price: newPrice || state.price
        });
      }
    } else {
      setter({
        ...state,
        client: '',
        phone: '',
        address: '',
        pricePerHour: '7',
        price: calculatePrice(state.startTime, state.endTime, '7') || state.price
      });
    }
  };

  const handleDragStart = (e: React.DragEvent, task: Task) => {
    if (!isAdmin) return;
    e.dataTransfer.setData("taskId", task.id);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent) => {
    if (!isAdmin) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = async (e: React.DragEvent, targetDateString: string) => {
    if (!isAdmin) return;
    e.preventDefault();
    const taskId = e.dataTransfer.getData("taskId");

    // Find the task
    let taskToMove: Task | null = null;
    for (const monthKey of monthKeys) {
      const monthTasks = allTasks[monthKey as keyof AllTasks] || [];
      const found = monthTasks.find(t => t.id === taskId);
      if (found) {
        taskToMove = found;
        break;
      }
    }

    if (!taskToMove) return;

    // Check if target day has existing tasks
    const targetMonthKey = getMonthKeyFromDate(targetDateString);
    if (!targetMonthKey) return;

    const targetTasks = allTasks[targetMonthKey as keyof AllTasks] || [];
    const existingTasks = targetTasks
      .filter(t => t.date === targetDateString && t.id !== taskToMove!.id)
      .sort((a, b) => a.startTime.localeCompare(b.startTime));

    // If there are existing tasks, show position dialog
    if (existingTasks.length > 0) {
      setPendingDrop({
        taskToMove,
        targetDateString,
        existingTasks
      });
      setShowPositionDialog(true);
      return;
    }

    // No existing tasks - move with original times
    await executeMoveTask(taskToMove, targetDateString, taskToMove.startTime, taskToMove.endTime);
  };

  const executeMoveTask = async (
    taskToMove: Task, 
    targetDateString: string, 
    newStartTime: string, 
    newEndTime: string
  ) => {
    const originalState = {
      id: taskToMove.id,
      originalDate: taskToMove.date,
      originalStartTime: taskToMove.startTime,
      originalEndTime: taskToMove.endTime,
      clientName: taskToMove.client
    };

    if (taskToMove.date === targetDateString) {
      if (newStartTime !== taskToMove.startTime || newEndTime !== taskToMove.endTime) {
        const success = await updateTask(taskToMove.id, {
          ...taskToMove,
          startTime: newStartTime,
          endTime: newEndTime
        });
        if (success) {
          setLastMovedTask({
            ...originalState,
            newDate: targetDateString,
            newStartTime,
            newEndTime
          });
          setShowMoveUndoBar(true);
          setTimeout(() => {
            setShowMoveUndoBar(false);
            setLastMovedTask(null);
          }, 15000);
          
          toast({ 
            title: 'Horário ajustado',
            description: `${newStartTime} - ${newEndTime}`
          });
        }
      }
      return;
    }

    const success = await updateTask(taskToMove.id, {
      ...taskToMove,
      date: targetDateString,
      startTime: newStartTime,
      endTime: newEndTime
    });
    
    if (success) {
      setLastMovedTask({
        ...originalState,
        newDate: targetDateString,
        newStartTime,
        newEndTime
      });
      setShowMoveUndoBar(true);
      setTimeout(() => {
        setShowMoveUndoBar(false);
        setLastMovedTask(null);
      }, 15000);
      
      toast({ 
        title: 'Agendamento movido',
        description: `Novo horário: ${newStartTime} - ${newEndTime}`
      });
    }
  };

  const handlePositionChoice = async (position: 'above' | 'below') => {
    if (!pendingDrop) return;

    const { taskToMove, targetDateString, existingTasks } = pendingDrop;
    
    const originalStart = parseTime(taskToMove.startTime);
    const originalEnd = parseTime(taskToMove.endTime);
    const durationMs = originalEnd.getTime() - originalStart.getTime();

    let newStartTime: string;
    let newEndTime: string;

    if (position === 'above') {
      const firstTask = existingTasks[0];
      const firstTaskStart = parseTime(firstTask.startTime);
      const newEndDate = new Date(firstTaskStart.getTime() - (60 * 60 * 1000));
      const newStartDate = new Date(newEndDate.getTime() - durationMs);
      newStartTime = formatTime(newStartDate);
      newEndTime = formatTime(newEndDate);
    } else {
      const lastTask = existingTasks[existingTasks.length - 1];
      const lastTaskEnd = parseTime(lastTask.endTime);
      const newStartDate = new Date(lastTaskEnd.getTime() + (60 * 60 * 1000));
      const newEndDate = new Date(newStartDate.getTime() + durationMs);
      newStartTime = formatTime(newStartDate);
      newEndTime = formatTime(newEndDate);
    }

    setShowPositionDialog(false);
    setPendingDrop(null);
    
    await executeMoveTask(taskToMove, targetDateString, newStartTime, newEndTime);
  };

  const handleUndoMove = async () => {
    if (!lastMovedTask) return;

    setSaving(true);
    try {
      let taskToRestore: Task | null = null;
      for (const monthKey of monthKeys) {
        const monthTasks = allTasks[monthKey as keyof AllTasks] || [];
        const found = monthTasks.find(t => t.id === lastMovedTask.id);
        if (found) {
          taskToRestore = found;
          break;
        }
      }

      if (!taskToRestore) {
        toast({
          title: 'Erro ao desfazer',
          description: 'Agendamento não encontrado.',
          variant: 'destructive'
        });
        return;
      }

      const success = await updateTask(lastMovedTask.id, {
        ...taskToRestore,
        date: lastMovedTask.originalDate,
        startTime: lastMovedTask.originalStartTime,
        endTime: lastMovedTask.originalEndTime
      });

      if (success) {
        toast({
          title: 'Movimento desfeito',
          description: `${lastMovedTask.clientName} restaurado para ${lastMovedTask.originalStartTime} - ${lastMovedTask.originalEndTime}`
        });
      }

      setLastMovedTask(null);
      setShowMoveUndoBar(false);
    } catch (error: any) {
      console.error('Error undoing move:', error);
      toast({
        title: 'Erro ao desfazer',
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setSaving(false);
    }
  };

  const openEditModal = (task: Task) => {
    if (!isAdmin) return;
    setEditingId(task.id);
    setActiveTab('single');
    setNewTask({
      date: task.date,
      client: task.client,
      phone: task.phone || '',
      startTime: task.startTime,
      endTime: task.endTime,
      address: task.address || '',
      pricePerHour: task.pricePerHour || '7',
      price: task.price || '',
      notes: task.notes || '',
      completed: task.completed || false
    });
    setShowModal(true);
  };

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTask.client) return;

    // Validate time range
    const timeValidation = validateTimeRange(newTask.startTime, newTask.endTime);
    if (!timeValidation.valid) {
      toast({
        title: 'Horário inválido',
        description: timeValidation.message,
        variant: 'destructive'
      });
      return;
    }

    setSaving(true);

    try {
      if (saveAsClient && !selectedClientId && newTask.client) {
        await addClient({
          nome: newTask.client,
          telefone: newTask.phone,
          morada: newTask.address,
          preco_hora: newTask.pricePerHour,
          notas: ''
        });
      }

      if (editingId) {
        const success = await updateTask(editingId, newTask);
        if (success) {
          toast({ title: 'Agendamento atualizado' });
        }
        setEditingId(null);
      } else {
        const targetMonth = getMonthKeyFromDate(newTask.date);
        if (!targetMonth) {
          toast({ 
            title: 'Data inválida', 
            description: 'Data fora do período permitido',
            variant: 'destructive'
          });
          return;
        }

        const result = await addTask(newTask);
        if (result) {
          toast({ title: 'Agendamento criado' });
        }
      }

      setNewTask({ ...newTask, client: '', phone: '', address: '', notes: '', completed: false });
      setSelectedClientId('');
      setSaveAsClient(false);
      setShowModal(false);
    } finally {
      setSaving(false);
    }
  };

  const handleAddFixedTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fixedTask.client) return;

    // Validate time range
    const timeValidation = validateTimeRange(fixedTask.startTime, fixedTask.endTime);
    if (!timeValidation.valid) {
      toast({
        title: 'Horário inválido',
        description: timeValidation.message,
        variant: 'destructive'
      });
      return;
    }
    
    setSaving(true);

    try {
      let count = 0;
      const normalizedWeekDay = fixedTask.weekDay.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

      for (const day of currentMonthDays) {
        const normalizedDayName = day.dayName.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
        
        if (normalizedDayName.includes(normalizedWeekDay)) {
          const taskData = {
            date: day.dateString,
            client: fixedTask.client,
            phone: fixedTask.phone,
            startTime: fixedTask.startTime,
            endTime: fixedTask.endTime,
            address: fixedTask.address,
            pricePerHour: fixedTask.pricePerHour,
            price: fixedTask.price,
            notes: fixedTask.notes,
            completed: fixedTask.completed
          };
          const result = await addTask(taskData);
          if (result) count++;
        }
      }

      if (count === 0) {
        toast({
          title: 'Nenhum dia encontrado',
          description: 'Nenhum dia encontrado neste mês para o dia da semana selecionado.',
          variant: 'destructive'
        });
        return;
      }

      toast({ title: `${count} agendamentos criados em ${activeConfig.label}` });
      setFixedTask({ ...fixedTask, client: '', phone: '', address: '', notes: '', completed: false });
      setSelectedClientId('');
      setShowModal(false);
    } finally {
      setSaving(false);
    }
  };

  const handleAddBiWeeklyTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!biWeeklyTask.client) return;

    // Validate time range
    const timeValidation = validateTimeRange(biWeeklyTask.startTime, biWeeklyTask.endTime);
    if (!timeValidation.valid) {
      toast({
        title: 'Horário inválido',
        description: timeValidation.message,
        variant: 'destructive'
      });
      return;
    }
    
    setSaving(true);

    try {
      const allDaysContinuous = monthKeys.flatMap(key => 
        generateDaysForMonth(monthsConfig[key])
      );

      const startIndex = allDaysContinuous.findIndex(d => d.dateString === biWeeklyTask.startDate);

      if (startIndex === -1) {
        toast({ title: 'Data inválida', variant: 'destructive' });
        return;
      }

      let addedCount = 0;

      const firstDate = allDaysContinuous[startIndex];
      const firstResult = await addTask({
        date: firstDate.dateString,
        client: biWeeklyTask.client,
        phone: biWeeklyTask.phone,
        startTime: biWeeklyTask.startTime,
        endTime: biWeeklyTask.endTime,
        address: biWeeklyTask.address,
        pricePerHour: biWeeklyTask.pricePerHour,
        price: biWeeklyTask.price,
        notes: biWeeklyTask.notes,
        completed: biWeeklyTask.completed
      });
      if (firstResult) addedCount++;

      const nextIndex = startIndex + 14;
      if (nextIndex < allDaysContinuous.length) {
        const nextDate = allDaysContinuous[nextIndex];
        const secondResult = await addTask({
          date: nextDate.dateString,
          client: biWeeklyTask.client,
          phone: biWeeklyTask.phone,
          startTime: biWeeklyTask.startTime,
          endTime: biWeeklyTask.endTime,
          address: biWeeklyTask.address,
          pricePerHour: biWeeklyTask.pricePerHour,
          price: biWeeklyTask.price,
          notes: biWeeklyTask.notes,
          completed: biWeeklyTask.completed
        });
        if (secondResult) addedCount++;
      }

      toast({ 
        title: `${addedCount} agendamentos criados`,
        description: 'Verifique as abas dos meses seguintes se necessário'
      });
      setBiWeeklyTask({ ...biWeeklyTask, client: '', phone: '', address: '', notes: '', completed: false });
      setSelectedClientId('');
      setShowModal(false);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!isAdmin) return;
    if (window.confirm('Tem certeza que deseja remover este agendamento?')) {
      const success = await deleteTask(id);
      if (success) {
        toast({ title: 'Agendamento eliminado' });
      }
    }
  };

  const handleToggleStatus = async (id: string, currentlyCompleted: boolean) => {
    if (!isAdmin) return;
    await toggleTaskStatus(id, currentlyCompleted);
  };

  const calculateMonthTotal = () => {
    const monthTasks = allTasks[activeMonth as keyof AllTasks] || [];
    return monthTasks.reduce((acc, curr) => acc + (parseFloat(curr.price) || 0), 0);
  };

  const getPreviousMonth = (): string | null => {
    const currentIndex = monthKeys.indexOf(activeMonth);
    if (currentIndex <= 0) return null;
    return monthKeys[currentIndex - 1];
  };

  const handleCopyFromPreviousMonth = async () => {
    const previousMonth = getPreviousMonth();
    if (!previousMonth) {
      toast({
        title: 'Não é possível copiar',
        description: 'Este é o primeiro mês disponível.',
        variant: 'destructive'
      });
      return;
    }

    const previousTasks = allTasks[previousMonth as keyof AllTasks] || [];
    if (previousTasks.length === 0) {
      toast({
        title: 'Mês anterior vazio',
        description: `Não há agendamentos em ${monthsConfig[previousMonth]?.label || previousMonth} para copiar.`,
        variant: 'destructive'
      });
      return;
    }

    const clientNames = clients.map(c => c.nome.toLowerCase());
    const tasksToClone = previousTasks.filter(t => 
      clientNames.includes(t.client.toLowerCase())
    );

    if (tasksToClone.length === 0) {
      toast({
        title: 'Nenhum cliente cadastrado',
        description: 'Nenhum agendamento do mês anterior corresponde a clientes cadastrados.',
        variant: 'destructive'
      });
      return;
    }

    setCopyingFromPrevious(true);
    setShowTypeSelector(false);
    
    try {
      const newTaskIds: string[] = [];

      for (const task of tasksToClone) {
        const oldDate = new Date(task.date);
        const dayOfMonth = oldDate.getUTCDate();
        const oldDayOfWeek = oldDate.getUTCDay();
        
        const matchingDays = currentMonthDays.filter(d => 
          d.dateObject.getDay() === oldDayOfWeek
        );
        
        let newDateStr = '';
        if (matchingDays.length > 0) {
          const weekOfMonth = Math.ceil(dayOfMonth / 7);
          const targetDay = matchingDays[Math.min(weekOfMonth - 1, matchingDays.length - 1)];
          newDateStr = targetDay.dateString;
        } else {
          newDateStr = currentMonthDays[0]?.dateString || '';
        }

        if (!newDateStr) continue;

        const result = await addTask({
          date: newDateStr,
          client: task.client,
          phone: task.phone,
          startTime: task.startTime,
          endTime: task.endTime,
          address: task.address,
          pricePerHour: task.pricePerHour,
          price: task.price,
          notes: task.notes,
          completed: false
        });

        if (result) {
          newTaskIds.push(result.id);
        }
      }

      if (newTaskIds.length > 0) {
        setCopiedTaskIds(newTaskIds);
        setShowUndoBar(true);
        toast({
          title: `${newTaskIds.length} agendamentos copiados`,
          description: `Dados de ${monthsConfig[previousMonth]?.label || previousMonth} copiados para ${activeConfig.label}`,
        });
        
        setTimeout(() => {
          setShowUndoBar(false);
          setCopiedTaskIds([]);
        }, 15000);
      } else {
        toast({
          title: 'Nenhum agendamento copiado',
          variant: 'destructive'
        });
      }
    } catch (error: any) {
      console.error('Error copying tasks:', error);
      toast({
        title: 'Erro ao copiar',
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setCopyingFromPrevious(false);
    }
  };

  const handleUndoCopy = async () => {
    if (copiedTaskIds.length === 0) return;

    const confirmed = window.confirm(`Tem certeza que deseja desfazer? ${copiedTaskIds.length} agendamentos serão eliminados.`);
    if (!confirmed) return;

    setSaving(true);
    try {
      let deletedCount = 0;
      for (const id of copiedTaskIds) {
        const success = await deleteTask(id);
        if (success) deletedCount++;
      }

      toast({
        title: `${deletedCount} agendamentos eliminados`,
        description: 'Cópia desfeita com sucesso.'
      });
      
      setCopiedTaskIds([]);
      setShowUndoBar(false);
    } catch (error: any) {
      console.error('Error undoing copy:', error);
      toast({
        title: 'Erro ao desfazer',
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setSaving(false);
    }
  };

  const exportToPDF = () => {
    const doc = new jsPDF();
    const tasks = allTasks[activeMonth as keyof AllTasks] || [];
    const completedTasks = tasks.filter(t => t.completed);
    const pendingTasks = tasks.filter(t => !t.completed);
    
    doc.setFillColor(139, 92, 246);
    doc.rect(0, 0, 220, 35, 'F');
    doc.setFontSize(22);
    doc.setTextColor(255, 255, 255);
    doc.text('MaysLimpo', 14, 18);
    doc.setFontSize(12);
    doc.text(`Agenda - ${activeConfig.label}`, 14, 28);
    
    doc.setFontSize(11);
    doc.setTextColor(80, 80, 80);
    const totalConcluido = completedTasks.reduce((s, t) => s + parseFloat(t.price || '0'), 0);
    const totalPendente = pendingTasks.reduce((s, t) => s + parseFloat(t.price || '0'), 0);
    const totalHoras = tasks.reduce((s, t) => {
      const start = new Date(`1970-01-01T${t.startTime}`);
      const end = new Date(`1970-01-01T${t.endTime}`);
      return s + (end.getTime() - start.getTime()) / (1000 * 60 * 60);
    }, 0);
    
    doc.text(`Total Agendamentos: ${tasks.length}  |  Concluídos: ${completedTasks.length}  |  Pendentes: ${pendingTasks.length}`, 14, 45);
    doc.text(`Horas: ${totalHoras.toFixed(1)}h  |  Faturado: €${totalConcluido.toFixed(2)}  |  Pendente: €${totalPendente.toFixed(2)}`, 14, 52);
    
    const tableData = tasks.map(task => {
      const date = new Date(task.date);
      const dayName = date.toLocaleDateString('pt-BR', { weekday: 'short' });
      const formattedDate = date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
      
      return [
        `${formattedDate} (${dayName})`,
        task.client,
        task.phone || '-',
        `${task.startTime} - ${task.endTime}`,
        task.address || '-',
        `€${task.price}`,
        task.completed ? '✓' : '○'
      ];
    });
    
    autoTable(doc, {
      head: [['Data', 'Cliente', 'Telefone', 'Horário', 'Morada', 'Preço', '']],
      body: tableData,
      startY: 58,
      styles: { fontSize: 8, cellPadding: 2 },
      headStyles: { fillColor: [139, 92, 246], textColor: 255 },
      alternateRowStyles: { fillColor: [248, 245, 255] },
      columnStyles: {
        6: { halign: 'center', fontStyle: 'bold' }
      },
      didParseCell: (data) => {
        if (data.section === 'body' && data.column.index === 6) {
          const val = data.cell.raw as string;
          if (val === '✓') {
            data.cell.styles.textColor = [16, 185, 129];
          } else {
            data.cell.styles.textColor = [245, 158, 11];
          }
        }
      }
    });
    
    const finalY = (doc as any).lastAutoTable.finalY || 58;
    doc.setDrawColor(139, 92, 246);
    doc.setLineWidth(0.5);
    doc.line(14, finalY + 8, 196, finalY + 8);
    doc.setFontSize(10);
    doc.setTextColor(139, 92, 246);
    doc.text(`Total Faturado: €${totalConcluido.toFixed(2)}`, 14, finalY + 16);
    doc.setTextColor(245, 158, 11);
    doc.text(`Total Pendente: €${totalPendente.toFixed(2)}`, 80, finalY + 16);
    doc.setTextColor(100, 100, 100);
    doc.setFontSize(8);
    doc.text(`Gerado em ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`, 14, finalY + 24);
    
    doc.save(`agenda-${activeMonth}-${activeConfig.year}.pdf`);
    toast({ title: 'PDF exportado com sucesso' });
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const themeGradient = activeConfig ? getThemeGradient(activeConfig.color) : 'from-purple-600 to-purple-800';
  const bgColor = activeConfig ? getBgColor(activeConfig.color) : 'bg-purple-50';
  const headerBg = theme === 'dark' ? 'bg-secondary' : bgColor;

  const username = user?.user_metadata?.name || user?.email?.replace('@local.app', '') || '';
  const roleLabel = role === 'admin' ? 'Administrador' : 'Neury';

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-muted-foreground">A carregar agendamentos...</p>
        </div>
      </div>
    );
  }

  const previousMonth = getPreviousMonth();
  const previousMonthLabel = previousMonth ? monthsConfig[previousMonth]?.label : null;

  return (
    <div className={`min-h-screen font-sans text-foreground pb-10 print:bg-white ${theme === 'dark' ? 'bg-background' : bgColor}`}>
      {/* User Info Bar */}
      <ScheduleHeader
        username={username}
        roleLabel={roleLabel}
        isAdmin={isAdmin}
        theme={theme}
        toggleTheme={toggleTheme}
        onSignOut={handleSignOut}
      />

      {/* Month Navigation Tabs */}
      <MonthTabs
        monthsConfig={monthsConfig}
        activeMonth={activeMonth}
        onMonthChange={setActiveMonth}
      />

      {/* Header */}
      <header className={`bg-gradient-to-r ${themeGradient} text-white p-6 shadow-lg print:hidden relative z-10 rounded-b-lg mx-2`}>
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              Agenda da Neury
            </h1>
            <p className="opacity-90 mt-1 flex items-center gap-2 text-lg font-medium">
              Visualizando: {activeConfig?.label}
            </p>
          </div>

          <div className="mt-4 md:mt-0 flex gap-3 flex-wrap items-center">
            <button
              onClick={exportToPDF}
              className="bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition"
            >
              <Download size={20} />
              <span className="hidden sm:inline">Exportar PDF</span>
            </button>
          </div>
        </div>
      </header>

      {/* Financial Summary */}
      <div className="max-w-7xl mx-auto px-4 mt-6 print:mt-2 relative z-0">
        <div className="bg-card p-4 rounded-xl shadow-sm border border-border flex justify-between items-center">
          <span className="text-muted-foreground font-medium">Total previsto ({activeConfig?.label}):</span>
          <span className="text-3xl font-bold flex items-center gap-1 text-primary">
            € {calculateMonthTotal().toFixed(2)}
          </span>
        </div>
      </div>


      {/* Days Grid */}
      <main className="max-w-7xl mx-auto p-4 mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 print:block print:w-full relative z-0">
        {currentMonthDays.map((dayObj) => {
          const dayTasks = getTasksForMonth(activeMonth)
            .filter(t => t.date === dayObj.dateString)
            .sort((a, b) => a.startTime.localeCompare(b.startTime));

          return (
            <DayCard
              key={dayObj.dateString}
              dayObj={dayObj}
              tasks={dayTasks}
              isAdmin={isAdmin}
              isDarkMode={theme === 'dark'}
              headerBg={headerBg}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              onDragStart={handleDragStart}
              onEditTask={openEditModal}
              onDeleteTask={handleDelete}
              onToggleStatus={handleToggleStatus}
            />
          );
        })}
      </main>

      {/* Task Form Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 print:hidden overflow-y-auto animate-fade-in">
          <div className="bg-card rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden my-8">
            <div className={`bg-gradient-to-r ${themeGradient} text-white p-5 flex items-center justify-between sticky top-0`}>
              <h3 className="font-bold text-lg">
                {editingId ? 'Editar Agendamento' : 'Novo Agendamento'}
              </h3>
              <button 
                onClick={() => { setShowModal(false); setEditingId(null); }}
                className="hover:bg-white/20 p-2 rounded-full transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            <div className="p-5 max-h-[70vh] overflow-y-auto">
              {/* Tab selector */}
              {!editingId && (
                <div className="flex gap-2 mb-5 border-b border-border pb-4">
                  <button
                    onClick={() => setActiveTab('single')}
                    className={`px-4 py-2 rounded-lg font-medium text-sm transition-all flex items-center gap-1 ${
                      activeTab === 'single' ? `bg-gradient-to-r ${themeGradient} text-white` : 'bg-secondary text-muted-foreground'
                    }`}
                  >
                    <Calendar size={14} /> Único
                  </button>
                  <button
                    onClick={() => setActiveTab('fixed')}
                    className={`px-4 py-2 rounded-lg font-medium text-sm transition-all flex items-center gap-1 ${
                      activeTab === 'fixed' ? `bg-gradient-to-r ${themeGradient} text-white` : 'bg-secondary text-muted-foreground'
                    }`}
                  >
                    <Repeat size={14} /> Semanal
                  </button>
                  <button
                    onClick={() => setActiveTab('biweekly')}
                    className={`px-4 py-2 rounded-lg font-medium text-sm transition-all flex items-center gap-1 ${
                      activeTab === 'biweekly' ? `bg-gradient-to-r ${themeGradient} text-white` : 'bg-secondary text-muted-foreground'
                    }`}
                  >
                    <CalendarRange size={14} /> Quinzenal
                  </button>
                </div>
              )}

              {/* Single Task Form */}
              {activeTab === 'single' && (
                <form onSubmit={handleAddTask} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-card-foreground mb-1">Data</label>
                    <select
                      value={newTask.date}
                      onChange={(e) => handleInputChange(setNewTask, newTask, 'date', e.target.value)}
                      disabled={!!editingId}
                      className="w-full p-2 border border-border rounded-lg focus:ring-2 focus:ring-primary bg-input text-foreground disabled:bg-muted disabled:cursor-not-allowed"
                    >
                      {currentMonthDays.map(d => <option key={d.dateString} value={d.dateString}>{d.formatted} - {d.dayName}</option>)}
                    </select>
                  </div>
                  
                  {clients.length > 0 && !editingId && (
                    <div>
                      <label className="block text-sm font-medium text-card-foreground mb-1 flex items-center gap-1">
                        <Users size={14} /> Selecionar Cliente Existente
                      </label>
                      <select
                        value={selectedClientId}
                        onChange={(e) => handleClientSelect(e.target.value, setNewTask, newTask)}
                        className="w-full p-2 border border-border rounded-lg focus:ring-2 focus:ring-primary bg-input text-foreground"
                      >
                        <option value="">-- Novo cliente --</option>
                        {clients.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
                      </select>
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-card-foreground mb-1">Cliente <span className="text-destructive">*</span></label>
                    <input 
                      type="text" 
                      required={!selectedClientId}
                      placeholder="Nome do cliente" 
                      value={newTask.client} 
                      onChange={(e) => { handleInputChange(setNewTask, newTask, 'client', e.target.value); setSelectedClientId(''); }} 
                      readOnly={!!selectedClientId}
                      className={`w-full p-2 border rounded-lg bg-input text-foreground ${selectedClientId ? 'bg-muted text-muted-foreground border-border' : 'border-border'}`}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-card-foreground mb-1">Telefone</label>
                    <input 
                      type="text" 
                      placeholder="Ex: 912 345 678" 
                      value={newTask.phone} 
                      onChange={(e) => handleInputChange(setNewTask, newTask, 'phone', e.target.value)} 
                      disabled={!!selectedClientId}
                      className={`w-full p-2 border rounded-lg bg-input text-foreground ${selectedClientId ? 'bg-muted text-muted-foreground border-border cursor-not-allowed' : 'border-border'}`}
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-card-foreground mb-1">Início</label>
                      <input type="time" required value={newTask.startTime} onChange={(e) => handleInputChange(setNewTask, newTask, 'startTime', e.target.value)} className="w-full p-2 border border-border rounded-lg bg-input text-foreground" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-card-foreground mb-1">Fim</label>
                      <input type="time" required value={newTask.endTime} onChange={(e) => handleInputChange(setNewTask, newTask, 'endTime', e.target.value)} className="w-full p-2 border border-border rounded-lg bg-input text-foreground" />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 bg-secondary p-3 rounded-lg border border-border">
                    <div>
                      <label className="block text-sm font-medium text-card-foreground mb-1">€/h</label>
                      <input type="number" step="0.01" min="0" value={newTask.pricePerHour} onChange={(e) => handleInputChange(setNewTask, newTask, 'pricePerHour', e.target.value)} className="w-full p-2 border border-border rounded-lg focus:ring-2 focus:ring-primary bg-input text-foreground" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-success mb-1">Total (€)</label>
                      <input type="number" step="0.01" value={newTask.price} onChange={(e) => handleInputChange(setNewTask, newTask, 'price', e.target.value)} className="w-full p-2 border-2 border-success/30 bg-success/10 rounded-lg text-success font-bold" />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-card-foreground mb-1">Morada</label>
                    <input 
                      type="text" 
                      placeholder="Rua..." 
                      value={newTask.address} 
                      onChange={(e) => handleInputChange(setNewTask, newTask, 'address', e.target.value)} 
                      disabled={!!selectedClientId}
                      className={`w-full p-2 border rounded-lg bg-input text-foreground ${selectedClientId ? 'bg-muted text-muted-foreground border-border cursor-not-allowed' : 'border-border'}`}
                    />
                  </div>

                  {!editingId && !selectedClientId && newTask.client && (
                    <label className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer hover:text-foreground">
                      <input
                        type="checkbox"
                        checked={saveAsClient}
                        onChange={(e) => setSaveAsClient(e.target.checked)}
                        className="w-4 h-4 rounded border-border text-primary focus:ring-primary"
                      />
                      <UserPlus size={14} />
                      Guardar cliente para próximos agendamentos
                    </label>
                  )}

                  <button 
                    type="submit" 
                    disabled={saving}
                    className={`w-full text-white font-bold py-3 rounded-xl shadow transition flex justify-center items-center gap-2 mt-4 bg-gradient-to-r ${themeGradient} disabled:opacity-50`}
                  >
                    {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                    {editingId ? 'Salvar Alterações' : `Salvar em ${activeConfig?.label}`}
                  </button>
                </form>
              )}

              {/* Fixed Task Form */}
              {activeTab === 'fixed' && (
                <form onSubmit={handleAddFixedTask} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-card-foreground mb-1">Dia da Semana</label>
                    <select
                      value={fixedTask.weekDay}
                      onChange={(e) => handleInputChange(setFixedTask, fixedTask, 'weekDay', e.target.value)}
                      className="w-full p-2 border border-border rounded-lg focus:ring-2 focus:ring-primary bg-input text-foreground"
                    >
                      {weekDaysList.map(day => <option key={day} value={day}>{day}</option>)}
                    </select>
                  </div>
                  
                  {clients.length > 0 && (
                    <div>
                      <label className="block text-sm font-medium text-card-foreground mb-1 flex items-center gap-1">
                        <Users size={14} /> Selecionar Cliente Existente
                      </label>
                      <select
                        value={selectedClientId}
                        onChange={(e) => handleClientSelect(e.target.value, setFixedTask, fixedTask)}
                        className="w-full p-2 border border-border rounded-lg focus:ring-2 focus:ring-primary bg-input text-foreground"
                      >
                        <option value="">-- Novo cliente --</option>
                        {clients.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
                      </select>
                    </div>
                  )}
                  
                  <div>
                    <label className="block text-sm font-medium text-card-foreground mb-1">Cliente <span className="text-destructive">*</span></label>
                    <input 
                      type="text" 
                      required={!selectedClientId}
                      placeholder="Nome do cliente" 
                      value={fixedTask.client} 
                      onChange={(e) => { handleInputChange(setFixedTask, fixedTask, 'client', e.target.value); setSelectedClientId(''); }} 
                      readOnly={!!selectedClientId}
                      className={`w-full p-2 border rounded-lg bg-input text-foreground ${selectedClientId ? 'bg-muted text-muted-foreground border-border' : 'border-border'}`}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-card-foreground mb-1">Telefone</label>
                    <input 
                      type="text" 
                      placeholder="Ex: 912 345 678" 
                      value={fixedTask.phone} 
                      onChange={(e) => handleInputChange(setFixedTask, fixedTask, 'phone', e.target.value)} 
                      disabled={!!selectedClientId}
                      className={`w-full p-2 border rounded-lg bg-input text-foreground ${selectedClientId ? 'bg-muted text-muted-foreground border-border cursor-not-allowed' : 'border-border'}`}
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-card-foreground mb-1">Início</label>
                      <input type="time" required value={fixedTask.startTime} onChange={(e) => handleInputChange(setFixedTask, fixedTask, 'startTime', e.target.value)} className="w-full p-2 border border-border rounded-lg bg-input text-foreground" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-card-foreground mb-1">Fim</label>
                      <input type="time" required value={fixedTask.endTime} onChange={(e) => handleInputChange(setFixedTask, fixedTask, 'endTime', e.target.value)} className="w-full p-2 border border-border rounded-lg bg-input text-foreground" />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 bg-secondary p-3 rounded-lg border border-border">
                    <div>
                      <label className="block text-sm font-medium text-card-foreground mb-1">€/h</label>
                      <input type="number" step="0.01" min="0" value={fixedTask.pricePerHour} onChange={(e) => handleInputChange(setFixedTask, fixedTask, 'pricePerHour', e.target.value)} className="w-full p-2 border border-border rounded-lg focus:ring-2 focus:ring-primary bg-input text-foreground" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-success mb-1">Total (€)</label>
                      <input type="number" step="0.01" value={fixedTask.price} onChange={(e) => handleInputChange(setFixedTask, fixedTask, 'price', e.target.value)} className="w-full p-2 border-2 border-success/30 bg-success/10 rounded-lg text-success font-bold" />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-card-foreground mb-1">Morada</label>
                    <input 
                      type="text" 
                      placeholder="Rua..." 
                      value={fixedTask.address} 
                      onChange={(e) => handleInputChange(setFixedTask, fixedTask, 'address', e.target.value)} 
                      disabled={!!selectedClientId}
                      className={`w-full p-2 border rounded-lg bg-input text-foreground ${selectedClientId ? 'bg-muted text-muted-foreground border-border cursor-not-allowed' : 'border-border'}`}
                    />
                  </div>
                  
                  <button 
                    type="submit"
                    disabled={saving}
                    className={`w-full text-white font-bold py-3 rounded-xl shadow transition flex justify-center items-center gap-2 mt-4 bg-gradient-to-r ${themeGradient} disabled:opacity-50`}
                  >
                    {saving ? <Loader2 size={18} className="animate-spin" /> : <Repeat size={18} />}
                    Criar em todas as {fixedTask.weekDay}s de {activeConfig?.label}
                  </button>
                </form>
              )}

              {/* BiWeekly Task Form */}
              {activeTab === 'biweekly' && (
                <form onSubmit={handleAddBiWeeklyTask} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-card-foreground mb-1">Data de Início</label>
                    <select
                      value={biWeeklyTask.startDate}
                      onChange={(e) => handleInputChange(setBiWeeklyTask, biWeeklyTask, 'startDate', e.target.value)}
                      className="w-full p-2 border border-border rounded-lg focus:ring-2 focus:ring-primary bg-input text-foreground"
                    >
                      {currentMonthDays.map(d => <option key={d.dateString} value={d.dateString}>{d.formatted} - {d.dayName}</option>)}
                    </select>
                  </div>
                  
                  {clients.length > 0 && (
                    <div>
                      <label className="block text-sm font-medium text-card-foreground mb-1 flex items-center gap-1">
                        <Users size={14} /> Selecionar Cliente Existente
                      </label>
                      <select
                        value={selectedClientId}
                        onChange={(e) => handleClientSelect(e.target.value, setBiWeeklyTask, biWeeklyTask)}
                        className="w-full p-2 border border-border rounded-lg focus:ring-2 focus:ring-primary bg-input text-foreground"
                      >
                        <option value="">-- Novo cliente --</option>
                        {clients.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
                      </select>
                    </div>
                  )}
                  
                  <div>
                    <label className="block text-sm font-medium text-card-foreground mb-1">Cliente <span className="text-destructive">*</span></label>
                    <input 
                      type="text" 
                      required={!selectedClientId}
                      placeholder="Nome do cliente" 
                      value={biWeeklyTask.client} 
                      onChange={(e) => { handleInputChange(setBiWeeklyTask, biWeeklyTask, 'client', e.target.value); setSelectedClientId(''); }} 
                      readOnly={!!selectedClientId}
                      className={`w-full p-2 border rounded-lg bg-input text-foreground ${selectedClientId ? 'bg-muted text-muted-foreground border-border' : 'border-border'}`}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-card-foreground mb-1">Telefone</label>
                    <input 
                      type="text" 
                      placeholder="Ex: 912 345 678" 
                      value={biWeeklyTask.phone} 
                      onChange={(e) => handleInputChange(setBiWeeklyTask, biWeeklyTask, 'phone', e.target.value)} 
                      disabled={!!selectedClientId}
                      className={`w-full p-2 border rounded-lg bg-input text-foreground ${selectedClientId ? 'bg-muted text-muted-foreground border-border cursor-not-allowed' : 'border-border'}`}
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-card-foreground mb-1">Início</label>
                      <input type="time" required value={biWeeklyTask.startTime} onChange={(e) => handleInputChange(setBiWeeklyTask, biWeeklyTask, 'startTime', e.target.value)} className="w-full p-2 border border-border rounded-lg bg-input text-foreground" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-card-foreground mb-1">Fim</label>
                      <input type="time" required value={biWeeklyTask.endTime} onChange={(e) => handleInputChange(setBiWeeklyTask, biWeeklyTask, 'endTime', e.target.value)} className="w-full p-2 border border-border rounded-lg bg-input text-foreground" />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 bg-secondary p-3 rounded-lg border border-border">
                    <div>
                      <label className="block text-sm font-medium text-card-foreground mb-1">€/h</label>
                      <input type="number" step="0.01" min="0" value={biWeeklyTask.pricePerHour} onChange={(e) => handleInputChange(setBiWeeklyTask, biWeeklyTask, 'pricePerHour', e.target.value)} className="w-full p-2 border border-border rounded-lg focus:ring-2 focus:ring-primary bg-input text-foreground" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-success mb-1">Total (€)</label>
                      <input type="number" step="0.01" value={biWeeklyTask.price} onChange={(e) => handleInputChange(setBiWeeklyTask, biWeeklyTask, 'price', e.target.value)} className="w-full p-2 border-2 border-success/30 bg-success/10 rounded-lg text-success font-bold" />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-card-foreground mb-1">Morada</label>
                    <input 
                      type="text" 
                      placeholder="Rua..." 
                      value={biWeeklyTask.address} 
                      onChange={(e) => handleInputChange(setBiWeeklyTask, biWeeklyTask, 'address', e.target.value)} 
                      disabled={!!selectedClientId}
                      className={`w-full p-2 border rounded-lg bg-input text-foreground ${selectedClientId ? 'bg-muted text-muted-foreground border-border cursor-not-allowed' : 'border-border'}`}
                    />
                  </div>
                  
                  <button 
                    type="submit"
                    disabled={saving}
                    className={`w-full text-white font-bold py-3 rounded-xl shadow transition flex justify-center items-center gap-2 mt-4 bg-gradient-to-r ${themeGradient} disabled:opacity-50`}
                  >
                    {saving ? <Loader2 size={18} className="animate-spin" /> : <CalendarRange size={18} />}
                    Criar Quinzenalmente
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Type Selector Modal */}
      {showTypeSelector && activeConfig && (
        <TypeSelectorModal
          activeConfig={activeConfig}
          previousMonthLabel={previousMonthLabel}
          canCopyFromPrevious={!!previousMonth}
          copyingFromPrevious={copyingFromPrevious}
          onSelectSingle={() => {
            setActiveTab('single');
            setShowTypeSelector(false);
            setNewTask(prev => ({ ...prev, client: '', phone: '', notes: '', date: currentMonthDays[0]?.dateString || '' }));
            setShowModal(true);
          }}
          onSelectFixed={() => {
            setActiveTab('fixed');
            setShowTypeSelector(false);
            setFixedTask(prev => ({ ...prev, client: '', phone: '', notes: '' }));
            setShowModal(true);
          }}
          onSelectBiWeekly={() => {
            setActiveTab('biweekly');
            setShowTypeSelector(false);
            setBiWeeklyTask(prev => ({ ...prev, client: '', phone: '', notes: '', startDate: currentMonthDays[0]?.dateString || '' }));
            setShowModal(true);
          }}
          onCopyFromPrevious={handleCopyFromPreviousMonth}
          onClose={() => setShowTypeSelector(false)}
        />
      )}

      {/* Position Dialog */}
      {showPositionDialog && pendingDrop && (
        <PositionDialog
          taskToMove={pendingDrop.taskToMove}
          existingTasks={pendingDrop.existingTasks}
          onPositionChoice={handlePositionChoice}
          onCancel={() => {
            setShowPositionDialog(false);
            setPendingDrop(null);
          }}
        />
      )}

      {/* Undo Bars */}
      {showUndoBar && copiedTaskIds.length > 0 && (
        <UndoBar
          message={`${copiedTaskIds.length} agendamentos copiados`}
          onUndo={handleUndoCopy}
          onDismiss={() => {
            setShowUndoBar(false);
            setCopiedTaskIds([]);
          }}
          saving={saving}
        />
      )}

      {showMoveUndoBar && lastMovedTask && (
        <UndoBar
          message={`${lastMovedTask.clientName} movido`}
          onUndo={handleUndoMove}
          onDismiss={() => {
            setShowMoveUndoBar(false);
            setLastMovedTask(null);
          }}
          saving={saving}
          variant="move"
        />
      )}

      {/* Calendar Modal */}
      <CalendarModal
        isOpen={showCalendarModal}
        onClose={() => setShowCalendarModal(false)}
        allTasks={allTasks}
        isLoading={loading}
      />

      {/* Floating Calendar Button */}
      <button
        onClick={() => setShowCalendarModal(true)}
        className="fixed bottom-6 left-6 z-50 w-14 h-14 rounded-full shadow-lg flex items-center justify-center transition-all transform hover:scale-110 print:hidden bg-gradient-to-r from-red-500 to-red-600 text-white"
        title="Ver Calendário"
      >
        <CalendarDays size={26} />
      </button>

      {/* Floating New Button - Admin Only */}
      {isAdmin && (
        <button
          onClick={() => {
            setEditingId(null);
            setSelectedClientId('');
            setShowTypeSelector(true);
          }}
          className={`fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full shadow-lg flex items-center justify-center transition-all transform hover:scale-110 print:hidden bg-gradient-to-r ${themeGradient} text-white`}
          title="Novo Agendamento"
        >
          <Plus size={28} />
        </button>
      )}

      <style>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fade-in 0.3s ease-out;
        }
        @media print {
          body * { visibility: hidden; }
          main, main * { visibility: visible; }
          main { position: absolute; left: 0; top: 0; }
        }
      `}</style>
    </div>
  );
};

export default ScheduleView;
