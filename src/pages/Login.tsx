import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useTheme } from '@/hooks/useTheme';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Loader2, AlertCircle, Sun, Moon, Eye, EyeOff, AlertTriangle, HelpCircle, Mail, Phone, User, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';
import logoMayslimpo from '@/assets/logo-mayslimpo.jpg';
import { APP_VERSION } from '@/utils/appVersion';
import { lovable } from '@/integrations/lovable/index';


import { REMEMBER_USER_KEY } from '@/utils/authConstants';
import { EMAIL_LOGIN_SETTING, getBooleanSetting } from '@/utils/appSettings';

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
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [isAppleLoading, setIsAppleLoading] = useState(false);
  const [error, setError] = useState('');
  const [oauthFallbackUrl, setOauthFallbackUrl] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [capsLockOn, setCapsLockOn] = useState(false);
  const [shake, setShake] = useState(false);
  const [rememberUser, setRememberUser] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);
  const passwordInputRef = useRef<HTMLInputElement>(null);
  const { theme, toggleTheme } = useTheme();
  const [emailLoginEnabled, setEmailLoginEnabled] = useState(false);

  useEffect(() => {
    let mounted = true;
    getBooleanSetting(EMAIL_LOGIN_SETTING).then((v) => {
      if (mounted) setEmailLoginEnabled(v);
    });
    return () => {
      mounted = false;
    };
  }, []);
  
  const { signIn, user, role, loading } = useAuth();
  const navigate = useNavigate();
  const greeting = getGreeting();

  // Load remembered user on mount and auto-focus password
  useEffect(() => {
    const remembered = localStorage.getItem(REMEMBER_USER_KEY);
    if (remembered) {
      setUsername(remembered);
      setRememberUser(true);
      // Auto-focus password field when user is remembered
      setTimeout(() => {
        passwordInputRef.current?.focus();
      }, 100);
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
    setOauthFallbackUrl('');
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

  const handleOAuthSignIn = async (provider: 'google' | 'apple') => {
    const setProviderLoading = provider === 'google' ? setIsGoogleLoading : setIsAppleLoading;
    const providerLabel = provider === 'google' ? 'Google' : 'Apple';

    setProviderLoading(true);
    setError('');
    setOauthFallbackUrl('');

    try {
      const { error } = await lovable.auth.signInWithOAuth(provider, {
        redirect_uri: window.location.origin,
      });

      if (error) {
        const isPopupBlocked = error.message.toLowerCase().includes('popup') || error.message.toLowerCase().includes('preview');
        if (isPopupBlocked) {
          setOauthFallbackUrl(window.location.origin);
          setError('O browser bloqueou a janela de login. Abre a app numa nova aba e tenta novamente.');
        } else {
          setError(`Erro ao iniciar sessão com ${providerLabel}.`);
        }
        console.error(`${providerLabel} sign-in error:`, error);
      }
    } catch (err) {
      setError(`Erro inesperado ao iniciar sessão com ${providerLabel}.`);
      console.error(`${providerLabel} sign-in unexpected error:`, err);
    } finally {
      setProviderLoading(false);
    }
  };

  if (loading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${theme === 'dark' ? 'bg-background' : 'bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800'}`}>
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const isDark = theme === 'dark';

  return (
    <main className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-[hsl(222_47%_6%)]">
      {/* Premium aurora background */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Base gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-[hsl(222_47%_6%)] via-[hsl(225_45%_9%)] to-[hsl(240_50%_8%)]" />
        {/* Aurora blobs */}
        <div className="absolute -top-32 -left-32 w-[42rem] h-[42rem] rounded-full blur-3xl opacity-50 bg-[radial-gradient(circle,hsl(199_89%_48%/0.55),transparent_60%)] animate-float-bubble-slow" />
        <div className="absolute top-1/3 -right-40 w-[38rem] h-[38rem] rounded-full blur-3xl opacity-40 bg-[radial-gradient(circle,hsl(262_83%_62%/0.55),transparent_60%)] animate-float-bubble-slow" style={{ animationDelay: '3s' }} />
        <div className="absolute -bottom-40 left-1/4 w-[44rem] h-[44rem] rounded-full blur-3xl opacity-35 bg-[radial-gradient(circle,hsl(180_70%_50%/0.45),transparent_60%)] animate-float-bubble" style={{ animationDelay: '1.5s' }} />
        {/* Grain / noise overlay */}
        <div
          className="absolute inset-0 opacity-[0.05] mix-blend-overlay"
          style={{
            backgroundImage:
              "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='200' height='200'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9'/></filter><rect width='100%25' height='100%25' filter='url(%23n)' opacity='0.6'/></svg>\")",
          }}
        />
        {/* Top vignette */}
        <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-black/40 to-transparent" />
      </div>

      {/* Theme toggle button */}
      <button
        onClick={toggleTheme}
        className="absolute top-4 right-4 p-2.5 rounded-full bg-white/5 hover:bg-white/10 transition-all duration-300 z-10 backdrop-blur-md border border-white/10 hover:scale-110"
        title={isDark ? 'Mudar para tema claro' : 'Mudar para tema escuro'}
      >
        {isDark ? <Sun size={18} className="text-amber-300" /> : <Moon size={18} className="text-white" />}
      </button>

      {/* Glass card */}
      <div className={`relative w-full max-w-md animate-login-card-entry ${shake ? 'animate-shake' : ''}`}>
        {/* Gradient border halo */}
        <div className="absolute -inset-px rounded-[2rem] bg-gradient-to-br from-white/30 via-primary/30 to-purple-400/20 opacity-60 blur-[2px]" />
        {/* Card body */}
        <div className="relative rounded-[2rem] overflow-hidden backdrop-blur-2xl bg-white/[0.06] border border-white/15 shadow-[0_30px_80px_-20px_rgba(0,0,0,0.6)]">
          {/* Top reflection */}
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/60 to-transparent" />
          <div className="absolute inset-x-12 top-0 h-24 bg-gradient-to-b from-white/10 to-transparent rounded-b-full blur-2xl pointer-events-none" />

          <div className="relative p-10 space-y-8">
            {/* Logo */}
            <div className="flex flex-col items-center space-y-5">
              <div className="relative">
                {/* Concentric glow */}
                <div className="absolute inset-0 -m-4 rounded-full bg-gradient-to-br from-primary/40 via-purple-400/30 to-cyan-400/20 blur-2xl animate-logo-glow" />
                <div className="relative w-24 h-24 rounded-full overflow-hidden ring-2 ring-white/25 shadow-2xl">
                  <img src={logoMayslimpo} alt="Mayslimpo Logo" width={96} height={96} fetchPriority="high" decoding="async" className="w-full h-full object-cover" />
                </div>
              </div>
              <div className="text-center space-y-2">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/5 border border-white/10 text-[10px] uppercase tracking-[0.18em] text-white/60 animate-fade-in">
                  <span className="w-1 h-1 rounded-full bg-emerald-400 animate-pulse" />
                  Mayslimpo · v3
                </div>
                <h1 className="font-display text-3xl font-bold tracking-tight text-white animate-fade-in animation-delay-100">
                  Agenda Mayara Godoi
                </h1>
                <div className="flex items-center justify-center gap-2 text-white/55 animate-fade-in animation-delay-200">
                  {greeting.icon === 'night' ? (
                    <Moon size={14} className="text-amber-300" />
                  ) : (
                    <Sun size={14} className="text-amber-400" />
                  )}
                  <span className="text-sm font-light tracking-wide">{greeting.text}! Bem-vinda de volta.</span>
                </div>
              </div>
            </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="bg-destructive/20 backdrop-blur-sm border border-destructive/30 text-destructive rounded-xl p-3 animate-fade-in">
                <div className="flex items-start gap-2">
                  <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
                  <span className="text-sm">{error}</span>
                </div>
                {oauthFallbackUrl && (
                  <a
                    href={oauthFallbackUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-3 inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-primary px-3 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
                  >
                    <ExternalLink className="h-4 w-4" />
                    Abrir app para entrar
                  </a>
                )}
              </div>
            )}
            
            {emailLoginEnabled && (
              <>
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
                      ref={passwordInputRef}
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
                  
                  {capsLockOn && (
                    <div className="flex items-center gap-1.5 text-amber-500 animate-fade-in">
                      <AlertTriangle size={14} />
                      <span className="text-xs font-medium">Caps Lock está ativo</span>
                    </div>
                  )}
                </div>
                
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

                <div className="flex items-center gap-3 animate-fade-in animation-delay-500">
                  <div className={`flex-1 h-px ${theme === 'dark' ? 'bg-border' : 'bg-white/20'}`} />
                  <span className={`text-xs ${theme === 'dark' ? 'text-muted-foreground' : 'text-white/50'}`}>ou</span>
                  <div className={`flex-1 h-px ${theme === 'dark' ? 'bg-border' : 'bg-white/20'}`} />
                </div>
              </>
            )}

            {/* Google Sign-In */}
            <Button
              type="button"
              variant="outline"
              className={`w-full h-13 font-medium rounded-xl transition-all duration-300 animate-fade-in animation-delay-500 flex items-center justify-center gap-3 hover:-translate-y-0.5 ${
                theme === 'dark'
                  ? 'bg-card border-border hover:bg-accent text-foreground hover:shadow-lg'
                  : 'bg-white text-gray-700 border-white/80 hover:shadow-xl hover:shadow-white/20'
              }`}
              disabled={isLoading || isGoogleLoading || isAppleLoading}
              onClick={() => handleOAuthSignIn('google')}
            >
              {isGoogleLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <svg className="h-5 w-5" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
              )}
              Entrar com Google
            </Button>

            {/* Apple Sign-In */}
            <Button
              type="button"
              variant="outline"
              className={`w-full h-13 font-medium rounded-xl transition-all duration-300 animate-fade-in animation-delay-600 flex items-center justify-center gap-3 hover:-translate-y-0.5 ${
                theme === 'dark'
                  ? 'bg-foreground border-foreground hover:bg-foreground/90 text-background hover:shadow-lg'
                  : 'bg-black text-white border-black hover:bg-black/90 hover:shadow-xl hover:shadow-black/30'
              }`}
              disabled={isLoading || isGoogleLoading || isAppleLoading}
              onClick={() => handleOAuthSignIn('apple')}
            >
              {isAppleLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
                </svg>
              )}
              Entrar com Apple
            </Button>
            
            {/* Help link */}
            <button
              type="button"
              onClick={() => setShowHelpModal(true)}
              className={`w-full flex items-center justify-center gap-1.5 text-xs transition-colors animate-fade-in animation-delay-700 mt-2 ${
                theme === 'dark' 
                  ? 'text-muted-foreground/60 hover:text-muted-foreground' 
                  : 'text-white/30 hover:text-white/60'
              }`}
            >
              <HelpCircle size={12} />
              <span>Precisa de ajuda?</span>
            </button>
          </form>
          
          {/* App version */}
          <div className={`text-center text-[10px] tracking-widest uppercase animate-fade-in animation-delay-800 ${
            theme === 'dark' ? 'text-muted-foreground/30' : 'text-white/20'
          }`}>
            v{APP_VERSION}
          </div>
        </div>
        </div>
      </div>

      
      {/* Help Modal */}
      <Dialog open={showHelpModal} onOpenChange={setShowHelpModal}>
        <DialogContent className={`max-w-sm ${theme === 'dark' ? '' : 'bg-slate-900/95 border-white/20 text-white'}`}>
          <DialogHeader>
            <DialogTitle className={`flex items-center gap-2 ${theme === 'dark' ? '' : 'text-white'}`}>
              <HelpCircle size={20} />
              Ajuda de Acesso
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 pt-2">
            {/* Users info */}
            <div className={`p-3 rounded-xl ${theme === 'dark' ? 'bg-muted' : 'bg-white/10'}`}>
              <div className={`flex items-center gap-2 mb-2 font-medium ${theme === 'dark' ? 'text-foreground' : 'text-white'}`}>
                <User size={16} />
                <span>Utilizadores Disponíveis</span>
              </div>
              <ul className={`text-sm space-y-1 ${theme === 'dark' ? 'text-muted-foreground' : 'text-white/70'}`}>
                <li>• <strong>admin</strong> — Acesso completo</li>
                <li>• <strong>O seu nome de utilizador</strong> — Agenda pessoal</li>
              </ul>
            </div>
            
            {/* Contact info */}
            <div className="space-y-2">
              <p className={`text-sm ${theme === 'dark' ? 'text-muted-foreground' : 'text-white/70'}`}>
                Se tiver problemas de acesso, contacte o administrador:
              </p>
              <a 
                href="mailto:mayslimpo@gmail.com" 
                className={`flex items-center gap-2 text-sm transition-colors ${theme === 'dark' ? 'text-foreground hover:text-primary' : 'text-white hover:text-white/80'}`}
              >
                <Mail size={14} />
                <span>mayslimpo@gmail.com</span>
              </a>
              <a 
                href="https://wa.me/351933474736" 
                target="_blank" 
                rel="noopener noreferrer"
                className={`flex items-center gap-2 text-sm transition-colors ${theme === 'dark' ? 'text-foreground hover:text-primary' : 'text-white hover:text-white/80'}`}
              >
                <Phone size={14} />
                <span>933 474 736 (WhatsApp)</span>
              </a>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </main>
  );
};

export default Login;
