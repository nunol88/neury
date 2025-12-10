import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useAgendamentos, Task, AllTasks } from '@/hooks/useAgendamentos';
import { useClients, Client } from '@/hooks/useClients';
import { 
  Plus, Trash2, Check, MapPin, Calendar, Save, Download, X, 
  Phone, Repeat, CalendarRange, Pencil, LogOut, User, Loader2, Users, UserPlus
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import logoMayslimpo from '@/assets/logo-mayslimpo.jpg';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const MONTHS_CONFIG = {
  december: {
    id: 'december',
    label: 'Dezembro 2025',
    year: 2025,
    monthIndex: 11,
    startDay: 8,
    endDay: 31,
    color: 'purple',
  },
  january: {
    id: 'january',
    label: 'Janeiro 2026',
    year: 2026,
    monthIndex: 0,
    startDay: 1,
    endDay: 31,
    color: 'blue',
  },
  february: {
    id: 'february',
    label: 'Fevereiro 2026',
    year: 2026,
    monthIndex: 1,
    startDay: 1,
    endDay: 28,
    color: 'pink',
  }
};

interface ScheduleViewProps {
  isAdmin: boolean;
}

const ScheduleView: React.FC<ScheduleViewProps> = ({ isAdmin }) => {
  const { user, role, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { allTasks, loading, addTask, updateTask, deleteTask, toggleTaskStatus, moveTask } = useAgendamentos();
  const { clients, addClient } = useClients();
  
  const [activeMonth, setActiveMonth] = useState<'december' | 'january' | 'february'>('december');
  const [showModal, setShowModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'single' | 'fixed' | 'biweekly'>('single');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [selectedClientId, setSelectedClientId] = useState<string>('');
  const [saveAsClient, setSaveAsClient] = useState(false);

  const generateDaysForMonth = (monthKey: string) => {
    const config = MONTHS_CONFIG[monthKey as keyof typeof MONTHS_CONFIG];
    const days = [];
    for (let day = config.startDay; day <= config.endDay; day++) {
      const date = new Date(config.year, config.monthIndex, day);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const d = String(date.getDate()).padStart(2, '0');
      const dateString = `${year}-${month}-${d}`;

      days.push({
        dateObject: date,
        dateString: dateString,
        dayName: date.toLocaleDateString('pt-BR', { weekday: 'long' }),
        formatted: date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
        monthKey: monthKey
      });
    }
    return days;
  };

  const currentMonthDays = generateDaysForMonth(activeMonth);
  const activeConfig = MONTHS_CONFIG[activeMonth];

  const getMonthKeyFromDate = (dateString: string): keyof AllTasks | null => {
    const date = new Date(dateString);
    const month = date.getMonth();
    const year = date.getFullYear();

    if (month === 11 && year === 2025) return 'december';
    if (month === 0 && year === 2026) return 'january';
    if (month === 1 && year === 2026) return 'february';
    return null;
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

  const calculatePrice = (startStr: string, endStr: string, pricePerHour: string) => {
    if (startStr && endStr && pricePerHour) {
      const start = new Date(`1970-01-01T${startStr}`);
      const end = new Date(`1970-01-01T${endStr}`);
      let diffMs = end.getTime() - start.getTime();
      if (diffMs <= 0) return null;
      const diffHours = diffMs / (1000 * 60 * 60);
      return (diffHours * parseFloat(pricePerHour)).toFixed(2);
    }
    return null;
  };

  const handleInputChange = (setter: any, state: any, field: string, value: string) => {
    const updatedTask = { ...state, [field]: value };
    if (field === 'startTime' || field === 'endTime') {
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
        setter({
          ...state,
          client: client.nome,
          phone: client.telefone,
          address: client.morada,
          pricePerHour: client.preco_hora
        });
      }
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
    for (const monthKey of ['december', 'january', 'february'] as const) {
      const found = allTasks[monthKey].find(t => t.id === taskId);
      if (found) {
        taskToMove = found;
        break;
      }
    }

    if (!taskToMove || taskToMove.date === targetDateString) return;

    const success = await moveTask(taskId, targetDateString);
    if (success) {
      toast({ title: 'Agendamento movido com sucesso' });
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

    setSaving(true);

    try {
      // Save as client if checkbox is checked and it's a new client
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
            description: 'Data fora do período permitido (Dez/25 a Fev/26)',
            variant: 'destructive'
          });
          return;
        }

        const result = await addTask(newTask);
        if (result) {
          toast({ title: 'Agendamento criado' });
        }
      }

      setNewTask({ ...newTask, client: '', phone: '', notes: '', completed: false });
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
    
    setSaving(true);

    try {
      let count = 0;

      for (const day of currentMonthDays) {
        if (day.dayName.toLowerCase().includes(fixedTask.weekDay.toLowerCase())) {
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
      setFixedTask({ ...fixedTask, client: '', phone: '', notes: '', completed: false });
      setShowModal(false);
    } finally {
      setSaving(false);
    }
  };

  const handleAddBiWeeklyTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!biWeeklyTask.client) return;
    
    setSaving(true);

    try {
      const allDaysContinuous = [
        ...generateDaysForMonth('december'),
        ...generateDaysForMonth('january'),
        ...generateDaysForMonth('february')
      ];

      const startIndex = allDaysContinuous.findIndex(d => d.dateString === biWeeklyTask.startDate);

      if (startIndex === -1) {
        toast({ title: 'Data inválida', variant: 'destructive' });
        return;
      }

      let addedCount = 0;

      // First appointment
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

      // Second appointment (14 days later)
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
      setBiWeeklyTask({ ...biWeeklyTask, client: '', phone: '', notes: '', completed: false });
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
    return allTasks[activeMonth].reduce((acc, curr) => acc + (parseFloat(curr.price) || 0), 0);
  };

  const exportToPDF = () => {
    const doc = new jsPDF();
    const tasks = allTasks[activeMonth];
    
    // Header
    doc.setFontSize(20);
    doc.setTextColor(100, 100, 100);
    doc.text(`Agenda da Neury - ${activeConfig.label}`, 14, 20);
    
    // Prepare table data
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
        task.completed ? 'Concluído' : 'Pendente'
      ];
    });
    
    // Add table
    autoTable(doc, {
      head: [['Data', 'Cliente', 'Telefone', 'Horário', 'Morada', 'Preço', 'Estado']],
      body: tableData,
      startY: 30,
      styles: { fontSize: 8, cellPadding: 2 },
      headStyles: { fillColor: [100, 100, 100] },
      alternateRowStyles: { fillColor: [245, 245, 245] },
    });
    
    // Total
    const finalY = (doc as any).lastAutoTable.finalY || 30;
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    doc.text(`Total: €${calculateMonthTotal().toFixed(2)}`, 14, finalY + 10);
    
    // Save
    doc.save(`agenda-${activeMonth}-${activeConfig.year}.pdf`);
    toast({ title: 'PDF exportado com sucesso' });
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const getThemeColor = () => {
    if (activeMonth === 'december') return 'from-purple-600 to-purple-800';
    if (activeMonth === 'january') return 'from-blue-600 to-blue-800';
    if (activeMonth === 'february') return 'from-pink-500 to-pink-700';
    return 'from-purple-600 to-purple-800';
  };

  const getBgColor = () => {
    if (activeMonth === 'december') return 'bg-purple-50';
    if (activeMonth === 'january') return 'bg-blue-50';
    if (activeMonth === 'february') return 'bg-pink-50';
    return 'bg-purple-50';
  };

  const username = user?.user_metadata?.name || user?.email?.replace('@local.app', '') || '';
  const roleLabel = role === 'admin' ? 'Administrador' : 'Neury';

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-gray-600">A carregar agendamentos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen font-sans text-gray-800 pb-10 print:bg-white ${getBgColor()}`}>

      {/* User Info Bar */}
      <div className="bg-white border-b px-4 py-2 print:hidden">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <img 
              src={logoMayslimpo} 
              alt="MaysLimpo Logo" 
              className="w-10 h-10 rounded-full object-cover shadow-sm border border-gray-200"
            />
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <span className="capitalize font-medium">{username}</span>
              <span className="px-2 py-0.5 bg-primary/10 text-primary rounded text-xs font-medium">
                {roleLabel}
              </span>
              {!isAdmin && (
                <span className="px-2 py-0.5 bg-yellow-100 text-yellow-700 rounded text-xs">
                  Apenas visualização
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isAdmin && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => navigate('/admin/clientes')}
              >
                <Users size={16} className="mr-1" />
                Clientes
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={handleSignOut}>
              <LogOut size={16} className="mr-1" />
              Sair
            </Button>
          </div>
        </div>
      </div>

      {/* Navegação de Meses (Abas) */}
      <div className="bg-white shadow-sm pt-2 px-2 sticky top-0 z-20 print:hidden overflow-x-auto">
        <div className="max-w-7xl mx-auto flex gap-2">
          {Object.values(MONTHS_CONFIG).map((month) => (
            <button
              key={month.id}
              onClick={() => setActiveMonth(month.id as 'december' | 'january' | 'february')}
              className={`px-6 py-3 rounded-t-xl font-bold text-sm transition-all flex items-center gap-2
                ${activeMonth === month.id
                  ? `bg-gradient-to-r ${getThemeColor()} text-white shadow-lg transform -translate-y-1`
                  : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                }`}
            >
              <Calendar size={16} />
              {month.label}
            </button>
          ))}
        </div>
      </div>

      {/* Header */}
      <header className={`bg-gradient-to-r ${getThemeColor()} text-white p-6 shadow-lg print:hidden relative z-10 rounded-b-lg mx-2`}>
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              Agenda da Neury
            </h1>
            <p className="opacity-90 mt-1 flex items-center gap-2 text-lg font-medium">
              Visualizando: {activeConfig.label}
            </p>
          </div>

          <div className="mt-4 md:mt-0 flex gap-3 flex-wrap">
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

      {/* Resumo Financeiro */}
      <div className="max-w-7xl mx-auto px-4 mt-6 print:mt-2 relative z-0">
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex justify-between items-center">
          <span className="text-gray-600 font-medium">Total previsto ({activeConfig.label}):</span>
          <span className={`text-3xl font-bold flex items-center gap-1 ${activeMonth === 'january' ? 'text-blue-600' : activeMonth === 'february' ? 'text-pink-600' : 'text-purple-600'}`}>
            € {calculateMonthTotal().toFixed(2)}
          </span>
        </div>
      </div>

      {/* Grid de Dias */}
      <main className="max-w-7xl mx-auto p-4 mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 print:block print:w-full relative z-0">
        {currentMonthDays.map((dayObj) => {
          const dayTasks = allTasks[activeMonth]
            .filter(t => t.date === dayObj.dateString)
            .sort((a, b) => a.startTime.localeCompare(b.startTime));

          const isWeekend = dayObj.dateObject.getDay() === 0 || dayObj.dateObject.getDay() === 6;
          const isSunday = dayObj.dateObject.getDay() === 0;

          const borderClass = activeMonth === 'january' ? 'border-blue-100' : activeMonth === 'february' ? 'border-pink-100' : 'border-purple-100';
          const headerBg = activeMonth === 'january' ? 'bg-blue-50' : activeMonth === 'february' ? 'bg-pink-50' : 'bg-purple-50';
          const textHeader = activeMonth === 'january' ? 'text-blue-900' : activeMonth === 'february' ? 'text-pink-900' : 'text-purple-900';

          return (
            <div
              key={dayObj.dateString}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, dayObj.dateString)}
              className={`rounded-xl shadow-sm overflow-hidden border flex flex-col print:mb-4 print:break-inside-avoid h-full transition-colors duration-200
                ${isWeekend ? 'bg-gray-50 border-gray-200' : `bg-white ${borderClass}`}
                ${isSunday ? 'border-l-4 border-l-red-300' : ''}
              `}
            >
              <div className={`p-3 border-b flex justify-between items-center ${isWeekend ? 'bg-gray-100' : `${headerBg} ${borderClass}`}`}>
                <div>
                  <h2 className={`font-bold capitalize ${isSunday ? 'text-red-500' : textHeader}`}>
                    {dayObj.dayName}
                  </h2>
                  <span className="text-xs text-gray-500 font-semibold">{dayObj.formatted}</span>
                </div>
                {dayTasks.length > 0 && (
                  <span className={`text-xs bg-white border px-2 py-1 rounded-full shadow-sm ${textHeader} ${borderClass}`}>
                    {dayTasks.length}
                  </span>
                )}
              </div>

              <div className="p-2 flex-1 min-h-[100px]">
                {dayTasks.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-gray-300 text-xs italic">
                    {isSunday ? 'Domingo' : 'Livre'}
                  </div>
                ) : (
                  <div className="space-y-2">
                    {dayTasks.map((task) => (
                      <div
                        key={task.id}
                        draggable={isAdmin}
                        onDragStart={(e) => handleDragStart(e, task)}
                        className={`relative group p-2 rounded-lg border transition-all text-sm ${isAdmin ? 'cursor-move' : 'cursor-default'} ${task.completed
                          ? 'bg-green-50 border-green-200'
                          : 'bg-white border-gray-200 hover:border-gray-400 hover:shadow-md'
                          }`}
                      >
                        <div className="flex justify-between items-start mb-1">
                          <span className={`font-bold truncate ${task.completed ? 'text-green-800 line-through' : 'text-gray-800'}`}>
                            {task.client}
                          </span>
                          <span className="text-xs bg-gray-100 px-1.5 py-0.5 rounded text-gray-600 whitespace-nowrap">
                            {task.startTime} - {task.endTime}
                          </span>
                        </div>

                        {task.phone && (
                          <div className="text-xs text-blue-600 truncate flex items-center gap-1 mb-1 font-medium">
                            <Phone size={10} />
                            {task.phone}
                          </div>
                        )}

                        {task.address && (
                          <div className="text-xs text-gray-500 flex items-start gap-1 mb-1">
                            <MapPin size={10} className="shrink-0 mt-0.5" />
                            <span className="break-words">{task.address}</span>
                          </div>
                        )}

                        <div className="flex justify-between items-center border-t pt-1.5 border-dashed border-gray-100 mt-1">
                          <div className="text-green-700 font-bold text-xs flex items-center gap-0.5">
                            € {task.price || '0'}
                          </div>

                          {isAdmin && (
                            <div className="flex gap-1 print:hidden opacity-0 group-hover:opacity-100 transition-opacity">
                              <button
                                onClick={() => openEditModal(task)}
                                className="p-1 rounded text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition"
                                title="Editar"
                              >
                                <Pencil size={14} />
                              </button>
                              <button
                                onClick={() => handleToggleStatus(task.id, task.completed)}
                                className={`p-1 rounded hover:scale-110 transition ${task.completed ? 'text-green-600 bg-green-100' : 'text-gray-400 hover:text-green-600 hover:bg-green-50'
                                  }`}
                                title={task.completed ? "Desmarcar" : "Concluir"}
                              >
                                <Check size={14} />
                              </button>
                              <button
                                onClick={() => handleDelete(task.id)}
                                className="p-1 rounded text-gray-400 hover:text-red-500 hover:bg-red-50 hover:scale-110 transition"
                                title="Apagar"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </main>

      {/* Modal de Adicionar/Editar Tarefa */}
      {showModal && isAdmin && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowModal(false)}
          ></div>

          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden relative z-10 animate-fade-in">
            <div className={`p-4 text-white flex justify-between items-center bg-gradient-to-r ${getThemeColor()}`}>
              <h2 className="text-xl font-bold">{editingId ? 'Editar Agendamento' : 'Agendar Limpeza'}</h2>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="hover:bg-white/20 p-2 rounded-full transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            {!editingId && (
              <div className="flex border-b border-gray-200 overflow-x-auto bg-gray-50">
                <button
                  onClick={() => setActiveTab('single')}
                  className={`flex-1 min-w-[100px] py-3 text-xs md:text-sm font-bold transition-colors whitespace-nowrap ${activeTab === 'single' ? 'text-purple-600 border-b-2 border-purple-600 bg-white' : 'text-gray-500 hover:bg-white'}`}
                >
                  Único
                </button>
                <button
                  onClick={() => setActiveTab('fixed')}
                  className={`flex-1 min-w-[100px] py-3 text-xs md:text-sm font-bold transition-colors whitespace-nowrap flex items-center justify-center gap-1 ${activeTab === 'fixed' ? 'text-purple-600 border-b-2 border-purple-600 bg-white' : 'text-gray-500 hover:bg-white'}`}
                >
                  <Repeat size={14} />
                  Semanal
                </button>
                <button
                  onClick={() => setActiveTab('biweekly')}
                  className={`flex-1 min-w-[100px] py-3 text-xs md:text-sm font-bold transition-colors whitespace-nowrap flex items-center justify-center gap-1 ${activeTab === 'biweekly' ? 'text-purple-600 border-b-2 border-purple-600 bg-white' : 'text-gray-500 hover:bg-white'}`}
                >
                  <CalendarRange size={14} />
                  Quinzenal
                </button>
              </div>
            )}

            <div className="p-6 max-h-[70vh] overflow-y-auto">

              {activeTab === 'single' && (
                <form onSubmit={handleAddTask} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Data</label>
                    <select
                      value={newTask.date}
                      onChange={(e) => handleInputChange(setNewTask, newTask, 'date', e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 bg-white"
                      disabled={!!editingId}
                    >
                      {editingId ? (
                        <option value={newTask.date}>{new Date(newTask.date).toLocaleDateString('pt-BR')}</option>
                      ) : (
                        currentMonthDays.map(d => <option key={d.dateString} value={d.dateString}>{d.formatted} - {d.dayName}</option>)
                      )}
                    </select>
                    {editingId && <p className="text-xs text-gray-500 mt-1">Para mudar o dia, arraste o cartão na agenda.</p>}
                  </div>
                  {/* Client selector */}
                  {clients.length > 0 && !editingId && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
                        <Users size={14} />
                        Selecionar Cliente Existente
                      </label>
                      <select
                        value={selectedClientId}
                        onChange={(e) => handleClientSelect(e.target.value, setNewTask, newTask)}
                        className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 bg-white"
                      >
                        <option value="">-- Novo cliente --</option>
                        {clients.map(c => (
                          <option key={c.id} value={c.id}>{c.nome}</option>
                        ))}
                      </select>
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Cliente <span className="text-red-500">*</span></label>
                    <input 
                      type="text" 
                      required 
                      placeholder="Nome do cliente" 
                      value={newTask.client} 
                      onChange={(e) => { handleInputChange(setNewTask, newTask, 'client', e.target.value); setSelectedClientId(''); }} 
                      disabled={!!selectedClientId}
                      className={`w-full p-2 border rounded-lg ${selectedClientId ? 'bg-gray-100 text-gray-500 border-gray-200 cursor-not-allowed' : 'border-gray-300'}`}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Telefone</label>
                    <input 
                      type="text" 
                      placeholder="Ex: 912 345 678" 
                      value={newTask.phone} 
                      onChange={(e) => handleInputChange(setNewTask, newTask, 'phone', e.target.value)} 
                      disabled={!!selectedClientId}
                      className={`w-full p-2 border rounded-lg ${selectedClientId ? 'bg-gray-100 text-gray-500 border-gray-200 cursor-not-allowed' : 'border-gray-300'}`}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Início</label>
                      <input type="time" required value={newTask.startTime} onChange={(e) => handleInputChange(setNewTask, newTask, 'startTime', e.target.value)} className="w-full p-2 border border-gray-300 rounded-lg" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Fim</label>
                      <input type="time" required value={newTask.endTime} onChange={(e) => handleInputChange(setNewTask, newTask, 'endTime', e.target.value)} className="w-full p-2 border border-gray-300 rounded-lg" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4 bg-gray-50 p-3 rounded-lg border border-gray-100">
                    <div>
                      <label className="block text-sm font-medium text-gray-500 mb-1">€/h (Fixo)</label>
                      <input type="number" readOnly disabled value={newTask.pricePerHour} className="w-full p-2 border border-gray-200 rounded-lg bg-gray-100 text-gray-500 cursor-not-allowed" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-green-700 mb-1">Total (€)</label>
                      <input type="number" step="0.01" value={newTask.price} onChange={(e) => handleInputChange(setNewTask, newTask, 'price', e.target.value)} className="w-full p-2 border-2 border-green-100 bg-green-50 rounded-lg text-green-800 font-bold" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Morada</label>
                    <input 
                      type="text" 
                      placeholder="Rua..." 
                      value={newTask.address} 
                      onChange={(e) => handleInputChange(setNewTask, newTask, 'address', e.target.value)} 
                      disabled={!!selectedClientId}
                      className={`w-full p-2 border rounded-lg ${selectedClientId ? 'bg-gray-100 text-gray-500 border-gray-200 cursor-not-allowed' : 'border-gray-300'}`}
                    />
                    {selectedClientId && (
                      <p className="text-xs text-gray-400 mt-1">Morada definida na ficha do cliente</p>
                    )}
                  </div>

                  {/* Save as client checkbox */}
                  {!editingId && !selectedClientId && newTask.client && (
                    <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer hover:text-gray-800">
                      <input
                        type="checkbox"
                        checked={saveAsClient}
                        onChange={(e) => setSaveAsClient(e.target.checked)}
                        className="w-4 h-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                      />
                      <UserPlus size={14} />
                      Guardar cliente para próximos agendamentos
                    </label>
                  )}

                  <button 
                    type="submit" 
                    disabled={saving}
                    className={`w-full text-white font-bold py-3 rounded-xl shadow transition flex justify-center items-center gap-2 mt-4 bg-gradient-to-r ${getThemeColor()} disabled:opacity-50`}
                  >
                    {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                    {editingId ? 'Salvar Alterações' : `Salvar em ${activeConfig.label}`}
                  </button>
                </form>
              )}

              {activeTab === 'fixed' && (
                <form onSubmit={handleAddFixedTask} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Dia da Semana</label>
                    <select
                      value={fixedTask.weekDay}
                      onChange={(e) => handleInputChange(setFixedTask, fixedTask, 'weekDay', e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 bg-white"
                    >
                      {weekDaysList.map(day => <option key={day} value={day}>{day}</option>)}
                    </select>
                  </div>
                  {/* Client selector for fixed */}
                  {clients.length > 0 && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
                        <Users size={14} />
                        Selecionar Cliente Existente
                      </label>
                      <select
                        value={selectedClientId}
                        onChange={(e) => handleClientSelect(e.target.value, setFixedTask, fixedTask)}
                        className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 bg-white"
                      >
                        <option value="">-- Novo cliente --</option>
                        {clients.map(c => (
                          <option key={c.id} value={c.id}>{c.nome}</option>
                        ))}
                      </select>
                    </div>
                  )}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Cliente <span className="text-red-500">*</span></label>
                    <input 
                      type="text" 
                      required 
                      placeholder="Nome do cliente" 
                      value={fixedTask.client} 
                      onChange={(e) => { handleInputChange(setFixedTask, fixedTask, 'client', e.target.value); setSelectedClientId(''); }} 
                      disabled={!!selectedClientId}
                      className={`w-full p-2 border rounded-lg ${selectedClientId ? 'bg-gray-100 text-gray-500 border-gray-200 cursor-not-allowed' : 'border-gray-300'}`}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Telefone</label>
                    <input 
                      type="text" 
                      placeholder="Ex: 912 345 678" 
                      value={fixedTask.phone} 
                      onChange={(e) => handleInputChange(setFixedTask, fixedTask, 'phone', e.target.value)} 
                      disabled={!!selectedClientId}
                      className={`w-full p-2 border rounded-lg ${selectedClientId ? 'bg-gray-100 text-gray-500 border-gray-200 cursor-not-allowed' : 'border-gray-300'}`}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Início</label>
                      <input type="time" required value={fixedTask.startTime} onChange={(e) => handleInputChange(setFixedTask, fixedTask, 'startTime', e.target.value)} className="w-full p-2 border border-gray-300 rounded-lg" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Fim</label>
                      <input type="time" required value={fixedTask.endTime} onChange={(e) => handleInputChange(setFixedTask, fixedTask, 'endTime', e.target.value)} className="w-full p-2 border border-gray-300 rounded-lg" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4 bg-gray-50 p-3 rounded-lg border border-gray-100">
                    <div>
                      <label className="block text-sm font-medium text-gray-500 mb-1">€/h (Fixo)</label>
                      <input type="number" readOnly disabled value={fixedTask.pricePerHour} className="w-full p-2 border border-gray-200 rounded-lg bg-gray-100 text-gray-500 cursor-not-allowed" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-green-700 mb-1">Total (€)</label>
                      <input type="number" step="0.01" value={fixedTask.price} onChange={(e) => handleInputChange(setFixedTask, fixedTask, 'price', e.target.value)} className="w-full p-2 border-2 border-green-100 bg-green-50 rounded-lg text-green-800 font-bold" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Morada</label>
                    <input 
                      type="text" 
                      placeholder="Rua..." 
                      value={fixedTask.address} 
                      onChange={(e) => handleInputChange(setFixedTask, fixedTask, 'address', e.target.value)} 
                      disabled={!!selectedClientId}
                      className={`w-full p-2 border rounded-lg ${selectedClientId ? 'bg-gray-100 text-gray-500 border-gray-200 cursor-not-allowed' : 'border-gray-300'}`}
                    />
                    {selectedClientId && (
                      <p className="text-xs text-gray-400 mt-1">Morada definida na ficha do cliente</p>
                    )}
                  </div>
                  <button 
                    type="submit"
                    disabled={saving}
                    className={`w-full text-white font-bold py-3 rounded-xl shadow transition flex justify-center items-center gap-2 mt-4 bg-gradient-to-r ${getThemeColor()} disabled:opacity-50`}
                  >
                    {saving ? <Loader2 size={18} className="animate-spin" /> : <Repeat size={18} />}
                    Criar em todas as {fixedTask.weekDay}s de {activeConfig.label}
                  </button>
                </form>
              )}

              {activeTab === 'biweekly' && (
                <form onSubmit={handleAddBiWeeklyTask} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Data de Início</label>
                    <select
                      value={biWeeklyTask.startDate}
                      onChange={(e) => handleInputChange(setBiWeeklyTask, biWeeklyTask, 'startDate', e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 bg-white"
                    >
                      {currentMonthDays.map(d => <option key={d.dateString} value={d.dateString}>{d.formatted} - {d.dayName}</option>)}
                    </select>
                  </div>
                  {/* Client selector for biweekly */}
                  {clients.length > 0 && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
                        <Users size={14} />
                        Selecionar Cliente Existente
                      </label>
                      <select
                        value={selectedClientId}
                        onChange={(e) => handleClientSelect(e.target.value, setBiWeeklyTask, biWeeklyTask)}
                        className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 bg-white"
                      >
                        <option value="">-- Novo cliente --</option>
                        {clients.map(c => (
                          <option key={c.id} value={c.id}>{c.nome}</option>
                        ))}
                      </select>
                    </div>
                  )}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Cliente <span className="text-red-500">*</span></label>
                    <input 
                      type="text" 
                      required 
                      placeholder="Nome do cliente" 
                      value={biWeeklyTask.client} 
                      onChange={(e) => { handleInputChange(setBiWeeklyTask, biWeeklyTask, 'client', e.target.value); setSelectedClientId(''); }} 
                      disabled={!!selectedClientId}
                      className={`w-full p-2 border rounded-lg ${selectedClientId ? 'bg-gray-100 text-gray-500 border-gray-200 cursor-not-allowed' : 'border-gray-300'}`}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Telefone</label>
                    <input 
                      type="text" 
                      placeholder="Ex: 912 345 678" 
                      value={biWeeklyTask.phone} 
                      onChange={(e) => handleInputChange(setBiWeeklyTask, biWeeklyTask, 'phone', e.target.value)} 
                      disabled={!!selectedClientId}
                      className={`w-full p-2 border rounded-lg ${selectedClientId ? 'bg-gray-100 text-gray-500 border-gray-200 cursor-not-allowed' : 'border-gray-300'}`}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Início</label>
                      <input type="time" required value={biWeeklyTask.startTime} onChange={(e) => handleInputChange(setBiWeeklyTask, biWeeklyTask, 'startTime', e.target.value)} className="w-full p-2 border border-gray-300 rounded-lg" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Fim</label>
                      <input type="time" required value={biWeeklyTask.endTime} onChange={(e) => handleInputChange(setBiWeeklyTask, biWeeklyTask, 'endTime', e.target.value)} className="w-full p-2 border border-gray-300 rounded-lg" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4 bg-gray-50 p-3 rounded-lg border border-gray-100">
                    <div>
                      <label className="block text-sm font-medium text-gray-500 mb-1">€/h (Fixo)</label>
                      <input type="number" readOnly disabled value={biWeeklyTask.pricePerHour} className="w-full p-2 border border-gray-200 rounded-lg bg-gray-100 text-gray-500 cursor-not-allowed" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-green-700 mb-1">Total (€)</label>
                      <input type="number" step="0.01" value={biWeeklyTask.price} onChange={(e) => handleInputChange(setBiWeeklyTask, biWeeklyTask, 'price', e.target.value)} className="w-full p-2 border-2 border-green-100 bg-green-50 rounded-lg text-green-800 font-bold" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Morada</label>
                    <input 
                      type="text" 
                      placeholder="Rua..." 
                      value={biWeeklyTask.address} 
                      onChange={(e) => handleInputChange(setBiWeeklyTask, biWeeklyTask, 'address', e.target.value)} 
                      disabled={!!selectedClientId}
                      className={`w-full p-2 border rounded-lg ${selectedClientId ? 'bg-gray-100 text-gray-500 border-gray-200 cursor-not-allowed' : 'border-gray-300'}`}
                    />
                    {selectedClientId && (
                      <p className="text-xs text-gray-400 mt-1">Morada definida na ficha do cliente</p>
                    )}
                  </div>
                  <button 
                    type="submit"
                    disabled={saving}
                    className={`w-full text-white font-bold py-3 rounded-xl shadow transition flex justify-center items-center gap-2 mt-4 bg-gradient-to-r ${getThemeColor()} disabled:opacity-50`}
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

      {/* Botão Flutuante - Apenas Admin */}
      {isAdmin && (
        <button
          onClick={() => {
            setEditingId(null);
            setActiveTab('single');
            setNewTask(prev => ({ ...prev, client: '', phone: '', notes: '', date: currentMonthDays[0]?.dateString || '' }));
            setShowModal(true);
          }}
          className={`fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full shadow-lg flex items-center justify-center transition-all transform hover:scale-110 print:hidden bg-gradient-to-r ${getThemeColor()} text-white`}
          title="Novo Agendamento"
        >
          <Plus size={28} />
        </button>
      )}
    </div>
  );
};

export default ScheduleView;
