import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useClients, Client } from '@/hooks/useClients';
import { useAgendamentos } from '@/hooks/useAgendamentos';
import { useClientStats, ClientHistory } from '@/hooks/useClientStats';
import { useTheme } from '@/hooks/useTheme';
import { supabase } from '@/integrations/supabase/client';
import { 
  Users, Pencil, Trash2, Save, X, Plus, ArrowLeft, 
  Phone, MapPin, Loader2, LogOut, History, Euro, Clock,
  CheckCircle, Calendar, TrendingUp, ChevronDown, ChevronUp, Sun, Moon,
  Navigation
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import logoMayslimpo from '@/assets/logo-mayslimpo.jpg';
import { ClientsViewSkeleton } from '@/components/ui/skeleton-loader';
import ClientAvatar from '@/components/ui/client-avatar';
import EmptyState from '@/components/ui/empty-state';

const ClientesAdmin = () => {
  const { user, role, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { theme, toggleTheme } = useTheme();
  const { clients, loading, addClient, clientExists, refetch } = useClients();
  const { allTasks, loading: loadingAgendamentos } = useAgendamentos();
  const { clientStats, getClientHistory } = useClientStats(allTasks, clients);
  
  const [showForm, setShowForm] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [saving, setSaving] = useState(false);
  const [expandedClient, setExpandedClient] = useState<string | null>(null);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [selectedClientHistory, setSelectedClientHistory] = useState<{
    name: string;
    history: ClientHistory[];
  } | null>(null);
  const [formData, setFormData] = useState({
    nome: '',
    telefone: '',
    morada: '',
    preco_hora: '7',
    notas: ''
  });

  const resetForm = () => {
    setFormData({ nome: '', telefone: '', morada: '', preco_hora: '7', notas: '' });
    setEditingClient(null);
    setShowForm(false);
  };

  const handleEdit = (client: Client) => {
    setEditingClient(client);
    setFormData({
      nome: client.nome,
      telefone: client.telefone,
      morada: client.morada,
      preco_hora: client.preco_hora,
      notas: client.notas
    });
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nome.trim()) return;

    // Check for duplicate name (exclude current client when editing)
    const excludeId = editingClient?.id;
    if (clientExists(formData.nome, excludeId)) {
      toast({
        title: 'Cliente já existe',
        description: `Já existe um cliente com o nome "${formData.nome.trim()}"`,
        variant: 'destructive'
      });
      return;
    }

    setSaving(true);
    try {
      if (editingClient) {
        const { error } = await supabase
          .from('clients')
          .update({
            nome: formData.nome.trim(),
            telefone: formData.telefone || null,
            morada: formData.morada || null,
            preco_hora: formData.preco_hora,
            notas: formData.notas || null
          })
          .eq('id', editingClient.id);

        if (error) throw error;
        toast({ title: 'Cliente atualizado' });
      } else {
        await addClient(formData);
      }
      await refetch();
      resetForm();
    } catch (error: any) {
      toast({ 
        title: 'Erro ao guardar cliente', 
        description: error.message,
        variant: 'destructive' 
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Tem certeza que deseja eliminar este cliente?')) return;

    try {
      const { error } = await supabase.from('clients').delete().eq('id', id);
      if (error) throw error;
      toast({ title: 'Cliente eliminado' });
      await refetch();
    } catch (error: any) {
      toast({ 
        title: 'Erro ao eliminar cliente', 
        description: error.message,
        variant: 'destructive' 
      });
    }
  };

  const handleShowHistory = (clientName: string) => {
    const history = getClientHistory(clientName);
    setSelectedClientHistory({ name: clientName, history });
    setShowHistoryModal(true);
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const username = user?.user_metadata?.name || user?.email?.replace('@local.app', '') || '';

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const dayName = date.toLocaleDateString('pt-BR', { weekday: 'short' });
    const formatted = date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' });
    return `${formatted} (${dayName})`;
  };

  const openGoogleMaps = (address: string) => {
    const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  if (loading || loadingAgendamentos) {
    return (
      <div className="min-h-screen bg-background">
        {/* Header skeleton */}
        <div className="bg-card border-b border-border px-4 py-2">
          <div className="max-w-4xl mx-auto flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-muted animate-pulse" />
              <div className="h-4 w-32 bg-muted rounded animate-pulse" />
            </div>
            <div className="flex gap-2">
              <div className="h-8 w-8 bg-muted rounded animate-pulse" />
              <div className="h-8 w-16 bg-muted rounded animate-pulse" />
            </div>
          </div>
        </div>
        <div className="max-w-4xl mx-auto">
          <ClientsViewSkeleton />
        </div>
      </div>
    );
  }

  // Calculate summary stats
  const totalClients = clients.length;
  const activeClients = Object.values(clientStats).filter(s => s.totalAgendamentos > 0).length;
  const totalRevenue = Object.values(clientStats).reduce((sum, s) => sum + s.totalRevenue, 0);
  const totalHours = Object.values(clientStats).reduce((sum, s) => sum + s.totalHours, 0);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-card border-b border-border px-4 py-2">
        <div className="max-w-4xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <img 
              src={logoMayslimpo} 
              alt="MaysLimpo Logo" 
              className="w-10 h-10 rounded-full object-cover shadow-sm border border-border"
            />
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span className="capitalize font-medium">{username}</span>
              <span className="px-2 py-0.5 bg-primary/10 text-primary rounded text-xs font-medium">
                {role === 'admin' ? 'Administrador' : 'Neury'}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={toggleTheme} className="p-2">
              {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            </Button>
            <Button variant="outline" size="sm" onClick={handleSignOut}>
              <LogOut size={16} className="mr-1" />
              Sair
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-4">
        {/* Back button and title */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => navigate('/admin/agendamentos')}
            >
              <ArrowLeft size={16} className="mr-1" />
              Voltar
            </Button>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <Users size={24} />
              Gestão de Clientes
            </h1>
          </div>
          <Button onClick={() => setShowForm(true)} className="bg-primary hover:bg-primary/90">
            <Plus size={16} className="mr-1" />
            Novo Cliente
          </Button>
        </div>

        {/* Summary Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <div className="bg-card rounded-xl shadow-sm p-4 border border-border">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Users size={18} className="text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Total Clientes</p>
                <p className="text-xl font-bold text-primary">{totalClients}</p>
              </div>
            </div>
          </div>
          <div className="bg-card rounded-xl shadow-sm p-4 border border-border">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-primary/10 rounded-lg">
                <TrendingUp size={18} className="text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Clientes Ativos</p>
                <p className="text-xl font-bold text-primary">{activeClients}</p>
              </div>
            </div>
          </div>
          <div className="bg-card rounded-xl shadow-sm p-4 border border-border">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-success/10 rounded-lg">
                <Euro size={18} className="text-success" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Total Faturado</p>
                <p className="text-xl font-bold text-success">€{totalRevenue.toFixed(0)}</p>
              </div>
            </div>
          </div>
          <div className="bg-card rounded-xl shadow-sm p-4 border border-border">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-warning/10 rounded-lg">
                <Clock size={18} className="text-warning" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Horas Trabalhadas</p>
                <p className="text-xl font-bold text-warning">{totalHours.toFixed(0)}h</p>
              </div>
            </div>
          </div>
        </div>

        {/* Form Modal */}
        {showForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/50" onClick={resetForm} />
            <div className="bg-card rounded-xl shadow-xl w-full max-w-md relative z-10">
              <div className="bg-gradient-to-r from-primary to-primary/80 text-white p-4 rounded-t-xl flex justify-between items-center">
                <h2 className="text-lg font-bold">
                  {editingClient ? 'Editar Cliente' : 'Novo Cliente'}
                </h2>
                <button onClick={resetForm} className="hover:bg-white/20 p-1 rounded">
                  <X size={20} />
                </button>
              </div>
              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-card-foreground mb-1">
                    Nome <span className="text-destructive">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.nome}
                    onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                    className="w-full p-2 border border-border rounded-lg bg-input text-foreground"
                    placeholder="Nome do cliente"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-card-foreground mb-1">Telefone</label>
                  <input
                    type="text"
                    value={formData.telefone}
                    onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
                    className="w-full p-2 border border-border rounded-lg bg-input text-foreground"
                    placeholder="Ex: 912 345 678"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-card-foreground mb-1">Morada</label>
                  <input
                    type="text"
                    value={formData.morada}
                    onChange={(e) => setFormData({ ...formData, morada: e.target.value })}
                    className="w-full p-2 border border-border rounded-lg bg-input text-foreground"
                    placeholder="Rua..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-card-foreground mb-1">€/hora</label>
                  <input
                    type="number"
                    value={formData.preco_hora}
                    onChange={(e) => setFormData({ ...formData, preco_hora: e.target.value })}
                    className="w-full p-2 border border-border rounded-lg bg-input text-foreground"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-card-foreground mb-1">Notas</label>
                  <textarea
                    value={formData.notas}
                    onChange={(e) => setFormData({ ...formData, notas: e.target.value })}
                    className="w-full p-2 border border-border rounded-lg bg-input text-foreground"
                    rows={2}
                    placeholder="Observações..."
                  />
                </div>
                <Button 
                  type="submit" 
                  disabled={saving}
                  className="w-full bg-gradient-to-r from-primary to-primary/80"
                >
                  {saving ? <Loader2 size={16} className="animate-spin mr-2" /> : <Save size={16} className="mr-2" />}
                  {editingClient ? 'Guardar Alterações' : 'Criar Cliente'}
                </Button>
              </form>
            </div>
          </div>
        )}

        {/* History Modal */}
        {showHistoryModal && selectedClientHistory && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/50" onClick={() => setShowHistoryModal(false)} />
            <div className="bg-card rounded-xl shadow-xl w-full max-w-2xl relative z-10 max-h-[80vh] flex flex-col">
              <div className="bg-gradient-to-r from-primary to-primary/80 text-white p-4 rounded-t-xl flex justify-between items-center">
                <h2 className="text-lg font-bold flex items-center gap-2">
                  <History size={20} />
                  Histórico: {selectedClientHistory.name}
                </h2>
                <button onClick={() => setShowHistoryModal(false)} className="hover:bg-white/20 p-1 rounded">
                  <X size={20} />
                </button>
              </div>
              <div className="p-4 overflow-y-auto flex-1">
                {selectedClientHistory.history.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Calendar size={48} className="mx-auto mb-2 opacity-50" />
                    <p>Sem histórico de agendamentos</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {selectedClientHistory.history.map((item) => (
                      <div 
                        key={item.id} 
                        className={`p-3 rounded-lg border ${
                          item.completed 
                            ? 'bg-success/10 border-success/30' 
                            : 'bg-warning/10 border-warning/30'
                        }`}
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-foreground">
                                {formatDate(item.date)}
                              </span>
                              <span className={`text-xs px-2 py-0.5 rounded ${
                                item.completed 
                                  ? 'bg-success/20 text-success' 
                                  : 'bg-warning/20 text-warning'
                              }`}>
                                {item.completed ? 'Concluído' : 'Pendente'}
                              </span>
                            </div>
                            <div className="text-sm text-muted-foreground mt-1">
                              {item.startTime} - {item.endTime}
                              {item.address && (
                                <span className="ml-2 text-muted-foreground/60">• {item.address}</span>
                              )}
                            </div>
                            {item.notes && (
                              <p className="text-xs text-muted-foreground/60 mt-1 italic">{item.notes}</p>
                            )}
                          </div>
                          <span className="font-bold text-success">€{item.price}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="p-4 border-t border-border bg-secondary rounded-b-xl">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">
                    Total de agendamentos: <strong>{selectedClientHistory.history.length}</strong>
                  </span>
                  <span className="text-success font-bold">
                    Total: €{selectedClientHistory.history
                      .filter(h => h.completed)
                      .reduce((sum, h) => sum + parseFloat(h.price), 0)
                      .toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Clients List */}
        {clients.length === 0 ? (
          <EmptyState 
            type="clients"
            action={
              <Button onClick={() => setShowForm(true)} className="gap-2">
                <Plus size={16} />
                Adicionar primeiro cliente
              </Button>
            }
          />
        ) : (
          <div className="grid gap-3">
            {clients.map((client) => {
              const stats = clientStats[client.nome];
              const isExpanded = expandedClient === client.id;
              
              return (
                <div 
                  key={client.id} 
                  className="bg-card rounded-xl shadow-sm border border-border hover:shadow-md transition overflow-hidden"
                >
                  <div className="p-4">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <ClientAvatar name={client.nome} size="lg" />
                          <div>
                            <h3 className="font-bold text-card-foreground text-lg">{client.nome}</h3>
                            {stats && stats.totalAgendamentos > 0 && (
                              <span className="text-xs px-2 py-0.5 bg-primary/10 text-primary rounded-full">
                                {stats.totalAgendamentos} agendamentos
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="mt-2 space-y-1 text-sm text-muted-foreground">
                          {client.telefone && (
                            <a 
                              href={`tel:${client.telefone}`}
                              className="flex items-center gap-2 hover:text-primary transition-colors"
                            >
                              <Phone size={14} className="text-primary" />
                              {client.telefone}
                            </a>
                          )}
                          {client.morada && (
                            <button
                              onClick={() => openGoogleMaps(client.morada)}
                              className="flex items-center gap-2 hover:text-primary transition-colors text-left group"
                            >
                              <MapPin size={14} className="text-muted-foreground group-hover:text-primary" />
                              <span className="group-hover:underline">{client.morada}</span>
                              <Navigation size={12} className="text-primary opacity-0 group-hover:opacity-100 transition-opacity" />
                            </button>
                          )}
                          <div className="text-success font-medium">
                            €{client.preco_hora}/hora
                          </div>
                        </div>
                        {client.notas && (
                          <p className="mt-2 text-xs text-muted-foreground italic">{client.notas}</p>
                        )}
                      </div>
                      <div className="flex gap-2">
                        {client.morada && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openGoogleMaps(client.morada)}
                            className="text-primary hover:text-primary hover:bg-primary/10"
                            title="Navegar no Google Maps"
                          >
                            <Navigation size={14} />
                          </Button>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleShowHistory(client.nome)}
                          className="text-primary hover:text-primary hover:bg-primary/10"
                        >
                          <History size={14} />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(client)}
                        >
                          <Pencil size={14} />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(client.id)}
                          className="text-destructive hover:text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 size={14} />
                        </Button>
                      </div>
                    </div>

                    {/* Stats toggle */}
                    {stats && stats.totalAgendamentos > 0 && (
                      <button
                        onClick={() => setExpandedClient(isExpanded ? null : client.id)}
                        className="mt-3 text-xs text-primary hover:text-primary/80 flex items-center gap-1"
                      >
                        {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                        {isExpanded ? 'Ocultar estatísticas' : 'Ver estatísticas'}
                      </button>
                    )}
                  </div>

                  {/* Expanded Stats */}
                  {isExpanded && stats && (
                    <div className="px-4 pb-4 pt-0">
                      <div className="bg-secondary rounded-lg p-3 grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                        <div className="flex items-center gap-2">
                          <CheckCircle size={16} className="text-success" />
                          <div>
                            <p className="text-xs text-muted-foreground">Concluídos</p>
                            <p className="font-bold text-card-foreground">{stats.concluidos}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock size={16} className="text-warning" />
                          <div>
                            <p className="text-xs text-muted-foreground">Pendentes</p>
                            <p className="font-bold text-card-foreground">{stats.pendentes}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Euro size={16} className="text-success" />
                          <div>
                            <p className="text-xs text-muted-foreground">Total Faturado</p>
                            <p className="font-bold text-success">€{stats.totalRevenue.toFixed(2)}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <TrendingUp size={16} className="text-primary" />
                          <div>
                            <p className="text-xs text-muted-foreground">Horas Trabalhadas</p>
                            <p className="font-bold text-card-foreground">{stats.totalHours.toFixed(1)}h</p>
                          </div>
                        </div>
                      </div>
                      {stats.firstService && stats.lastService && (
                        <div className="mt-2 text-xs text-muted-foreground flex gap-4">
                          <span>Primeiro serviço: {formatDate(stats.firstService)}</span>
                          <span>Último serviço: {formatDate(stats.lastService)}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        <p className="text-center text-sm text-muted-foreground mt-6">
          {clients.length} cliente{clients.length !== 1 ? 's' : ''} guardado{clients.length !== 1 ? 's' : ''}
        </p>
      </div>
    </div>
  );
};

export default ClientesAdmin;
