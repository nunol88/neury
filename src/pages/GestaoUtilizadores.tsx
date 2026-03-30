import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from '@/components/ui/dialog';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Users, ShieldCheck, UserCheck, UserX, Loader2, UserPlus, Trash2, Eye, EyeOff, KeyRound, Mail,
  Clock, Activity,
} from 'lucide-react';
import ActivityLogTab from '@/components/admin/ActivityLogTab';
import { toast } from 'sonner';
import ClientAvatar from '@/components/ui/client-avatar';
import { formatDistanceToNow } from 'date-fns';
import { pt } from 'date-fns/locale';

interface ActivityLog {
  id: string;
  action: string;
  details: Record<string, unknown>;
  created_at: string;
}

interface ManagedUser {
  id: string;
  email: string;
  name: string;
  avatar_url: string | null;
  provider: string;
  role: string | null;
  is_active: boolean;
  role_id: string | null;
  created_at: string;
  last_sign_in_at: string | null;
  activity_logs: ActivityLog[];
}

const ProviderIcon: React.FC<{ provider: string }> = ({ provider }) => {
  if (provider === 'google') {
    return (
      <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24">
        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
      </svg>
    );
  }
  if (provider === 'apple') {
    return (
      <svg className="h-4 w-4 shrink-0 text-foreground" viewBox="0 0 24 24" fill="currentColor">
        <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
      </svg>
    );
  }
  return <Mail className="h-4 w-4 shrink-0 text-muted-foreground" />;
};

const formatRelativeTime = (dateStr: string | null) => {
  if (!dateStr) return null;
  try {
    return formatDistanceToNow(new Date(dateStr), { addSuffix: true, locale: pt });
  } catch {
    return null;
  }
};

