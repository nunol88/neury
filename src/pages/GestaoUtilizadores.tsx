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
import {
  Users, ShieldCheck, UserCheck, UserX, Loader2, UserPlus, Trash2, Eye, EyeOff,
} from 'lucide-react';
import { toast } from 'sonner';

interface ManagedUser {
  id: string;
  email: string;
  name: string;
  role: string | null;
  is_active: boolean;
  role_id: string | null;
  created_at: string;
}

const GestaoUtilizadores: React.FC = () => {
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState<string | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [deleteUser, setDeleteUser] = useState<ManagedUser | null>(null);
  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Form state
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  

  const fetchUsers = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
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

  useEffect(() => {
    fetchUsers();
  }, []);

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
      console.error(error);
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
          return (
            <Card key={u.id} className={`transition-all duration-200 hover:shadow-md hover:border-primary/20 ${!u.is_active && !isAdmin ? 'opacity-60' : ''}`}>
              <CardContent className="flex items-center justify-between py-5 px-6">
                <div className="flex items-center gap-4">
                  <div className={`rounded-full p-2.5 ${isAdmin ? 'bg-primary/15' : u.is_active ? 'bg-green-100 dark:bg-green-950/40' : 'bg-muted'}`}>
                    {u.is_active || isAdmin ? (
                      <UserCheck className={`h-5 w-5 ${isAdmin ? 'text-primary' : 'text-green-600 dark:text-green-400'}`} />
                    ) : (
                      <UserX className="h-5 w-5 text-muted-foreground" />
                    )}
                  </div>
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
                    <span className="text-xs text-muted-foreground block">{u.email}</span>
                    <div className="text-xs text-muted-foreground/80">
                      {isAdmin
                        ? 'Acesso total — pode gerir tudo'
                        : u.is_active
                          ? 'Ativo — pode marcar tarefas'
                          : 'Inativo — apenas observação'}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
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
              <Input
                id="name"
                placeholder="Ex: Maria Silva"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="email@exemplo.com"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Mínimo 6 caracteres"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)} disabled={creating}>
              Cancelar
            </Button>
            <Button onClick={handleCreate} disabled={creating}>
              {creating ? <Loader2 size={16} className="animate-spin mr-2" /> : <UserPlus size={16} className="mr-2" />}
              Criar
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
