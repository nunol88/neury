import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/hooks/useTheme';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, AlertCircle, Sun, Moon } from 'lucide-react';
import { toast } from 'sonner';
import logoMayslimpo from '@/assets/logo-mayslimpo.jpg';
import { ExportSiteButton } from '@/components/ExportSiteButton';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const { theme, toggleTheme } = useTheme();
  
  const { signIn, user, role, loading } = useAuth();
  const navigate = useNavigate();

  // Redirect if already logged in
  useEffect(() => {
    if (!loading && user && role) {
      if (role === 'admin') {
        navigate('/admin/agendamentos', { replace: true });
      } else if (role === 'neury') {
        navigate('/neury/agendamentos', { replace: true });
      }
    }
  }, [user, role, loading, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      // Convert username to email format for Supabase auth
      const email = `${username.toLowerCase().trim()}@local.app`;
      const { error } = await signIn(email, password);
      
      if (error) {
        if (error.message.includes('Invalid login credentials')) {
          setError('Utilizador ou palavra-passe incorretos.');
        } else {
          setError('Erro ao iniciar sessão. Tente novamente.');
        }
        return;
      }
      
      toast.success('Sessão iniciada com sucesso!');
    } catch (err) {
      setError('Erro inesperado. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  if (loading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${theme === 'dark' ? 'bg-background' : 'bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800'}`}>
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const bgClass = theme === 'dark' 
    ? 'bg-background' 
    : 'bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800';

  return (
    <div className={`min-h-screen flex items-center justify-center p-4 relative overflow-hidden ${bgClass}`}>
      {/* Export and Theme buttons */}
      <div className="absolute top-4 right-4 flex items-center gap-2 z-10">
        <ExportSiteButton />
        <button
          onClick={toggleTheme}
          className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
          title={theme === 'dark' ? 'Mudar para tema claro' : 'Mudar para tema escuro'}
        >
          {theme === 'dark' ? <Sun size={20} className="text-foreground" /> : <Moon size={20} className="text-white" />}
        </button>
      </div>

      {/* Animated background orbs - only show in light mode */}
      {theme !== 'dark' && (
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-500/30 rounded-full blur-3xl animate-pulse" />
          <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-cyan-400/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
        </div>
      )}

      {/* Glass card */}
      <div className="relative w-full max-w-md animate-fade-in">
        <div className={`absolute inset-0 backdrop-blur-xl rounded-3xl ${theme === 'dark' ? 'bg-card' : 'bg-white/10'}`} />
        <div className={`absolute inset-0 rounded-3xl ${theme === 'dark' ? 'bg-gradient-to-br from-card via-card to-card' : 'bg-gradient-to-br from-white/20 via-white/5 to-transparent'}`} />
        <div className={`absolute inset-[1px] rounded-3xl border ${theme === 'dark' ? 'border-border' : 'border-white/20'}`} />
        
        <div className="relative p-8 space-y-6">
          {/* Logo */}
          <div className="flex flex-col items-center space-y-4">
            <div className={`w-24 h-24 rounded-full overflow-hidden ring-4 shadow-2xl ${theme === 'dark' ? 'ring-primary/30 shadow-black/40' : 'ring-white/30 shadow-black/20'}`}>
              <img src={logoMayslimpo} alt="MaysLimpo Logo" className="w-full h-full object-cover" />
            </div>
            <div className="text-center">
              <h1 className={`text-2xl font-bold tracking-tight ${theme === 'dark' ? 'text-foreground' : 'text-white'}`}>Agenda Neury</h1>
              <p className={`mt-1 text-sm ${theme === 'dark' ? 'text-muted-foreground' : 'text-white/60'}`}>
                Introduza as suas credenciais para aceder
              </p>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="bg-destructive/20 backdrop-blur-sm border border-destructive/30 text-destructive rounded-xl p-3 flex items-start gap-2 animate-fade-in">
                <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
                <span className="text-sm">{error}</span>
              </div>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="username" className={`text-sm font-medium ${theme === 'dark' ? 'text-foreground' : 'text-white/80'}`}>Utilizador</Label>
              <Input
                id="username"
                type="text"
                placeholder="O seu nome de utilizador"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                disabled={isLoading}
                className={`h-12 rounded-xl backdrop-blur-sm ${
                  theme === 'dark' 
                    ? 'bg-input border-border text-foreground placeholder:text-muted-foreground' 
                    : 'bg-white/10 border-white/20 text-white placeholder:text-white/40 focus:border-white/40 focus:ring-white/20'
                }`}
                autoComplete="username"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password" className={`text-sm font-medium ${theme === 'dark' ? 'text-foreground' : 'text-white/80'}`}>Palavra-passe</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={isLoading}
                className={`h-12 rounded-xl backdrop-blur-sm ${
                  theme === 'dark' 
                    ? 'bg-input border-border text-foreground placeholder:text-muted-foreground' 
                    : 'bg-white/10 border-white/20 text-white placeholder:text-white/40 focus:border-white/40 focus:ring-white/20'
                }`}
                autoComplete="current-password"
              />
            </div>
            
            <Button 
              type="submit" 
              className={`w-full h-12 font-semibold rounded-xl transition-all duration-300 ${
                theme === 'dark'
                  ? 'bg-primary hover:bg-primary/90 text-primary-foreground'
                  : 'bg-white/20 hover:bg-white/30 text-white border border-white/30 backdrop-blur-sm hover:shadow-lg hover:shadow-white/10'
              }`}
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  A entrar...
                </>
              ) : (
                'Entrar'
              )}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;
