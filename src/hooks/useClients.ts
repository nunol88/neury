import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface Client {
  id: string;
  nome: string;
  telefone: string;
  morada: string;
  preco_hora: string;
  notas: string;
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
        .order('nome', { ascending: true });

      if (error) throw error;

      setClients((data || []).map(row => ({
        id: row.id,
        nome: row.nome,
        telefone: row.telefone || '',
        morada: row.morada || '',
        preco_hora: row.preco_hora || '7',
        notas: row.notas || ''
      })));
    } catch (error: any) {
      console.error('Error fetching clients:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchClients();
  }, [fetchClients]);

  const addClient = async (clientData: Omit<Client, 'id'>): Promise<Client | null> => {
    try {
      const { data, error } = await supabase
        .from('clients')
        .insert({
          nome: clientData.nome,
          telefone: clientData.telefone || null,
          morada: clientData.morada || null,
          preco_hora: clientData.preco_hora || '7',
          notas: clientData.notas || null
        })
        .select()
        .single();

      if (error) throw error;

      const newClient: Client = {
        id: data.id,
        nome: data.nome,
        telefone: data.telefone || '',
        morada: data.morada || '',
        preco_hora: data.preco_hora || '7',
        notas: data.notas || ''
      };

      setClients(prev => [...prev, newClient].sort((a, b) => a.nome.localeCompare(b.nome)));
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

  return {
    clients,
    loading,
    addClient,
    refetch: fetchClients
  };
};
