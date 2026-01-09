import React, { useState, useMemo } from 'react';
import { Task, AllTasks } from '@/hooks/useAgendamentos';
import { parseISO, startOfMonth, endOfMonth, isWithinInterval, startOfWeek, endOfWeek, format, getWeek } from 'date-fns';
import { pt } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { GitCompare, TrendingUp, TrendingDown, Minus, X } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

type PeriodFilter = 'weekly' | 'monthly' | 'quarterly' | 'semester' | 'yearly';

interface PeriodComparisonWidgetProps {
  allTasks: AllTasks;
  onClose: () => void;
}

const MONTH_NAMES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

const QUARTER_NAMES = ['1º Trim', '2º Trim', '3º Trim', '4º Trim'];
const SEMESTER_NAMES = ['1º Sem', '2º Sem'];

// Generate years from 2020 to current year + 1
const generateYears = () => {
  const currentYear = new Date().getFullYear();
  const years: number[] = [];
  for (let y = currentYear + 1; y >= 2020; y--) {
    years.push(y);
  }
  return years;
};

const ALL_YEARS = generateYears();

// Generate weeks with date ranges for a given year
const generateWeeksWithDates = (year: number) => {
  const weeks: { num: number; label: string }[] = [];
  for (let w = 1; w <= 53; w++) {
    const jan1 = new Date(year, 0, 1);
    const daysToAdd = (w - 1) * 7;
    const weekDate = new Date(jan1.getTime() + daysToAdd * 24 * 60 * 60 * 1000);
    const start = startOfWeek(weekDate, { weekStartsOn: 1 });
    const end = endOfWeek(weekDate, { weekStartsOn: 1 });
    const label = `Sem ${w} (${format(start, 'dd/MM')} - ${format(end, 'dd/MM')})`;
    weeks.push({ num: w, label });
  }
  return weeks;
};

