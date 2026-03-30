import React, { useEffect, useState, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Activity, Loader2, Search, RotateCcw, Calendar, User, Filter,
  ChevronLeft, ChevronRight, Clock,
} from 'lucide-react';
import { toast } from 'sonner';
import { format, formatDistanceToNow, parseISO, startOfDay, endOfDay, subDays } from 'date-fns';
import { pt } from 'date-fns/locale';
import ClientAvatar from '@/components/ui/client-avatar';

interface ActivityLog {
  id: string;
  user_id: string;
  action: string;
  details: Record<string, unknown>;
  created_at: string;
}

interface UserInfo {
  id: string;
  name: string;
  email: string;
  avatar_url: string | null;
}

interface Props {
  users: UserInfo[];
}

const ACTION_LABELS: Record<string, { label: string; icon: string; color: string }> = {
  'Criou agendamento': { label: 'Criação', icon: '🟢', color: 'bg-green-100 text-green-700 dark:bg-green-950/50 dark:text-green-400' },
  'Eliminou agendamento': { label: 'Eliminação', icon: '🔴', color: 'bg-destructive/10 text-destructive' },
  'Concluiu agendamento': { label: 'Conclusão', icon: '🔵', color: 'bg-blue-100 text-blue-700 dark:bg-blue-950/50 dark:text-blue-400' },
  'Reabriu agendamento': { label: 'Reabertura', icon: '🟠', color: 'bg-orange-100 text-orange-700 dark:bg-orange-950/50 dark:text-orange-400' },
};

const formatLogDate = (dateStr: string) => {
  if (!dateStr) return '';
  // Handle "YYYY-MM-DD" format
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  return dateStr;
};

const PAGE_SIZE = 30;

