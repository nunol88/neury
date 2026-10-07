import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { CONTAS_ITEMS } from '@/config/navigation';

/** Small tab bar shared by the four "Contas" pages. */
const ContasTabs: React.FC = () => {
  const { pathname } = useLocation();
  return (
    <nav aria-label="Contas" className="border-b border-border/60 bg-background/60 backdrop-blur print:hidden">
      <div className="max-w-7xl mx-auto px-3 flex gap-1 overflow-x-auto">
        {CONTAS_ITEMS.map(item => {
          const active = pathname === item.url;
          return (
            <NavLink
              key={item.url}
              to={item.url}
              aria-current={active ? 'page' : undefined}
              className={`inline-flex items-center gap-1.5 whitespace-nowrap px-3 min-h-[44px] text-sm font-medium border-b-2 transition-colors ${
                active ? 'border-primary text-foreground' : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              <item.icon size={16} /> {item.title}
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
};

export default ContasTabs;
