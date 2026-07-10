import React, { useMemo, useState } from 'react';
import ScheduleView from '@/components/ScheduleView';
import { useAgendamentos, Task } from '@/hooks/useAgendamentos';
import { useAuth } from '@/hooks/useAuth';
import AgendaFocusView, { StatusFilter } from '@/components/schedule/AgendaFocusView';
import QuickNewTaskModal from '@/components/schedule/QuickNewTaskModal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Plus, CalendarDays, CalendarRange, Grid3x3, Loader2 } from 'lucide-react';

type View = 'hoje' | 'semana' | 'mes';

const todayISO = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

const humanToday = () =>
  new Date().toLocaleDateString('pt-PT', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

const AdminAgendamentos: React.FC = () => {
  const { role } = useAuth();
  const { allTasks, loading } = useAgendamentos();
  const [view, setView] = useState<View>('hoje');
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<StatusFilter>('todas');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Task | null>(null);
  const [defaultDate, setDefaultDate] = useState<string | undefined>();

  const flatTasks = useMemo(() => {
    return Object.values(allTasks).flat();
  }, [allTasks]);

  const today = todayISO();
  const todayTasks = flatTasks.filter(t => t.date === today);
  const summary = {
    total: todayTasks.length,
    pending: todayTasks.filter(t => !t.completed).length,
    done: todayTasks.filter(t => t.completed).length,
    revenue: todayTasks.reduce((s, t) => s + (parseFloat(t.price) || 0), 0),
  };

  const openNew = (d?: string) => {
    setEditing(null);
    setDefaultDate(d);
    setModalOpen(true);
  };
  const openEdit = (t: Task) => {
    setEditing(t);
    setDefaultDate(t.date);
    setModalOpen(true);
  };

  if (view === 'mes') {
    return (
      <>
        {/* Slim header with view switcher for month */}
        <div className="sticky top-0 z-30 bg-background/95 backdrop-blur border-b border-border px-4 py-2 flex items-center justify-between gap-2">
          <div className="flex items-center gap-1 bg-secondary rounded-lg p-1">
            <ViewButton current={view} value="hoje" onClick={() => setView('hoje')} icon={<CalendarDays size={15} />} label="Hoje" />
            <ViewButton current={view} value="semana" onClick={() => setView('semana')} icon={<CalendarRange size={15} />} label="Semana" />
            <ViewButton current={view} value="mes" onClick={() => setView('mes')} icon={<Grid3x3 size={15} />} label="Mês" />
          </div>
        </div>
        <ScheduleView isAdmin={true} />
      </>
    );
  }

  return (
    <div className="pb-24 sm:pb-8">
      {/* Sticky Header */}
      <div className="sticky top-0 z-30 bg-background/95 backdrop-blur border-b border-border">
        <div className="max-w-4xl mx-auto px-4 py-3 space-y-3">
          <div className="flex items-center justify-between gap-2">
            <div className="min-w-0">
              <h1 className="text-xl sm:text-2xl font-bold text-foreground leading-tight">Agenda</h1>
              <p className="text-xs sm:text-sm text-muted-foreground capitalize truncate">{humanToday()}</p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                onClick={() => setView('hoje')}
                variant={view === 'hoje' ? 'default' : 'outline'}
                size="sm"
                className="min-h-[40px] hidden sm:inline-flex"
              >
                Hoje
              </Button>
              <Button onClick={() => openNew(view === 'hoje' ? today : undefined)} className="min-h-[40px] hidden sm:inline-flex">
                <Plus size={16} className="mr-1" /> Nova limpeza
              </Button>
            </div>
          </div>

          {/* Search + view switcher */}
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Procurar por cliente ou morada"
                className="pl-9 h-10"
              />
            </div>
            <div className="flex items-center gap-1 bg-secondary rounded-lg p-1">
              <ViewButton current={view} value="hoje" onClick={() => setView('hoje')} icon={<CalendarDays size={15} />} label="Hoje" />
              <ViewButton current={view} value="semana" onClick={() => setView('semana')} icon={<CalendarRange size={15} />} label="Semana" />
              <ViewButton current={view} value="mes" onClick={() => setView('mes')} icon={<Grid3x3 size={15} />} label="Mês" />
            </div>
          </div>

          {/* Status filters */}
          <div className="flex gap-1.5 overflow-x-auto -mx-1 px-1 pb-0.5">
            {(['todas', 'pendentes', 'concluidas', 'porpagar'] as StatusFilter[]).map(s => (
              <button
                key={s}
                onClick={() => setStatus(s)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors border ${
                  status === s ? 'bg-primary text-primary-foreground border-primary' : 'bg-background border-border text-muted-foreground hover:text-foreground'
                }`}
              >
                {s === 'todas' && 'Todas'}
                {s === 'pendentes' && 'Pendentes'}
                {s === 'concluidas' && 'Concluídas'}
                {s === 'porpagar' && 'Por pagar'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Today summary */}
      {view === 'hoje' && (
        <div className="max-w-4xl mx-auto px-4 pt-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
            <SummaryCard label="Hoje" value={summary.total} tone="primary" />
            <SummaryCard label="Por confirmar" value={summary.pending} tone="warn" />
            <SummaryCard label="Concluídas" value={summary.done} tone="ok" />
            <SummaryCard label="Total previsto" value={`€${summary.revenue.toFixed(0)}`} tone="euro" />
          </div>
        </div>
      )}

      {/* List */}
      <main className="max-w-4xl mx-auto px-4 pt-5">
        {loading ? (
          <div className="flex justify-center py-16"><Loader2 className="animate-spin text-primary" /></div>
        ) : (
          <AgendaFocusView
            view={view}
            tasks={flatTasks}
            searchQuery={search}
            statusFilter={status}
            onEditTask={openEdit}
            onNewTask={openNew}
            role={role || 'user'}
          />
        )}
      </main>

      {/* Mobile floating + */}
      <button
        onClick={() => openNew(view === 'hoje' ? today : undefined)}
        className="sm:hidden fixed bottom-5 right-4 z-40 h-14 w-14 rounded-full bg-primary text-primary-foreground shadow-xl active:scale-95 transition-transform flex items-center justify-center"
        aria-label="Nova limpeza"
      >
        <Plus size={26} />
      </button>

      <QuickNewTaskModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        defaultDate={defaultDate}
        editingTask={editing}
      />
    </div>
  );
};

const ViewButton: React.FC<{
  current: View; value: View; onClick: () => void; icon: React.ReactNode; label: string;
}> = ({ current, value, onClick, icon, label }) => (
  <button
    onClick={onClick}
    className={`inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-md text-xs sm:text-sm font-medium transition-all ${
      current === value ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'
    }`}
  >
    {icon}
    <span>{label}</span>
  </button>
);

const SummaryCard: React.FC<{ label: string; value: React.ReactNode; tone: 'primary' | 'warn' | 'ok' | 'euro' }> = ({ label, value, tone }) => {
  const styles: Record<string, string> = {
    primary: 'bg-primary/10 text-primary border-primary/20',
    warn: 'bg-amber-100 dark:bg-amber-950/40 text-amber-800 dark:text-amber-200 border-amber-200 dark:border-amber-900',
    ok: 'bg-emerald-100 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-200 border-emerald-200 dark:border-emerald-900',
    euro: 'bg-blue-100 dark:bg-blue-950/40 text-blue-800 dark:text-blue-200 border-blue-200 dark:border-blue-900',
  };
  return (
    <div className={`rounded-xl border p-3 ${styles[tone]}`}>
      <p className="text-[11px] uppercase font-semibold tracking-wide opacity-80">{label}</p>
      <p className="text-xl sm:text-2xl font-bold mt-0.5">{value}</p>
    </div>
  );
};

export default AdminAgendamentos;