const GestaoUtilizadores: React.FC = () => {
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState<string | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [deleteUser, setDeleteUser] = useState<ManagedUser | null>(null);
  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [resetUser, setResetUser] = useState<ManagedUser | null>(null);
  const [resetPassword, setResetPassword] = useState('');
  const [resetting, setResetting] = useState(false);
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [expandedUser, setExpandedUser] = useState<string | null>(null);

  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');

  const fetchUsers = async () => {
    try {
      const res = await supabase.functions.invoke('manage-users', {
        body: { action: 'list' },
      });
      if (res.error) throw res.error;
      setUsers(res.data.users || []);
    } catch (err: any) {
      toast.error('Erro ao carregar utilizadores');
      console.error(err);
    }
    setLoading(false);
  };

  useEffect(() => { fetchUsers(); }, []);

  const toggleActive = async (user: ManagedUser) => {
    if (user.role === 'admin') {
      toast.error('Não é possível desativar a administradora');
      return;
    }
    if (!user.role_id) return;

    setToggling(user.id);
    const { error } = await supabase
      .from('user_roles')
      .update({ is_active: !user.is_active })
      .eq('id', user.role_id);

    if (error) {
      toast.error('Erro ao atualizar estado');
    } else {
      toast.success(user.is_active ? `${user.name} desativado(a)` : `${user.name} ativado(a)`);
      fetchUsers();
    }
    setToggling(null);
  };

  const handleCreate = async () => {
    if (!newEmail || !newPassword) {
      toast.error('Preencha todos os campos');
      return;
    }
    if (newPassword.length < 6) {
      toast.error('Password deve ter pelo menos 6 caracteres');
      return;
    }

    setCreating(true);
    try {
      const res = await supabase.functions.invoke('manage-users', {
        body: {
          action: 'create',
          email: newEmail,
          password: newPassword,
          role: 'neury',
          name: newName || newEmail.split('@')[0],
        },
      });

      if (res.error || res.data?.error) {
        throw new Error(res.data?.error || res.error?.message || 'Erro ao criar');
      }

      toast.success('Utilizador criado com sucesso!');
      setShowCreateDialog(false);
      setNewName('');
      setNewEmail('');
      setNewPassword('');
      fetchUsers();
    } catch (err: any) {
      toast.error(err.message || 'Erro ao criar utilizador');
    }
    setCreating(false);
  };

  const handleResetPassword = async () => {
    if (!resetUser || !resetPassword) return;
    if (resetPassword.length < 8) {
      toast.error('Password deve ter pelo menos 8 caracteres');
      return;
    }

    setResetting(true);
    try {
      const res = await supabase.functions.invoke('manage-users', {
        body: { action: 'reset_password', user_id: resetUser.id, new_password: resetPassword },
      });

      if (res.error || res.data?.error) {
        throw new Error(res.data?.error || res.error?.message || 'Erro ao redefinir password');
      }

      toast.success(`Password de ${resetUser.name} atualizada com sucesso!`);
      setResetUser(null);
      setResetPassword('');
      setShowResetPassword(false);
    } catch (err: any) {
      toast.error(err.message || 'Erro ao redefinir password');
    }
    setResetting(false);
  };

  const handleDelete = async () => {
    if (!deleteUser) return;

    setDeleting(true);
    try {
      const res = await supabase.functions.invoke('manage-users', {
        body: { action: 'delete', user_id: deleteUser.id },
      });

      if (res.error || res.data?.error) {
        throw new Error(res.data?.error || res.error?.message || 'Erro ao eliminar');
      }

      toast.success(`${deleteUser.name} foi removido(a)`);
      setDeleteUser(null);
      fetchUsers();
    } catch (err: any) {
      toast.error(err.message || 'Erro ao eliminar utilizador');
    }
    setDeleting(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Users className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold text-foreground">Gestão de Utilizadores</h1>
        </div>
        <Button onClick={() => setShowCreateDialog(true)} className="gap-2">
          <UserPlus size={16} />
          <span className="hidden sm:inline">Adicionar</span>
        </Button>
      </div>

      <p className="text-muted-foreground text-sm">
        Gerencie utilizadores da aplicação. Novos utilizadores têm acesso apenas de visualização.
      </p>

      <div className="grid gap-4">
        {users.map((u) => {
          const isAdmin = u.role === 'admin';
          const lastLogin = formatRelativeTime(u.last_sign_in_at);
          const isExpanded = expandedUser === u.id;
          const hasLogs = u.activity_logs && u.activity_logs.length > 0;

          return (
            <Card key={u.id} className={`transition-all duration-200 hover:shadow-md hover:border-primary/20 ${!u.is_active && !isAdmin ? 'opacity-60' : ''}`}>
              <CardContent className="py-5 px-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    {u.avatar_url ? (
                      <img 
                        src={u.avatar_url} 
                        alt={u.name}
                        className="w-10 h-10 rounded-full object-cover ring-2 ring-background shadow-sm shrink-0"
                        referrerPolicy="no-referrer"
                        onError={(e) => { e.currentTarget.style.display = 'none'; e.currentTarget.nextElementSibling?.classList.remove('hidden'); }}
                      />
                    ) : null}
                    <ClientAvatar name={u.name || 'U'} size="lg" className={u.avatar_url ? 'hidden' : ''} />
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-foreground">{u.name}</span>
                        {isAdmin ? (
                          <Badge className="bg-primary/10 text-primary border-primary/20 hover:bg-primary/15">
                            <ShieldCheck className="h-3 w-3 mr-1" /> Admin
                          </Badge>
                        ) : u.is_active ? (
                          <Badge className="bg-green-100 text-green-700 border-green-200 dark:bg-green-950/50 dark:text-green-400 dark:border-green-800">
                            Funcionário
                          </Badge>
                        ) : (
                          <Badge className="bg-muted text-muted-foreground border-border">
                            Funcionário
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5">
                        <ProviderIcon provider={u.provider} />
                        <span className="text-xs text-muted-foreground">{u.email}</span>
                      </div>
                      <div className="flex items-center gap-3 flex-wrap">
                        {lastLogin && (
                          <div className="flex items-center gap-1 text-xs text-muted-foreground/80">
                            <Clock className="h-3 w-3" />
                            <span>Último login: {lastLogin}</span>
                          </div>
                        )}
                        <span className="text-xs text-muted-foreground/60">
                          {isAdmin
                            ? 'Acesso total — pode gerir tudo'
                            : u.is_active
                              ? 'Ativo — pode marcar tarefas'
                              : 'Inativo — apenas observação'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-primary hover:text-primary hover:bg-primary/10"
                      onClick={() => { setResetUser(u); setResetPassword(''); setShowResetPassword(false); }}
                      title="Redefinir password"
                    >
                      <KeyRound size={16} />
                    </Button>
                    {!isAdmin && (
                      <>
                        <div className="text-right hidden sm:block">
                          <Badge variant="outline" className={`text-xs ${u.is_active ? 'border-green-200 text-green-600 dark:border-green-800 dark:text-green-400' : 'border-orange-200 text-orange-600 dark:border-orange-800 dark:text-orange-400'}`}>
                            {u.is_active ? 'Ativo' : 'Inativo'}
                          </Badge>
                        </div>
                        <Switch
                          checked={u.is_active}
                          onCheckedChange={() => toggleActive(u)}
                          disabled={toggling === u.id}
                        />
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive hover:text-destructive hover:bg-destructive/10"
                          onClick={() => setDeleteUser(u)}
                          title="Remover utilizador"
                        >
                          <Trash2 size={16} />
                        </Button>
                      </>
                    )}
                  </div>
                </div>

                {/* Activity Logs Collapsible */}
                {hasLogs && (
                  <Collapsible
                    open={isExpanded}
                    onOpenChange={(open) => setExpandedUser(open ? u.id : null)}
                    className="mt-3"
                  >
                    <CollapsibleTrigger asChild>
                      <button className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors py-1">
                        <Activity className="h-3 w-3" />
                        <span>Atividade recente ({u.activity_logs.length})</span>
                        <ChevronDown className={`h-3 w-3 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                      </button>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <div className="mt-2 ml-14 space-y-1.5 border-l-2 border-muted pl-3">
                        {u.activity_logs.map((log) => (
                          <div key={log.id} className="flex items-start gap-2 text-xs">
                            <div className="w-1.5 h-1.5 rounded-full bg-primary/50 mt-1.5 shrink-0" />
                            <div className="flex-1 min-w-0">
                              <span className="text-foreground">{log.action}</span>
                              {log.details && typeof log.details === 'object' && (log.details as any).client && (
                                <span className="text-muted-foreground ml-1">— {(log.details as any).client}</span>
                              )}
                            </div>
                            <span className="text-muted-foreground/60 shrink-0">
                              {formatRelativeTime(log.created_at)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                )}
              </CardContent>
            </Card>
          );
        })}

        {users.length === 0 && (
          <p className="text-center text-muted-foreground py-8">
            Nenhum utilizador encontrado.
          </p>
        )}
      </div>

      {/* Create User Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserPlus size={20} className="text-primary" />
              Adicionar Utilizador
            </DialogTitle>
            <DialogDescription>
              Crie uma conta para um novo funcionário. O novo utilizador terá acesso apenas de visualização.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="name">Nome</Label>
              <Input id="name" placeholder="Ex: Maria Silva" value={newName} onChange={(e) => setNewName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" placeholder="email@exemplo.com" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input id="password" type={showPassword ? 'text' : 'password'} placeholder="Mínimo 6 caracteres" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
                <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground" onClick={() => setShowPassword(!showPassword)}>
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)} disabled={creating}>Cancelar</Button>
            <Button onClick={handleCreate} disabled={creating}>
              {creating ? <Loader2 size={16} className="animate-spin mr-2" /> : <UserPlus size={16} className="mr-2" />}
              Criar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reset Password Dialog */}
      <Dialog open={!!resetUser} onOpenChange={(open) => { if (!open) { setResetUser(null); setResetPassword(''); } }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <KeyRound size={20} className="text-primary" />
              Redefinir Password
            </DialogTitle>
            <DialogDescription>
              Defina uma nova password para <strong>{resetUser?.name}</strong> ({resetUser?.email}).
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="reset-password">Nova Password</Label>
              <div className="relative">
                <Input id="reset-password" type={showResetPassword ? 'text' : 'password'} placeholder="Mínimo 8 caracteres" value={resetPassword} onChange={(e) => setResetPassword(e.target.value)} />
                <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground" onClick={() => setShowResetPassword(!showResetPassword)}>
                  {showResetPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setResetUser(null)} disabled={resetting}>Cancelar</Button>
            <Button onClick={handleResetPassword} disabled={resetting || resetPassword.length < 8}>
              {resetting ? <Loader2 size={16} className="animate-spin mr-2" /> : <KeyRound size={16} className="mr-2" />}
              Redefinir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteUser} onOpenChange={(open) => !open && setDeleteUser(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover utilizador</AlertDialogTitle>
            <AlertDialogDescription>
              Tem a certeza que deseja remover <strong>{deleteUser?.name}</strong> ({deleteUser?.email})?
              Esta ação é irreversível e elimina a conta permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? <Loader2 size={16} className="animate-spin mr-2" /> : <Trash2 size={16} className="mr-2" />}
              Remover
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default GestaoUtilizadores;
