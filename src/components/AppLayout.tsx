import React from 'react';
import { SidebarProvider, SidebarTrigger, SidebarInset } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';
import { useIsMobile } from '@/hooks/use-mobile';
import logoMayslimpo from '@/assets/logo-mayslimpo.jpg';

interface AppLayoutProps {
  children: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const isMobile = useIsMobile();

  return (
    <SidebarProvider defaultOpen={!isMobile}>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <SidebarInset className="flex flex-col flex-1 min-w-0">
          {/* Top bar with sidebar trigger */}
          <header className="sticky top-0 z-40 flex h-12 shrink-0 items-center gap-3 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-4 print:hidden">
            <SidebarTrigger className="-ml-1" />
            {isMobile && (
              <div className="flex items-center gap-2">
                <img 
                  src={logoMayslimpo} 
                  alt="Mayslimpo" 
                  className="w-7 h-7 rounded-full object-cover"
                />
                <span className="font-semibold text-sm truncate">Mayslimpo</span>
              </div>
            )}
          </header>
          
          {/* Main content area */}
          <main className="flex-1 overflow-auto">
            {children}
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}

export default AppLayout;
