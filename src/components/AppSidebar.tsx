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
} from 'lucide-react';
import logoMayslimpo from '@/assets/logo-mayslimpo.jpg';
import ClientAvatar from '@/components/ui/client-avatar';

const adminPrimary = [
  { title: 'Agendamentos', url: '/admin/agendamentos', icon: CalendarDays },
  { title: 'Dashboard', url: '/admin/dashboard', icon: BarChart3 },
  { title: 'Clientes', url: '/admin/clientes', icon: Users },
  { title: 'Pagamentos', url: '/admin/pagamentos', icon: Euro },
  { title: 'Gestão Fiscal', url: '/admin/recibos-verdes', icon: Receipt },
];

const adminMore = [
  { title: 'Utilizadores', url: '/admin/utilizadores', icon: UserCog },
  { title: 'Transportes', url: '/admin/transportes', icon: Bus },
  { title: 'Definições', url: '/admin/definicoes', icon: Settings },
  { title: 'Sobre', url: '/admin/sobre', icon: Info },
];

const neurySidebarItems = [
  { title: 'Agendamentos', url: '/neury/agendamentos', icon: CalendarDays },
  { title: 'Transportes', url: '/neury/transportes', icon: Bus },
  { title: 'Sobre', url: '/neury/sobre', icon: Info },
];

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
        >
          <NavLink to={item.url} onClick={handleNavClick} className="flex items-center gap-3">
            <item.icon className="h-4 w-4 flex-shrink-0" />
            <span className="flex-1">{item.title}</span>
            {showOverdueBadge && (
              <span
                className="ml-auto inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold leading-none"
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
      <SidebarHeader className="border-b border-sidebar-border">
        <div className="flex items-center gap-3 px-3 py-3">
          <img
            src={logoMayslimpo}
            alt="Mayslimpo"
            className="w-10 h-10 rounded-full object-cover shadow-sm border border-sidebar-border flex-shrink-0"
          />
          <div className="flex flex-col overflow-hidden">
            <span className="font-semibold text-sidebar-foreground truncate">Mayslimpo</span>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        {isAdmin ? (
          <>
            <SidebarGroup>
              <SidebarGroupLabel>Principal</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>{adminPrimary.map(renderItem)}</SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
            <SidebarGroup>
              <SidebarGroupLabel>Mais</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>{adminMore.map(renderItem)}</SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </>
        ) : (
          <SidebarGroup>
            <SidebarGroupContent>
              <SidebarMenu>{neurySidebarItems.map(renderItem)}</SidebarMenu>
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
