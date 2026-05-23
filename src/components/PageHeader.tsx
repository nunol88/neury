import React from 'react';
import { cn } from '@/lib/utils';

interface PageHeaderProps {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  icon?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
  children?: React.ReactNode;
}

/**
 * v3 unified page header. Glass + subtle gradient halo + accent top line.
 * Use at the top of every page for a consistent rhythm across the app.
 */
export function PageHeader({ title, subtitle, icon, actions, className, children }: PageHeaderProps) {
  return (
    <header className={cn('page-header-v3 animate-fade-in', className)}>
      <div className="relative z-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3 min-w-0">
          {icon && (
            <div className="shrink-0 w-11 h-11 rounded-xl bg-gradient-primary text-primary-foreground flex items-center justify-center shadow-glow">
              {icon}
            </div>
          )}
          <div className="min-w-0">
            <h1 className="page-title text-foreground truncate">{title}</h1>
            {subtitle && (
              <p className="mt-1 text-sm text-muted-foreground line-clamp-2">{subtitle}</p>
            )}
          </div>
        </div>
        {actions && <div className="flex items-center gap-2 flex-wrap">{actions}</div>}
      </div>
      {children && <div className="relative z-10 mt-4">{children}</div>}
    </header>
  );
}

export default PageHeader;
