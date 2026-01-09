import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/hooks/useTheme';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2, AlertCircle, Sun, Moon, Eye, EyeOff, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import logoMayslimpo from '@/assets/logo-mayslimpo.jpg';

const REMEMBER_USER_KEY = 'agenda_neury_remembered_user';

const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return { text: 'Bom dia', icon: 'morning' };
  if (hour >= 12 && hour < 19) return { text: 'Boa tarde', icon: 'afternoon' };
  return { text: 'Boa noite', icon: 'night' };
};

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [capsLockOn, setCapsLockOn] = useState(false);
  const [shake, setShake] = useState(false);
  const [rememberUser, setRememberUser] = useState(false);
  const { theme, toggleTheme } = useTheme();
  
  const { signIn, user, role, loading } = useAuth();
  const navigate = useNavigate();
  const greeting = getGreeting();

  // Load remembered user on mount
  useEffect(() => {
    const remembered = localStorage.getItem(REMEMBER_USER_KEY);
    if (remembered) {
      setUsername(remembered);
      setRememberUser(true);
    }
  }, []);

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

  const handleKeyDown = (e: React.KeyboardEvent) => {
    setCapsLockOn(e.getModifierState('CapsLock'));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      // Convert username to email format for Supabase auth
      const email = `${username.toLowerCase().trim()}@local.app`;
      const { error } = await signIn(email, password);
      
      if (error) {
        setShake(true);
        setTimeout(() => setShake(false), 500);
        
        if (error.message.includes('Invalid login credentials')) {
          setError('Utilizador ou palavra-passe incorretos.');
        } else {
          setError('Erro ao iniciar sessão. Tente novamente.');
        }
        return;
      }
      
      // Save or remove remembered user based on checkbox
      if (rememberUser) {
        localStorage.setItem(REMEMBER_USER_KEY, username.trim());
      } else {
        localStorage.removeItem(REMEMBER_USER_KEY);
      }
      
      toast.success('Sessão iniciada com sucesso!');
    } catch (err) {
      setShake(true);
      setTimeout(() => setShake(false), 500);
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
      {/* Theme toggle button */}
      <button
        onClick={toggleTheme}
        className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors z-10"
        title={theme === 'dark' ? 'Mudar para tema claro' : 'Mudar para tema escuro'}
      >
        {theme === 'dark' ? <Sun size={20} className="text-foreground" /> : <Moon size={20} className="text-white" />}
      </button>

      {/* Animated background orbs - only show in light mode */}
      {theme !== 'dark' && (
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-500/30 rounded-full blur-3xl animate-pulse" />
          <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-cyan-400/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
        </div>
      )}

      {/* Glass card */}
      <div className={`relative w-full max-w-md ${shake ? 'animate-shake' : ''}`}>
        <div className={`absolute inset-0 backdrop-blur-xl rounded-3xl ${theme === 'dark' ? 'bg-card' : 'bg-white/10'}`} />
        <div className={`absolute inset-0 rounded-3xl ${theme === 'dark' ? 'bg-gradient-to-br from-card via-card to-card' : 'bg-gradient-to-br from-white/20 via-white/5 to-transparent'}`} />
        <div className={`absolute inset-[1px] rounded-3xl border ${theme === 'dark' ? 'border-border' : 'border-white/20'}`} />
        
        <div className="relative p-8 space-y-6">
          {/* Logo */}
          <div className="flex flex-col items-center space-y-4">
            <div className={`w-24 h-24 rounded-full overflow-hidden ring-4 shadow-2xl animate-fade-in ${theme === 'dark' ? 'ring-primary/30 shadow-black/40' : 'ring-white/30 shadow-black/20'}`}>
              <img src={logoMayslimpo} alt="MaysLimpo Logo" className="w-full h-full object-cover" />
            </div>
            <div className="text-center">
              <h1 className={`text-2xl font-bold tracking-tight animate-fade-in animation-delay-100 ${theme === 'dark' ? 'text-foreground' : 'text-white'}`}>
                Agenda Neury
              </h1>
              <div className={`mt-2 flex items-center justify-center gap-2 animate-fade-in animation-delay-200 ${theme === 'dark' ? 'text-muted-foreground' : 'text-white/70'}`}>
                {greeting.icon === 'night' ? (
                  <Moon size={16} className="text-amber-300" />
                ) : (
                  <Sun size={16} className="text-amber-400" />
                )}
                <span className="text-sm font-medium">{greeting.text}! Bem-vindo de volta.</span>
              </div>
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
            
            <div className="space-y-2 animate-fade-in animation-delay-300">
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
            
            <div className="space-y-2 animate-fade-in animation-delay-400">
              <Label htmlFor="password" className={`text-sm font-medium ${theme === 'dark' ? 'text-foreground' : 'text-white/80'}`}>Palavra-passe</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyDown={handleKeyDown}
                  onKeyUp={handleKeyDown}
                  required
                  disabled={isLoading}
                  className={`h-12 rounded-xl backdrop-blur-sm pr-12 ${
                    theme === 'dark' 
                      ? 'bg-input border-border text-foreground placeholder:text-muted-foreground' 
                      : 'bg-white/10 border-white/20 text-white placeholder:text-white/40 focus:border-white/40 focus:ring-white/20'
                  }`}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className={`absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-md transition-colors ${
                    theme === 'dark' 
                      ? 'text-muted-foreground hover:text-foreground' 
                      : 'text-white/50 hover:text-white/80'
                  }`}
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              
              {/* Caps Lock indicator */}
              {capsLockOn && (
                <div className="flex items-center gap-1.5 text-amber-500 animate-fade-in">
                  <AlertTriangle size={14} />
                  <span className="text-xs font-medium">Caps Lock está ativo</span>
                </div>
              )}
            </div>
            
            {/* Remember user checkbox */}
            <div className="flex items-center space-x-2 animate-fade-in animation-delay-400">
              <Checkbox 
                id="remember" 
                checked={rememberUser}
                onCheckedChange={(checked) => setRememberUser(checked === true)}
                className={theme === 'dark' ? '' : 'border-white/40 data-[state=checked]:bg-white/20 data-[state=checked]:border-white/40'}
              />
              <label 
                htmlFor="remember" 
                className={`text-sm cursor-pointer select-none ${theme === 'dark' ? 'text-muted-foreground' : 'text-white/70'}`}
              >
                Lembrar utilizador
              </label>
            </div>
            
            <Button 
              type="submit" 
              className={`w-full h-12 font-semibold rounded-xl transition-all duration-300 animate-fade-in animation-delay-500 ${
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
