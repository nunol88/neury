import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import {
  Command, CommandGroup, CommandInput, CommandItem, CommandList,
} from '@/components/ui/command';
import { useClients } from '@/hooks/useClients';
import { useAgendamentos } from '@/hooks/useAgendamentos';
import { useExtras } from '@/hooks/useExtras';
import { generateMonthsConfig, getMonthKeyFromDate } from '@/utils/monthConfig';
import { ADMIN_MAIN, ADMIN_MAIS_ITEMS, CONTAS_ITEMS } from '@/config/navigation';
import { Calendar, User, Euro, Minus, Plus, FileText } from 'lucide-react';

interface GlobalSearchProps {
  isAdmin: boolean;
}

const MONTHS = generateMonthsConfig();
const LIMIT = 8;

const normalize = (v: string) => v.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
const fmtDate = (d: string) => {
  const [y, m, day] = d.split('-');
  return `${day}/${m}/${y}`;
};

const PAGES = [
  ...ADMIN_MAIN.map(i => ({ title: i.title, url: i.url })),
  ...CONTAS_ITEMS.map(i => ({ title: `Contas · ${i.title}`, url: i.url })),
  ...ADMIN_MAIS_ITEMS.map(i => ({ title: i.title, url: i.url })),
];
const ACTIONS = [
  { title: 'Registar receita extra', url: '/admin/movimentos?novo=receita', icon: Plus },
  { title: 'Registar despesa', url: '/admin/movimentos?novo=despesa', icon: Minus },
  { title: 'Agenda do mês (fixos, quinzenais, copiar, exportar)', url: '/admin/agendamentos?vista=mes', icon: Calendar },
];

/** Admin-only command palette. Filters the full authorised collections, then limits results. */
const GlobalSearch: React.FC<GlobalSearchProps> = ({ isAdmin }) => {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const navigate = useNavigate();
  const { clients } = useClients();
  const { allTasks } = useAgendamentos();
  const { extras } = useExtras();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setOpen(v => !v);
      }
    };
    const onOpen = () => setOpen(true);
    window.addEventListener('keydown', onKey);
    window.addEventListener('open-global-search', onOpen);
    return () => {
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('open-global-search', onOpen);
    };
  }, []);

  useEffect(() => { if (!open) setQuery(''); }, [open]);

  const tasks = useMemo(() => Object.values(allTasks).flat(), [allTasks]);
  const q = normalize(query.trim());

  const results = useMemo(() => {
    const match = (...parts: (string | null | undefined)[]) => !q || normalize(parts.filter(Boolean).join(' ')).includes(q);
    const pages = PAGES.filter(p => match(p.title));
    const actions = ACTIONS.filter(a => match(a.title));
    if (!q) return { pages, actions, clients: [], tasks: [], extras: [] };
    const c = clients.filter(cl => match(cl.nome, cl.telefone, cl.morada));
    const t = tasks
      .filter(tk => match(tk.client, tk.address, tk.date, fmtDate(tk.date), tk.notes))
      .sort((a, b) => b.date.localeCompare(a.date));
    const x = extras
      .filter(e => match(e.observacoes, e.data, fmtDate(e.data), Number(e.valor).toFixed(2), e.tipo === 'despesa' ? 'despesa' : 'receita extra'))
      .sort((a, b) => b.data.localeCompare(a.data));
    return { pages, actions, clients: c, tasks: t, extras: x };
  }, [q, clients, tasks, extras]);

  if (!isAdmin) return null;

  const go = (url: string) => { setOpen(false); navigate(url); };
  const taskUrl = (id: string, date: string) =>
    getMonthKeyFromDate(date, MONTHS)
      ? `/admin/agendamentos?data=${date}&destaque=${encodeURIComponent(id)}`
      : '/admin/agendamentos?vista=mes';
  const total = results.pages.length + results.actions.length + results.clients.length + results.tasks.length + results.extras.length;
  const more = (n: number) => (n > LIMIT ? ` (${LIMIT} de ${n})` : '');

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="overflow-hidden p-0 shadow-lg">
        <DialogTitle className="sr-only">Pesquisar</DialogTitle>
        <Command shouldFilter={false} className="[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:text-muted-foreground [&_[cmdk-input]]:h-12 [&_[cmdk-item]]:py-3">
          <CommandInput value={query} onValueChange={setQuery} placeholder="Pesquisar clientes, serviços, extras, páginas…" />
          <CommandList className="max-h-[60vh]">
            {total === 0 && <p className="py-6 text-center text-sm text-muted-foreground">Sem resultados para “{query}”.</p>}

            {results.clients.length > 0 && (
              <CommandGroup heading={`Clientes${more(results.clients.length)}`}>
                {results.clients.slice(0, LIMIT).map(c => (
                  <CommandItem key={c.id} value={`c-${c.id}`} onSelect={() => go(`/admin/clientes?cliente=${encodeURIComponent(c.id)}`)}>
                    <User className="mr-2 h-4 w-4" />
                    <span className="flex-1 truncate">{c.nome}</span>
                    {c.telefone && <span className="text-xs text-muted-foreground">{c.telefone}</span>}
                  </CommandItem>
                ))}
              </CommandGroup>
            )}

            {results.tasks.length > 0 && (
              <CommandGroup heading={`Serviços${more(results.tasks.length)}`}>
                {results.tasks.slice(0, LIMIT).map(t => (
                  <CommandItem key={t.id} value={`t-${t.id}`} onSelect={() => go(taskUrl(t.id, t.date))}>
                    <Calendar className="mr-2 h-4 w-4" />
                    <span className="flex-1 truncate">{t.client}</span>
                    <span className="text-xs text-muted-foreground">{fmtDate(t.date)} · {t.startTime}</span>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}

            {results.extras.length > 0 && (
              <CommandGroup heading={`Receitas e despesas${more(results.extras.length)}`}>
                {results.extras.slice(0, LIMIT).map(e => (
                  <CommandItem key={e.id} value={`x-${e.id}`} onSelect={() => go(`/admin/movimentos?mes=${e.mes_key}&id=${encodeURIComponent(e.id)}`)}>
                    <Euro className="mr-2 h-4 w-4" />
                    <span className="flex-1 truncate">{e.observacoes || (e.tipo === 'despesa' ? 'Despesa' : 'Receita extra')}</span>
                    <span className={`text-xs ${e.tipo === 'despesa' ? 'text-destructive' : 'text-success'}`}>
                      {e.tipo === 'despesa' ? '−' : '+'}€{Number(e.valor).toFixed(2)} · {fmtDate(e.data)}
                    </span>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}

            {results.actions.length > 0 && (
              <CommandGroup heading="Ações">
                {results.actions.map(a => (
                  <CommandItem key={a.url} value={a.url} onSelect={() => go(a.url)}>
                    <a.icon className="mr-2 h-4 w-4" /> {a.title}
                  </CommandItem>
                ))}
              </CommandGroup>
            )}

            {results.pages.length > 0 && (
              <CommandGroup heading="Páginas">
                {results.pages.map(p => (
                  <CommandItem key={p.url + p.title} value={p.url + p.title} onSelect={() => go(p.url)}>
                    <FileText className="mr-2 h-4 w-4" /> {p.title}
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </DialogContent>
    </Dialog>
  );
};

export default GlobalSearch;
