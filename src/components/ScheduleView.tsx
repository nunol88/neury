import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { 
  Plus, Trash2, Check, Clock, MapPin, Calendar, Save, Printer, X, 
  Phone, Repeat, CalendarRange, Pencil, Undo2, LogOut, User 
} from 'lucide-react';
import { Button } from '@/components/ui/button';

const MONTHS_CONFIG = {
  december: {
    id: 'december',
    label: 'Dezembro 2025',
    year: 2025,
    monthIndex: 11,
    startDay: 8,
    endDay: 31,
    color: 'purple',
    storageKey: 'neury_schedule_december_2025'
  },
  january: {
    id: 'january',
    label: 'Janeiro 2026',
    year: 2026,
    monthIndex: 0,
    startDay: 1,
    endDay: 31,
    color: 'blue',
    storageKey: 'neury_schedule_january_2026'
  },
  february: {
    id: 'february',
    label: 'Fevereiro 2026',
    year: 2026,
    monthIndex: 1,
    startDay: 1,
    endDay: 28,
    color: 'pink',
    storageKey: 'neury_schedule_february_2026'
  }
};

interface Task {
  id: number;
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

interface AllTasks {
  december: Task[];
  january: Task[];
  february: Task[];
}

interface ScheduleViewProps {
  isAdmin: boolean;
}

const ScheduleView: React.FC<ScheduleViewProps> = ({ isAdmin }) => {
  const { user, role, signOut } = useAuth();
  const navigate = useNavigate();
  
  const [allTasks, setAllTasks] = useState<AllTasks>({
    december: [],
    january: [],
    february: []
  });

  const [history, setHistory] = useState<AllTasks[]>([]);
  const [activeMonth, setActiveMonth] = useState<'december' | 'january' | 'february'>('december');
  const [showModal, setShowModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'single' | 'fixed' | 'biweekly'>('single');
  const [editingId, setEditingId] = useState<number | null>(null);

  // Dados de exemplo para demonstração
  const getSampleData = (): AllTasks => ({
    december: [
      { id: 1, date: '2025-12-09', client: 'Maria Silva', phone: '912 345 678', startTime: '08:00', endTime: '12:00', address: 'Rua das Flores, 123', pricePerHour: '7', price: '28.00', notes: '', completed: false },
      { id: 2, date: '2025-12-10', client: 'João Santos', phone: '923 456 789', startTime: '09:00', endTime: '13:00', address: 'Av. da Liberdade, 45', pricePerHour: '7', price: '28.00', notes: '', completed: true },
      { id: 3, date: '2025-12-12', client: 'Ana Costa', phone: '934 567 890', startTime: '14:00', endTime: '17:00', address: 'Praça do Comércio, 7', pricePerHour: '7', price: '21.00', notes: '', completed: false },
      { id: 4, date: '2025-12-15', client: 'Pedro Oliveira', phone: '945 678 901', startTime: '08:30', endTime: '11:30', address: 'Rua Augusta, 200', pricePerHour: '7', price: '21.00', notes: '', completed: false },
      { id: 5, date: '2025-12-18', client: 'Sofia Pereira', phone: '956 789 012', startTime: '10:00', endTime: '14:00', address: 'Largo do Carmo, 15', pricePerHour: '7', price: '28.00', notes: '', completed: false },
      { id: 6, date: '2025-12-20', client: 'Maria Silva', phone: '912 345 678', startTime: '08:00', endTime: '12:00', address: 'Rua das Flores, 123', pricePerHour: '7', price: '28.00', notes: '', completed: false },
    ],
    january: [
      { id: 7, date: '2026-01-06', client: 'Carlos Rodrigues', phone: '967 890 123', startTime: '09:00', endTime: '12:00', address: 'Rua do Ouro, 88', pricePerHour: '7', price: '21.00', notes: '', completed: false },
      { id: 8, date: '2026-01-08', client: 'Maria Silva', phone: '912 345 678', startTime: '08:00', endTime: '12:00', address: 'Rua das Flores, 123', pricePerHour: '7', price: '28.00', notes: '', completed: false },
      { id: 9, date: '2026-01-15', client: 'Ana Costa', phone: '934 567 890', startTime: '14:00', endTime: '17:00', address: 'Praça do Comércio, 7', pricePerHour: '7', price: '21.00', notes: '', completed: false },
    ],
    february: [
      { id: 10, date: '2026-02-05', client: 'João Santos', phone: '923 456 789', startTime: '09:00', endTime: '13:00', address: 'Av. da Liberdade, 45', pricePerHour: '7', price: '28.00', notes: '', completed: false },
      { id: 11, date: '2026-02-12', client: 'Sofia Pereira', phone: '956 789 012', startTime: '10:00', endTime: '14:00', address: 'Largo do Carmo, 15', pricePerHour: '7', price: '28.00', notes: '', completed: false },
    ]
  });

  useEffect(() => {
    const loadedTasks: AllTasks = { december: [], january: [], february: [] };
    let hasAnyData = false;
    
    Object.values(MONTHS_CONFIG).forEach(config => {
      try {
        const saved = localStorage.getItem(config.storageKey);
        if (saved) {
          const parsed = JSON.parse(saved);
          loadedTasks[config.id as keyof AllTasks] = parsed;
          if (parsed.length > 0) hasAnyData = true;
        }
      } catch (error) {
        console.error(`Erro ao carregar ${config.id}`, error);
      }
    });

    // Se não há dados, carregar dados de exemplo
    if (!hasAnyData) {
      setAllTasks(getSampleData());
    } else {
      setAllTasks(loadedTasks);
    }
  }, []);

  useEffect(() => {
    Object.values(MONTHS_CONFIG).forEach(config => {
      localStorage.setItem(config.storageKey, JSON.stringify(allTasks[config.id as keyof AllTasks]));
    });
  }, [allTasks]);

  const saveToHistory = () => {
    setHistory(prev => [...prev.slice(-10), JSON.parse(JSON.stringify(allTasks))]);
  };

  const handleUndo = () => {
    if (history.length === 0) return;
    const previousState = history[history.length - 1];
    setAllTasks(previousState);
    setHistory(prev => prev.slice(0, -1));
  };

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
  }, [activeMonth, currentMonthDays.length]);

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