export function PeriodComparisonWidget({ allTasks, onClose }: PeriodComparisonWidgetProps) {
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth();
  const currentWeek = getWeek(new Date(), { weekStartsOn: 1 });

  // Period A (left)
  const [periodAType, setPeriodAType] = useState<PeriodFilter>('monthly');
  const [periodAYear, setPeriodAYear] = useState(currentYear);
  const [periodAMonth, setPeriodAMonth] = useState(currentMonth);
  const [periodAWeek, setPeriodAWeek] = useState(currentWeek);
  const [periodAQuarter, setPeriodAQuarter] = useState(Math.floor(currentMonth / 3));
  const [periodASemester, setPeriodASemester] = useState(currentMonth < 6 ? 0 : 1);

  // Period B (right) - defaults to same period last year
  const [periodBType, setPeriodBType] = useState<PeriodFilter>('monthly');
  const [periodBYear, setPeriodBYear] = useState(currentYear - 1);
  const [periodBMonth, setPeriodBMonth] = useState(currentMonth);
  const [periodBWeek, setPeriodBWeek] = useState(currentWeek);
  const [periodBQuarter, setPeriodBQuarter] = useState(Math.floor(currentMonth / 3));
  const [periodBSemester, setPeriodBSemester] = useState(currentMonth < 6 ? 0 : 1);

  const getFilteredTasks = (type: PeriodFilter, year: number, month: number, week: number, quarter: number, semester: number) => {
    const allTasksFlat: Task[] = Object.values(allTasks).flat();
    let start: Date;
    let end: Date;

    switch (type) {
      case 'weekly':
        // Calculate week start/end from week number
        const jan1 = new Date(year, 0, 1);
        const daysToAdd = (week - 1) * 7;
        const weekDate = new Date(jan1.getTime() + daysToAdd * 24 * 60 * 60 * 1000);
        start = startOfWeek(weekDate, { weekStartsOn: 1 });
        end = endOfWeek(weekDate, { weekStartsOn: 1 });
        break;
      case 'monthly':
        start = startOfMonth(new Date(year, month, 1));
        end = endOfMonth(new Date(year, month, 1));
        break;
      case 'quarterly':
        start = new Date(year, quarter * 3, 1);
        end = new Date(year, quarter * 3 + 3, 0, 23, 59, 59, 999);
        break;
      case 'semester':
        start = new Date(year, semester * 6, 1);
        end = new Date(year, semester * 6 + 6, 0, 23, 59, 59, 999);
        break;
      case 'yearly':
        start = new Date(year, 0, 1);
        end = new Date(year, 11, 31, 23, 59, 59, 999);
        break;
      default:
        return allTasksFlat;
    }

    return allTasksFlat.filter(task => {
      const taskDate = parseISO(task.date);
      return isWithinInterval(taskDate, { start, end });
    });
  };

  const calculateStats = (tasks: Task[]) => {
    const completedTasks = tasks.filter(t => t.completed);
    const pendingTasks = tasks.filter(t => !t.completed);
    
    const totalRevenue = completedTasks.reduce((sum, t) => sum + parseFloat(t.price || '0'), 0);
    const pendingRevenue = pendingTasks.reduce((sum, t) => sum + parseFloat(t.price || '0'), 0);
    const totalHours = completedTasks.reduce((sum, task) => {
      const start = new Date(`1970-01-01T${task.startTime}`);
      const end = new Date(`1970-01-01T${task.endTime}`);
      return sum + (end.getTime() - start.getTime()) / (1000 * 60 * 60);
    }, 0);
    const uniqueClients = new Set(tasks.map(t => t.client)).size;
    
    return {
      totalRevenue,
      pendingRevenue,
      totalAgendamentos: tasks.length,
      concluidos: completedTasks.length,
      pendentes: pendingTasks.length,
      totalHours,
      uniqueClients,
    };
  };

  const getPeriodLabel = (type: PeriodFilter, year: number, month: number, week: number, quarter: number, semester: number) => {
    switch (type) {
      case 'weekly':
        return `Sem ${week} de ${year}`;
      case 'monthly':
        return `${MONTH_NAMES[month]} ${year}`;
      case 'quarterly':
        return `${QUARTER_NAMES[quarter]} ${year}`;
      case 'semester':
        return `${SEMESTER_NAMES[semester]} ${year}`;
      case 'yearly':
        return `${year}`;
      default:
        return '';
    }
  };

  const statsA = useMemo(() => {
    const tasks = getFilteredTasks(periodAType, periodAYear, periodAMonth, periodAWeek, periodAQuarter, periodASemester);
    return calculateStats(tasks);
  }, [allTasks, periodAType, periodAYear, periodAMonth, periodAWeek, periodAQuarter, periodASemester]);

  const statsB = useMemo(() => {
    const tasks = getFilteredTasks(periodBType, periodBYear, periodBMonth, periodBWeek, periodBQuarter, periodBSemester);
    return calculateStats(tasks);
  }, [allTasks, periodBType, periodBYear, periodBMonth, periodBWeek, periodBQuarter, periodBSemester]);

  const labelA = getPeriodLabel(periodAType, periodAYear, periodAMonth, periodAWeek, periodAQuarter, periodASemester);
  const labelB = getPeriodLabel(periodBType, periodBYear, periodBMonth, periodBWeek, periodBQuarter, periodBSemester);

  // Chart data
  const chartData = useMemo(() => [
    { name: 'Receita', A: statsA.totalRevenue, B: statsB.totalRevenue },
    { name: 'Pendente', A: statsA.pendingRevenue, B: statsB.pendingRevenue },
  ], [statsA, statsB]);

  const chartDataServices = useMemo(() => [
    { name: 'Serviços', A: statsA.totalAgendamentos, B: statsB.totalAgendamentos },
    { name: 'Concluídos', A: statsA.concluidos, B: statsB.concluidos },
    { name: 'Clientes', A: statsA.uniqueClients, B: statsB.uniqueClients },
  ], [statsA, statsB]);

  const getDiffPercent = (a: number, b: number) => {
    if (b === 0) return a > 0 ? 100 : 0;
    return Math.round(((a - b) / b) * 100);
  };

  const DiffIndicator = ({ valueA, valueB }: { valueA: number; valueB: number }) => {
    const diff = getDiffPercent(valueA, valueB);
    if (diff === 0) return <Minus size={14} className="text-muted-foreground" />;
    if (diff > 0) return <span className="flex items-center gap-0.5 text-emerald-500 text-xs font-medium"><TrendingUp size={12} /> +{diff}%</span>;
    return <span className="flex items-center gap-0.5 text-red-500 text-xs font-medium"><TrendingDown size={12} /> {diff}%</span>;
  };

  const PeriodSelector = ({
    type, setType,
    year, setYear,
    month, setMonth,
    week, setWeek,
    quarter, setQuarter,
    semester, setSemester,
    label,
    color
  }: {
    type: PeriodFilter;
    setType: (v: PeriodFilter) => void;
    year: number;
    setYear: (v: number) => void;
    month: number;
    setMonth: (v: number) => void;
    week: number;
    setWeek: (v: number) => void;
    quarter: number;
    setQuarter: (v: number) => void;
    semester: number;
    setSemester: (v: number) => void;
    label: string;
    color: string;
  }) => (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <div className={`w-3 h-3 rounded-full ${color}`} />
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{label}</p>
      </div>
      <div className="flex flex-wrap gap-1.5">
        <select
          value={type}
          onChange={(e) => setType(e.target.value as PeriodFilter)}
          className="px-2 py-1.5 rounded text-xs font-medium bg-secondary border border-border text-foreground"
        >
          <option value="weekly">Semana</option>
          <option value="monthly">Mês</option>
          <option value="quarterly">Trimestre</option>
          <option value="semester">Semestre</option>
          <option value="yearly">Ano</option>
        </select>
        <select
          value={year}
          onChange={(e) => setYear(Number(e.target.value))}
          className="px-2 py-1.5 rounded text-xs font-medium bg-secondary border border-border text-foreground"
        >
          {ALL_YEARS.map((y) => (
            <option key={y} value={y}>{y}</option>
          ))}
        </select>
        {type === 'weekly' && (
          <select
            value={week}
            onChange={(e) => setWeek(Number(e.target.value))}
            className="px-2 py-1.5 rounded text-xs font-medium bg-secondary border border-border text-foreground"
          >
            {generateWeeksWithDates(year).map((w) => (
              <option key={w.num} value={w.num}>{w.label}</option>
            ))}
          </select>
        )}
        {type === 'monthly' && (
          <select
            value={month}
            onChange={(e) => setMonth(Number(e.target.value))}
            className="px-2 py-1.5 rounded text-xs font-medium bg-secondary border border-border text-foreground"
          >
            {MONTH_NAMES.map((m, i) => (
              <option key={i} value={i}>{m.slice(0, 3)}</option>
            ))}
          </select>
        )}
        {type === 'quarterly' && (
          <select
            value={quarter}
            onChange={(e) => setQuarter(Number(e.target.value))}
            className="px-2 py-1.5 rounded text-xs font-medium bg-secondary border border-border text-foreground"
          >
            {QUARTER_NAMES.map((q, i) => (
              <option key={i} value={i}>{q}</option>
            ))}
          </select>
        )}
        {type === 'semester' && (
          <select
            value={semester}
            onChange={(e) => setSemester(Number(e.target.value))}
            className="px-2 py-1.5 rounded text-xs font-medium bg-secondary border border-border text-foreground"
          >
            {SEMESTER_NAMES.map((s, i) => (
              <option key={i} value={i}>{s}</option>
            ))}
          </select>
        )}
      </div>
    </div>
  );

  const StatRow = ({ label, valueA, valueB, prefix = '', suffix = '' }: { 
    label: string; 
    valueA: number; 
    valueB: number; 
    prefix?: string;
    suffix?: string;
  }) => (
    <div className="grid grid-cols-[1fr_auto_1fr] gap-2 items-center py-2 border-b border-border/50 last:border-0">
      <div className="text-right">
        <span className="text-sm font-semibold text-foreground">{prefix}{valueA.toFixed(suffix ? 1 : 0)}{suffix}</span>
      </div>
      <div className="flex flex-col items-center gap-0.5">
        <span className="text-[10px] text-muted-foreground uppercase tracking-wide">{label}</span>
        <DiffIndicator valueA={valueA} valueB={valueB} />
      </div>
      <div className="text-left">
        <span className="text-sm font-semibold text-foreground">{prefix}{valueB.toFixed(suffix ? 1 : 0)}{suffix}</span>
      </div>
    </div>
  );

  return (
    <div className="bg-card border border-border rounded-xl p-4 mb-8 animate-fade-in">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <GitCompare size={18} className="text-primary" />
          <h3 className="font-semibold text-foreground">Comparação de Períodos</h3>
        </div>
        <Button variant="ghost" size="sm" onClick={onClose}>
          <X size={16} />
        </Button>
      </div>

      {/* Period Selectors */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        <PeriodSelector
          label="Período A"
          color="bg-emerald-500"
          type={periodAType}
          setType={setPeriodAType}
          year={periodAYear}
          setYear={setPeriodAYear}
          month={periodAMonth}
          setMonth={setPeriodAMonth}
          week={periodAWeek}
          setWeek={setPeriodAWeek}
          quarter={periodAQuarter}
          setQuarter={setPeriodAQuarter}
          semester={periodASemester}
          setSemester={setPeriodASemester}
        />
        <PeriodSelector
          label="Período B"
          color="bg-blue-500"
          type={periodBType}
          setType={setPeriodBType}
          year={periodBYear}
          setYear={setPeriodBYear}
          month={periodBMonth}
          setMonth={setPeriodBMonth}
          week={periodBWeek}
          setWeek={setPeriodBWeek}
          quarter={periodBQuarter}
          setQuarter={setPeriodBQuarter}
          semester={periodBSemester}
          setSemester={setPeriodBSemester}
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        {/* Revenue Chart */}
        <div className="bg-secondary/30 rounded-lg p-3">
          <p className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wide">Receitas (€)</p>
          <div className="h-40">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} barGap={8}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
                <YAxis tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))', 
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                    fontSize: '12px'
                  }}
                  formatter={(value: number) => [`€${value.toFixed(2)}`, '']}
                />
                <Legend 
                  formatter={(value) => value === 'A' ? labelA : labelB}
                  wrapperStyle={{ fontSize: '10px' }}
                />
                <Bar dataKey="A" name="A" fill="#10B981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="B" name="B" fill="#3B82F6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Services Chart */}
        <div className="bg-secondary/30 rounded-lg p-3">
          <p className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wide">Serviços</p>
          <div className="h-40">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartDataServices} barGap={8}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
                <YAxis tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))', 
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                    fontSize: '12px'
                  }}
                />
                <Legend 
                  formatter={(value) => value === 'A' ? labelA : labelB}
                  wrapperStyle={{ fontSize: '10px' }}
                />
                <Bar dataKey="A" name="A" fill="#10B981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="B" name="B" fill="#3B82F6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Comparison Headers */}
      <div className="grid grid-cols-[1fr_auto_1fr] gap-2 items-center mb-2">
        <div className="text-right flex items-center justify-end gap-1.5">
          <div className="w-2 h-2 rounded-full bg-emerald-500" />
          <span className="text-xs font-medium text-foreground">{labelA}</span>
        </div>
        <div className="w-20" />
        <div className="text-left flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-blue-500" />
          <span className="text-xs font-medium text-foreground">{labelB}</span>
        </div>
      </div>

      {/* Stats Comparison */}
      <div className="bg-secondary/30 rounded-lg p-3">
        <StatRow label="Receita" valueA={statsA.totalRevenue} valueB={statsB.totalRevenue} prefix="€" />
        <StatRow label="Pendente" valueA={statsA.pendingRevenue} valueB={statsB.pendingRevenue} prefix="€" />
        <StatRow label="Serviços" valueA={statsA.totalAgendamentos} valueB={statsB.totalAgendamentos} />
        <StatRow label="Concluídos" valueA={statsA.concluidos} valueB={statsB.concluidos} />
        <StatRow label="Horas" valueA={statsA.totalHours} valueB={statsB.totalHours} suffix="h" />
        <StatRow label="Clientes" valueA={statsA.uniqueClients} valueB={statsB.uniqueClients} />
      </div>
    </div>
  );
}
