import React, { useMemo, useState } from 'react';
import { Task } from '@/hooks/useAgendamentos';
import { Client } from '@/hooks/useClients';
import { Extra } from '@/hooks/useExtras';
import {
  TrendingUp, TrendingDown, Award, AlertTriangle, Minus,
  Star, Clock, Filter, Table as TableIcon, List, ArrowUpDown,
  Heart, AlertCircle,
} from 'lucide-react';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { format, parseISO, differenceInDays, subMonths } from 'date-fns';
import { pt } from 'date-fns/locale';

interface Props {
  allTasksFlat: Task[];
  extras?: Extra[];
  clients?: Client[];
}

type ClientType = 'favorito' | 'ocasional' | 'perdido';
type Period = '30d' | '90d' | 'ytd' | 'all';
type SortKey =
  | 'score' | 'rate' | 'rateNet' | 'hoursPerMonth' | 'frequency'
  | 'avgServiceHours' | 'ytd' | 'lifetime' | 'paidPercent' | 'lastService';

interface ClientMetrics {
  name: string;
  type: ClientType;
  servicesCount: number;
  totalHours: number;
  totalRevenue: number;
  ratePerHour: number;
  ratePerHourNet: number;          // após despesas alocadas proporcionalmente
  hoursPerMonth: number;
  frequencyDays: number | null;    // média de dias entre serviços
  avgServiceHours: number;
  ytdRevenue: number;
  lifetimeRevenue: number;
  paidPercent: number;              // 0-100
  pendingValue: number;
  trendPercent: number | null;      // null se sem dados suficientes
  lastServiceDate: string | null;
  daysSinceLast: number | null;
  firstServiceDate: string | null;
  score: number;                    // 0-100
}

const periodLabel: Record<Period, string> = {
  '30d': 'Últimos 30 dias',
  '90d': 'Últimos 3 meses',
  'ytd': 'Ano atual',
  'all': 'Desde sempre',
};

const sortLabel: Record<SortKey, string> = {
  score: 'Score',
  rate: '€/hora',
  rateNet: '€/h líquido',
  hoursPerMonth: 'Horas/mês',
  frequency: 'Frequência',
  avgServiceHours: 'Tempo médio',
  ytd: 'Total YTD',
  lifetime: 'Total vida',
  paidPercent: '% pago',
  lastService: 'Último serviço',
};

function hoursOfTask(t: Task): number {
  const start = new Date(`1970-01-01T${t.startTime}`);
  const end = new Date(`1970-01-01T${t.endTime}`);
  const h = (end.getTime() - start.getTime()) / 3_600_000;
  return h > 0 ? h : 0;
}

