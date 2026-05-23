import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export type FrequenciaPreferida = 'semanal' | 'quinzenal';
export type PeriodoPreferido = 'manha' | 'tarde' | 'noite' | null;

export interface Client {
  id: string;
  nome: string;
  telefone: string;
  morada: string;
  preco_hora: string;
  notas: string;
  recibo_verde: boolean;
  favorito: boolean;
  // Preferências de agendamento (usadas para auto-agendar fixos)
  dias_preferidos: number[]; // 0=Dom, 1=Seg, ..., 6=Sáb
  frequencia_preferida: FrequenciaPreferida;
  periodo_preferido: PeriodoPreferido;
  hora_preferida: string | null; // ex: "09:00"
  duracao_preferida_horas: number; // ex: 3
  data_nascimento: string | null; // yyyy-mm-dd
  tags: string[]; // ex: ["vivenda", "tem cão"]
}

export const useClients = () => {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchClients = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .order('favorito', { ascending: false })
        .order('nome', { ascending: true });

      if (error) throw error;

      setClients((data || []).map(row => {
        const r = row as any;
        return {
          id: row.id,
          nome: row.nome,
          telefone: row.telefone || '',
          morada: row.morada || '',
          preco_hora: row.preco_hora || '7',
          notas: row.notas || '',
          recibo_verde: row.recibo_verde || false,
          favorito: r.favorito || false,
          dias_preferidos: Array.isArray(r.dias_preferidos) ? r.dias_preferidos : [],
          frequencia_preferida: (r.frequencia_preferida === 'quinzenal' ? 'quinzenal' : 'semanal') as FrequenciaPreferida,
          periodo_preferido: (['manha', 'tarde', 'noite'].includes(r.periodo_preferido) ? r.periodo_preferido : null) as PeriodoPreferido,
          hora_preferida: r.hora_preferida || null,
          duracao_preferida_horas: typeof r.duracao_preferida_horas === 'number' ? r.duracao_preferida_horas : Number(r.duracao_preferida_horas) || 3,
          data_nascimento: r.data_nascimento || null,
          tags: Array.isArray(r.tags) ? r.tags : [],
        };
      }));
    } catch (error: any) {
      console.error('Error fetching clients:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchClients();
  }, [fetchClients]);

  const clientExists = useCallback((nome: string, excludeId?: string): boolean => {
    const normalizedName = nome.trim().toLowerCase();
    return clients.some(client => 
      client.nome.toLowerCase() === normalizedName && client.id !== excludeId
    );
  }, [clients]);

  const sortClients = (list: Client[]) =>
    [...list].sort((a, b) => {
      if (a.favorito !== b.favorito) return a.favorito ? -1 : 1;
      return a.nome.localeCompare(b.nome);
    });

  const addClient = async (clientData: Omit<Client, 'id'>): Promise<Client | null> => {
    // Check for duplicate name
    if (clientExists(clientData.nome)) {
      toast({
        title: 'Cliente já existe',
        description: `Já existe um cliente com o nome "${clientData.nome.trim()}"`,
        variant: 'destructive'
      });
      return null;
    }

    try {
      const { data, error } = await supabase
        .from('clients')
        .insert({
          nome: clientData.nome.trim(),
          telefone: clientData.telefone || null,
          morada: clientData.morada || null,
          preco_hora: clientData.preco_hora || '7',
          notas: clientData.notas || null,
          favorito: clientData.favorito || false,
          dias_preferidos: clientData.dias_preferidos || [],
          frequencia_preferida: clientData.frequencia_preferida || 'semanal',
          periodo_preferido: clientData.periodo_preferido,
          hora_preferida: clientData.hora_preferida,
          duracao_preferida_horas: clientData.duracao_preferida_horas ?? 3,
          data_nascimento: clientData.data_nascimento || null,
          tags: clientData.tags || [],
        } as any)
        .select()
        .single();

      if (error) throw error;

      const d = data as any;
      const newClient: Client = {
        id: data.id,
        nome: data.nome,
        telefone: data.telefone || '',
        morada: data.morada || '',
        preco_hora: data.preco_hora || '7',
        notas: data.notas || '',
        recibo_verde: data.recibo_verde || false,
        favorito: d.favorito || false,
        dias_preferidos: Array.isArray(d.dias_preferidos) ? d.dias_preferidos : [],
        frequencia_preferida: (d.frequencia_preferida === 'quinzenal' ? 'quinzenal' : 'semanal') as FrequenciaPreferida,
        periodo_preferido: (['manha', 'tarde', 'noite'].includes(d.periodo_preferido) ? d.periodo_preferido : null) as PeriodoPreferido,
        hora_preferida: d.hora_preferida || null,
        duracao_preferida_horas: typeof d.duracao_preferida_horas === 'number' ? d.duracao_preferida_horas : Number(d.duracao_preferida_horas) || 3,
        data_nascimento: d.data_nascimento || null,
        tags: Array.isArray(d.tags) ? d.tags : [],
      };

      setClients(prev => sortClients([...prev, newClient]));
      toast({ title: 'Cliente guardado' });
      return newClient;
    } catch (error: any) {
      console.error('Error adding client:', error);
      toast({
        title: 'Erro ao guardar cliente',
        description: error.message,
        variant: 'destructive'
      });
      return null;
    }
  };

  const toggleFavorite = async (clientId: string): Promise<void> => {
    const current = clients.find(c => c.id === clientId);
    if (!current) return;
    const newValue = !current.favorito;

    // Optimistic update
    setClients(prev => sortClients(prev.map(c => c.id === clientId ? { ...c, favorito: newValue } : c)));

    try {
      const { error } = await supabase
        .from('clients')
        .update({ favorito: newValue } as any)
        .eq('id', clientId);

      if (error) throw error;
    } catch (error: any) {
      // Revert
      setClients(prev => sortClients(prev.map(c => c.id === clientId ? { ...c, favorito: !newValue } : c)));
      toast({
        title: 'Erro ao atualizar favorito',
        description: error.message,
        variant: 'destructive'
      });
    }
  };

  return {
    clients,
    loading,
    addClient,
    clientExists,
    toggleFavorite,
    refetch: fetchClients
  };
};
