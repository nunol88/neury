import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, Search } from 'lucide-react';
import { ADMIN_MAIS_ITEMS, CONTAS_ITEMS } from '@/config/navigation';
import { APP_VERSION } from '@/utils/appVersion';
import { Button } from '@/components/ui/button';

const Section: React.FC<{ title: string; items: typeof ADMIN_MAIS_ITEMS }> = ({ title, items }) => (
  <section className="space-y-2">
    <h2 className="px-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">{title}</h2>
    <div className="grid gap-2 sm:grid-cols-2">
      {items.map(item => (
        <Link
          key={item.url}
          to={item.url}
          className="flex items-center gap-3 rounded-2xl border border-border bg-card p-4 min-h-[64px] hover:bg-accent transition-colors"
        >
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <item.icon size={20} />
          </span>
          <span className="flex-1 min-w-0">
            <span className="block font-semibold text-foreground">{item.title}</span>
            {item.description && <span className="block text-sm text-muted-foreground truncate">{item.description}</span>}
          </span>
          <ChevronRight size={18} className="text-muted-foreground" />
        </Link>
      ))}
    </div>
  </section>
);

const Mais: React.FC = () => (
  <div className="max-w-3xl mx-auto px-4 py-5 space-y-6">
    <header className="flex items-start justify-between gap-3">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Mais</h1>
        <p className="text-sm text-muted-foreground">Ferramentas, equipa e definições</p>
      </div>
      <Button variant="outline" className="min-h-[44px]" onClick={() => window.dispatchEvent(new CustomEvent('open-global-search'))}>
        <Search size={16} className="mr-1.5" /> Pesquisar
      </Button>
    </header>
    <Section title="Equipa e ferramentas" items={ADMIN_MAIS_ITEMS} />
    <Section title="Contas" items={CONTAS_ITEMS} />
    <p className="text-center text-xs text-muted-foreground">Agenda Digital · Versão {APP_VERSION}</p>
  </div>
);

export default Mais;
