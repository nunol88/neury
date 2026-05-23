import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command';
import { useClients } from '@/hooks/useClients';
import { useAgendamentos } from '@/hooks/useAgendamentos';
import { Calendar, User, Euro, BarChart3, Settings, Receipt } from 'lucide-react';

interface GlobalSearchProps {
  isAdmin: boolean;
}

const GlobalSearch: React.FC<GlobalSearchProps> = ({ isAdmin }) => {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const { clients } = useClients();
  const { allTasks } = useAgendamentos();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setOpen(v => !v);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const tasks = useMemo(() => Object.values(allTasks).flat(), [allTasks]);

  const close = () => setOpen(false);

  const formatDate = (d: string) => {
    const [y, m, day] = d.split('-');
    return `${day}/${m}/${y}`;
  };

  if (!isAdmin) return null;

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Pesquisar clientes, agendamentos, páginas..." />
      <CommandList>
        <CommandEmpty>Sem resultados.</CommandEmpty>

        <CommandGroup heading="Páginas">
          <CommandItem onSelect={() => { close(); navigate('/admin/agendamentos'); }}>
            <Calendar className="mr-2 h-4 w-4" /> Agendamentos
          </CommandItem>
          <CommandItem onSelect={() => { close(); navigate('/admin/dashboard'); }}>
            <BarChart3 className="mr-2 h-4 w-4" /> Dashboard
          </CommandItem>
          <CommandItem onSelect={() => { close(); navigate('/admin/clientes'); }}>
            <User className="mr-2 h-4 w-4" /> Clientes
          </CommandItem>
          <CommandItem onSelect={() => { close(); navigate('/admin/pagamentos'); }}>
            <Euro className="mr-2 h-4 w-4" /> Pagamentos
          </CommandItem>
          <CommandItem onSelect={() => { close(); navigate('/admin/recibos-verdes'); }}>
            <Receipt className="mr-2 h-4 w-4" /> Gestão Fiscal
          </CommandItem>
          <CommandItem onSelect={() => { close(); navigate('/admin/definicoes'); }}>
            <Settings className="mr-2 h-4 w-4" /> Definições
          </CommandItem>
        </CommandGroup>

        {clients.length > 0 && (
          <>
            <CommandSeparator />
            <CommandGroup heading="Clientes">
              {clients.slice(0, 20).map(c => (
                <CommandItem
                  key={c.id}
                  value={`cliente ${c.nome} ${c.telefone || ''}`}
                  onSelect={() => { close(); navigate('/admin/clientes'); }}
                >
                  <User className="mr-2 h-4 w-4 text-primary" />
                  <span>{c.nome}</span>
                  {c.telefone && <span className="ml-2 text-xs text-muted-foreground">{c.telefone}</span>}
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        )}

        {tasks.length > 0 && (
          <>
            <CommandSeparator />
            <CommandGroup heading="Agendamentos">
              {tasks.slice(0, 30).map(t => (
                <CommandItem
                  key={t.id}
                  value={`agendamento ${t.client} ${t.date} ${t.address || ''}`}
                  onSelect={() => { close(); navigate('/admin/agendamentos'); }}
                >
                  <Calendar className="mr-2 h-4 w-4 text-primary" />
                  <span className="flex-1">{t.client}</span>
                  <span className="text-xs text-muted-foreground">{formatDate(t.date)} · {t.startTime}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        )}
      </CommandList>
    </CommandDialog>
  );
};

export default GlobalSearch;
