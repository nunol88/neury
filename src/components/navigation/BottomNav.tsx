import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { isNavActive, type NavItem } from '@/config/navigation';

interface BottomNavProps {
  items: NavItem[];
  badgeFor?: (item: NavItem) => number;
}

/** Fixed mobile bottom navigation (hidden from md up). */
const BottomNav: React.FC<BottomNavProps> = ({ items, badgeFor }) => {
  const { pathname } = useLocation();
  return (
    <nav
      aria-label="Navegação principal"
      data-floating-obstacle
      className="md:hidden fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 backdrop-blur-xl print:hidden"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <ul className="grid h-16" style={{ gridTemplateColumns: `repeat(${items.length}, minmax(0, 1fr))` }}>
        {items.map(item => {
          const active = isNavActive(item, pathname);
          const badge = badgeFor?.(item) ?? 0;
          return (
            <li key={item.url}>
              <NavLink
                to={item.url}
                aria-current={active ? 'page' : undefined}
                className={`relative flex h-full min-h-[44px] flex-col items-center justify-center gap-0.5 text-[11px] font-medium transition-colors ${
                  active ? 'text-primary' : 'text-muted-foreground'
                }`}
              >
                <span className={`flex h-7 w-12 items-center justify-center rounded-full ${active ? 'bg-primary/15' : ''}`}>
                  <item.icon size={20} />
                </span>
                {item.title}
                {badge > 0 && (
                  <span className="absolute top-1.5 right-[calc(50%-1.5rem)] min-w-[18px] h-[18px] px-1 rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold flex items-center justify-center">
                    {badge > 99 ? '99+' : badge}
                  </span>
                )}
              </NavLink>
            </li>
          );
        })}
      </ul>
    </nav>
  );
};

export default BottomNav;
