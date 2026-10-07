import React, { useCallback, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import ScheduleView from '@/components/ScheduleView';
import { useAgendamentos, Task } from '@/hooks/useAgendamentos';
import { useAuth } from '@/hooks/useAuth';
import { useExtras, Extra, ExtraTipo } from '@/hooks/useExtras';
import AgendaFocusView, { StatusFilter } from '@/components/schedule/AgendaFocusView';
import QuickNewTaskModal from '@/components/schedule/QuickNewTaskModal';
import ExtraValueModal from '@/components/schedule/ExtraValueModal';
import { generateMonthsConfig, getMonthKeyFromDate } from '@/utils/monthConfig';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Search, Plus, CalendarDays, CalendarRange, Grid3x3, Loader2, ChevronLeft, ChevronRight, Sparkles, Euro, Minus, Settings2 } from 'lucide-react';

type View = 'hoje' | 'semana' | 'mes';

const MONTHS = generateMonthsConfig();

const toISO = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const todayISO = () => toISO(new Date());
const isValidISO = (v: string | null): v is string => {
  if (!v || !/^\d{4}-\d{2}-\d{2}$/.test(v)) return false;
  const [y, m, d] = v.split('-').map(Number);
  const dt = new Date(y, m - 1, d);
  return toISO(dt) === v && !!getMonthKeyFromDate(v, MONTHS);
};
const shiftISO = (iso: string, days: number) => {
  const [y, m, d] = iso.split('-').map(Number);
  return toISO(new Date(y, m - 1, d + days));
};
const humanDate = (iso: string) => {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('pt-PT', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
};

const AdminAgendamentos: React.FC = () => {
  const { role } = useAuth();
  const { allTasks, loading } = useAgendamentos();
  const { extras, addExtra, updateExtra } = useExtras();
  const [params, setParams] = useSearchParams();

  // URL is the source of truth for view/date/month so context survives navigation and deep links.
  const rawView = params.get('vista');
  const view: View = rawView === 'semana' || rawView === 'mes' ? rawView : 'hoje';
  const today = todayISO();
  const date = isValidISO(params.get('data')) ? params.get('data')! : today;
  const rawMes = params.get('mes');
  const mes = rawMes && MONTHS[rawMes] ? rawMes : getMonthKeyFromDate(date, MONTHS) || undefined;
  const highlightId = params.get('destaque') || undefined;

  const update = useCallback((changes: Record<string, string | null>, replace = false) => {
    setParams(prev => {
      const next = new URLSearchParams(prev);
      Object.entries(changes).forEach(([k, v]) => (v === null ? next.delete(k) : next.set(k, v)));
      return next;
    }, { replace });
  }, [setParams]);

  const setView = (v: View) => update({ vista: v === 'hoje' ? null : v, destaque: null });
  const setDate = (d: string) => update({ data: d === today ? null : d, destaque: null }, true);
  const onMonthChange = useCallback((m: string) => {
    if (params.get('mes') !== m) update({ mes: m }, true);
  }, [params, update]);

  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<StatusFilter>('todas');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Task | null>(null);
  const [defaultDate, setDefaultDate] = useState<string | undefined>();
  const [extraOpen, setExtraOpen] = useState(false);
  const [editingExtra, setEditingExtra] = useState<Extra | null>(null);
  const [extraTipo, setExtraTipo] = useState<ExtraTipo>('receita');

  const flatTasks = useMemo(() => Object.values(allTasks).flat(), [allTasks]);

  const dayTasks = flatTasks.filter(t => t.date === date);
  const dayExtras = extras.filter(e => e.data === date);
  const extrasNet = dayExtras.reduce((s, e) => s + (e.tipo === 'despesa' ? -1 : 1) * Number(e.valor), 0);
  const summary = {
    total: dayTasks.length,
    pending: dayTasks.filter(t => !t.completed).length,
    done: dayTasks.filter(t => t.completed).length,
    revenue: dayTasks.reduce((s, t) => s + (parseFloat(t.price) || 0), 0) + extrasNet,
  };

  const openNew = (d?: string) => { setEditing(null); setDefaultDate(d); setModalOpen(true); };
  const openEdit = (t: Task) => { setEditing(t); setDefaultDate(t.date); setModalOpen(true); };
  const openExtra = (tipo: ExtraTipo) => { setEditingExtra(null); setExtraTipo(tipo); setExtraOpen(true); };

  const viewSwitcher = (
    <div role="tablist" aria-label="Vista da agenda" className="flex items-center gap-1 bg-secondary rounded-lg p-1">
      <ViewButton current={view} value="hoje" onClick={() => setView('hoje')} icon={<CalendarDays size={15} />} label="Hoje" />
      <ViewButton current={view} value="semana" onClick={() => setView('semana')} icon={<CalendarRange size={15} />} label="Semana" />
      <ViewButton current={view} value="mes" onClick={() => setView('mes')} icon={<Grid3x3 size={15} />} label="Mês" />
    </div>
  );

  if (view === 'mes') {
    return (
      <>
        <div className="sticky top-0 z-30 bg-background/95 backdrop-blur border-b border-border px-4 py-2 flex items-center justify-between gap-2">
          {viewSwitcher}
          <p className="hidden sm:block text-xs text-muted-foreground">Use o botão <strong>Adicionar</strong> para limpezas, fixos, quinzenais, extras, copiar e exportar.</p>
        </div>
        <ScheduleView isAdmin={true} initialMonth={mes} onMonthChange={onMonthChange} />
      </>
    );
  }

  const addMenu = (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button className="min-h-[44px]" aria-label="Adicionar">
          <Plus size={18} className="mr-1" /> Adicionar
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-60">
        <DropdownMenuItem className="min-h-[44px] gap-2" onClick={() => openNew(view === 'hoje' ? date : undefined)}>
          <Sparkles size={16} className="text-primary" /> Nova limpeza
        </DropdownMenuItem>
        <DropdownMenuItem className="min-h-[44px] gap-2" onClick={() => openExtra('receita')}>
          <Euro size={16} className="text-success" /> Receita extra
        </DropdownMenuItem>
        <DropdownMenuItem className="min-h-[44px] gap-2" onClick={() => openExtra('despesa')}>
          <Minus size={16} className="text-destructive" /> Despesa
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuLabel className="text-xs text-muted-foreground font-normal">Fixa, quinzenal, copiar, exportar, desfazer</DropdownMenuLabel>
        <DropdownMenuItem className="min-h-[44px] gap-2" onClick={() => setView('mes')}>
          <Settings2 size={16} /> Mais opções (vista Mês)
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );

  return (
    <div className="pb-8">
      <div className="sticky top-0 z-30 bg-background/95 backdrop-blur border-b border-border">
        <div className="max-w-4xl mx-auto px-4 py-3 space-y-3">
          <div className="flex items-center justify-between gap-2">
            <div className="min-w-0">
              <h1 className="text-xl sm:text-2xl font-bold text-foreground leading-tight">Agenda</h1>
              <p className="text-xs sm:text-sm text-muted-foreground capitalize truncate">
                {view === 'semana' ? `Semana desde ${humanDate(date)}` : humanDate(date)}
              </p>
            </div>
            {addMenu}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {viewSwitcher}
            <div className="flex items-center gap-1">
              <Button variant="outline" size="icon" className="h-10 w-10" aria-label={view === 'semana' ? 'Semana anterior' : 'Dia anterior'}
                onClick={() => { const d = shiftISO(date, view === 'semana' ? -7 : -1); if (isValidISO(d)) setDate(d); }}>
                <ChevronLeft size={16} />
              </Button>
              <Button variant={date === today ? 'default' : 'outline'} className="h-10" onClick={() => setDate(today)}>Hoje</Button>
              <Button variant="outline" size="icon" className="h-10 w-10" aria-label={view === 'semana' ? 'Semana seguinte' : 'Dia seguinte'}
                onClick={() => { const d = shiftISO(date, view === 'semana' ? 7 : 1); if (isValidISO(d)) setDate(d); }}>
                <ChevronRight size={16} />
              </Button>
            </div>
            <div className="relative flex-1 min-w-[180px]">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Filtrar por cliente ou morada"
                aria-label="Filtrar agenda"
                className="pl-9 h-10"
              />
            </div>
          </div>

          <div className="flex gap-1.5 overflow-x-auto -mx-1 px-1 pb-0.5">
            {(['todas', 'pendentes', 'concluidas', 'porpagar'] as StatusFilter[]).map(s => (
              <button
                key={s}
                onClick={() => setStatus(s)}
                aria-pressed={status === s}
                className={`px-3 min-h-[36px] rounded-full text-xs font-semibold whitespace-nowrap transition-colors border ${
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

      {view === 'hoje' && (
        <div className="max-w-4xl mx-auto px-4 pt-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
            <SummaryCard label="Serviços" value={summary.total} tone="primary" />
            <SummaryCard label="Por concluir" value={summary.pending} tone="warn" />
            <SummaryCard label="Concluídas" value={summary.done} tone="ok" />
            <SummaryCard label="Total previsto do dia" value={`€${summary.revenue.toFixed(2)}`} tone="euro" />
          </div>
        </div>
      )}

      <section className="max-w-4xl mx-auto px-4 pt-5">
        {loading ? (
          <div className="flex justify-center py-16"><Loader2 className="animate-spin text-primary" /></div>
        ) : (
          <AgendaFocusView
            view={view}
            baseDate={date}
            tasks={flatTasks}
            extras={extras}
            onEditExtra={(e) => { setEditingExtra(e); setExtraOpen(true); }}
            highlightId={highlightId}
            searchQuery={search}
            statusFilter={status}
            onEditTask={openEdit}
            onNewTask={openNew}
            role={role || 'user'}
          />
        )}
      </section>

      <QuickNewTaskModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        defaultDate={defaultDate}
        editingTask={editing}
      />

      <ExtraValueModal
        isOpen={extraOpen}
        onClose={() => { setExtraOpen(false); setEditingExtra(null); }}
        editingExtra={editingExtra}
        defaultDate={date}
        defaultTipo={extraTipo}
        onSubmit={async (data) => {
          const r = editingExtra ? await updateExtra(editingExtra.id, data) : await addExtra(data);
          return !!r;
        }}
      />
    </div>
  );
};

const ViewButton: React.FC<{
  current: View; value: View; onClick: () => void; icon: React.ReactNode; label: string;
}> = ({ current, value, onClick, icon, label }) => (
  <button
    role="tab"
    aria-selected={current === value}
    onClick={onClick}
    className={`inline-flex items-center gap-1.5 px-2.5 sm:px-3 min-h-[36px] rounded-md text-xs sm:text-sm font-medium transition-all ${
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
