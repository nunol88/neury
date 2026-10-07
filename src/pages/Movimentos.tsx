import React, { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useExtras, Extra, ExtraTipo } from '@/hooks/useExtras';
import ExtraValueModal from '@/components/schedule/ExtraValueModal';
import { generateMonthsConfig, getMonthKeyFromDate } from '@/utils/monthConfig';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Loader2, Pencil, Plus, Minus, Search, Trash2, AlertTriangle, RotateCcw } from 'lucide-react';

type Filtro = 'todos' | ExtraTipo;

const MONTHS = generateMonthsConfig();
const MONTH_KEYS = Object.keys(MONTHS);

const todayISO = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};
const fmtDate = (iso: string) => {
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${y}`;
};
const eur = (n: number) => `€${n.toFixed(2)}`;

const Movimentos: React.FC = () => {
  const { extras, loading, error, refetch, addExtra, updateExtra, deleteExtra } = useExtras();
  const [params, setParams] = useSearchParams();

  const rawMes = params.get('mes');
  const mes = rawMes && (rawMes === 'todos' || MONTHS[rawMes]) ? rawMes : (getMonthKeyFromDate(todayISO(), MONTHS) || 'todos');
  const rawTipo = params.get('tipo');
  const filtro: Filtro = rawTipo === 'receita' || rawTipo === 'despesa' ? rawTipo : 'todos';
  const q = params.get('q') || '';
  const highlightId = params.get('id') || undefined;

  const setParam = (key: string, value: string | null) => {
    const next = new URLSearchParams(params);
    if (value === null || value === '') next.delete(key); else next.set(key, value);
    setParams(next, { replace: true });
  };

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Extra | null>(null);
  const [defaultTipo, setDefaultTipo] = useState<ExtraTipo>('receita');
  const [toDelete, setToDelete] = useState<Extra | null>(null);

  // Deep link: ?novo=receita|despesa opens the form; ?id=..&editar=1 opens edit.
  // Both react to param changes while already mounted (same-route navigation
  // from GlobalSearch only changes the query string) and consume the param
  // once, without loops.
  const novo = params.get('novo');
  useEffect(() => {
    if (novo !== 'receita' && novo !== 'despesa') return;
    setEditing(null); setDefaultTipo(novo); setModalOpen(true);
    const next = new URLSearchParams(params);
    next.delete('novo');
    setParams(next, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [novo]);

  const editar = params.get('editar');
  useEffect(() => {
    if (!highlightId || loading) return;
    const target = extras.find(e => e.id === highlightId);
    if (!target) return; // invalid/unknown id: no selection, no scroll
    const wantEdit = editar === '1';
    // Make sure month/type/search filters don't hide the target.
    const next = new URLSearchParams(params);
    let changed = false;
    if (mes !== 'todos' && target.mes_key !== mes) { next.set('mes', 'todos'); changed = true; }
    if (filtro !== 'todos' && target.tipo !== filtro) { next.delete('tipo'); changed = true; }
    if (q) { next.delete('q'); changed = true; }
    if (wantEdit) { next.delete('editar'); changed = true; }
    if (changed) setParams(next, { replace: true });
    if (wantEdit) { setEditing(target); setModalOpen(true); }
    // Wait for the list to render before scrolling to the row.
    const t = window.setTimeout(() => {
      document.getElementById(`mov-${highlightId}`)?.scrollIntoView({ block: 'center' });
    }, 50);
    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [highlightId, loading, editar, extras, mes, filtro, q]);

  const list = useMemo(() => {
    const term = q.trim().toLowerCase();
    return extras
      .filter(e => mes === 'todos' || e.mes_key === mes)
      .filter(e => filtro === 'todos' || e.tipo === filtro)
      .filter(e => {
        if (!term) return true;
        const hay = `${e.observacoes || ''} ${fmtDate(e.data)} ${e.data} ${Number(e.valor).toFixed(2)} ${Number(e.valor).toFixed(2).replace('.', ',')}`.toLowerCase();
        return hay.includes(term);
      })
      .sort((a, b) => b.data.localeCompare(a.data));
  }, [extras, mes, filtro, q]);

  const totals = useMemo(() => {
    const receitas = list.filter(e => e.tipo !== 'despesa').reduce((s, e) => s + Number(e.valor), 0);
    const despesas = list.filter(e => e.tipo === 'despesa').reduce((s, e) => s + Number(e.valor), 0);
    return { receitas, despesas, saldo: receitas - despesas };
  }, [list]);

  const openNew = (tipo: ExtraTipo) => { setEditing(null); setDefaultTipo(tipo); setModalOpen(true); };

  const defaultDate = mes !== 'todos' && MONTHS[mes]
    ? (getMonthKeyFromDate(todayISO(), MONTHS) === mes
        ? todayISO()
        : `${MONTHS[mes].year}-${String(MONTHS[mes].monthIndex + 1).padStart(2, '0')}-01`)
    : todayISO();

  return (
    <div className="max-w-4xl mx-auto px-4 py-5 space-y-4">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Movimentos</h1>
          <p className="text-sm text-muted-foreground">Receitas extra e despesas registadas na agenda</p>
        </div>
        <div className="flex gap-2">
          <Button className="min-h-[44px]" onClick={() => openNew('receita')}><Plus size={16} className="mr-1" /> Receita</Button>
          <Button variant="outline" className="min-h-[44px]" onClick={() => openNew('despesa')}><Minus size={16} className="mr-1" /> Despesa</Button>
        </div>
      </header>

      <div className="grid gap-2 sm:grid-cols-[180px_1fr]">
        <label className="sr-only" htmlFor="mov-mes">Mês</label>
        <select
          id="mov-mes"
          value={mes}
          onChange={e => setParam('mes', e.target.value)}
          className="h-11 rounded-md border border-input bg-background px-3 text-sm"
        >
          <option value="todos">Todos os meses</option>
          {MONTH_KEYS.map(k => <option key={k} value={k}>{MONTHS[k].label}</option>)}
        </select>
        <div className="relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            aria-label="Pesquisar movimentos"
            value={q}
            onChange={e => setParam('q', e.target.value)}
            placeholder="Pesquisar descrição, data (dd/mm/aaaa) ou valor"
            className="pl-9 h-11"
          />
        </div>
      </div>

      <div role="tablist" aria-label="Tipo" className="flex gap-1.5">
        {([['todos', 'Todos'], ['receita', 'Receitas'], ['despesa', 'Despesas']] as const).map(([v, l]) => (
          <button
            key={v}
            role="tab"
            aria-selected={filtro === v}
            onClick={() => setParam('tipo', v === 'todos' ? null : v)}
            className={`px-4 min-h-[40px] rounded-full text-sm font-semibold border ${filtro === v ? 'bg-primary text-primary-foreground border-primary' : 'bg-background border-border text-muted-foreground'}`}
          >
            {l}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-2">
        <div className="rounded-xl border border-border bg-card p-3"><p className="text-[11px] uppercase text-muted-foreground font-semibold">Total receitas extra</p><p className="text-lg font-bold text-success">{eur(totals.receitas)}</p></div>
        <div className="rounded-xl border border-border bg-card p-3"><p className="text-[11px] uppercase text-muted-foreground font-semibold">Total despesas</p><p className="text-lg font-bold text-destructive">−{eur(totals.despesas)}</p></div>
        <div className="rounded-xl border border-border bg-card p-3"><p className="text-[11px] uppercase text-muted-foreground font-semibold">Diferença (extras)</p><p className="text-lg font-bold text-foreground">{totals.saldo < 0 ? '−' : ''}{eur(Math.abs(totals.saldo))}</p></div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center gap-2 py-12 text-muted-foreground"><Loader2 className="animate-spin" /> A carregar movimentos…</div>
      ) : error ? (
        <div role="alert" className="rounded-xl border border-destructive/40 bg-destructive/5 p-4 flex items-center gap-3">
          <AlertTriangle className="text-destructive" />
          <p className="flex-1 text-sm">Não foi possível carregar os movimentos.</p>
          <Button variant="outline" onClick={() => refetch()}><RotateCcw size={14} className="mr-1" /> Tentar de novo</Button>
        </div>
      ) : list.length === 0 ? (
        <p className="text-center py-12 text-muted-foreground">Sem movimentos para estes filtros.</p>
      ) : (
        <ul className="space-y-2">
          {list.map(e => {
            const isDespesa = e.tipo === 'despesa';
            return (
              <li
                key={e.id}
                id={`mov-${e.id}`}
                className={`flex items-center gap-3 rounded-xl border bg-card p-3 ${highlightId === e.id ? 'ring-2 ring-primary border-primary' : 'border-border'}`}
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{e.observacoes || 'Sem descrição'}</p>
                  <p className="text-xs text-muted-foreground">{fmtDate(e.data)} · {isDespesa ? 'Despesa' : 'Receita extra'}</p>
                </div>
                <span className={`font-bold tabular-nums ${isDespesa ? 'text-destructive' : 'text-success'}`}>{isDespesa ? '−' : '+'}{eur(Number(e.valor))}</span>
                <Button size="sm" variant="outline" className="min-h-[40px]" onClick={() => { setEditing(e); setModalOpen(true); }} aria-label={`Editar registo de ${eur(Number(e.valor))}`}>
                  <Pencil size={14} className="mr-1" /> Editar
                </Button>
                <Button size="icon" variant="ghost" className="h-10 w-10 text-destructive" onClick={() => setToDelete(e)} aria-label={`Eliminar registo de ${eur(Number(e.valor))}`}>
                  <Trash2 size={16} />
                </Button>
              </li>
            );
          })}
        </ul>
      )}

      <ExtraValueModal
        isOpen={modalOpen}
        onClose={() => { setModalOpen(false); setEditing(null); }}
        editingExtra={editing}
        defaultDate={defaultDate}
        defaultTipo={defaultTipo}
        onSubmit={async (data) => {
          const r = editing ? await updateExtra(editing.id, data) : await addExtra(data);
          return !!r;
        }}
      />

      <AlertDialog open={!!toDelete} onOpenChange={(o) => !o && setToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminar este registo?</AlertDialogTitle>
            <AlertDialogDescription>
              {toDelete && `${toDelete.tipo === 'despesa' ? 'Despesa' : 'Receita extra'} de ${eur(Number(toDelete.valor))} em ${fmtDate(toDelete.data)}. Esta ação não pode ser desfeita.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={async () => { if (toDelete) await deleteExtra(toDelete.id); setToDelete(null); }}
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Movimentos;
