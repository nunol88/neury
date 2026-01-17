import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useIsMobile } from '@/hooks/use-mobile';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { 
  LogOut, BarChart3, Users, Menu, Sun, Moon, Euro 
} from 'lucide-react';
import logoMayslimpo from '@/assets/logo-mayslimpo.jpg';

interface ScheduleHeaderProps {
  username: string;
  roleLabel: string;
  isAdmin: boolean;
  theme: string;
  toggleTheme: () => void;
  onSignOut: () => void;
}

const ScheduleHeader: React.FC<ScheduleHeaderProps> = ({
  username,
  roleLabel,
  isAdmin,
  theme,
  toggleTheme,
  onSignOut,
}) => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  return (
    <div className="sticky-header px-4 py-2 print:hidden">
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        <div className="flex items-center gap-3">
          <img 
            src={logoMayslimpo} 
            alt="MaysLimpo Logo" 
            className="w-10 h-10 rounded-full object-cover shadow-sm border border-border"
          />
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span className="capitalize font-medium">{username}</span>
            <span className="px-2 py-0.5 bg-primary/10 text-primary rounded text-xs font-medium">
              {roleLabel}
            </span>
            {!isAdmin && (
              <span className="px-2 py-0.5 bg-yellow-100 text-yellow-700 rounded text-xs">
                Apenas visualização
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={toggleTheme}
            className="p-2"
            title={theme === 'dark' ? 'Mudar para tema claro' : 'Mudar para tema escuro'}
          >
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </Button>
          {isMobile ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <Menu size={20} />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-popover z-50">
                {isAdmin && (
                  <>
                    <DropdownMenuItem onClick={() => navigate('/admin/dashboard')}>
                      <BarChart3 size={16} className="mr-2" />
                      Dashboard
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate('/admin/clientes')}>
                      <Users size={16} className="mr-2" />
                      Clientes
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate('/admin/pagamentos')}>
                      <Euro size={16} className="mr-2" />
                      Pagamentos
                    </DropdownMenuItem>
                  </>
                )}
                <DropdownMenuItem onClick={onSignOut}>
                  <LogOut size={16} className="mr-2" />
                  Sair
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <>
              {isAdmin && (
                <>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => navigate('/admin/dashboard')}
                  >
                    <BarChart3 size={16} className="mr-1" />
                    Dashboard
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => navigate('/admin/clientes')}
                  >
                    <Users size={16} className="mr-1" />
                    Clientes
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => navigate('/admin/pagamentos')}
                  >
                    <Euro size={16} className="mr-1" />
                    Pagamentos
                  </Button>
                </>
              )}
              <Button variant="outline" size="sm" onClick={onSignOut}>
                <LogOut size={16} className="mr-1" />
                Sair
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ScheduleHeader;
