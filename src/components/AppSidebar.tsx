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
import { 
  CalendarDays, 
  BarChart3, 
  Users, 
  Euro, 
  LogOut, 
  Sun, 
  Moon,
  PanelLeft
} from 'lucide-react';
import logoMayslimpo from '@/assets/logo-mayslimpo.jpg';

const navItems = [
  { title: 'Agendamentos', url: '/admin/agendamentos', icon: CalendarDays },
  { title: 'Dashboard', url: '/admin/dashboard', icon: BarChart3 },
  { title: 'Clientes', url: '/admin/clientes', icon: Users },
  { title: 'Pagamentos', url: '/admin/pagamentos', icon: Euro },
];

const neurySidebarItems = [
  { title: 'Agendamentos', url: '/neury/agendamentos', icon: CalendarDays },
];

export function AppSidebar() {
  const { user, role, signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const { state, isMobile, setOpenMobile } = useSidebar();
  
  const isCollapsed = state === 'collapsed';
  const isAdmin = role === 'admin';
  const items = isAdmin ? navItems : neurySidebarItems;
  const username = user?.user_metadata?.name || user?.email?.replace('@local.app', '') || '';
  const roleLabel = isAdmin ? 'Administrador' : 'Neury';

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
    <Sidebar collapsible="icon">
      {/* Header with Logo */}
      <SidebarHeader className="border-b border-sidebar-border">
        <div className="flex items-center gap-3 px-2 py-2">
          <img 
            src={logoMayslimpo} 
            alt="MaysLimpo" 
            className="w-9 h-9 rounded-full object-cover shadow-sm border border-sidebar-border flex-shrink-0"
          />
          {!isCollapsed && (
            <div className="flex flex-col overflow-hidden">
              <span className="font-semibold text-sm text-sidebar-foreground truncate">
                MaysLimpo
              </span>
              <span className="text-xs text-sidebar-foreground/60 truncate">
                Gestão de Limpezas
              </span>
            </div>
          )}
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
        {!isCollapsed && (
          <div className="px-2 py-2">
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
        )}
        
        <SidebarSeparator />
        
        {/* Action buttons */}
        <div className={`flex ${isCollapsed ? 'flex-col' : 'flex-row'} gap-2 p-2`}>
          <Button 
            variant="ghost" 
            size={isCollapsed ? 'icon' : 'sm'}
            onClick={toggleTheme}
            className={isCollapsed ? 'w-full justify-center' : 'flex-1'}
            title={theme === 'dark' ? 'Tema claro' : 'Tema escuro'}
          >
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            {!isCollapsed && <span className="ml-2">Tema</span>}
          </Button>
          
          <Button 
            variant="ghost" 
            size={isCollapsed ? 'icon' : 'sm'}
            onClick={handleSignOut}
            className={`${isCollapsed ? 'w-full justify-center' : 'flex-1'} text-destructive hover:text-destructive`}
            title="Sair"
          >
            <LogOut size={18} />
            {!isCollapsed && <span className="ml-2">Sair</span>}
          </Button>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}

export default AppSidebar;