const ActivityLogTab: React.FC<Props> = ({ users }) => {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterUser, setFilterUser] = useState<string | null>(null);
  const [filterAction, setFilterAction] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [revertLog, setRevertLog] = useState<ActivityLog | null>(null);
  const [reverting, setReverting] = useState(false);
  const [totalCount, setTotalCount] = useState(0);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      // Get total count
      let countQuery = supabase
        .from('user_activity_logs')
        .select('id', { count: 'exact', head: true });

      if (filterUser) countQuery = countQuery.eq('user_id', filterUser);

      const { count } = await countQuery;
      setTotalCount(count || 0);

      // Get paginated logs
      let query = supabase
        .from('user_activity_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);

      if (filterUser) query = query.eq('user_id', filterUser);

      const { data, error } = await query;
      if (error) throw error;
      setLogs((data as ActivityLog[]) || []);
    } catch (err) {
      console.error(err);
      toast.error('Erro ao carregar atividade');
    }
    setLoading(false);
  };

  useEffect(() => { fetchLogs(); }, [page, filterUser]);

  const filteredLogs = useMemo(() => {
    let result = logs;
    if (filterAction) {
      result = result.filter(l => l.action === filterAction);
    }
    if (search.trim()) {
      const s = search.toLowerCase();
      result = result.filter(l => {
        const userName = users.find(u => u.id === l.user_id)?.name || '';
        const client = (l.details as any)?.client || '';
        return l.action.toLowerCase().includes(s) || userName.toLowerCase().includes(s) || client.toLowerCase().includes(s);
      });
    }
    return result;
  }, [logs, search, filterAction, users]);

  const canRevert = (log: ActivityLog): boolean => {
    return ['Eliminou agendamento', 'Concluiu agendamento', 'Reabriu agendamento'].includes(log.action);
  };

  const getRevertDescription = (log: ActivityLog): string => {
    const details = log.details as any;
    const client = details?.client || 'cliente';
    const date = details?.date ? formatLogDate(details.date) : '';
    const dateInfo = date ? ` (${date})` : '';
    switch (log.action) {
      case 'Eliminou agendamento':
        return `Restaurar o agendamento de "${client}"${dateInfo} que foi eliminado?`;
      case 'Concluiu agendamento':
        return `Reabrir o agendamento de "${client}"${dateInfo} que foi marcado como concluído?`;
      case 'Reabriu agendamento':
        return `Voltar a marcar como concluído o agendamento de "${client}"${dateInfo}?`;
      default:
        return 'Reverter esta ação?';
    }
  };

  const handleRevert = async () => {
    if (!revertLog) return;
    setReverting(true);

    try {
      const details = revertLog.details as any;

      switch (revertLog.action) {
        case 'Agendamento eliminado': {
          // Re-create the deleted agendamento from stored details
          if (!details?.agendamento_id) {
            toast.error('Dados insuficientes para restaurar');
            break;
          }
          const insertData: any = {
            id: details.agendamento_id,
            cliente_nome: details.client || 'Desconhecido',
            data_inicio: details.data_inicio,
            data_fim: details.data_fim,
            status: details.previous_status || 'agendado',
            descricao: details.descricao || null,
            cliente_contacto: details.cliente_contacto || null,
            pago: details.pago || false,
          };
          const { error } = await supabase.from('agendamentos').insert(insertData);
          if (error) throw error;
          toast.success('Agendamento restaurado com sucesso!');
          break;
        }

        case 'Agendamento concluído': {
          if (!details?.agendamento_id) {
            toast.error('Dados insuficientes para reverter');
            break;
          }
          const { error } = await supabase
            .from('agendamentos')
            .update({ status: 'agendado' as any, completed_by: null, completed_by_role: null })
            .eq('id', details.agendamento_id);
          if (error) throw error;
          toast.success('Agendamento reaberto com sucesso!');
          break;
        }

        case 'Agendamento reaberto': {
          if (!details?.agendamento_id) {
            toast.error('Dados insuficientes para reverter');
            break;
          }
          const { error } = await supabase
            .from('agendamentos')
            .update({ status: 'concluido' as any })
            .eq('id', details.agendamento_id);
          if (error) throw error;
          toast.success('Agendamento marcado como concluído!');
          break;
        }

        default:
          toast.error('Esta ação não pode ser revertida');
      }

      setRevertLog(null);
      fetchLogs();
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Erro ao reverter ação');
    }
    setReverting(false);
  };

  const totalPages = Math.ceil(totalCount / PAGE_SIZE);
  const uniqueActions = [...new Set(logs.map(l => l.action))];

  const getUserInfo = (userId: string) => users.find(u => u.id === userId);

  const groupedByDate = useMemo(() => {
    const groups: { date: string; logs: ActivityLog[] }[] = [];
    let currentDate = '';

    filteredLogs.forEach(log => {
      const date = format(parseISO(log.created_at), 'yyyy-MM-dd');
      if (date !== currentDate) {
        currentDate = date;
        groups.push({ date, logs: [log] });
      } else {
        groups[groups.length - 1].logs.push(log);
      }
    });

    return groups;
  }, [filteredLogs]);

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Pesquisar atividade..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button
            variant={filterUser === null ? 'default' : 'outline'}
            size="sm"
            onClick={() => { setFilterUser(null); setPage(0); }}
          >
            <User className="h-3.5 w-3.5 mr-1" />
            Todos
          </Button>
          {users.filter(u => u.id).map(u => (
            <Button
              key={u.id}
              variant={filterUser === u.id ? 'default' : 'outline'}
              size="sm"
              onClick={() => { setFilterUser(u.id); setPage(0); }}
            >
              {u.name.split(' ')[0]}
            </Button>
          ))}
        </div>
      </div>

      {/* Action type filter */}
      {uniqueActions.length > 1 && (
        <div className="flex gap-2 flex-wrap">
          <Button
            variant={filterAction === null ? 'secondary' : 'ghost'}
            size="sm"
            className="h-7 text-xs"
            onClick={() => setFilterAction(null)}
          >
            Todas as ações
          </Button>
          {uniqueActions.map(action => (
            <Button
              key={action}
              variant={filterAction === action ? 'secondary' : 'ghost'}
              size="sm"
              className="h-7 text-xs"
              onClick={() => setFilterAction(filterAction === action ? null : action)}
            >
              {ACTION_LABELS[action]?.label || action}
            </Button>
          ))}
        </div>
      )}

      {/* Log entries */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      ) : filteredLogs.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <Activity className="h-8 w-8 mx-auto mb-2 opacity-40" />
          <p>Nenhuma atividade registada</p>
        </div>
      ) : (
        <div className="space-y-6">
          {groupedByDate.map(({ date, logs: dayLogs }) => (
            <div key={date}>
              <div className="flex items-center gap-2 mb-3">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium text-muted-foreground">
                  {format(parseISO(date), "EEEE, d 'de' MMMM", { locale: pt })}
                </span>
                <Badge variant="outline" className="text-xs">{dayLogs.length}</Badge>
              </div>
              <div className="space-y-2 ml-1 border-l-2 border-muted pl-4">
                {dayLogs.map(log => {
                  const user = getUserInfo(log.user_id);
                  const actionStyle = ACTION_LABELS[log.action];
                  const details = log.details as any;

                  return (
                    <Card key={log.id} className="border-border/50 hover:border-primary/20 transition-colors">
                      <CardContent className="py-3 px-4">
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            <div className="w-1.5 h-1.5 rounded-full bg-primary/60 shrink-0" />
                            {user?.avatar_url ? (
                              <img
                                src={user.avatar_url}
                                alt={user.name}
                                className="w-7 h-7 rounded-full object-cover shrink-0"
                                referrerPolicy="no-referrer"
                              />
                            ) : (
                              <ClientAvatar name={user?.name || '?'} size="sm" />
                            )}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-sm font-medium text-foreground">
                                  {user?.name || 'Desconhecido'}
                                </span>
                                {actionStyle && (
                                  <Badge className={`text-[10px] px-1.5 py-0 ${actionStyle.color} border-0`}>
                                    {actionStyle.label}
                                  </Badge>
                                )}
                              </div>
                              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                <span>{log.action}</span>
                                {details?.client && (
                                  <span>— {details.client}</span>
                                )}
                                {details?.date && (
                                  <span className="text-muted-foreground/60">({details.date})</span>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            <div className="flex items-center gap-1 text-xs text-muted-foreground/60">
                              <Clock className="h-3 w-3" />
                              {format(parseISO(log.created_at), 'HH:mm')}
                            </div>
                            {canRevert(log) && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 px-2 text-xs text-primary hover:text-primary hover:bg-primary/10"
                                onClick={() => setRevertLog(log)}
                                title="Reverter esta ação"
                              >
                                <RotateCcw className="h-3.5 w-3.5 mr-1" />
                                Reverter
                              </Button>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-2">
          <span className="text-xs text-muted-foreground">
            {totalCount} registos · Página {page + 1} de {totalPages}
          </span>
          <div className="flex gap-1">
            <Button
              variant="outline"
              size="sm"
              disabled={page === 0}
              onClick={() => setPage(p => p - 1)}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages - 1}
              onClick={() => setPage(p => p + 1)}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Revert Confirmation Dialog */}
      <AlertDialog open={!!revertLog} onOpenChange={(open) => !open && setRevertLog(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <RotateCcw className="h-5 w-5 text-primary" />
              Reverter ação
            </AlertDialogTitle>
            <AlertDialogDescription>
              {revertLog && getRevertDescription(revertLog)}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={reverting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleRevert} disabled={reverting}>
              {reverting ? <Loader2 size={16} className="animate-spin mr-2" /> : <RotateCcw size={16} className="mr-2" />}
              Reverter
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default ActivityLogTab;
