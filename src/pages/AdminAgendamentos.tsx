import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import AppHeader from '@/components/AppHeader';
import AgendamentoCard from '@/components/AgendamentoCard';
import AgendamentoModal from '@/components/AgendamentoModal';
import { Button } from '@/components/ui/button';
import { Plus, Loader2, CalendarX } from 'lucide-react';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface Agendamento {
  id: string;
  cliente_nome: string;
  cliente_contacto: string | null;
  data_inicio: string;
  data_fim: string;
  descricao: string | null;
  status: 'agendado' | 'concluido' | 'cancelado';
}

const AdminAgendamentos = () => {
  const [agendamentos, setAgendamentos] = useState<Agendamento[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingAgendamento, setEditingAgendamento] = useState<Agendamento | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchAgendamentos = async () => {
    try {
      const { data, error } = await supabase
        .from('agendamentos')
        .select('*')
        .order('data_inicio', { ascending: true });

      if (error) throw error;
      setAgendamentos(data as Agendamento[]);
    } catch (error) {
      console.error('Error fetching agendamentos:', error);
      toast.error('Erro ao carregar agendamentos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAgendamentos();
  }, []);

  const handleSave = async (data: Omit<Agendamento, 'id'>) => {
    setIsSaving(true);
    
    try {
      if (editingAgendamento) {
        const { error } = await supabase
          .from('agendamentos')
          .update(data)
          .eq('id', editingAgendamento.id);

        if (error) throw error;
        toast.success('Agendamento atualizado com sucesso!');
      } else {
        const { error } = await supabase
          .from('agendamentos')
          .insert([data]);

        if (error) throw error;
        toast.success('Agendamento criado com sucesso!');
      }
      
      setModalOpen(false);
      setEditingAgendamento(null);
      fetchAgendamentos();
    } catch (error) {
      console.error('Error saving agendamento:', error);
      toast.error('Erro ao guardar agendamento');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    
    setIsDeleting(true);
    
    try {
      const { error } = await supabase
        .from('agendamentos')
        .delete()
        .eq('id', deleteId);

      if (error) throw error;
      toast.success('Agendamento apagado com sucesso!');
      setDeleteId(null);
      fetchAgendamentos();
    } catch (error) {
      console.error('Error deleting agendamento:', error);
      toast.error('Erro ao apagar agendamento');
    } finally {
      setIsDeleting(false);
    }
  };

  const openEditModal = (agendamento: Agendamento) => {
    setEditingAgendamento(agendamento);
    setModalOpen(true);
  };

  const openCreateModal = () => {
    setEditingAgendamento(null);
    setModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-background">
      <AppHeader 
        title="Agenda Neury" 
        subtitle="Gestão de Agendamentos" 
      />
      
      <main className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-2xl font-bold text-foreground">Agendamentos</h2>
            <p className="text-muted-foreground">
              {agendamentos.length} agendamento{agendamentos.length !== 1 ? 's' : ''}
            </p>
          </div>
          <Button onClick={openCreateModal}>
            <Plus className="h-4 w-4 mr-2" />
            Novo Agendamento
          </Button>
        </div>
        
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : agendamentos.length === 0 ? (
          <div className="text-center py-20">
            <CalendarX className="h-16 w-16 text-muted-foreground/50 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-muted-foreground">
              Sem agendamentos
            </h3>
            <p className="text-sm text-muted-foreground/70 mt-1">
              Crie o primeiro agendamento clicando no botão acima
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {agendamentos.map((agendamento) => (
              <AgendamentoCard
                key={agendamento.id}
                agendamento={agendamento}
                isAdmin
                onEdit={openEditModal}
                onDelete={(id) => setDeleteId(id)}
              />
            ))}
          </div>
        )}
      </main>
      
      <AgendamentoModal
        open={modalOpen}
        onOpenChange={(open) => {
          setModalOpen(open);
          if (!open) setEditingAgendamento(null);
        }}
        agendamento={editingAgendamento}
        onSave={handleSave}
        isLoading={isSaving}
      />
      
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Apagar agendamento?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser revertida. O agendamento será permanentemente removido.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  A apagar...
                </>
              ) : (
                'Apagar'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AdminAgendamentos;
