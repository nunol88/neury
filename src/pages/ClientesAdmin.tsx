import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useClients, Client } from '@/hooks/useClients';
import { supabase } from '@/integrations/supabase/client';
import { 
  Users, Pencil, Trash2, Save, X, Plus, ArrowLeft, 
  Phone, MapPin, Loader2, LogOut, User
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import logoMayslimpo from '@/assets/logo-mayslimpo.jpg';

const ClientesAdmin = () => {
  const { user, role, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { clients, loading, addClient, refetch } = useClients();
  
  const [showForm, setShowForm] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [saving, setSaving] = useState(false);
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

    setSaving(true);
    try {
      if (editingClient) {
        const { error } = await supabase
          .from('clients')
          .update({
            nome: formData.nome,
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

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const username = user?.user_metadata?.name || user?.email?.replace('@local.app', '') || '';

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-50">
      {/* Header */}
      <div className="bg-white border-b px-4 py-2">
        <div className="max-w-4xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <img 
              src={logoMayslimpo} 
              alt="MaysLimpo Logo" 
              className="w-10 h-10 rounded-full object-cover shadow-sm border border-gray-200"
            />
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <span className="capitalize font-medium">{username}</span>
              <span className="px-2 py-0.5 bg-primary/10 text-primary rounded text-xs font-medium">
                {role === 'admin' ? 'Administrador' : 'Neury'}
              </span>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={handleSignOut}>
            <LogOut size={16} className="mr-1" />
            Sair
          </Button>
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
            <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
              <Users size={24} />
              Gestão de Clientes
            </h1>
          </div>
          <Button onClick={() => setShowForm(true)} className="bg-purple-600 hover:bg-purple-700">
            <Plus size={16} className="mr-1" />
            Novo Cliente
          </Button>
        </div>

        {/* Form Modal */}
        {showForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/50" onClick={resetForm} />
            <div className="bg-white rounded-xl shadow-xl w-full max-w-md relative z-10">
              <div className="bg-gradient-to-r from-purple-600 to-purple-800 text-white p-4 rounded-t-xl flex justify-between items-center">
                <h2 className="text-lg font-bold">
                  {editingClient ? 'Editar Cliente' : 'Novo Cliente'}
                </h2>
                <button onClick={resetForm} className="hover:bg-white/20 p-1 rounded">
                  <X size={20} />
                </button>
              </div>
              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nome <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.nome}
                    onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                    className="w-full p-2 border border-gray-300 rounded-lg"
                    placeholder="Nome do cliente"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Telefone</label>
                  <input
                    type="text"
                    value={formData.telefone}
                    onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
                    className="w-full p-2 border border-gray-300 rounded-lg"
                    placeholder="Ex: 912 345 678"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Morada</label>
                  <input
                    type="text"
                    value={formData.morada}
                    onChange={(e) => setFormData({ ...formData, morada: e.target.value })}
                    className="w-full p-2 border border-gray-300 rounded-lg"
                    placeholder="Rua..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">€/hora</label>
                  <input
                    type="number"
                    value={formData.preco_hora}
                    onChange={(e) => setFormData({ ...formData, preco_hora: e.target.value })}
                    className="w-full p-2 border border-gray-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Notas</label>
                  <textarea
                    value={formData.notas}
                    onChange={(e) => setFormData({ ...formData, notas: e.target.value })}
                    className="w-full p-2 border border-gray-300 rounded-lg"
                    rows={2}
                    placeholder="Observações..."
                  />
                </div>
                <Button 
                  type="submit" 
                  disabled={saving}
                  className="w-full bg-gradient-to-r from-purple-600 to-purple-800"
                >
                  {saving ? <Loader2 size={16} className="animate-spin mr-2" /> : <Save size={16} className="mr-2" />}
                  {editingClient ? 'Guardar Alterações' : 'Criar Cliente'}
                </Button>
              </form>
            </div>
          </div>
        )}

        {/* Clients List */}
        {clients.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm p-12 text-center">
            <Users size={48} className="mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500">Nenhum cliente guardado</p>
            <p className="text-sm text-gray-400 mt-1">
              Adicione clientes ao agendar ou clique em "Novo Cliente"
            </p>
          </div>
        ) : (
          <div className="grid gap-3">
            {clients.map((client) => (
              <div 
                key={client.id} 
                className="bg-white rounded-xl shadow-sm p-4 border border-gray-100 hover:shadow-md transition"
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h3 className="font-bold text-gray-800 text-lg">{client.nome}</h3>
                    <div className="mt-2 space-y-1 text-sm text-gray-600">
                      {client.telefone && (
                        <div className="flex items-center gap-2">
                          <Phone size={14} className="text-blue-500" />
                          {client.telefone}
                        </div>
                      )}
                      {client.morada && (
                        <div className="flex items-center gap-2">
                          <MapPin size={14} className="text-gray-400" />
                          {client.morada}
                        </div>
                      )}
                      <div className="text-green-600 font-medium">
                        €{client.preco_hora}/hora
                      </div>
                    </div>
                    {client.notas && (
                      <p className="mt-2 text-xs text-gray-400 italic">{client.notas}</p>
                    )}
                  </div>
                  <div className="flex gap-2">
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
                      className="text-red-500 hover:text-red-600 hover:bg-red-50"
                    >
                      <Trash2 size={14} />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <p className="text-center text-sm text-gray-400 mt-6">
          {clients.length} cliente{clients.length !== 1 ? 's' : ''} guardado{clients.length !== 1 ? 's' : ''}
        </p>
      </div>
    </div>
  );
};

export default ClientesAdmin;
