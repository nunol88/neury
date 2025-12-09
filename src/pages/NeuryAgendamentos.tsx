import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import AppHeader from '@/components/AppHeader';
import AgendamentoCard from '@/components/AgendamentoCard';
import { Loader2, CalendarX } from 'lucide-react';
import { toast } from 'sonner';

interface Agendamento {
  id: string;
  cliente_nome: string;
  cliente_contacto: string | null;
  data_inicio: string;
  data_fim: string;
  descricao: string | null;
  status: 'agendado' | 'concluido' | 'cancelado';
}

const NeuryAgendamentos = () => {
  const [agendamentos, setAgendamentos] = useState<Agendamento[]>([]);
  const [loading, setLoading] = useState(true);

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

  return (
    <div className="min-h-screen bg-background">
      <AppHeader 
        title="Agenda Neury" 
        subtitle="Visualização de Agendamentos" 
      />
      
      <main className="max-w-7xl mx-auto px-4 py-6">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-foreground">Agendamentos</h2>
          <p className="text-muted-foreground">
            {agendamentos.length} agendamento{agendamentos.length !== 1 ? 's' : ''} • Apenas visualização
          </p>
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
              Ainda não há agendamentos registados
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {agendamentos.map((agendamento) => (
              <AgendamentoCard
                key={agendamento.id}
                agendamento={agendamento}
                isAdmin={false}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default NeuryAgendamentos;
