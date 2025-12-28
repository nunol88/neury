import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useAgendamentos, Task } from '@/hooks/useAgendamentos';
import { useClients } from '@/hooks/useClients';
import { 
  ArrowLeft, TrendingUp, Users, Calendar, Euro, 
  CheckCircle, Clock, BarChart3, Loader2, LogOut,
  CalendarDays, CalendarRange
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import logoMayslimpo from '@/assets/logo-mayslimpo.jpg';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import {
  startOfDay,
  endOfDay,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  startOfYear,
  endOfYear,
  isWithinInterval,
  format,
  parseISO,
} from 'date-fns';
import { pt } from 'date-fns/locale';

type PeriodFilter = 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'semester' | 'yearly' | 'all';

const PERIOD_LABELS: Record<PeriodFilter, string> = {
  daily: 'Hoje',
  weekly: 'Semana',
  monthly: 'Mês',
  quarterly: 'Trimestre',
  semester: 'Semestre',
  yearly: 'Ano',
  all: 'Tudo',
};

const COLORS = ['#8B5CF6', '#EC4899', '#10B981', '#F59E0B', '#3B82F6', '#6366F1', '#14B8A6', '#F97316'];

const Dashboard = () => {
  const { user, role, signOut } = useAuth();
  const navigate = useNavigate();
  const { allTasks, loading: loadingAgendamentos } = useAgendamentos();
  const { clients, loading: loadingClients } = useClients();
  const [periodFilter, setPeriodFilter] = useState<PeriodFilter>('monthly');

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const username = user?.user_metadata?.name || user?.email?.replace('@local.app', '') || '';

  // Filter tasks by period
  const filteredTasks = useMemo(() => {
    const allTasksFlat: Task[] = Object.values(allTasks).flat();
    const now = new Date();

    if (periodFilter === 'all') {
      return allTasksFlat;
    }

    let start: Date;
    let end: Date;

    switch (periodFilter) {
      case 'daily':
        start = startOfDay(now);
        end = endOfDay(now);
        break;
      case 'weekly':
        start = startOfWeek(now, { weekStartsOn: 1 });
        end = endOfWeek(now, { weekStartsOn: 1 });
        break;
      case 'monthly':
        start = startOfMonth(now);
        end = endOfMonth(now);
        break;
      case 'quarterly':
        // Current quarter
        const currentQuarter = Math.floor(now.getMonth() / 3);
        start = new Date(now.getFullYear(), currentQuarter * 3, 1);
        end = new Date(now.getFullYear(), currentQuarter * 3 + 3, 0, 23, 59, 59, 999);
        break;
      case 'semester':
        // Current semester
        const currentSemester = now.getMonth() < 6 ? 0 : 1;
        start = new Date(now.getFullYear(), currentSemester * 6, 1);
        end = new Date(now.getFullYear(), currentSemester * 6 + 6, 0, 23, 59, 59, 999);
        break;
      case 'yearly':
        start = startOfYear(now);
        end = endOfYear(now);
        break;
      default:
        return allTasksFlat;
    }

    return allTasksFlat.filter(task => {
      const taskDate = parseISO(task.date);
      return isWithinInterval(taskDate, { start, end });
    });
  }, [allTasks, periodFilter]);

  // Calculate statistics based on filtered tasks
  const stats = useMemo(() => {
    const completedTasks = filteredTasks.filter(t => t.completed);
    const pendingTasks = filteredTasks.filter(t => !t.completed);

    // Group by day for chart
    const dailyData: Record<string, { date: string; label: string; receita: number; pendente: number; count: number }> = {};
    
    filteredTasks.forEach(task => {
      const dateKey = task.date;
      if (!dailyData[dateKey]) {
        const taskDate = parseISO(task.date);
        dailyData[dateKey] = {
          date: dateKey,
          label: format(taskDate, periodFilter === 'yearly' ? 'MMM' : 'dd/MM', { locale: pt }),
          receita: 0,
          pendente: 0,
          count: 0,
        };
      }
      const price = parseFloat(task.price || '0');
      if (task.completed) {
        dailyData[dateKey].receita += price;
      } else {
        dailyData[dateKey].pendente += price;
      }
      dailyData[dateKey].count += 1;
    });

    const chartData = Object.values(dailyData).sort((a, b) => a.date.localeCompare(b.date));

    // Aggregate monthly for yearly view
    let displayData = chartData;
    if (periodFilter === 'yearly') {
      const monthlyAgg: Record<string, { label: string; receita: number; pendente: number }> = {};
      filteredTasks.forEach(task => {
        const taskDate = parseISO(task.date);
        const monthKey = format(taskDate, 'yyyy-MM');
        const monthLabel = format(taskDate, 'MMM', { locale: pt });
        if (!monthlyAgg[monthKey]) {
          monthlyAgg[monthKey] = { label: monthLabel, receita: 0, pendente: 0 };
        }
        const price = parseFloat(task.price || '0');
        if (task.completed) {
          monthlyAgg[monthKey].receita += price;
        } else {
          monthlyAgg[monthKey].pendente += price;
        }
      });
      displayData = Object.entries(monthlyAgg)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([, data]) => ({ ...data, date: '', count: 0 }));
    }

    // Top clients by revenue
    const clientRevenue: Record<string, { name: string; total: number; count: number }> = {};
    filteredTasks.forEach(task => {
      if (!clientRevenue[task.client]) {
        clientRevenue[task.client] = { name: task.client, total: 0, count: 0 };
      }
      clientRevenue[task.client].total += parseFloat(task.price || '0');
      clientRevenue[task.client].count += 1;
    });

    const topClients = Object.values(clientRevenue)
      .sort((a, b) => b.total - a.total)
      .slice(0, 8);

    // General stats
    const totalRevenue = completedTasks.reduce((sum, t) => sum + parseFloat(t.price || '0'), 0);
    const pendingRevenue = pendingTasks.reduce((sum, t) => sum + parseFloat(t.price || '0'), 0);
    const totalAgendamentos = filteredTasks.length;
    const concluidos = completedTasks.length;
    const pendentes = pendingTasks.length;

    // Calculate total hours worked
    const totalHours = completedTasks.reduce((sum, task) => {
      const start = new Date(`1970-01-01T${task.startTime}`);
      const end = new Date(`1970-01-01T${task.endTime}`);
      return sum + (end.getTime() - start.getTime()) / (1000 * 60 * 60);
    }, 0);

    // Unique clients in period
    const uniqueClients = new Set(filteredTasks.map(t => t.client)).size;

    return {
      chartData: displayData,
      topClients,
      totalRevenue,
      pendingRevenue,
      totalAgendamentos,
      concluidos,
      pendentes,
      totalHours,
      uniqueClients,
      totalClients: clients.length,
    };
  }, [filteredTasks, clients, periodFilter]);

  // Get period display text
  const getPeriodDisplay = () => {
    const now = new Date();
    switch (periodFilter) {
      case 'daily':
        return format(now, "EEEE, d 'de' MMMM", { locale: pt });
      case 'weekly':
        const weekStart = startOfWeek(now, { weekStartsOn: 1 });
        const weekEnd = endOfWeek(now, { weekStartsOn: 1 });
        return `${format(weekStart, 'dd/MM')} - ${format(weekEnd, 'dd/MM/yyyy')}`;
      case 'monthly':
        return format(now, "MMMM 'de' yyyy", { locale: pt });
      case 'quarterly':
        const currentQuarter = Math.floor(now.getMonth() / 3) + 1;
        return `${currentQuarter}º Trimestre de ${now.getFullYear()}`;
      case 'semester':
        const currentSemester = now.getMonth() < 6 ? 1 : 2;
        return `${currentSemester}º Semestre de ${now.getFullYear()}`;
      case 'yearly':
        return format(now, 'yyyy');
      case 'all':
        return 'Todos os períodos';
    }
  };

  if (loadingAgendamentos || loadingClients) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-gray-600">A carregar dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-50">
      {/* Header */}
      <div className="bg-white border-b px-4 py-2">
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
                {role === 'admin' ? 'Administrador' : 'Neury'}
              </span>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={handleSignOut}>
            <LogOut size={16} className="mr-1" />
            Sair
          </Button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-4 md:p-6">
        {/* Back button and title */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-4">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => navigate('/admin/agendamentos')}
            >
              <ArrowLeft size={16} className="mr-1" />
              Voltar
            </Button>
            <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
              <BarChart3 size={24} />
              Dashboard
            </h1>
          </div>
          
          {/* Period Filter Buttons */}
          <div className="flex flex-wrap gap-2">
            {(Object.keys(PERIOD_LABELS) as PeriodFilter[]).map((period) => (
              <button
                key={period}
                onClick={() => setPeriodFilter(period)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-1.5 ${
                  periodFilter === period
                    ? 'bg-purple-600 text-white shadow-md'
                    : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
                }`}
              >
                {period === 'daily' && <CalendarDays size={14} />}
                {period === 'weekly' && <CalendarRange size={14} />}
                {period === 'monthly' && <Calendar size={14} />}
                {period === 'yearly' && <TrendingUp size={14} />}
                {period === 'all' && <BarChart3 size={14} />}
                {PERIOD_LABELS[period]}
              </button>
            ))}
          </div>
        </div>

        {/* Period Display */}
        <div className="mb-6 text-center">
          <p className="text-sm text-gray-500">A mostrar dados de</p>
          <p className="text-lg font-semibold text-gray-800 capitalize">{getPeriodDisplay()}</p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-100">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-green-100 rounded-lg">
                <Euro size={24} className="text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Receita Concluída</p>
                <p className="text-2xl font-bold text-green-600">€{stats.totalRevenue.toFixed(2)}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-100">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-yellow-100 rounded-lg">
                <Clock size={24} className="text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Receita Pendente</p>
                <p className="text-2xl font-bold text-yellow-600">€{stats.pendingRevenue.toFixed(2)}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-100">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-purple-100 rounded-lg">
                <Calendar size={24} className="text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Agendamentos</p>
                <p className="text-2xl font-bold text-purple-600">{stats.totalAgendamentos}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-100">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-100 rounded-lg">
                <Users size={24} className="text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Clientes no Período</p>
                <p className="text-2xl font-bold text-blue-600">{stats.uniqueClients}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Secondary Stats */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100 flex items-center gap-3">
            <CheckCircle size={20} className="text-green-500" />
            <div>
              <p className="text-xs text-gray-500">Concluídos</p>
              <p className="text-lg font-bold text-gray-800">{stats.concluidos}</p>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100 flex items-center gap-3">
            <Clock size={20} className="text-yellow-500" />
            <div>
              <p className="text-xs text-gray-500">Pendentes</p>
              <p className="text-lg font-bold text-gray-800">{stats.pendentes}</p>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100 flex items-center gap-3">
            <TrendingUp size={20} className="text-indigo-500" />
            <div>
              <p className="text-xs text-gray-500">Horas Trabalhadas</p>
              <p className="text-lg font-bold text-gray-800">{stats.totalHours.toFixed(1)}h</p>
            </div>
          </div>
        </div>

        {/* Charts */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {/* Revenue Chart */}
          <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-100">
            <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
              <BarChart3 size={18} className="text-purple-600" />
              Receita {periodFilter === 'yearly' ? 'por Mês' : 'por Dia'}
            </h3>
            {stats.chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={stats.chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip 
                    formatter={(value: number) => [`€${value.toFixed(2)}`, '']}
                    labelStyle={{ fontWeight: 'bold' }}
                  />
                  <Bar dataKey="receita" name="Concluído" fill="#10B981" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="pendente" name="Pendente" fill="#F59E0B" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[250px] flex items-center justify-center text-gray-400">
                Sem dados para o período selecionado
              </div>
            )}
          </div>

          {/* Top Clients Pie Chart */}
          <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-100">
            <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
              <Users size={18} className="text-purple-600" />
              Top Clientes por Receita
            </h3>
            {stats.topClients.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={stats.topClients}
                    dataKey="total"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    label={({ name, percent }) => `${name.split(' ')[0]} (${(percent * 100).toFixed(0)}%)`}
                    labelLine={false}
                  >
                    {stats.topClients.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => [`€${value.toFixed(2)}`, 'Total']} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[250px] flex items-center justify-center text-gray-400">
                Sem dados para o período selecionado
              </div>
            )}
          </div>
        </div>

        {/* Top Clients Table */}
        <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-100">
          <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
            <TrendingUp size={18} className="text-purple-600" />
            Ranking de Clientes - {PERIOD_LABELS[periodFilter]}
          </h3>
          {stats.topClients.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 px-3 font-medium text-gray-600">#</th>
                    <th className="text-left py-2 px-3 font-medium text-gray-600">Cliente</th>
                    <th className="text-right py-2 px-3 font-medium text-gray-600">Agendamentos</th>
                    <th className="text-right py-2 px-3 font-medium text-gray-600">Total Faturado</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.topClients.map((client, index) => (
                    <tr key={client.name} className="border-b last:border-0 hover:bg-gray-50">
                      <td className="py-3 px-3">
                        <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${
                          index === 0 ? 'bg-yellow-100 text-yellow-700' :
                          index === 1 ? 'bg-gray-100 text-gray-600' :
                          index === 2 ? 'bg-orange-100 text-orange-700' :
                          'bg-gray-50 text-gray-500'
                        }`}>
                          {index + 1}
                        </span>
                      </td>
                      <td className="py-3 px-3 font-medium text-gray-800">{client.name}</td>
                      <td className="py-3 px-3 text-right text-gray-600">{client.count}</td>
                      <td className="py-3 px-3 text-right font-bold text-green-600">€{client.total.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="py-8 text-center text-gray-400">
              Sem dados para o período selecionado
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
