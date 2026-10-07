import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useTheme } from '@/hooks/useTheme';
import { useOverduePayments } from '@/hooks/useOverduePayments';
import { NavLink } from '@/components/NavLink';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
  useSidebar,
} from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import {
  CalendarDays,
  BarChart3,
  Users,
  Euro,
  LogOut,
  Sun,
  Moon,
  Receipt,
  Info,
  UserCog,
  Bus,
  Settings,
  MessageSquare,
} from 'lucide-react';
import logoMayslimpo from '@/assets/logo-mayslimpo.jpg';
import ClientAvatar from '@/components/ui/client-avatar';

import { ADMIN_MAIN, CONTAS_ITEMS, ADMIN_MAIS_ITEMS, WORKER_MAIN, APP_VERSION_LABEL } from '@/config/sidebarItems';

export function AppSidebar() {
  const { user, role, signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const { isMobile, setOpenMobile } = useSidebar();
  const isAdmin = role === 'admin';
  const { count: overdueCount } = useOverduePayments(7);
  const username = user?.user_metadata?.name || user?.email?.replace('@local.app', '') || '';
  const roleLabel = isAdmin ? 'Administrador' : 'Funcionário/a';

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const handleNavClick = () => {
    if (isMobile) setOpenMobile(false);
  };

  const renderItem = (item: { title: string; url: string; icon: any }) => {
    const isActive = location.pathname === item.url;
    const showOverdueBadge =
      isAdmin && overdueCount > 0 && item.url === '/admin/pagamentos';

    return (
      <SidebarMenuItem key={item.title}>
        <SidebarMenuButton
          asChild
          isActive={isActive}
          tooltip={showOverdueBadge ? `${item.title} — ${overdueCount} em atraso` : item.title}
          className={isActive ? 'nav-pill-active font-semibold' : 'transition-colors'}
        >
          <NavLink to={item.url} onClick={handleNavClick} className="flex items-center gap-3">
            <item.icon className="h-4 w-4 flex-shrink-0" />
            <span className="flex-1">{item.title}</span>
            {showOverdueBadge && (
              <span
                className="ml-auto inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold leading-none shadow-glow"
                aria-label={`${overdueCount} pagamentos em atraso`}
              >
                {overdueCount > 99 ? '99+' : overdueCount}
              </span>
            )}
          </NavLink>
        </SidebarMenuButton>
      </SidebarMenuItem>
    );
  };

  return (
    <Sidebar collapsible="offcanvas" className="border-r border-sidebar-border">
      <SidebarHeader className="border-b border-sidebar-border relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-hero opacity-80 pointer-events-none" />
        <div className="relative flex items-center gap-3 px-3 py-3">
          <img
            src={logoMayslimpo}
            alt="Mayslimpo"
            className="w-10 h-10 rounded-xl object-cover border border-sidebar-border flex-shrink-0 shadow-glow"
          />
          <div className="flex flex-col overflow-hidden">
            <span className="font-display font-bold text-sidebar-foreground truncate tracking-tight">Mayslimpo</span>
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground">{roleLabel}</span>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        {isAdmin ? (
          <>
            <SidebarGroup>
              <SidebarGroupContent>
                <SidebarMenu>{ADMIN_MAIN.slice(0, 2).map(renderItem)}</SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
            <SidebarGroup>
              <SidebarGroupLabel>Contas</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>{CONTAS_ITEMS.map(renderItem)}</SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
            <SidebarGroup>
              <SidebarGroupLabel>Mais</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>{ADMIN_MAIS_ITEMS.map(renderItem)}</SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </>
        ) : (
          <SidebarGroup>
            <SidebarGroupContent>
              <SidebarMenu>{WORKER_MAIN.map(renderItem)}</SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border">
        <div className="px-3 py-3">
          <div className="flex items-center gap-2 text-sm">
            {user?.user_metadata?.avatar_url || user?.user_metadata?.picture ? (
              <img
                src={user.user_metadata.avatar_url || user.user_metadata.picture}
                alt={username}
                className="w-6 h-6 rounded-full object-cover ring-2 ring-background shadow-sm shrink-0"
                referrerPolicy="no-referrer"
                onError={(e) => { e.currentTarget.style.display = 'none'; e.currentTarget.nextElementSibling?.classList.remove('hidden'); }}
              />
            ) : null}
            <ClientAvatar name={username || 'U'} size="sm" className={user?.user_metadata?.avatar_url || user?.user_metadata?.picture ? 'hidden' : ''} />
            <span className="capitalize font-medium text-sidebar-foreground truncate">
              {username}
            </span>
            <span className="px-2 py-0.5 bg-primary/10 text-primary rounded text-xs font-medium flex-shrink-0">
              {roleLabel}
            </span>
          </div>
          {!isAdmin && (
            <span className="text-xs text-yellow-600 dark:text-yellow-400">
              Apenas visualização
            </span>
          )}
        </div>

        <SidebarSeparator />
        <p className="px-3 pt-2 text-[10px] text-muted-foreground text-center">{APP_VERSION_LABEL}</p>
        <div className="flex flex-row gap-1 p-3 justify-center">
          <TooltipProvider delayDuration={200}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" onClick={toggleTheme} className="h-9 w-9">
                  {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
                </Button>
              </TooltipTrigger>
              <TooltipContent side="top">
                {theme === 'dark' ? 'Tema claro' : 'Tema escuro'}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider delayDuration={200}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleSignOut}
                  className="h-9 w-9 text-destructive hover:text-destructive"
                >
                  <LogOut size={18} />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="top">Sair</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}

export default AppSidebar;
