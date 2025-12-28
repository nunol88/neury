import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useAgendamentos, Task } from '@/hooks/useAgendamentos';
import { useClients } from '@/hooks/useClients';
import { useTheme } from '@/hooks/useTheme';
import { CountUp } from '@/hooks/useCountUp';
import { Sparkline, TrendIndicator } from '@/components/ui/sparkline';
import {
  ArrowLeft, TrendingUp, Users, Calendar, Euro, 
  CheckCircle, Clock, BarChart3, Loader2, LogOut,
  CalendarDays, CalendarRange, Sun, Moon, Download
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
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
  LineChart,
  Line,
  AreaChart,
  Area,
  Legend,
  RadialBarChart,
  RadialBar,
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
const GRADIENT_COLORS = {
  primary: ['#8B5CF6', '#6366F1'],
  success: ['#10B981', '#059669'],
  warning: ['#F59E0B', '#D97706'],
  danger: ['#EF4444', '#DC2626'],
};

const Dashboard = () => {
  const { user, role, signOut } = useAuth();
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const { toast } = useToast();
  const { allTasks, loading: loadingAgendamentos } = useAgendamentos();
  const { clients, loading: loadingClients } = useClients();
  const [periodFilter, setPeriodFilter] = useState<PeriodFilter>('monthly');
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());

  // Get available years from tasks
  const availableYears = useMemo(() => {
    const allTasksFlat: Task[] = Object.values(allTasks).flat();
    const years = new Set<number>();
    allTasksFlat.forEach(task => {
      const year = parseISO(task.date).getFullYear();
      years.add(year);
    });
    // Add current year if not present
    years.add(new Date().getFullYear());
    return Array.from(years).sort((a, b) => b - a);
  }, [allTasks]);

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const username = user?.user_metadata?.name || user?.email?.replace('@local.app', '') || '';

  // Filter tasks by period and year
  const filteredTasks = useMemo(() => {
    const allTasksFlat: Task[] = Object.values(allTasks).flat();
    const now = new Date();
    const referenceDate = new Date(selectedYear, now.getMonth(), now.getDate());

    if (periodFilter === 'all') {
      // Filter by year only when "all" is selected
      return allTasksFlat.filter(task => {
        const taskYear = parseISO(task.date).getFullYear();
        return taskYear === selectedYear;
      });
    }

    let start: Date;
    let end: Date;

    switch (periodFilter) {
      case 'daily':
        // For daily, use current date but in selected year
        start = startOfDay(referenceDate);
        end = endOfDay(referenceDate);
        break;
      case 'weekly':
        start = startOfWeek(referenceDate, { weekStartsOn: 1 });
        end = endOfWeek(referenceDate, { weekStartsOn: 1 });
        break;
      case 'monthly':
        start = startOfMonth(referenceDate);
        end = endOfMonth(referenceDate);
        break;
      case 'quarterly':
        const currentQuarter = Math.floor(referenceDate.getMonth() / 3);
        start = new Date(selectedYear, currentQuarter * 3, 1);
        end = new Date(selectedYear, currentQuarter * 3 + 3, 0, 23, 59, 59, 999);
        break;
      case 'semester':
        const currentSemester = referenceDate.getMonth() < 6 ? 0 : 1;
        start = new Date(selectedYear, currentSemester * 6, 1);
        end = new Date(selectedYear, currentSemester * 6 + 6, 0, 23, 59, 59, 999);
        break;
      case 'yearly':
        start = new Date(selectedYear, 0, 1);
        end = new Date(selectedYear, 11, 31, 23, 59, 59, 999);
        break;
      default:
        return allTasksFlat;
    }

    return allTasksFlat.filter(task => {
      const taskDate = parseISO(task.date);
      return isWithinInterval(taskDate, { start, end });
    });
  }, [allTasks, periodFilter, selectedYear]);

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

    // Completion rate for radial chart
    const completionRate = totalAgendamentos > 0 
      ? Math.round((concluidos / totalAgendamentos) * 100) 
      : 0;

    // Status distribution for pie chart
    const statusData = [
      { name: 'Concluídos', value: concluidos, color: '#10B981' },
      { name: 'Pendentes', value: pendentes, color: '#F59E0B' },
    ];

    // Average per day
    const avgPerDay = displayData.length > 0 
      ? (totalRevenue + pendingRevenue) / displayData.length 
      : 0;

    // Sparkline data (last 7 data points for mini charts)
    const sparklineData = chartData.slice(-7).map(d => ({
      value: d.receita + d.pendente,
      receita: d.receita,
      pendente: d.pendente,
      count: d.count,
    }));

    // Calculate trends (comparing first half to second half)
    const midPoint = Math.floor(sparklineData.length / 2);
    const firstHalf = sparklineData.slice(0, midPoint);
    const secondHalf = sparklineData.slice(midPoint);
    
    const avgFirstHalf = firstHalf.length > 0 
      ? firstHalf.reduce((sum, d) => sum + d.value, 0) / firstHalf.length 
      : 0;
    const avgSecondHalf = secondHalf.length > 0 
      ? secondHalf.reduce((sum, d) => sum + d.value, 0) / secondHalf.length 
      : 0;
    
    const trendPercent = avgFirstHalf > 0 
      ? Math.round(((avgSecondHalf - avgFirstHalf) / avgFirstHalf) * 100) 
      : 0;

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
      completionRate,
      statusData,
      avgPerDay,
      sparklineData,
      trendPercent,
    };
  }, [filteredTasks, clients, periodFilter]);

  // Get period display text
  const getPeriodDisplay = () => {
    const now = new Date();
    const refMonth = now.getMonth();
    switch (periodFilter) {
      case 'daily':
        return format(new Date(selectedYear, refMonth, now.getDate()), "EEEE, d 'de' MMMM", { locale: pt });
      case 'weekly':
        const refDate = new Date(selectedYear, refMonth, now.getDate());
        const weekStart = startOfWeek(refDate, { weekStartsOn: 1 });
        const weekEnd = endOfWeek(refDate, { weekStartsOn: 1 });
        return `${format(weekStart, 'dd/MM')} - ${format(weekEnd, 'dd/MM/yyyy')}`;
      case 'monthly':
        return format(new Date(selectedYear, refMonth, 1), "MMMM 'de' yyyy", { locale: pt });
      case 'quarterly':
        const currentQuarter = Math.floor(refMonth / 3) + 1;
        return `${currentQuarter}º Trimestre de ${selectedYear}`;
      case 'semester':
        const currentSemester = refMonth < 6 ? 1 : 2;
        return `${currentSemester}º Semestre de ${selectedYear}`;
      case 'yearly':
        return `${selectedYear}`;
      case 'all':
        return `Ano ${selectedYear}`;
    }
  };

  // Export dashboard to PDF
  const exportToPDF = () => {
    const doc = new jsPDF();
    const periodText = getPeriodDisplay();
    
    // Header
    doc.setFillColor(139, 92, 246);
    doc.rect(0, 0, 220, 35, 'F');
    doc.setFontSize(22);
    doc.setTextColor(255, 255, 255);
    doc.text('MaysLimpo - Dashboard', 14, 18);
    doc.setFontSize(12);
    doc.text(`Período: ${periodText}`, 14, 28);
    
    // Summary section
    doc.setFontSize(14);
    doc.setTextColor(80, 80, 80);
    doc.text('Resumo Financeiro', 14, 50);
    
    doc.setFontSize(11);
    doc.text(`Receita Concluída: €${stats.totalRevenue.toFixed(2)}`, 14, 60);
    doc.text(`Receita Pendente: €${stats.pendingRevenue.toFixed(2)}`, 14, 68);
    doc.text(`Total Agendamentos: ${stats.totalAgendamentos}`, 14, 76);
    doc.text(`Concluídos: ${stats.concluidos} | Pendentes: ${stats.pendentes}`, 14, 84);
    doc.text(`Horas Trabalhadas: ${stats.totalHours.toFixed(1)}h`, 14, 92);
    doc.text(`Clientes no Período: ${stats.uniqueClients}`, 14, 100);
    
    // Top clients table
    if (stats.topClients.length > 0) {
      doc.setFontSize(14);
      doc.text('Ranking de Clientes', 14, 120);
      
      const tableData = stats.topClients.map((client, index) => [
        `${index + 1}º`,
        client.name,
        client.count.toString(),
        `€${client.total.toFixed(2)}`
      ]);
      
      autoTable(doc, {
        head: [['#', 'Cliente', 'Agendamentos', 'Total Faturado']],
        body: tableData,
        startY: 125,
        styles: { fontSize: 9, cellPadding: 3 },
        headStyles: { fillColor: [139, 92, 246], textColor: 255 },
        alternateRowStyles: { fillColor: [248, 245, 255] },
      });
    }
    
    // Footer
    const finalY = stats.topClients.length > 0 ? (doc as any).lastAutoTable.finalY + 15 : 120;
    doc.setDrawColor(139, 92, 246);
    doc.setLineWidth(0.5);
    doc.line(14, finalY, 196, finalY);
    doc.setFontSize(8);
    doc.setTextColor(100, 100, 100);
    doc.text(`Gerado em ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`, 14, finalY + 8);
    
    // Save
    doc.save(`dashboard-${periodFilter}-${selectedYear}.pdf`);
    toast({ title: 'PDF exportado com sucesso' });
  };

  if (loadingAgendamentos || loadingClients) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-muted-foreground">A carregar dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-card border-b border-border px-4 py-2">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <img 
              src={logoMayslimpo} 
              alt="MaysLimpo Logo" 
              className="w-10 h-10 rounded-full object-cover shadow-sm border border-border"
            />
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span className="capitalize font-medium">{username}</span>
              <span className="px-2 py-0.5 bg-primary/10 text-primary rounded text-xs font-medium">
                {role === 'admin' ? 'Administrador' : 'Neury'}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={toggleTheme} className="p-2">
              {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            </Button>
            <Button variant="outline" size="sm" onClick={handleSignOut}>
              <LogOut size={16} className="mr-1" />
              Sair
            </Button>
          </div>
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
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <BarChart3 size={24} />
              Dashboard
            </h1>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={exportToPDF}
            >
              <Download size={16} className="mr-1" />
              Exportar PDF
            </Button>
          </div>
          
          {/* Year Selector */}
          <div className="flex items-center gap-3">
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="px-3 py-2 rounded-lg text-sm font-medium bg-card border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            >
              {availableYears.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </div>
          
          {/* Period Filter Buttons */}
          <div className="flex flex-wrap gap-2">
            {(Object.keys(PERIOD_LABELS) as PeriodFilter[]).map((period) => (
              <button
                key={period}
                onClick={() => setPeriodFilter(period)}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-1.5 ${
                  periodFilter === period
                    ? 'bg-primary text-primary-foreground shadow-md'
                    : 'bg-card text-muted-foreground hover:bg-secondary border border-border'
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
          <p className="text-sm text-muted-foreground">A mostrar dados de</p>
          <p className="text-lg font-semibold text-foreground capitalize">{getPeriodDisplay()}</p>
        </div>

        {/* Hero Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {/* Revenue Card with Gradient */}
          <div className="relative overflow-hidden bg-gradient-to-br from-emerald-500 to-emerald-700 rounded-2xl shadow-lg p-5 text-white animate-fade-in-up hover-lift">
            <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Euro size={20} className="opacity-80" />
                  <span className="text-sm opacity-80">Receita Concluída</span>
                </div>
                {stats.trendPercent !== 0 && (
                  <TrendIndicator 
                    value={stats.trendPercent} 
                    className={stats.trendPercent >= 0 ? 'text-emerald-200' : 'text-red-200'} 
                  />
                )}
              </div>
              <p className="text-3xl font-bold">
                <CountUp end={stats.totalRevenue} decimals={2} prefix="€" duration={1800} />
              </p>
              <div className="mt-1 text-xs opacity-70">
                <CountUp end={stats.concluidos} duration={1500} /> serviços concluídos
              </div>
            </div>
            {/* Sparkline */}
            <div className="absolute bottom-0 left-0 right-0 h-12 opacity-60">
              <Sparkline 
                data={stats.sparklineData.map(d => ({ value: d.receita }))} 
                color="#ffffff" 
                height={48}
              />
            </div>
          </div>
          
          {/* Pending Revenue Card */}
          <div className="relative overflow-hidden bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl shadow-lg p-5 text-white animate-fade-in-up animation-delay-100 hover-lift">
            <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-2">
                <Clock size={20} className="opacity-80" />
                <span className="text-sm opacity-80">Receita Pendente</span>
              </div>
              <p className="text-3xl font-bold">
                <CountUp end={stats.pendingRevenue} decimals={2} prefix="€" duration={1800} />
              </p>
              <div className="mt-1 text-xs opacity-70">
                <CountUp end={stats.pendentes} duration={1500} /> por concluir
              </div>
            </div>
            {/* Sparkline */}
            <div className="absolute bottom-0 left-0 right-0 h-12 opacity-60">
              <Sparkline 
                data={stats.sparklineData.map(d => ({ value: d.pendente }))} 
                color="#ffffff" 
                height={48}
              />
            </div>
          </div>
          
          {/* Appointments Card */}
          <div className="relative overflow-hidden bg-gradient-to-br from-violet-500 to-purple-700 rounded-2xl shadow-lg p-5 text-white animate-fade-in-up animation-delay-200 hover-lift">
            <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-2">
                <Calendar size={20} className="opacity-80" />
                <span className="text-sm opacity-80">Agendamentos</span>
              </div>
              <p className="text-3xl font-bold">
                <CountUp end={stats.totalAgendamentos} duration={1500} />
              </p>
              <div className="mt-1 text-xs opacity-70">
                <CountUp end={stats.totalHours} decimals={1} duration={1600} />h trabalhadas
              </div>
            </div>
            {/* Sparkline */}
            <div className="absolute bottom-0 left-0 right-0 h-12 opacity-60">
              <Sparkline 
                data={stats.sparklineData.map(d => ({ value: d.count }))} 
                color="#ffffff" 
                height={48}
              />
            </div>
          </div>
          
          {/* Clients Card */}
          <div className="relative overflow-hidden bg-gradient-to-br from-blue-500 to-cyan-600 rounded-2xl shadow-lg p-5 text-white animate-fade-in-up animation-delay-300 hover-lift">
            <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-2">
                <Users size={20} className="opacity-80" />
                <span className="text-sm opacity-80">Clientes</span>
              </div>
              <p className="text-3xl font-bold">
                <CountUp end={stats.uniqueClients} duration={1500} />
              </p>
              <div className="mt-1 text-xs opacity-70">
                de <CountUp end={stats.totalClients} duration={1400} /> total
              </div>
            </div>
            {/* Sparkline */}
            <div className="absolute bottom-0 left-0 right-0 h-12 opacity-60">
              <Sparkline 
                data={stats.sparklineData.map(d => ({ value: d.value }))} 
                color="#ffffff" 
                height={48}
              />
            </div>
          </div>
        </div>

        {/* Completion Rate & Quick Stats */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          {/* Completion Rate Gauge */}
          <div className="bg-card rounded-2xl shadow-sm p-6 border border-border animate-scale-in animation-delay-400 hover-lift">
            <h3 className="font-bold text-foreground mb-4 text-center">Taxa de Conclusão</h3>
            <div className="relative flex items-center justify-center">
              <ResponsiveContainer width="100%" height={180}>
                <RadialBarChart
                  cx="50%"
                  cy="50%"
                  innerRadius="60%"
                  outerRadius="90%"
                  data={[{ value: stats.completionRate, fill: stats.completionRate >= 70 ? '#10B981' : stats.completionRate >= 40 ? '#F59E0B' : '#EF4444' }]}
                  startAngle={180}
                  endAngle={0}
                >
                  <RadialBar
                    dataKey="value"
                    cornerRadius={10}
                    background={{ fill: 'hsl(var(--muted))' }}
                  />
                </RadialBarChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-4xl font-bold text-foreground">
                  <CountUp end={stats.completionRate} duration={2000} suffix="%" />
                </span>
                <span className="text-xs text-muted-foreground">concluídos</span>
              </div>
            </div>
          </div>

          {/* Status Distribution Pie */}
          <div className="bg-card rounded-2xl shadow-sm p-6 border border-border animate-scale-in animation-delay-500 hover-lift">
            <h3 className="font-bold text-foreground mb-4 text-center">Distribuição de Status</h3>
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie
                  data={stats.statusData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={70}
                  paddingAngle={5}
                >
                  {stats.statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => [value, '']} />
                <Legend
                  verticalAlign="bottom"
                  height={36}
                  formatter={(value, entry: any) => (
                    <span className="text-xs text-foreground">{value}</span>
                  )}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Quick Stats */}
          <div className="bg-card rounded-2xl shadow-sm p-6 border border-border flex flex-col justify-between animate-scale-in animation-delay-600 hover-lift">
            <h3 className="font-bold text-foreground mb-4">Resumo Rápido</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-success/10 rounded-xl">
                <div className="flex items-center gap-2">
                  <CheckCircle size={18} className="text-success" />
                  <span className="text-sm text-foreground">Concluídos</span>
                </div>
                <span className="font-bold text-success"><CountUp end={stats.concluidos} duration={1500} /></span>
              </div>
              <div className="flex items-center justify-between p-3 bg-warning/10 rounded-xl">
                <div className="flex items-center gap-2">
                  <Clock size={18} className="text-warning" />
                  <span className="text-sm text-foreground">Pendentes</span>
                </div>
                <span className="font-bold text-warning"><CountUp end={stats.pendentes} duration={1500} /></span>
              </div>
              <div className="flex items-center justify-between p-3 bg-primary/10 rounded-xl">
                <div className="flex items-center gap-2">
                  <TrendingUp size={18} className="text-primary" />
                  <span className="text-sm text-foreground">Média/Dia</span>
                </div>
                <span className="font-bold text-primary"><CountUp end={stats.avgPerDay} decimals={2} prefix="€" duration={1800} /></span>
              </div>
            </div>
          </div>
        </div>

        {/* Main Charts */}
        <div className="grid lg:grid-cols-2 gap-6 mb-8">
          {/* Revenue Area Chart */}
          <div className="bg-card rounded-2xl shadow-sm p-6 border border-border animate-fade-in-up animation-delay-500 hover-lift">
            <h3 className="font-bold text-foreground mb-4 flex items-center gap-2">
              <BarChart3 size={18} className="text-primary" />
              Evolução da Receita {periodFilter === 'yearly' ? '(Mensal)' : '(Diária)'}
            </h3>
            {stats.chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <AreaChart data={stats.chartData}>
                  <defs>
                    <linearGradient id="colorReceita" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10B981" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorPendente" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#F59E0B" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip 
                    formatter={(value: number) => [`€${value.toFixed(2)}`, '']}
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))', 
                      borderColor: 'hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                    labelStyle={{ fontWeight: 'bold', color: 'hsl(var(--foreground))' }}
                  />
                  <Legend />
                  <Area 
                    type="monotone" 
                    dataKey="receita" 
                    name="Concluído" 
                    stroke="#10B981" 
                    strokeWidth={2}
                    fillOpacity={1} 
                    fill="url(#colorReceita)" 
                  />
                  <Area 
                    type="monotone" 
                    dataKey="pendente" 
                    name="Pendente" 
                    stroke="#F59E0B" 
                    strokeWidth={2}
                    fillOpacity={1} 
                    fill="url(#colorPendente)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[280px] flex items-center justify-center text-muted-foreground">
                <div className="text-center">
                  <BarChart3 size={48} className="mx-auto mb-2 opacity-20" />
                  <p>Sem dados para o período selecionado</p>
                </div>
              </div>
            )}
          </div>

          {/* Top Clients Pie Chart */}
          <div className="bg-card rounded-2xl shadow-sm p-6 border border-border animate-fade-in-up animation-delay-600 hover-lift">
            <h3 className="font-bold text-foreground mb-4 flex items-center gap-2">
              <Users size={18} className="text-primary" />
              Top Clientes por Receita
            </h3>
            {stats.topClients.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie
                    data={stats.topClients}
                    dataKey="total"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={90}
                    paddingAngle={2}
                    label={({ name, percent }) => `${name.split(' ')[0]} ${(percent * 100).toFixed(0)}%`}
                    labelLine={{ stroke: 'hsl(var(--muted-foreground))', strokeWidth: 1 }}
                  >
                    {stats.topClients.map((_, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={COLORS[index % COLORS.length]}
                        className="hover:opacity-80 transition-opacity cursor-pointer"
                      />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value: number) => [`€${value.toFixed(2)}`, 'Total']}
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))', 
                      borderColor: 'hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[280px] flex items-center justify-center text-muted-foreground">
                <div className="text-center">
                  <Users size={48} className="mx-auto mb-2 opacity-20" />
                  <p>Sem dados para o período selecionado</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Bar Chart Comparison */}
        <div className="bg-card rounded-2xl shadow-sm p-6 border border-border mb-8 animate-fade-in-up animation-delay-700 hover-lift">
          <h3 className="font-bold text-foreground mb-4 flex items-center gap-2">
            <TrendingUp size={18} className="text-primary" />
            Comparativo de Receitas
          </h3>
          {stats.chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={stats.chartData} barGap={4}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip 
                  formatter={(value: number) => [`€${value.toFixed(2)}`, '']}
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))', 
                    borderColor: 'hsl(var(--border))',
                    borderRadius: '8px'
                  }}
                />
                <Legend />
                <Bar 
                  dataKey="receita" 
                  name="Concluído" 
                  fill="#10B981" 
                  radius={[6, 6, 0, 0]}
                  className="hover:opacity-80 transition-opacity"
                />
                <Bar 
                  dataKey="pendente" 
                  name="Pendente" 
                  fill="#F59E0B" 
                  radius={[6, 6, 0, 0]}
                  className="hover:opacity-80 transition-opacity"
                />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[300px] flex items-center justify-center text-muted-foreground">
              <div className="text-center">
                <TrendingUp size={48} className="mx-auto mb-2 opacity-20" />
                <p>Sem dados para o período selecionado</p>
              </div>
            </div>
          )}
        </div>

        {/* Top Clients Table */}
        <div className="bg-card rounded-2xl shadow-sm p-6 border border-border animate-fade-in-up animation-delay-800 hover-lift">
          <h3 className="font-bold text-foreground mb-4 flex items-center gap-2">
            <TrendingUp size={18} className="text-primary" />
            Ranking de Clientes - {PERIOD_LABELS[periodFilter]}
          </h3>
          {stats.topClients.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/50">
                    <th className="text-left py-3 px-4 font-semibold text-muted-foreground rounded-tl-lg">#</th>
                    <th className="text-left py-3 px-4 font-semibold text-muted-foreground">Cliente</th>
                    <th className="text-right py-3 px-4 font-semibold text-muted-foreground">Agendamentos</th>
                    <th className="text-right py-3 px-4 font-semibold text-muted-foreground rounded-tr-lg">Total Faturado</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.topClients.map((client, index) => (
                    <tr 
                      key={client.name} 
                      className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors"
                    >
                      <td className="py-4 px-4">
                        <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold ${
                          index === 0 ? 'bg-gradient-to-br from-amber-400 to-amber-600 text-white shadow-md' :
                          index === 1 ? 'bg-gradient-to-br from-slate-300 to-slate-500 text-white shadow-md' :
                          index === 2 ? 'bg-gradient-to-br from-orange-400 to-orange-600 text-white shadow-md' :
                          'bg-muted text-muted-foreground'
                        }`}>
                          {index + 1}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/20 to-primary/40 flex items-center justify-center text-primary font-bold">
                            {client.name.charAt(0).toUpperCase()}
                          </div>
                          <span className="font-medium text-foreground">{client.name}</span>
                        </div>
                      </td>
                      <td className="py-4 px-4 text-right">
                        <span className="inline-flex items-center gap-1 text-muted-foreground">
                          <Calendar size={14} />
                          {client.count}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-right">
                        <span className="font-bold text-success text-lg">€{client.total.toFixed(2)}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="py-12 text-center text-muted-foreground">
              <Users size={48} className="mx-auto mb-3 opacity-20" />
              <p>Sem dados para o período selecionado</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
