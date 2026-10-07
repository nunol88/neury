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
import BottomNav from '@/components/navigation/BottomNav';
import ContasTabs from '@/components/navigation/ContasTabs';
import { ADMIN_MAIN, CONTAS_ITEMS, WORKER_MAIN } from '@/config/navigation';

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
    window.dispatchEvent(new CustomEvent('open-global-search'));
  };
  const showContasTabs = isAdmin && CONTAS_ITEMS.some(i => i.url === location.pathname);

  return (
    <SidebarProvider defaultOpen={!isMobile}>
      {/* Global aurora background — theme-aware */}
      <div className="fixed inset-0 -z-10 pointer-events-none overflow-hidden">
        <div className="absolute inset-0" style={{ backgroundImage: 'var(--aurora-base)' }} />
        <div
          className="absolute -top-32 -left-32 w-[42rem] h-[42rem] rounded-full blur-3xl animate-float-bubble-slow"
          style={{ background: 'radial-gradient(circle, var(--aurora-blob-1), transparent 60%)' }}
        />
        <div
          className="absolute top-1/3 -right-40 w-[38rem] h-[38rem] rounded-full blur-3xl animate-float-bubble-slow"
          style={{ background: 'radial-gradient(circle, var(--aurora-blob-2), transparent 60%)', animationDelay: '3s' }}
        />
        <div
          className="absolute -bottom-40 left-1/4 w-[44rem] h-[44rem] rounded-full blur-3xl animate-float-bubble"
          style={{ background: 'radial-gradient(circle, var(--aurora-blob-3), transparent 60%)', animationDelay: '1.5s' }}
        />
        <div
          className="absolute inset-0 opacity-[0.05] mix-blend-overlay"
          style={{
            backgroundImage:
              "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='200' height='200'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9'/></filter><rect width='100%25' height='100%25' filter='url(%23n)' opacity='0.6'/></svg>\")",
          }}
        />
        <div className="absolute inset-x-0 top-0 h-40" style={{ backgroundImage: 'var(--aurora-vignette)' }} />
      </div>

      <div className="min-h-screen flex w-full relative">
        <AppSidebar />
        <SidebarInset className="flex flex-col flex-1 min-w-0 bg-transparent">
          <header className="sticky top-0 z-40 flex h-12 shrink-0 items-center gap-3 border-b border-border/50 bg-background/40 backdrop-blur-xl px-4 print:hidden">
            <SidebarTrigger className="-ml-1" />
            {isMobile && (
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <img
                  src={logoMayslimpo}
                  alt="Mayslimpo"
                  className="w-7 h-7 rounded-full object-cover ring-1 ring-white/20 shadow-glow"
                />
                <span className="font-display font-bold text-sm truncate">Mayslimpo</span>
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
                  <span className="text-xs">Pesquisar</span>
                  <kbd className="hidden md:inline-flex items-center px-1.5 py-0.5 rounded border border-border text-[10px] font-mono text-muted-foreground bg-muted">⌘K</kbd>
                </Button>
              )}
              {isAdmin && overdueCount > 0 && (
                <button
                  type="button"
                  onClick={() => navigate('/admin/pagamentos')}
                  className="inline-flex items-center gap-1.5 px-2.5 h-7 rounded-full bg-destructive text-destructive-foreground text-xs font-semibold shadow-glow hover:opacity-90 transition-opacity"
                  aria-label={`${overdueCount} pagamentos em atraso`}
                  title={`${overdueCount} pagamento(s) em atraso`}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-destructive-foreground/90 animate-pulse" />
                  {overdueCount} em atraso
                </button>
              )}
            </div>
          </header>

          {showContasTabs && <ContasTabs />}
          <main ref={mainRef} className="flex-1 overflow-auto pb-[calc(var(--bottom-nav-offset,0px)+env(safe-area-inset-bottom))]">
            {children}
          </main>

          <BottomNav
            items={isAdmin ? ADMIN_MAIN : WORKER_MAIN}
            badgeFor={(item) => (isAdmin && item.title === 'Contas' ? overdueCount : 0)}
          />

          {isAdmin && <GlobalSearch isAdmin={isAdmin} />}
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}

export default AppLayout;