  const handleDragStart = (e: React.DragEvent, task: Task, sourceMonth: string) => {
    if (!isAdmin) return;
    e.dataTransfer.setData("taskId", task.id.toString());
    e.dataTransfer.setData("sourceMonth", sourceMonth);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent) => {
    if (!isAdmin) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = (e: React.DragEvent, targetDateString: string) => {
    if (!isAdmin) return;
    e.preventDefault();
    const taskId = e.dataTransfer.getData("taskId");
    const sourceMonth = e.dataTransfer.getData("sourceMonth") as keyof AllTasks;

    const taskToMove = allTasks[sourceMonth].find(t => t.id.toString() === taskId.toString());
    if (!taskToMove) return;
    if (taskToMove.date === targetDateString) return;

    saveToHistory();

    const updatedTask = { ...taskToMove, date: targetDateString };
    const tasksWithoutMoved = allTasks[sourceMonth].filter(t => t.id.toString() !== taskId.toString());
    const targetMonth = getMonthKeyFromDate(targetDateString);

    if (!targetMonth) return;

    if (sourceMonth === targetMonth) {
      setAllTasks(prev => ({
        ...prev,
        [sourceMonth]: [...tasksWithoutMoved, updatedTask]
      }));
    } else {
      setAllTasks(prev => ({
        ...prev,
        [sourceMonth]: tasksWithoutMoved,
        [targetMonth]: [...(prev[targetMonth] || []), updatedTask]
      }));
    }
  };

  const addTaskToCorrectMonth = (taskData: Task) => {
    const targetMonth = getMonthKeyFromDate(taskData.date);
    if (targetMonth && allTasks[targetMonth]) {
      setAllTasks(prev => ({
        ...prev,
        [targetMonth]: [...prev[targetMonth], taskData]
      }));
      return true;
    }
    return false;
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

  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTask.client) return;

    saveToHistory();

    if (editingId) {
      let foundMonth: keyof AllTasks | null = null;

      (Object.keys(allTasks) as Array<keyof AllTasks>).forEach(m => {
        const t = allTasks[m].find(task => task.id === editingId);
        if (t) {
          foundMonth = m;
        }
      });

      if (foundMonth) {
        const tasksFiltered = allTasks[foundMonth].filter(t => t.id !== editingId);
        const updatedTask: Task = { ...newTask, id: editingId } as Task;
        const targetMonth = getMonthKeyFromDate(updatedTask.date);

        if (targetMonth) {
          if (foundMonth === targetMonth) {
            setAllTasks(prev => ({ ...prev, [foundMonth!]: [...tasksFiltered, updatedTask] }));
          } else {
            setAllTasks(prev => ({
              ...prev,
              [foundMonth!]: tasksFiltered,
              [targetMonth]: [...prev[targetMonth], updatedTask]
            }));
          }
        }
      }
      setEditingId(null);
    } else {
      const taskToAdd: Task = { ...newTask, id: Date.now() + Math.random() } as Task;
      const success = addTaskToCorrectMonth(taskToAdd);
      if (!success) {
        alert('Data fora do período permitido (Dez/25 a Fev/26)');
        return;
      }
    }

    setNewTask({ ...newTask, client: '', phone: '', notes: '', completed: false });
    setShowModal(false);
  };