const ClientProfitabilityCard: React.FC<Props> = ({ allTasksFlat, extras = [], clients = [] }) => {
  const [period, setPeriod] = useState<Period>('all');
  const [sortBy, setSortBy] = useState<SortKey>('score');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [view, setView] = useState<'compact' | 'table'>('compact');
  const [filter, setFilter] = useState<'all' | 'favoritos' | 'devedores' | 'ativos'>('all');

  const now = new Date();

  // Filtrar tasks por período
  const tasksInPeriod = useMemo(() => {
    if (period === 'all') return allTasksFlat;
    let cutoff: Date;
    switch (period) {
      case '30d': cutoff = subMonths(now, 1); break;
      case '90d': cutoff = subMonths(now, 3); break;
      case 'ytd': cutoff = new Date(now.getFullYear(), 0, 1); break;
    }
    return allTasksFlat.filter(t => parseISO(t.date) >= cutoff);
  }, [allTasksFlat, period]);

  // Alocação de despesas por dia (proporcional à receita do dia)
  // expensesByDate: { 'yyyy-MM-dd': totalDespesa }
  const expensesByDate = useMemo(() => {
    const map: Record<string, number> = {};
    extras.filter(e => e.tipo === 'despesa').forEach(e => {
      map[e.data] = (map[e.data] || 0) + (Number(e.valor) || 0);
    });
    return map;
  }, [extras]);

  // Receita por dia (todos os clientes, concluídos) — denominador para alocação
  const revenueByDate = useMemo(() => {
    const map: Record<string, number> = {};
    allTasksFlat.forEach(t => {
      if (!t.completed) return;
      const price = parseFloat(t.price || '0') || 0;
      map[t.date] = (map[t.date] || 0) + price;
    });
    return map;
  }, [allTasksFlat]);

  const favoriteSet = useMemo(
    () => new Set(clients.filter(c => c.favorito).map(c => c.nome)),
    [clients],
  );

  const metrics = useMemo<ClientMetrics[]>(() => {
    const byClient: Record<string, Task[]> = {};
    tasksInPeriod.forEach(t => {
      if (!t.completed) {
        // queremos pago% mesmo para não-concluídos? Só conta valor em dívida (pendingValue)
      }
      (byClient[t.client] ||= []).push(t);
    });

    // Também precisamos tasks LIFETIME (sempre) por cliente para "lifetime" e "ytd"
    const byClientLifetime: Record<string, Task[]> = {};
    allTasksFlat.forEach(t => {
      (byClientLifetime[t.client] ||= []).push(t);
    });

    const yearStart = new Date(now.getFullYear(), 0, 1);

    const result: ClientMetrics[] = Object.entries(byClient).map(([name, tasks]) => {
      const completed = tasks.filter(t => t.completed);
      const totalHours = completed.reduce((s, t) => s + hoursOfTask(t), 0);
      const totalRevenue = completed.reduce((s, t) => s + (parseFloat(t.price || '0') || 0), 0);
      const ratePerHour = totalHours > 0 ? totalRevenue / totalHours : 0;

      // €/h líquido: aloca despesas do dia proporcionalmente à receita
      const allocatedExpenses = completed.reduce((s, t) => {
        const dayExpense = expensesByDate[t.date] || 0;
        const dayRevenue = revenueByDate[t.date] || 0;
        if (dayExpense === 0 || dayRevenue === 0) return s;
        const price = parseFloat(t.price || '0') || 0;
        return s + (dayExpense * (price / dayRevenue));
      }, 0);
      const ratePerHourNet = totalHours > 0 ? (totalRevenue - allocatedExpenses) / totalHours : 0;

      // Datas
      const dates = tasks.map(t => t.date).sort();
      const firstServiceDate = dates[0] || null;
      const lastServiceDate = dates[dates.length - 1] || null;
      const daysSinceLast = lastServiceDate
        ? differenceInDays(now, parseISO(lastServiceDate))
        : null;

      // Horas/mês
      let hoursPerMonth = 0;
      if (firstServiceDate && totalHours > 0) {
        const months = Math.max(
          1,
          (now.getTime() - parseISO(firstServiceDate).getTime()) / (1000 * 60 * 60 * 24 * 30),
        );
        hoursPerMonth = totalHours / months;
      }

      // Frequência (dias entre serviços)
      let frequencyDays: number | null = null;
      if (tasks.length >= 2 && firstServiceDate && lastServiceDate) {
        const span = differenceInDays(parseISO(lastServiceDate), parseISO(firstServiceDate));
        frequencyDays = span > 0 ? span / (tasks.length - 1) : null;
      }

      const avgServiceHours = completed.length > 0 ? totalHours / completed.length : 0;

      // YTD e lifetime (usando lifetime tasks, ignorando filtro)
      const lifetimeTasks = byClientLifetime[name] || [];
      const ytdRevenue = lifetimeTasks
        .filter(t => t.completed && parseISO(t.date) >= yearStart)
        .reduce((s, t) => s + (parseFloat(t.price || '0') || 0), 0);
      const lifetimeRevenue = lifetimeTasks
        .filter(t => t.completed)
        .reduce((s, t) => s + (parseFloat(t.price || '0') || 0), 0);

      // % pago vs total faturado completado
      const paidCompleted = completed
        .filter(t => t.pago)
        .reduce((s, t) => s + (parseFloat(t.price || '0') || 0), 0);
      const paidPercent = totalRevenue > 0 ? (paidCompleted / totalRevenue) * 100 : 100;
      const pendingValue = totalRevenue - paidCompleted;

      // Tendência: comparar últimos 3 meses vs 3 meses anteriores (sempre sobre lifetime)
      const cutoffRecent = subMonths(now, 3);
      const cutoffPrev = subMonths(now, 6);
      const recent = lifetimeTasks.filter(
        t => t.completed && parseISO(t.date) >= cutoffRecent,
      );
      const prev = lifetimeTasks.filter(t => {
        if (!t.completed) return false;
        const d = parseISO(t.date);
        return d >= cutoffPrev && d < cutoffRecent;
      });

      let trendPercent: number | null = null;
      if (recent.length >= 3 && prev.length >= 3) {
        const recentHrs = recent.reduce((s, t) => s + hoursOfTask(t), 0);
        const recentRev = recent.reduce((s, t) => s + (parseFloat(t.price || '0') || 0), 0);
        const prevHrs = prev.reduce((s, t) => s + hoursOfTask(t), 0);
        const prevRev = prev.reduce((s, t) => s + (parseFloat(t.price || '0') || 0), 0);
        const rRecent = recentHrs > 0 ? recentRev / recentHrs : 0;
        const rPrev = prevHrs > 0 ? prevRev / prevHrs : 0;
        if (rPrev > 0) trendPercent = ((rRecent - rPrev) / rPrev) * 100;
      }

      // Tipo
      let type: ClientType = 'ocasional';
      if (favoriteSet.has(name)) {
        type = daysSinceLast !== null && daysSinceLast > 30 ? 'perdido' : 'favorito';
      }

      return {
        name,
        type,
        servicesCount: tasks.length,
        totalHours,
        totalRevenue,
        ratePerHour,
        ratePerHourNet,
        hoursPerMonth,
        frequencyDays,
        avgServiceHours,
        ytdRevenue,
        lifetimeRevenue,
        paidPercent,
        pendingValue,
        trendPercent,
        lastServiceDate,
        daysSinceLast,
        firstServiceDate,
        score: 0, // calculado depois
      };
    }).filter(c => c.totalHours >= 1);

    // Score 0-100: normalizar €/h, frequência (mais frequente = melhor) e % pago
    if (result.length > 0) {
      const rates = result.map(r => r.ratePerHour);
      const minR = Math.min(...rates);
      const maxR = Math.max(...rates);
      const freqs = result
        .map(r => r.frequencyDays)
        .filter((x): x is number => x !== null);
      const minF = freqs.length ? Math.min(...freqs) : 0;
      const maxF = freqs.length ? Math.max(...freqs) : 0;

      result.forEach(r => {
        const nRate = maxR > minR ? (r.ratePerHour - minR) / (maxR - minR) : 1;
        const nFreq = r.frequencyDays === null || maxF === minF
          ? 0.5
          : 1 - (r.frequencyDays - minF) / (maxF - minF); // menos dias = melhor
        const nPaid = (r.paidPercent || 0) / 100;
        r.score = Math.round((0.5 * nRate + 0.3 * nFreq + 0.2 * nPaid) * 100);
      });
    }

    return result;
  }, [tasksInPeriod, allTasksFlat, expensesByDate, revenueByDate, favoriteSet]);

  // Filtros
  const filtered = useMemo(() => {
    return metrics.filter(c => {
      if (filter === 'favoritos') return c.type === 'favorito' || c.type === 'perdido';
      if (filter === 'devedores') return c.pendingValue > 0;
      if (filter === 'ativos') return c.daysSinceLast !== null && c.daysSinceLast <= 60;
      return true;
    });
  }, [metrics, filter]);

  // Ordenação
  const sorted = useMemo(() => {
    const arr = [...filtered];
    const dir = sortDir === 'asc' ? 1 : -1;
    arr.sort((a, b) => {
      const get = (c: ClientMetrics): number => {
        switch (sortBy) {
          case 'score': return c.score;
          case 'rate': return c.ratePerHour;
          case 'rateNet': return c.ratePerHourNet;
          case 'hoursPerMonth': return c.hoursPerMonth;
          case 'frequency': return c.frequencyDays ?? 9999; // sem dados = pior
          case 'avgServiceHours': return c.avgServiceHours;
          case 'ytd': return c.ytdRevenue;
          case 'lifetime': return c.lifetimeRevenue;
          case 'paidPercent': return c.paidPercent;
          case 'lastService': return c.lastServiceDate ? parseISO(c.lastServiceDate).getTime() : 0;
        }
      };
      // Frequência: menos dias = melhor → inverter direção
      const va = get(a);
      const vb = get(b);
      if (sortBy === 'frequency') return (va - vb) * (sortDir === 'asc' ? 1 : -1);
      return (vb - va) * dir;
    });
    return arr;
  }, [filtered, sortBy, sortDir]);

  if (metrics.length === 0) {
    return (
      <div className="bg-card rounded-2xl shadow-sm p-6 border border-border">
        <h3 className="font-bold text-foreground flex items-center gap-2 mb-2">
          <Award size={18} className="text-primary" /> Rentabilidade por Cliente
        </h3>
        <p className="text-sm text-muted-foreground">
          Sem dados suficientes no período selecionado.
        </p>
      </div>
    );
  }

  // Resumo cabeçalho
  const totalRev = metrics.reduce((s, c) => s + c.totalRevenue, 0);
  const totalHrs = metrics.reduce((s, c) => s + c.totalHours, 0);
  const avgRate = totalHrs > 0 ? totalRev / totalHrs : 0;
  const best = [...metrics].sort((a, b) => b.ratePerHour - a.ratePerHour)[0];
  const worst = [...metrics].sort((a, b) => a.ratePerHour - b.ratePerHour)[0];

  const typeBadge = (t: ClientType) => {
    if (t === 'favorito') return (
      <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded bg-yellow-500/10 text-yellow-700 dark:text-yellow-400">
        <Heart size={10} className="fill-current" /> Favorito
      </span>
    );
    if (t === 'perdido') return (
      <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded bg-destructive/10 text-destructive">
        <AlertCircle size={10} /> Perdido
      </span>
    );
    return (
      <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
        Ocasional
      </span>
    );
  };

  const trendIcon = (t: number | null) => {
    if (t === null) return <span className="text-muted-foreground text-xs">—</span>;
    if (Math.abs(t) < 5) return (
      <span className="inline-flex items-center gap-0.5 text-muted-foreground text-xs">
        <Minus size={12} /> estável
      </span>
    );
    const up = t > 0;
    return (
      <span className={`inline-flex items-center gap-0.5 text-xs font-medium ${up ? 'text-success' : 'text-destructive'}`}>
        {up ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
        {Math.abs(t).toFixed(0)}%
      </span>
    );
  };

  return (
    <div className="bg-card rounded-2xl shadow-sm p-6 border border-border animate-fade-in-up">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
        <div>
          <h3 className="font-bold text-foreground flex items-center gap-2">
            <Award size={18} className="text-primary" /> Rentabilidade por Cliente
          </h3>
          <p className="text-xs text-muted-foreground mt-1">
            Média global: <strong className="text-foreground">€{avgRate.toFixed(2)}/h</strong>
            {' · '}
            <span className="text-success">Topo: {best.name} (€{best.ratePerHour.toFixed(2)}/h)</span>
            {worst.name !== best.name && (
              <>
                {' · '}
                <span className="text-destructive">Pior: {worst.name} (€{worst.ratePerHour.toFixed(2)}/h)</span>
              </>
            )}
            {' · '}
            <span>{metrics.length} clientes</span>
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant={view === 'compact' ? 'default' : 'outline'}
            onClick={() => setView('compact')}
            className="h-8 px-2"
          >
            <List size={14} className="mr-1" /> Lista
          </Button>
          <Button
            size="sm"
            variant={view === 'table' ? 'default' : 'outline'}
            onClick={() => setView('table')}
            className="h-8 px-2"
          >
            <TableIcon size={14} className="mr-1" /> Tabela
          </Button>
        </div>
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap items-center gap-2 mb-4 text-xs">
        <Select value={period} onValueChange={(v) => setPeriod(v as Period)}>
          <SelectTrigger className="h-8 w-[180px] text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {(Object.keys(periodLabel) as Period[]).map(p => (
              <SelectItem key={p} value={p}>{periodLabel[p]}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortKey)}>
          <SelectTrigger className="h-8 w-[180px] text-xs">
            <ArrowUpDown size={12} className="mr-1" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {(Object.keys(sortLabel) as SortKey[]).map(k => (
              <SelectItem key={k} value={k}>{sortLabel[k]}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button
          size="sm"
          variant="outline"
          className="h-8 px-2"
          onClick={() => setSortDir(d => d === 'asc' ? 'desc' : 'asc')}
        >
          {sortDir === 'asc' ? '↑ Asc' : '↓ Desc'}
        </Button>

        <div className="flex items-center gap-1 ml-auto">
          <Filter size={12} className="text-muted-foreground" />
          {(['all', 'favoritos', 'devedores', 'ativos'] as const).map(f => (
            <Button
              key={f}
              size="sm"
              variant={filter === f ? 'default' : 'outline'}
              onClick={() => setFilter(f)}
              className="h-7 px-2 text-[11px] capitalize"
            >
              {f === 'all' ? 'Todos' : f}
            </Button>
          ))}
        </div>
      </div>

      {/* Conteúdo */}
      {view === 'compact' ? (
        <div className="space-y-2 max-h-[520px] overflow-y-auto pr-1">
          {sorted.map((c, idx) => {
            const isBelow = c.ratePerHour < avgRate * 0.9;
            const isAbove = c.ratePerHour > avgRate * 1.1;
            const toneText = isBelow ? 'text-destructive' : isAbove ? 'text-success' : 'text-foreground';
            const Icon = isBelow ? TrendingDown : isAbove ? TrendingUp : Star;

            return (
              <div
                key={c.name}
                className="p-3 rounded-xl border border-border bg-muted/20 hover:bg-muted/40 transition-colors"
              >
                <div className="flex items-start gap-3">
                  <span className="w-7 h-7 rounded-full bg-card border border-border flex items-center justify-center text-xs font-bold text-muted-foreground shrink-0">
                    {idx + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold text-foreground truncate">{c.name}</p>
                      {typeBadge(c.type)}
                      {c.pendingValue > 0 && (
                        <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-orange-500/10 text-orange-700 dark:text-orange-400">
                          Deve €{c.pendingValue.toFixed(0)}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {c.servicesCount} serviço{c.servicesCount !== 1 ? 's' : ''} · {c.totalHours.toFixed(1)}h ·
                      {' '}€/h líq <strong className="text-foreground">€{c.ratePerHourNet.toFixed(2)}</strong>
                      {' '}· pago {c.paidPercent.toFixed(0)}%
                      {c.frequencyDays !== null && <> · ~{c.frequencyDays.toFixed(0)}d entre serviços</>}
                    </p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      Tempo médio: {c.avgServiceHours.toFixed(1)}h ·
                      {' '}YTD €{c.ytdRevenue.toFixed(0)} ·
                      {' '}Vida €{c.lifetimeRevenue.toFixed(0)}
                      {c.lastServiceDate && (
                        <> · último {format(parseISO(c.lastServiceDate), 'd MMM', { locale: pt })}
                          {c.daysSinceLast !== null && ` (há ${c.daysSinceLast}d)`}
                        </>
                      )}
                    </p>
                    {/* Score bar */}
                    <div className="mt-2 flex items-center gap-2">
                      <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${
                            c.score >= 70 ? 'bg-success' :
                            c.score >= 40 ? 'bg-yellow-500' : 'bg-destructive'
                          }`}
                          style={{ width: `${c.score}%` }}
                        />
                      </div>
                      <span className="text-[10px] font-bold text-muted-foreground w-8 text-right">
                        {c.score}
                      </span>
                    </div>
                  </div>
                  <div className={`text-right shrink-0 ${toneText}`}>
                    <div className="flex items-center justify-end gap-1 font-bold text-lg">
                      <Icon size={14} />
                      €{c.ratePerHour.toFixed(2)}
                    </div>
                    <p className="text-[10px] uppercase tracking-wide text-muted-foreground">€/hora</p>
                    <div className="mt-1">{trendIcon(c.trendPercent)}</div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="max-h-[520px] overflow-auto border border-border rounded-xl">
          <Table>
            <TableHeader className="bg-muted/40 sticky top-0">
              <TableRow>
                <TableHead className="w-10">#</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead className="text-right">Score</TableHead>
                <TableHead className="text-right">€/h</TableHead>
                <TableHead className="text-right">€/h líq</TableHead>
                <TableHead className="text-right">H/mês</TableHead>
                <TableHead className="text-right">Freq</TableHead>
                <TableHead className="text-right">T. médio</TableHead>
                <TableHead className="text-right">YTD</TableHead>
                <TableHead className="text-right">Vida</TableHead>
                <TableHead className="text-right">Pago</TableHead>
                <TableHead className="text-right">Tendência</TableHead>
                <TableHead className="text-right">Último</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sorted.map((c, idx) => (
                <TableRow key={c.name}>
                  <TableCell className="text-muted-foreground text-xs">{idx + 1}</TableCell>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-1.5">
                      <span className="truncate max-w-[140px]">{c.name}</span>
                      {typeBadge(c.type)}
                    </div>
                  </TableCell>
                  <TableCell className="text-right font-bold">
                    <span className={
                      c.score >= 70 ? 'text-success' :
                      c.score >= 40 ? 'text-yellow-600 dark:text-yellow-400' : 'text-destructive'
                    }>{c.score}</span>
                  </TableCell>
                  <TableCell className="text-right">€{c.ratePerHour.toFixed(2)}</TableCell>
                  <TableCell className="text-right">€{c.ratePerHourNet.toFixed(2)}</TableCell>
                  <TableCell className="text-right">{c.hoursPerMonth.toFixed(1)}h</TableCell>
                  <TableCell className="text-right">
                    {c.frequencyDays !== null ? `${c.frequencyDays.toFixed(0)}d` : '—'}
                  </TableCell>
                  <TableCell className="text-right">{c.avgServiceHours.toFixed(1)}h</TableCell>
                  <TableCell className="text-right">€{c.ytdRevenue.toFixed(0)}</TableCell>
                  <TableCell className="text-right">€{c.lifetimeRevenue.toFixed(0)}</TableCell>
                  <TableCell className="text-right">
                    <span className={c.paidPercent >= 90 ? 'text-success' : c.paidPercent >= 60 ? '' : 'text-destructive'}>
                      {c.paidPercent.toFixed(0)}%
                    </span>
                  </TableCell>
                  <TableCell className="text-right">{trendIcon(c.trendPercent)}</TableCell>
                  <TableCell className="text-right text-xs text-muted-foreground">
                    {c.daysSinceLast !== null ? `${c.daysSinceLast}d` : '—'}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <p className="text-[10px] text-muted-foreground mt-3">
        Score combina €/h (50%), frequência (30%) e fiabilidade de pagamento (20%). €/h líquido desconta despesas do dia alocadas proporcionalmente.
      </p>
    </div>
  );
};

export default ClientProfitabilityCard;
