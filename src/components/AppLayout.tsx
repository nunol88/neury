import React, { useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { SidebarProvider, SidebarTrigger, SidebarInset } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';
import { useIsMobile } from '@/hooks/use-mobile';
import { useAuth } from '@/hooks/useAuth';
import { useOverduePayments } from '@/hooks/useOverduePayments';
import GlobalSearch from '@/components/GlobalSearch';
import { Button } from '@/components/ui/button';
import { Search } from 'lucide-react';
import logoMayslimpo from '@/assets/logo-mayslimpo.jpg';

interface AppLayoutProps {
  children: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const isMobile = useIsMobile();
  const location = useLocation();
  const navigate = useNavigate();
  const mainRef = useRef<HTMLElement>(null);
  const { role } = useAuth();
  const isAdmin = role === 'admin';
  const { count: overdueCount } = useOverduePayments(7);

  useEffect(() => {
    mainRef.current?.scrollTo(0, 0);
    window.scrollTo(0, 0);
  }, [location.pathname]);

  const triggerSearch = () => {
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', metaKey: true, ctrlKey: true }));
  };

  return (
    <SidebarProvider defaultOpen={!isMobile}>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <SidebarInset className="flex flex-col flex-1 min-w-0">
          <header className="sticky top-0 z-40 flex h-12 shrink-0 items-center gap-3 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-4 print:hidden">
            <SidebarTrigger className="-ml-1" />
            {isMobile && (
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <img
                  src={logoMayslimpo}
                  alt="Mayslimpo"
                  className="w-7 h-7 rounded-full object-cover"
                />
                <span className="font-semibold text-sm truncate">Mayslimpo</span>
              </div>
            )}
            <div className="ml-auto flex items-center gap-2">
              {isAdmin && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={triggerSearch}
                  className="gap-2 h-8 px-2 text-muted-foreground hover:text-foreground"
                  title="Pesquisar (Ctrl/⌘+K)"
                  aria-label="Pesquisar"
                >
                  <Search size={16} />
                  <span className="hidden sm:inline text-xs">Pesquisar</span>
                  <kbd className="hidden md:inline-flex items-center px-1.5 py-0.5 rounded border border-border text-[10px] font-mono text-muted-foreground bg-muted">⌘K</kbd>
                </Button>
              )}
              {isAdmin && overdueCount > 0 && (
                <button
                  type="button"
                  onClick={() => navigate('/admin/pagamentos')}
                  className="inline-flex items-center gap-1.5 px-2.5 h-7 rounded-full bg-destructive text-destructive-foreground text-xs font-semibold shadow-sm hover:opacity-90 transition-opacity"
                  aria-label={`${overdueCount} pagamentos em atraso`}
                  title={`${overdueCount} pagamento(s) em atraso`}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-destructive-foreground/90 animate-pulse" />
                  {overdueCount} em atraso
                </button>
              )}
            </div>
          </header>

          <main ref={mainRef} className="flex-1 overflow-auto">
            {children}
          </main>

          {isAdmin && <GlobalSearch isAdmin={isAdmin} />}
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}

export default AppLayout;
