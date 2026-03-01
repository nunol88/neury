import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/hooks/useTheme';
import { NavLink } from '@/components/NavLink';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
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
  UserCog
} from 'lucide-react';
import logoMayslimpo from '@/assets/logo-mayslimpo.jpg';

const navItems = [
  { title: 'Agendamentos', url: '/admin/agendamentos', icon: CalendarDays },
  { title: 'Dashboard', url: '/admin/dashboard', icon: BarChart3 },
  { title: 'Clientes', url: '/admin/clientes', icon: Users },
  { title: 'Pagamentos', url: '/admin/pagamentos', icon: Euro },
  { title: 'Gestão Fiscal', url: '/admin/recibos-verdes', icon: Receipt },
  { title: 'Utilizadores', url: '/admin/utilizadores', icon: UserCog },
  { title: 'Sobre', url: '/admin/sobre', icon: Info },
];

const neurySidebarItems = [
  { title: 'Agendamentos', url: '/neury/agendamentos', icon: CalendarDays },
  { title: 'Sobre', url: '/neury/sobre', icon: Info },
];

export function AppSidebar() {
  const { user, role, signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const { isMobile, setOpenMobile } = useSidebar();
  const isAdmin = role === 'admin';
  const items = isAdmin ? navItems : neurySidebarItems;
  const username = user?.user_metadata?.name || user?.email?.replace('@local.app', '') || '';
  const roleLabel = isAdmin ? 'Administrador' : 'Funcionário/a';

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const handleNavClick = () => {
    // Close mobile sidebar after navigation
    if (isMobile) {
      setOpenMobile(false);
    }
  };

  return (
    <Sidebar collapsible="offcanvas" className="border-r border-sidebar-border">
      {/* Header with Logo */}
      <SidebarHeader className="border-b border-sidebar-border">
        <div className="flex items-center gap-3 px-3 py-3">
          <img 
            src={logoMayslimpo} 
            alt="Mayslimpo" 
            className="w-10 h-10 rounded-full object-cover shadow-sm border border-sidebar-border flex-shrink-0"
          />
          <div className="flex flex-col overflow-hidden">
            <span className="font-semibold text-sidebar-foreground truncate">
              Mayslimpo
            </span>
          </div>
        </div>
      </SidebarHeader>

      {/* Navigation Links */}
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => {
                const isActive = location.pathname === item.url;
                
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton 
                      asChild 
                      isActive={isActive}
                      tooltip={item.title}
                    >
                      <NavLink 
                        to={item.url} 
                        onClick={handleNavClick}
                        className="flex items-center gap-3"
                      >
                        <item.icon className="h-4 w-4 flex-shrink-0" />
                        <span>{item.title}</span>
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      {/* Footer with User Info & Actions */}
      <SidebarFooter className="border-t border-sidebar-border">
        {/* User info */}
        <div className="px-3 py-3">
          <div className="flex items-center gap-2 text-sm">
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
        
        {/* Action buttons - icon only */}
        <div className="flex flex-row gap-1 p-3 justify-center">
          <TooltipProvider delayDuration={200}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon"
                  onClick={toggleTheme}
                  className="h-9 w-9"
                >
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
