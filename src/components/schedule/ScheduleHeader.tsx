import React, { useState } from 'react';
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { 
  LogOut, User, BarChart3, Users, Menu, Sun, Moon, Settings2, Euro 
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
  const [copied, setCopied] = useState<string | null>(null);

  const edgeFunctionUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-assistant`;
  const apiKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopied(label);
    setTimeout(() => setCopied(null), 2000);
  };

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
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button
                        variant="ghost" 
                        size="icon"
                        className="h-8 w-8 opacity-40 hover:opacity-100 transition-opacity"
                        title="Configuração da Edge Function"
                      >
                        <Settings2 size={16} />
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-lg">
                      <DialogHeader>
                        <DialogTitle>Configuração da Edge Function</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4 mt-4">
                        <div>
                          <label className="text-sm font-medium text-muted-foreground">URL da Edge Function</label>
                          <div className="flex items-center gap-2 mt-1">
                            <code className="flex-1 p-2 bg-muted rounded text-xs break-all">
                              {edgeFunctionUrl}
                            </code>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => copyToClipboard(edgeFunctionUrl, 'url')}
                            >
                              {copied === 'url' ? 'Copiado!' : 'Copiar'}
                            </Button>
                          </div>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-muted-foreground">API Key (Anon)</label>
                          <div className="flex items-center gap-2 mt-1">
                            <code className="flex-1 p-2 bg-muted rounded text-xs break-all">
                              {apiKey}
                            </code>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => copyToClipboard(apiKey, 'key')}
                            >
                              {copied === 'key' ? 'Copiado!' : 'Copiar'}
                            </Button>
                          </div>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
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