  const handleAddFixedTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fixedTask.client) return;
    saveToHistory();

    let count = 0;

    currentMonthDays.forEach(day => {
      if (day.dayName.toLowerCase().includes(fixedTask.weekDay.toLowerCase())) {
        const task: Task = {
          id: Date.now() + Math.random() + count,
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
        addTaskToCorrectMonth(task);
        count++;
      }
    });

    if (count === 0) {
      alert("Nenhum dia encontrado neste mês para o dia da semana selecionado.");
      return;
    }

    alert(`${count} agendamentos criados em ${activeConfig.label}.`);
    setFixedTask({ ...fixedTask, client: '', phone: '', notes: '', completed: false });
    setShowModal(false);
  };

  const handleAddBiWeeklyTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!biWeeklyTask.client) return;
    saveToHistory();

    const allDaysContinuous = [
      ...generateDaysForMonth('december'),
      ...generateDaysForMonth('january'),
      ...generateDaysForMonth('february')
    ];

    const startIndex = allDaysContinuous.findIndex(d => d.dateString === biWeeklyTask.startDate);

    if (startIndex === -1) {
      alert("Data inválida.");
      return;
    }

    let addedCount = 0;

    const firstDate = allDaysContinuous[startIndex];
    addTaskToCorrectMonth({
      id: Date.now() + Math.random(),
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
    addedCount++;

    const nextIndex = startIndex + 14;

    if (nextIndex < allDaysContinuous.length) {
      const nextDate = allDaysContinuous[nextIndex];
      const added = addTaskToCorrectMonth({
        id: Date.now() + Math.random() + 1,
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
      if (added) addedCount++;
    }

    alert(`${addedCount} agendamentos criados. (Verifique as abas dos meses seguintes se necessário)`);
    setBiWeeklyTask({ ...biWeeklyTask, client: '', phone: '', notes: '', completed: false });
    setShowModal(false);
  };

  const handleDelete = (id: number) => {
    if (!isAdmin) return;
    if (window.confirm('Tem certeza que deseja remover este agendamento?')) {
      saveToHistory();
      setAllTasks(prev => ({
        ...prev,
        [activeMonth]: prev[activeMonth].filter(t => t.id !== id)
      }));
    }
  };

  const toggleStatus = (id: number) => {
    if (!isAdmin) return;
    setAllTasks(prev => ({
      ...prev,
      [activeMonth]: prev[activeMonth].map(t =>
        t.id === id ? { ...t, completed: !t.completed } : t
      )
    }));
  };

  const calculateMonthTotal = () => {
    return allTasks[activeMonth].reduce((acc, curr) => acc + (parseFloat(curr.price) || 0), 0);
  };

  const printSchedule = () => {
    window.print();
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

  return (
    <div className={`min-h-screen font-sans text-gray-800 pb-10 print:bg-white ${getBgColor()}`}>

      {/* User Info Bar */}
      <div className="bg-white border-b px-4 py-2 print:hidden">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <User size={16} />
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
          <Button variant="outline" size="sm" onClick={handleSignOut}>
            <LogOut size={16} className="mr-1" />
            Sair
          </Button>
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
            {isAdmin && (
              <button
                onClick={handleUndo}
                disabled={history.length === 0}
                className={`px-4 py-2 rounded-lg flex items-center gap-2 transition ${history.length === 0 ? 'bg-white/10 text-white/50 cursor-not-allowed' : 'bg-white/20 hover:bg-white/30 text-white'}`}
                title="Desfazer última alteração"
              >
                <Undo2 size={20} />
                <span className="hidden sm:inline">Desfazer</span>
              </button>
            )}

            <button
              onClick={printSchedule}
              className="bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition"
            >
              <Printer size={20} />
              <span className="hidden sm:inline">Imprimir</span>
            </button>

            {isAdmin && (
              <button
                onClick={() => {
                  setEditingId(null);
                  setActiveTab('single');
                  setNewTask(prev => ({ ...prev, client: '', phone: '', notes: '', date: currentMonthDays[0]?.dateString || '' }));
                  setShowModal(true);
                }}
                className="bg-white text-gray-800 hover:bg-gray-100 px-4 py-2 rounded-lg font-bold flex items-center gap-2 shadow-md transition transform hover:scale-105"
              >
                <Plus size={20} />
                Novo Agendamento
              </button>
            )}
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
                        onDragStart={(e) => handleDragStart(e, task, activeMonth)}
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
                          <div className="text-xs text-gray-500 truncate flex items-center gap-1 mb-1">
                            <MapPin size={10} />
                            {task.address}
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
                                onClick={() => toggleStatus(task.id)}
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
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Cliente <span className="text-red-500">*</span></label>
                    <input type="text" required placeholder="Nome do cliente" value={newTask.client} onChange={(e) => handleInputChange(setNewTask, newTask, 'client', e.target.value)} className="w-full p-2 border border-gray-300 rounded-lg" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Telefone</label>
                    <input type="text" placeholder="Ex: 912 345 678" value={newTask.phone} onChange={(e) => handleInputChange(setNewTask, newTask, 'phone', e.target.value)} className="w-full p-2 border border-gray-300 rounded-lg" />
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
                    <label className="block text-sm font-medium text-gray-700 mb-1">Endereço</label>
                    <input type="text" placeholder="Rua..." value={newTask.address} onChange={(e) => handleInputChange(setNewTask, newTask, 'address', e.target.value)} className="w-full p-2 border border-gray-300 rounded-lg" />
                  </div>
                  <button type="submit" className={`w-full text-white font-bold py-3 rounded-xl shadow transition flex justify-center items-center gap-2 mt-4 bg-gradient-to-r ${getThemeColor()}`}>
                    <Save size={18} />
                    {editingId ? 'Salvar Alterações' : `Salvar em ${activeConfig.label}`}
                  </button>
                </form>
              )}

              {activeTab === 'fixed' && !editingId && (
                <form onSubmit={handleAddFixedTask} className="space-y-4">
                  <div className="bg-blue-50 text-blue-700 p-3 rounded-lg text-sm mb-4 border border-blue-100">
                    <p className="flex items-start gap-2">
                      <Repeat size={16} className="mt-0.5 shrink-0" />
                      Preenche <strong>todas as {fixedTask.weekDay}s</strong> deste mês ({activeConfig.label}).
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Dia da Semana</label>
                    <select value={fixedTask.weekDay} onChange={(e) => handleInputChange(setFixedTask, fixedTask, 'weekDay', e.target.value)} className="w-full p-2 border border-gray-300 rounded-lg bg-white capitalize">
                      {weekDaysList.map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                  </div>
                  <div><label className="block text-sm font-medium text-gray-700 mb-1">Cliente *</label><input type="text" required value={fixedTask.client} onChange={(e) => handleInputChange(setFixedTask, fixedTask, 'client', e.target.value)} className="w-full p-2 border border-gray-300 rounded-lg" /></div>
                  <div><label className="block text-sm font-medium text-gray-700 mb-1">Telefone</label><input type="text" value={fixedTask.phone} onChange={(e) => handleInputChange(setFixedTask, fixedTask, 'phone', e.target.value)} className="w-full p-2 border border-gray-300 rounded-lg" /></div>
                  <div className="grid grid-cols-2 gap-4">
                    <div><label className="block text-sm font-medium text-gray-700 mb-1">Início</label><input type="time" required value={fixedTask.startTime} onChange={(e) => handleInputChange(setFixedTask, fixedTask, 'startTime', e.target.value)} className="w-full p-2 border border-gray-300 rounded-lg" /></div>
                    <div><label className="block text-sm font-medium text-gray-700 mb-1">Fim</label><input type="time" required value={fixedTask.endTime} onChange={(e) => handleInputChange(setFixedTask, fixedTask, 'endTime', e.target.value)} className="w-full p-2 border border-gray-300 rounded-lg" /></div>
                  </div>
                  <div className="grid grid-cols-2 gap-4 bg-gray-50 p-3 rounded-lg border border-gray-100">
                    <div><label className="block text-sm font-medium text-gray-500 mb-1">€/h (Fixo)</label><input type="number" readOnly disabled value={fixedTask.pricePerHour} className="w-full p-2 border border-gray-200 rounded-lg bg-gray-100" /></div>
                    <div><label className="block text-sm font-medium text-green-700 mb-1">Total (€)</label><input type="number" step="0.01" value={fixedTask.price} onChange={(e) => handleInputChange(setFixedTask, fixedTask, 'price', e.target.value)} className="w-full p-2 border-2 border-green-100 bg-green-50 rounded-lg font-bold text-green-800" /></div>
                  </div>
                  <div><label className="block text-sm font-medium text-gray-700 mb-1">Endereço</label><input type="text" value={fixedTask.address} onChange={(e) => handleInputChange(setFixedTask, fixedTask, 'address', e.target.value)} className="w-full p-2 border border-gray-300 rounded-lg" /></div>
                  <button type="submit" className={`w-full text-white font-bold py-3 rounded-xl shadow transition flex justify-center items-center gap-2 mt-4 bg-gradient-to-r ${getThemeColor()}`}>
                    <Repeat size={18} />
                    Criar Semanal
                  </button>
                </form>
              )}

              {activeTab === 'biweekly' && !editingId && (
                <form onSubmit={handleAddBiWeeklyTask} className="space-y-4">
                  <div className="bg-orange-50 text-orange-700 p-3 rounded-lg text-sm mb-4 border border-orange-100">
                    <p className="flex items-start gap-2">
                      <CalendarRange size={16} className="mt-0.5 shrink-0" />
                      Escolha a <strong>1ª data</strong>. Se a próxima cair no mês seguinte (ex: Jan), o sistema cria lá automaticamente.
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Data da 1ª Limpeza</label>
                    <select value={biWeeklyTask.startDate} onChange={(e) => handleInputChange(setBiWeeklyTask, biWeeklyTask, 'startDate', e.target.value)} className="w-full p-2 border border-gray-300 rounded-lg bg-white">
                      {currentMonthDays.map(d => <option key={d.dateString} value={d.dateString}>{d.formatted} - {d.dayName}</option>)}
                    </select>
                  </div>
                  <div><label className="block text-sm font-medium text-gray-700 mb-1">Cliente *</label><input type="text" required value={biWeeklyTask.client} onChange={(e) => handleInputChange(setBiWeeklyTask, biWeeklyTask, 'client', e.target.value)} className="w-full p-2 border border-gray-300 rounded-lg" /></div>
                  <div><label className="block text-sm font-medium text-gray-700 mb-1">Telefone</label><input type="text" value={biWeeklyTask.phone} onChange={(e) => handleInputChange(setBiWeeklyTask, biWeeklyTask, 'phone', e.target.value)} className="w-full p-2 border border-gray-300 rounded-lg" /></div>
                  <div className="grid grid-cols-2 gap-4">
                    <div><label className="block text-sm font-medium text-gray-700 mb-1">Início</label><input type="time" required value={biWeeklyTask.startTime} onChange={(e) => handleInputChange(setBiWeeklyTask, biWeeklyTask, 'startTime', e.target.value)} className="w-full p-2 border border-gray-300 rounded-lg" /></div>
                    <div><label className="block text-sm font-medium text-gray-700 mb-1">Fim</label><input type="time" required value={biWeeklyTask.endTime} onChange={(e) => handleInputChange(setBiWeeklyTask, biWeeklyTask, 'endTime', e.target.value)} className="w-full p-2 border border-gray-300 rounded-lg" /></div>
                  </div>
                  <div className="grid grid-cols-2 gap-4 bg-gray-50 p-3 rounded-lg border border-gray-100">
                    <div><label className="block text-sm font-medium text-gray-500 mb-1">€/h (Fixo)</label><input type="number" readOnly disabled value={biWeeklyTask.pricePerHour} className="w-full p-2 border border-gray-200 rounded-lg bg-gray-100" /></div>
                    <div><label className="block text-sm font-medium text-green-700 mb-1">Total (€)</label><input type="number" step="0.01" value={biWeeklyTask.price} onChange={(e) => handleInputChange(setBiWeeklyTask, biWeeklyTask, 'price', e.target.value)} className="w-full p-2 border-2 border-green-100 bg-green-50 rounded-lg font-bold text-green-800" /></div>
                  </div>
                  <div><label className="block text-sm font-medium text-gray-700 mb-1">Endereço</label><input type="text" value={biWeeklyTask.address} onChange={(e) => handleInputChange(setBiWeeklyTask, biWeeklyTask, 'address', e.target.value)} className="w-full p-2 border border-gray-300 rounded-lg" /></div>
                  <button type="submit" className={`w-full text-white font-bold py-3 rounded-xl shadow transition flex justify-center items-center gap-2 mt-4 bg-gradient-to-r ${getThemeColor()}`}>
                    <CalendarRange size={18} />
                    Criar Quinzenal
                  </button>
                </form>
              )}

            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ScheduleView;
