import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Calendar, LogOut, User } from 'lucide-react';

interface AppHeaderProps {
  title: string;
  subtitle?: string;
}

const AppHeader: React.FC<AppHeaderProps> = ({ title, subtitle }) => {
  const { user, role, signOut } = useAuth();

  const handleSignOut = async () => {
    await signOut();
  };

  const roleLabel = role === 'admin' ? 'Administrador' : 'Neury';
  
  // Extract username from email (remove @local.app)
  const username = user?.email?.replace('@local.app', '') || '';
  const displayName = user?.user_metadata?.name || username;

  return (
    <header className="bg-card border-b sticky top-0 z-10">
      <div className="max-w-7xl mx-auto px-4 py-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
              <Calendar className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">{title}</h1>
              {subtitle && (
                <p className="text-sm text-muted-foreground">{subtitle}</p>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 text-sm text-muted-foreground">
              <User className="h-4 w-4" />
              <span className="capitalize">{displayName}</span>
              <span className="px-2 py-0.5 bg-primary/10 text-primary rounded-md text-xs font-medium">
                {roleLabel}
              </span>
            </div>
            <Button variant="outline" size="sm" onClick={handleSignOut}>
              <LogOut className="h-4 w-4 mr-2" />
              Sair
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default AppHeader;
