import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Users, ShieldCheck, UserCheck, UserX, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface UserRole {
  id: string;
  user_id: string;
  role: 'admin' | 'neury';
  is_active: boolean;
  created_at: string;
}

const ROLE_DISPLAY: Record<string, { name: string; description: string }> = {
  admin: { name: 'Mayara', description: 'Administradora — acesso total' },
  neury: { name: 'Neury', description: 'Funcionária' },
};

const GestaoUtilizadores: React.FC = () => {
  const [users, setUsers] = useState<UserRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState<string | null>(null);

  const fetchUsers = async () => {
    const { data, error } = await supabase
      .from('user_roles')
      .select('*')
      .order('role', { ascending: true });

    if (error) {
      toast.error('Erro ao carregar utilizadores');
      console.error(error);
    } else {
      setUsers(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const toggleActive = async (userRole: UserRole) => {
    if (userRole.role === 'admin') {
      toast.error('Não é possível desativar a administradora');
      return;
    }

    setToggling(userRole.id);
    const { error } = await supabase
      .from('user_roles')
      .update({ is_active: !userRole.is_active })
      .eq('id', userRole.id);

    if (error) {
      toast.error('Erro ao atualizar estado do utilizador');
      console.error(error);
    } else {
      const display = ROLE_DISPLAY[userRole.role] || { name: userRole.role };
      toast.success(
        userRole.is_active
          ? `${display.name} desativada com sucesso`
          : `${display.name} ativada com sucesso`
      );
      fetchUsers();
    }
    setToggling(null);
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
      <div className="flex items-center gap-3">
        <Users className="h-6 w-6 text-primary" />
        <h1 className="text-2xl font-bold text-foreground">Gestão de Utilizadores</h1>
      </div>

      <p className="text-muted-foreground text-sm">
        Ative ou desative utilizadores. Utilizadores inativos apenas podem visualizar, sem permissão para editar.
      </p>

      <div className="grid gap-4">
        {users.map((u) => {
          const display = ROLE_DISPLAY[u.role] || { name: u.role, description: '' };
          return (
            <Card key={u.id} className={!u.is_active ? 'opacity-60' : ''}>
              <CardContent className="flex items-center justify-between py-4 px-5">
                <div className="flex items-center gap-4">
                  <div className={`rounded-full p-2 ${u.is_active ? 'bg-primary/10' : 'bg-muted'}`}>
                    {u.is_active ? (
                      <UserCheck className="h-5 w-5 text-primary" />
                    ) : (
                      <UserX className="h-5 w-5 text-muted-foreground" />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-foreground">{display.name}</span>
                      <Badge variant={u.role === 'admin' ? 'default' : 'secondary'}>
                        {u.role === 'admin' ? (
                          <><ShieldCheck className="h-3 w-3 mr-1" /> Admin</>
                        ) : (
                          'Funcionária'
                        )}
                      </Badge>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {u.is_active 
                        ? display.description + ' — pode editar'
                        : display.description + ' — apenas visualização'}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-sm text-muted-foreground">
                    {u.is_active ? 'Ativa' : 'Inativa'}
                  </span>
                  <Switch
                    checked={u.is_active}
                    onCheckedChange={() => toggleActive(u)}
                    disabled={u.role === 'admin' || toggling === u.id}
                  />
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
    </div>
  );
};

export default GestaoUtilizadores;
